# Personal Journal

## Requirements

- Node.js and npm
- A PostgreSQL database

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your PostgreSQL connection string.
2. Install both sets of dependencies:

   ```sh
   npm install
   npm install --prefix client
   ```

3. Generate the Prisma client and create/update the database table:

   ```sh
   npm run db:generate
   npm run db:push
   ```

4. Build the client and start the app:

   ```sh
   npm start
   ```

The app is served at `http://localhost:3000`. `npm start` builds the client before starting the API.

## Development

Run the API and frontend in separate terminals:

```sh
npm run dev:api
```

```sh
npm --prefix client run dev
```

The Vite development server proxies `/api` requests to the API on port 3000.
