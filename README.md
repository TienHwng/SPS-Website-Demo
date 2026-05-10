# HCMUT Smart Parking

Smart parking dashboard with a Node/Express backend, persistent JSON state, and a responsive frontend.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Scripts

- `npm start` - run the deployable Express server
- `npm run dev` - same as start for this lightweight app
- `npm run check` - syntax checks for backend and frontend JavaScript

## API

- `GET /api/health` - health check
- `GET /api/state` - read current parking state
- `PUT /api/state` - persist current parking state
- `POST /api/reset` - reset state from seed data

The backend stores runtime data in `data/db.json`. If that file does not exist, it is generated from `server/seed.js`.
