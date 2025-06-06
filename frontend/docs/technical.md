## 🎨 Frontend Technical Design: Gold Price Alert Web App (Next.js + PWA + Redux Toolkit)

### 1. Technology Stack
- **Next.js**: React-based framework with SSR and PWA support
- **Redux Toolkit**: Simplified Redux setup for managing application state
- **WebSocket**: Real-time tick updates
- **Web Push API**: Browser notification support
- **Charting**: Lightweight Charts or TradingView widget (for visualizing price and indicators)
- **Service Worker**: For offline support and background push notification handling

---

### 2. Core Containers and Components

#### 2.1 `ChartPage`
- Displays a real-time gold price chart using Lightweight Charts or TradingView widget.
- Integrates indicators: MACD, RSI, and MA overlays drawn using data from computed client-side indicators or backend-provided series.
- Establishes a WebSocket subscription to receive live tick data which is dispatched via `updateTick()` into the Redux `priceSlice`.
- Displays interactive cursor allowing user to hover or click to select a price level, launching an `AddAlertModal`.
- Supports timeframe selection, and upon change, re-renders the chart with new candle data.
- Internal logic listens to Redux state updates and refreshes chart data dynamically.

#### 2.2 `AlertManager`
- Fetches existing alerts using `fetchAlerts()` from `alertsSlice` on component mount.
- Displays alerts in a sortable list showing symbol, condition, target price, frequency, and trigger status.
- Provides edit and delete buttons which call `updateAlert()` and `deleteAlert()` respectively.
- Newly created alerts from modal are synced and appended live to Redux state.
- On `alert-triggered` WebSocket event, updates trigger timestamp and status.

#### 2.3 `NotificationBar`
- Subscribes to `notificationSlice`.
- When `pushNotification()` is called (either from WebSocket or internal event), displays the alert in a toast-style bar.
- Uses timer or manual close to trigger `clearNotification()`.
- Ensures user sees alert even if backgrounded or interacting with another tab section.

#### 2.4 `PushSubscriptionModal`
- On first load or if no push subscription exists, prompts user to grant notification permissions.
- If granted, obtains `PushSubscription` from browser and POSTs it to `/subscribe`.
- Handles permission denial gracefully and updates frontend state to prevent re-prompting.
- Verifies VAPID keys exist from backend response.

---

### 3. Redux Toolkit Slices

#### 3.1 `priceSlice`
- **Purpose**: Maintain the latest real-time price for each subscribed symbol.
- **State Structure**:
  ```ts
  price: {
    [symbol: string]: {
      price: number,
      timestamp: number
    }
  }
  ```
- **Actions**:
  - `updateTick(symbol, price, timestamp)`: Called by WebSocket listener to keep price state fresh.
- **Selectors**:
  - `getLatestPrice(symbol)`: Returns most recent price for rendering in chart and UI.

#### 3.2 `alertsSlice`
- **Purpose**: Store and track all alert configurations set by the user.
- **State Structure**:
  ```ts
  alerts: Array<{
    id: string,
    symbol: string,
    condition: string,
    target_price: number,
    frequency: string,
    is_active: boolean,
    triggered_at?: number
  }>
  ```
- **Actions**:
  - `fetchAlerts()`: Loads alerts from `/alerts`
  - `addAlert(rule)`: Creates a new alert via `POST /alerts`
  - `updateAlert(rule)`: Updates rule settings
  - `deleteAlert(id)`: Deletes rule from backend and Redux
  - `setAlertTriggered(id)`: Sets an alert as recently triggered
- **Selectors**:
  - `selectAllAlerts()`: Returns complete alert list
  - `selectTriggered()`: Filters only triggered alerts

#### 3.3 `notificationSlice`
- **Purpose**: Store real-time messages and display logic for notification bar.
- **State Structure**:
  ```ts
  notification: {
    message: string,
    timestamp: number
  }
  ```
- **Actions**:
  - `pushNotification({ msg })`: Called by WebSocket listener or alert evaluation logic
  - `clearNotification()`: Automatically after timeout or manual dismiss
- **Logic**:
  - Middleware checks if message is new or duplicate
  - UI listens for changes and shows snackbar-style popup

---

### 4. WebSocket Integration
- **Initialization**:
  - Upon app startup, connects to backend WebSocket endpoint.
  - Socket connection managed using native WebSocket API or library like `socket.io-client`.
- **Events Handled**:
  - `price-update`:
    - Payload contains `{ symbol, price, timestamp }`
    - Dispatched to `updateTick()` in `priceSlice`
    - Automatically updates chart via component reactivity
  - `alert-triggered`:
    - Payload includes `alertId`, `message`, and optional price
    - Dispatches `setAlertTriggered()` in `alertsSlice`
    - Sends `pushNotification()` to `notificationSlice`
- **Reconnection Logic**:
  - On disconnect, retries using exponential backoff (e.g., 1s → 2s → 4s… up to max 30s)
  - Rejoins subscriptions automatically on recovery
  - Logs reconnection attempts for debugging
- **Security Consideration**:
  - Message integrity is assumed since single-user setup
  - Future: can add token-based handshake

---

### 5. PWA Support
- Configured via `next-pwa`
- Registers service worker for offline cache and push listener
- Handles push events using browser service worker API

---

### 6. Alert UX Flow
1. User selects price on chart
2. Enters condition (`>`, `<`, `crosses`) and frequency (`once`, `every`)
3. Alert is POSTed to `/alerts`
4. Redux state updates via API response

---

### 7. Security and State Management
- No authentication — single user
- State is cached in Redux and optionally in `localStorage`
- WebSocket messages verified by payload structure only

---

## ✅ Summary
Frontend architecture supports real-time charting, alerting, and notification UX. Redux Toolkit ensures maintainable state management, while WebSocket and push APIs provide the responsiveness and user experience of native trading platforms.