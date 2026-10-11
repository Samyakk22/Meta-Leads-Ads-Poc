# Meta Leads Live

A proof of concept that shows Meta Lead Ads leads in a React Native app in real time.
When a lead form is submitted, the lead appears in the already-open app without
refreshing or touching the device.

## Features

- Receives Meta `leadgen` webhooks and verifies the request signature
- Fetches full lead details (name, email, phone, other form fields) from the Graph API
- Pushes new leads to the app instantly using Socket.IO
- Newly received leads are highlighted in the list
- Shows connection status (Live / Reconnecting) and syncs missed leads on reconnect
- Ignores duplicate webhooks for the same lead

## Tech Stack

- **Backend:** Node.js, Express, Socket.IO
- **Mobile:** React Native (Expo), socket.io-client
- **Other:** Meta Webhooks, Meta Graph API, ngrok

## How it works

```
Lead Ads Testing Tool -> Meta Webhook (leadgen_id) -> ngrok -> Express backend -> Graph API (fetch lead details) -> Socket.IO "lead:new" event ->  React Native app
```

The webhook only contains the lead id, so the backend fetches the actual details
from the Graph API before sending the lead to the app.

## Project Structure

```
backend/
  src/
    index.js          # server setup and /health route
    config.js         # environment variables
    webhook.js        # webhook verification and events
    graphApi.js       # Graph API requests
    leadProcessor.js  # fetch, format, store and broadcast a lead
    leadStore.js      # in-memory storage
    realtime.js       # Socket.IO
mobile/
  App.js
  src/
    LeadsScreen.js    # main screen
    LeadCard.js       # single lead item
    useLeads.js       # socket connection and leads state
    config.js         # backend URL
```

## Prerequisites

- Node.js 18+
- A Facebook Page with a lead form (Instant Form)
- A Meta developer app
- ngrok
- Expo Go app on your phone, or an Android emulator

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../mobile
npm install
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example`:

```
PORT=3000
META_VERIFY_TOKEN=your_verify_token
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_APP_SECRET=your_app_secret
META_GRAPH_VERSION=v24.0
```

Create `mobile/.env` from `mobile/.env.example`:

```
EXPO_PUBLIC_BACKEND_URL=https://your-ngrok-url
```

### 3. Start the backend and ngrok

```bash
cd backend
npm start
```

In another terminal:

```bash
ngrok http 3000
```

### 4. Meta app configuration

1. Add the **Capture & manage ad leads with Marketing API** use case to your app.
2. Generate a **Page access token** in the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) with these permissions:
   `leads_retrieval`, `pages_show_list`, `pages_read_engagement`, `pages_manage_metadata`, `pages_manage_ads`
3. In **Webhooks**, select **Page** and set:
   - Callback URL: `https://your-ngrok-url/webhook`
   - Verify token: same as `META_VERIFY_TOKEN`
4. Subscribe to the `leadgen` field.
5. Subscribe your Page to the app:
   ```bash
   curl -X POST "https://graph.facebook.com/v24.0/PAGE_ID/subscribed_apps?subscribed_fields=leadgen&access_token=PAGE_ACCESS_TOKEN"
   ```
6. **Publish the app.** If the app is unpublished, Meta only sends dashboard test
   webhooks, and leads from the testing tool stay on "Pending".

### 5. Run the app

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go. The screen should show **Live** with 0 leads.

## Testing

1. Keep the app open on the leads screen.
2. Open the [Lead Ads Testing Tool](https://developers.facebook.com/tools/lead-ads-testing).
3. Select your Page and form.
4. Click **Delete lead** (if one exists), then **Create lead**.
5. The lead shows up in the app within a few seconds.

Backend logs:

```
[webhook] received leadgen ids: 1413981083594415
[lead] 1413981083594415: stored and broadcast (1 total)
```

## Limitations

- Leads are stored in memory, so they're cleared when the backend restarts
- Graph API Explorer tokens expire after about an hour
- Socket connection has no authentication
- Supports a single Page