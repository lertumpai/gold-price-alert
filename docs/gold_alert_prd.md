# 📄 Product Requirements Document (PRD) – Gold Price Alert Web App

## 🔷 Overview
A fully open-source, real-time personal alerting web application to monitor gold prices. Built as a PWA with responsive charts and browser push notifications using MT5 data and custom alert triggers.

---

## 🎯 Goals
- Monitor gold price in real time with <1s delay
- Create alert rules (above, below, cross) on chart or via form
- Visual alert indicators and PWA push support
- Fully installable and functional offline
- One-person use, no auth

---

## 🧱 Tech Stack Summary

| Layer         | Technology                             |
|---------------|-----------------------------------------|
| Frontend      | Next.js, Tailwind CSS, ShadCN, PWA      |
| Charting      | Lightweight Charts, indicatorts         |
| Backend       | NestJS (TypeScript), WebSocket, REST    |
| Database      | MongoDB + Mongoose                      |
| Notification  | Web Push API + VAPID                    |
| Realtime Feed | MT5 (Exness) via custom MQL5 EA script  |

---

## 📦 Core Features

### 🖥 Chart
- Real-time price feed
- Timeframes: 1m to 1d
- Indicators: RSI, MACD, MA
- Drag-and-drop alert creation

### 🔔 Alerts
- Alert types: above, below, crosses
- Frequencies: once, every time, cooldown
- In-app UI and push notification delivery

### 🌐 PWA
- Installable on all platforms
- Works offline with cached price history
- Push in background (via service worker)

---

## ⚙️ Push Flow (VAPID-based)
1. Frontend gets `pushManager.subscribe()` and sends to backend
2. Backend stores subscription with `endpoint` + public key
3. On alert trigger:
   - Encrypt message
   - Sign with **VAPID private key**
   - Push to browser via push service
4. Browser triggers service worker → shows notification