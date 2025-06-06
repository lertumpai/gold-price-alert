## 🧠 Backend Technical Design: Gold Price Alert Web App (MongoDB Version)

The backend is designed using NestJS with MongoDB, targeting real-time price ingestion, alert evaluation, and push notification delivery. This version replaces PostgreSQL with MongoDB and uses Mongoose ODM for data modeling.

---

## 1. Technology Stack

The backend stack uses:

- **NestJS**: Modular, scalable server-side framework
- **MongoDB**: NoSQL document database
- **Mongoose**: ODM for schema validation and interaction
- **WebSockets**: For real-time updates
- **Web Push API**: For browser push alerts

---

## 2. Core Modules

### 2.1 Price Module
- **Input**: Tick data via `POST /prices/tick` from MT5 EA.
- **Tasks**:
  - **Validation**: Confirms presence of `symbol`, `price`, and `timestamp`. Verifies data types and checks that timestamp is within a reasonable margin (not too far in past/future).
  - **Storage**: Inserts tick into `price_logs` collection, ensuring proper indexing by timestamp and symbol. Applies retention policy (e.g., TTL index).
  - **Broadcasting**: Immediately emits the new tick data via WebSocket to all connected clients subscribed to the matching symbol.
  - **Forwarding to Alert Evaluator**: Hands off tick data to the alert service, triggering real-time evaluation of any matching alerts for the symbol.

### 2.2 Alert Module
- **Input**: User-defined alert rules from frontend.
- **Tasks**:
  - **Storing Alerts**: Saves alert rule definitions in the `alerts` collection. Rules include `symbol`, `condition` (e.g., >, <, crosses), `target_price`, `frequency`, and status flags (e.g., is_active).
  - **Real-Time Evaluation**: Listens to incoming tick data. For each tick, it queries active alerts by symbol and condition. Alerts are evaluated using logic such as: `price > target_price` for 'above', etc.
  - **Trigger Handling**: If a rule is triggered:
    - Logs trigger timestamp
    - Disables alert if it is a "once"-type
    - Adds cooldown if applicable
  - **Notification Queuing**: Sends trigger details to the notification module with user info and alert ID to push notification and WebSocket update.

### 2.3 Notification Module
- **Tasks**:
  - **Subscription Management**: Handles incoming subscriptions from `/subscribe` endpoint. Stores `endpoint`, `p256dh`, `auth` keys, and device metadata (e.g., user agent).
  - **Push Formatting**: On alert trigger, formats a concise push payload (e.g., 'Gold price above 2350!') including timestamp, symbol, and triggered rule.
  - **VAPID Signing and Dispatch**: Uses backend-stored VAPID private key to sign payloads using `web-push`. Ensures proper encryption and expiry header handling.
  - **Error & Expiration Handling**: Tracks failed deliveries. Deletes expired or invalid tokens from `push_tokens` if service returns 410 or 404 errors.
  - **WebSocket Sync**: Simultaneously broadcasts the alert trigger over WebSocket to ensure real-time UI update in parallel with push.

### 2.4 Aggregation Module
- **Tasks**:
  - **Scheduled Execution**: Uses `node-cron` to run every minute or based on desired timeframes (1m, 5m, 15m, etc.). It ensures candles are generated promptly without overlapping jobs using a locking mechanism or job queue.
  - **Tick Retrieval**: Queries `price_logs` for all ticks matching a given timeframe window (e.g., `timestamp >= last_aggregate_time && timestamp < now`). Ticks are filtered by `symbol` and `timeframe` window boundaries.
  - **OHLC Calculation**:
    - **Open**: First tick by timestamp
    - **High**: Maximum price in the interval
    - **Low**: Minimum price in the interval
    - **Close**: Last tick by timestamp
    - **Volume (if applicable)**: Count of ticks or sum of provided tick volumes (if available)
  - **Insertion and Upsert**: Saves each computed candle into `candle_data`. Uses an `upsert` strategy to prevent duplicate entries using a unique index on `symbol + tf + timestamp`.
  - **Backfilling Support**: If scheduled task is missed or restarted, the system can run catch-up aggregation by scanning historical `price_logs`.
  - **Old Tick Cleanup**: Optionally removes or archives tick data older than a threshold (e.g., 24h) after successful candle creation to conserve storage and optimize performance.
  - **Error Handling**: Wraps logic in try/catch and logs failures to a monitoring system. Failed batches can be retried without duplication.

---

## 3. MongoDB Data Model

### 3.1 `price_logs`
- **Purpose**: Stores every incoming tick for historical accuracy and real-time processing.
- **Fields**:
  - `_id`: ObjectId (auto-generated)
  - `symbol`: String, e.g., 'XAUUSD'
  - `price`: Number (float), required
  - `timestamp`: Number (epoch ms), required
- **Indexes**:
  - TTL index on `timestamp` for automatic deletion (e.g., expire after 24 hours)
  - Index on `symbol` for quick symbol-specific querying

### 3.2 `candle_data`
- **Purpose**: Stores OHLC candles aggregated by timeframe.
- **Fields**:
  - `_id`: ObjectId
  - `symbol`: String
  - `tf`: String (timeframe, e.g., '1m', '5m')
  - `timestamp`: Number (epoch of candle start)
  - `open`, `high`, `low`, `close`: Numbers
  - `volume`: Number (optional, number of ticks or volume sum)
- **Indexes**:
  - Compound index on `{ symbol, tf, timestamp }` to prevent duplicates and enable range scans
  - Optional TTL for shorter-term intervals (1m, 5m)

### 3.3 `alerts`
- **Purpose**: Defines user-set alert conditions
- **Fields**:
  - `_id`: ObjectId
  - `symbol`: String
  - `condition`: Enum ('above', 'below', 'crosses')
  - `target_price`: Number
  - `frequency`: Enum ('once', 'every', 'cooldown')
  - `cooldown_period`: Number (optional, seconds)
  - `is_active`: Boolean
  - `triggered_at`: Timestamp of last trigger (nullable)
  - `created_at`: Timestamp
  - `updated_at`: Timestamp
- **Indexes**:
  - Index on `symbol`
  - Compound index on `{ is_active, symbol, target_price }` for optimized matching

### 3.4 `push_tokens`
- **Purpose**: Store user browser push subscriptions
- **Fields**:
  - `_id`: ObjectId
  - `endpoint`: String (push service endpoint)
  - `expirationTime`: Date (optional)
  - `keys.p256dh`: String
  - `keys.auth`: String
  - `user_agent`: String (optional metadata)
  - `created_at`: Timestamp
- **Indexes**:
  - Unique index on `endpoint`
  - TTL on `created_at` if using auto-expiring tokens

---

## 4. Real-Time Price Flow

1. MT5 EA sends a tick via `POST /prices/tick`
2. Backend validates and saves tick into `price_logs`
3. Emits price via WebSocket to all connected clients
4. Evaluates all active alerts with the incoming tick
5. If alert triggers:
   - Pushes alert to frontend via WebSocket
   - Sends push notification to service worker
   - Updates alert state if "once" or applies cooldown

---

## 5. API Endpoints

### POST `/prices/tick`
- **Purpose**: Ingest real-time tick data from MT5 EA.
- **Headers**: `Authorization: Bearer <EA_TOKEN>`
- **Body Example**:
```json
{
  "symbol": "XAUUSD",
  "price": 2345.00,
  "timestamp": 1680000000
}
```
- **Validations**:
  - All fields required.
  - `price` must be a positive float.
  - Timestamp must be within reasonable bounds (e.g., ±30 seconds).
- **Response**: `200 OK` or error code with reason.

### GET `/alerts`
- **Purpose**: Retrieve current alert configurations.
- **Response**: Array of active/inactive alert rules.
- **Query Support** (optional): `?symbol=XAUUSD` to filter by symbol.

### POST `/alerts`
- **Purpose**: Create or update an alert rule.
- **Body Example**:
```json
{
  "symbol": "XAUUSD",
  "condition": "above",
  "target_price": 2360,
  "frequency": "once"
}
```
- **Validation**: Checks required fields, allowed conditions (`above`, `below`, `crosses`) and frequency (`once`, `every`, `cooldown`).
- **Response**: `201 Created` or `200 Updated`

### DELETE `/alerts/:id`
- **Purpose**: Remove a previously set alert by its ID.
- **Response**: `204 No Content` if deleted, `404` if not found.

### POST `/subscribe`
- **Purpose**: Store push subscription for Web Push notifications.
- **Body**: Browser `PushSubscription` object.
- **Validation**: Ensures endpoint and encryption keys are present.
- **Response**: `201 Created`

### GET `/health`
- **Purpose**: System health check endpoint for monitoring.
- **Response**: `{ "status": "ok", "uptime": <ms> }`

### WebSocket
- **Channels**:
  - `price-update`: real-time tick data
  - `alert-triggered`: server-sent alert events
- **Protocol**: JSON-encoded messages per event type

---

**✅ Endpoint Review Summary**:

These endpoints cover the core functionality:
- Tick ingestion
- Alert rule management (CRUD)
- Push subscription
- Real-time UI sync (WebSocket)
- Health check for deployment readiness

If multi-user support or alert history is later required, additional endpoints like `/users`, `/alerts/history`, or `/subscriptions/:user` could be added.