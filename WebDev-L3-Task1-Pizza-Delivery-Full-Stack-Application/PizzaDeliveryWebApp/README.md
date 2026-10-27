# Pizza Delivery

A React and Vite customer app with an Express API, MongoDB inventory and orders, Razorpay test checkout, and a separate admin dashboard.

## Deploy the frontend to GitHub Pages

The GitHub Actions workflow at the repository root builds this frontend and deploys it to GitHub Pages whenever changes are pushed to `main` (or when run manually). In the repository settings, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.

The workflow builds only the static frontend. GitHub Pages cannot run the Express API or MongoDB. To enable sign-in, ordering, and admin features, deploy the API separately and set the repository Actions variable `VITE_API_URL` to its public base URL (for example, `https://api.example.com`). Without it, API requests target the Pages site and those features will not work.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB Atlas or a local MongoDB replica set (order and inventory reservations use MongoDB transactions)
- Razorpay test API credentials and a configured webhook
- A Resend account and verified sender domain for verification, reset, and stock-alert email

## Configuration

Copy the example file once, preserving any existing MongoDB connection:

```powershell
Copy-Item server\.env.example server\.env
```

If `server\.env` already exists, add the missing settings from `server\.env.example` instead of overwriting it. Set the following values:

- `MONGODB_URI`: MongoDB connection URI. Use the `pizza_delivery` database.
- `JWT_SECRET`: unique random secret of at least 32 characters.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: admin account credentials. The password must have at least 12 characters. The admin is created on first startup and cannot be registered through the customer form.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: test-mode API credentials from Razorpay.
- `RAZORPAY_WEBHOOK_SECRET`: the webhook secret configured for `/api/payments/webhook`; subscribe to `payment.captured` and `payment.failed`.
- `RESEND_API_KEY` and `EMAIL_FROM`: email service key and verified sender address.
- `CLIENT_URL`: frontend origin, usually `http://localhost:5173`.

Keep all secrets in `server/.env`. It is ignored by Git. Never put server keys in frontend environment variables or commit them.

Generate a JWT secret from PowerShell with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

## Install and start

From `PizzaDeliveryWebApp` in PowerShell:

```powershell
npm.cmd install
Copy-Item server\.env.example server\.env
npm.cmd run dev
```

When `server/.env` already exists, do not repeat the copy command; add only missing configuration values. The frontend is served by Vite (usually `http://localhost:5173`); the API runs on `http://localhost:3000`. The development proxy forwards `/api` requests.

## Included functionality

- Customer registration, email verification, sign-in, and emailed password reset.
- Separate admin sign-in and role-checked admin routes.
- Custom pizza builder: five bases, five sauces, cheese choices, and multiple vegetables.
- Server-calculated totals and live stock reservation before payment.
- Razorpay checkout; order confirmation requires a valid checkout signature and a captured payment verified against Razorpay. Failed or expired reservations return stock; late captured payments request a refund.
- Customer order tracking and admin order updates, refreshed by polling.
- Admin inventory adjustment and configurable low-stock thresholds.
- Scheduled low-stock email alerts; an alert is sent again after stock has been replenished above its threshold.

Starter inventory is created with 100 units per menu item and a 20-unit alert threshold. Admin changes are stored in MongoDB.

## Project structure

```text
PizzaDeliveryWebApp/
├── public/                     # Static assets
├── src/
│   ├── components/             # Customer builder, order list, admin and auth views
│   ├── api.js                  # Frontend API and formatting helpers
│   ├── App.jsx                 # Session and top-level view
│   └── main.jsx
└── server/
    ├── .env.example            # Backend settings template
    └── src/
        ├── config/             # Database and password/token security
        ├── controllers/        # API handlers
        ├── data/               # Menu/prices
        ├── middleware/         # Auth and request limits
        ├── models/             # User, order and inventory schemas
        ├── routes/             # API endpoints
        ├── services/           # Email, payments, stock and scheduled jobs
        ├── app.js
        └── server.js
```
