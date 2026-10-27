# Pizza Delivery Web App

React and Vite power the frontend; Express and MongoDB power the API.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB Community Server running locally, or a MongoDB Atlas connection URI

## Install

From this directory, install all workspace dependencies:

```powershell
npm.cmd install
Copy-Item server\.env.example server\.env
```

Edit `server\.env` and set `MONGODB_URI` to your local MongoDB URI or Atlas connection URI. Keep credentials private; `.env` files are ignored by Git.

## Run in development

Start the frontend and API together:

```powershell
npm.cmd run dev
```

Open the Vite URL shown in the terminal (usually `http://localhost:5173`). The Express API runs on `http://localhost:3000`; the frontend proxies `/api` requests to it. Check the API and database connection at `http://localhost:3000/api/health`.

The API will not start if it cannot connect to MongoDB. Confirm MongoDB is running and `MONGODB_URI` is correct.

## Useful commands

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run server:start
```

## Project structure

```text
PizzaDeliveryWebApp/
├── public/                 # Static frontend files
├── src/                    # React/Vite frontend
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── server/
│   ├── .env.example        # Local configuration template
│   ├── package.json        # API dependencies and commands
│   └── src/
│       ├── config/         # Database setup
│       ├── controllers/    # HTTP request handlers
│       ├── routes/         # API route definitions
│       ├── app.js          # Express middleware and routes
│       └── server.js       # Environment, database, and startup
├── index.html
├── package.json            # Frontend/workspace commands
└── vite.config.js          # Vite development proxy
```
