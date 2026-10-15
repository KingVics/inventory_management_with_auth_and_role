# Inventory Management API

A Node.js and Express REST API for managing users, categories, suppliers, products, and inventory transactions. MongoDB stores the records and Passport-backed GitHub sessions protect the inventory endpoints.

**Live API:** [https://inventory-management-with-auth-and-role.onrender.com](https://inventory-management-with-auth-and-role.onrender.com)  
**Live Swagger UI:** [https://inventory-management-with-auth-and-role.onrender.com/api-docs](https://inventory-management-with-auth-and-role.onrender.com/api-docs)

## Requirements

- Node.js and npm
- A MongoDB database

## Setup

Install dependencies:

```sh
npm install
```

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://127.0.0.1:27017/inventory_management
SESSION_SECRET=replace-with-a-long-random-secret
GITHUB_CLIENT_ID=your-github-oauth-app-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-app-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
PORT=3000
NODE_ENV=development
```

`MONGO_URI`, `SESSION_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL` are required. Use a long random value for `SESSION_SECRET`. Create a GitHub OAuth App and set its authorization callback URL to the exact value of `GITHUB_CALLBACK_URL`. Set that value to your deployed API's callback URL in production. Passport sessions are stored in MongoDB's `sessions` collection, not in the `User` collection. `PORT` defaults to `3000`. Set `NODE_ENV=production` when deploying so authentication cookies are marked `Secure`.

Start the development server:

```sh
npm run dev
```

Or start it without nodemon:

```sh
npm start
```

The server connects to MongoDB before listening. Local API documentation is available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Tests

Run the Jest test suite with:

```sh
npm test
```

Tests use Node's environment and mock database models, so controller unit tests do not require a running MongoDB instance.

## Authentication

Start GitHub sign-in by navigating directly to `http://localhost:3000/api/v1/auth/github` in a browser (or using the sign-in button on the home page). Do not use Swagger's **Try it out** for this route: it uses `fetch`, which cannot follow the redirect to GitHub. The callback validates OAuth state, stores the GitHub ID and username in a Passport session, and redirects to the home page. OAuth sign-in does not create or look up a user in the `User` collection. Any successfully signed-in GitHub account is authorized with the `user` role. From the home page, use **Open API documentation** to open `/api-docs`.

Protected routes require an authenticated Passport session. Inventory transaction records store the GitHub account ID as their `userId`. Log out with `POST /api/v1/auth/logout`; this destroys the server-side session and clears its cookie.

## Roles

All routes mounted under `/api/v1/users`, `/api/v1/categories`, `/api/v1/suppliers`, and `/api/v1/products` require authentication.

| Role | Access |
| --- | --- |
| `user` | Read inventory and access user routes |
| `manager` | User access plus create, update, and delete products and transactions |
| `admin` | User access plus create, update, and delete categories, suppliers, products, and transactions |

User routes currently require authentication but do not restrict operations by role.

## API Routes

| Method | Route | Access |
| --- | --- | --- |
| `GET` | `/api/v1/auth/github` | Public; starts GitHub sign-in |
| `GET` | `/api/v1/auth/github/callback` | GitHub OAuth callback |
| `POST` | `/api/v1/auth/logout` | Public; clears the cookie |
| `GET` | `/api/v1/users` | Authenticated |
| `GET` | `/api/v1/users/profile` | Authenticated |
| `GET`, `PUT`, `DELETE` | `/api/v1/users/{id}` | Authenticated |
| `GET`, `POST` | `/api/v1/categories` | Read: authenticated; create: admin |
| `GET`, `PUT`, `DELETE` | `/api/v1/categories/{id}` | Read: authenticated; modify: admin |
| `GET`, `POST` | `/api/v1/suppliers` | Read: authenticated; create: admin |
| `GET`, `PUT`, `DELETE` | `/api/v1/suppliers/{id}` | Read: authenticated; modify: admin |
| `GET`, `POST` | `/api/v1/products` | Read: authenticated; create: admin or manager |
| `GET`, `PUT`, `DELETE` | `/api/v1/products/{id}` | Read: authenticated; modify: admin or manager |
| `GET` | `/api/v1/products/low-stock` | Authenticated |
| `GET` | `/api/v1/products/supplier/{supplierId}` | Authenticated |
| `GET`, `POST` | `/api/v1/transactions` | Read: authenticated; create: manager or admin |
| `GET`, `DELETE` | `/api/v1/transactions/{transactionId}` | Read: authenticated; delete: manager or admin |
| `GET` | `/api/v1/transactions/product/{productId}` | Authenticated |

Transaction creation accepts `productId`, `type` (`in` or `out`), a positive integer `quantity`, and optional `notes`. The authenticated user is recorded as `userId`; `previousQuantity` and `newQuantity` are calculated by the API. Stock-out transactions cannot reduce inventory below zero. Deleting a transaction reverses its stock change and is allowed only when it is the most recent transaction for that product and its recorded resulting stock still matches.

## Sample Data

Populate MongoDB with sample categories, suppliers, and linked products:

```sh
npm run seed
```

The seeder upserts records by category name, supplier name, and product SKU, so it can be run more than once without duplicating those samples.
