# Inventory Management API

A Node.js and Express REST API for managing users, categories, suppliers, and products. MongoDB stores the records, and JWT authentication protects the inventory endpoints.

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
JWT_SECRET=replace-with-a-long-random-secret
PORT=3000
NODE_ENV=development
```

`MONGO_URI` and `JWT_SECRET` are required. `PORT` defaults to `3000`. Set `NODE_ENV=production` when deploying so the authentication cookie is marked `Secure`.

Start the development server:

```sh
npm run dev
```

Or start it without nodemon:

```sh
npm start
```

The server connects to MongoDB before listening. API documentation is available at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

## Authentication

Register with `POST /api/v1/auth/register`, providing `firstName`, `lastName`, `email`, `phone`, `role`, and `password`. Passwords are hashed before storage. The accepted roles are `user`, `manager`, and `admin`; the current registration endpoint accepts the role in the request body, so production deployments should restrict who can assign privileged roles.

Log in with `POST /api/v1/auth/login` and an `email` and `password`. A successful login returns a JWT and sets it in an HTTP-only `token` cookie with a 40-minute lifetime. Protected routes also accept the token as `Authorization: Bearer <token>`.

Log out with `POST /api/v1/auth/logout`; this clears the authentication cookie. JWTs are stateless, so a copied token remains valid until it expires even after logout.

## Roles

All routes mounted under `/api/v1/users`, `/api/v1/categories`, `/api/v1/suppliers`, and `/api/v1/products` require authentication.

| Role | Access |
| --- | --- |
| `user` | Read inventory and access user routes |
| `manager` | User access plus create, update, and delete products |
| `admin` | User access plus create, update, and delete categories, suppliers, and products |

User routes currently require authentication but do not restrict operations by role.

## API Routes

| Method | Route | Access |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public |
| `POST` | `/api/v1/auth/login` | Public |
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

## Sample Data

Populate MongoDB with sample categories, suppliers, and linked products:

```sh
npm run seed
```

The seeder upserts records by category name, supplier name, and product SKU, so it can be run more than once without duplicating those samples.
