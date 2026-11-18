# Machanix Bhubaneswar — Full-Stack Practice Recreation

A responsive React/Vite website for Machanix, with an Express HTTP backend for service estimates and booking requests.

## Requirements

- Node.js 18 or newer
- npm

## Run frontend and backend together

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health
- Vite proxies `/api/*` requests to the Express API during local development.

## Testing accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@machanix.demo` | `Admin@123` |
| User | `user@machanix.demo` | `User@123` |

Open `http://localhost:5173/login`, use a testing account, then visit `/admin` for the admin dashboard or `/my-bookings` for the user booking view.

## Build and run as one app

```bash
npm run build
npm start
```

The server serves `dist/` and the API from the same origin on port 3001. Set `PORT` to change the server port.

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/services` | Service catalogue with indicative ranges |
| GET | `/api/cars` | Supported brands, models and fuel types |
| POST | `/api/quote` | Generate an estimate based on selected car/service |
| POST | `/api/bookings` | Validate and persist a booking request |

Example quote body:

```json
{
  "car": { "make": "Tata", "model": "Nexon", "fuel": "Petrol" },
  "serviceName": "Standard Service",
  "city": "Bhubaneswar"
}
```

Booking requests are stored in `backend/data/bookings.json`, which is generated locally when the API starts. The file is git-ignored to prevent personal contact/address details from being committed.

## Important limitations

- Testing accounts, JSON storage and cookie-based authentication are included for setup and review.
- Booking requests are stored locally for this website version.
- No real login, payment, SMS, email or third-party booking integration is configured.
- Use official brand assets and third-party integrations only when authorised.

## Quality checks

```bash
npm run build
```
