import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/connection.js';
import createHttpError from 'http-errors';
import { errorHandler } from './middleware/errorHandler.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger.js'
import { swaggerInitOptions } from './swagger-init.js';
import { isAuthentication } from './middleware/authentication.js';
import passport from 'passport';
import { configurePassport } from './config/passport.js';

// Import routes
// import userRoutes from './route/user.js';
import authRoutes from './route/auth.js';
import indexRoutes from './route/index.js';
import categoryRoutes from './route/category.js';
import supplierRoutes from "./route/supplier.js";
import productRoutes from "./route/product.js"
import transactionRoutes from './route/transaction.js';



const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    "https://inventory-management-with-auth-and-role.onrender.com"
];

configurePassport();
if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET must be configured.');
}

// -------------------------- Middleware -------------------------
app.use(cookieParser());
app.use(express.json());
app.use(express.json({
    limit: '50mb',
    verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', 1);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));
app.use(session({
    name: 'inventory.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
        ttl: 40 * 60,
    }),
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 40 * 60 * 1000,
    },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(helmet());

// -------------------------- Routes -------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customJsStr: `
      (() => {
        const addAuthControls = () => {
          const topbar = document.querySelector('.topbar-wrapper');
          if (!topbar || topbar.querySelector('.swagger-auth-controls')) return;

          const controls = document.createElement('div');
          controls.className = 'swagger-auth-controls';
          controls.style.display = 'flex';
          controls.style.gap = '8px';
          controls.style.marginLeft = '12px';

          const authorize = document.createElement('button');
          authorize.className = 'btn authorize';
          authorize.textContent = 'Authorize with GitHub';
          authorize.onclick = () => {
            window.location.href = '/api/v1/auth/github';
          };

          const logout = document.createElement('button');
          logout.className = 'btn authorize';
          logout.textContent = 'Logout';
          logout.onclick = async () => {
            try {
              const response = await fetch('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
              });
              if (!response.ok) {
                throw new Error('Logout failed. Please try again.');
              }
              window.location.href = '/';
            } catch (error) {
              window.alert(error.message);
            }
          };

          const status = document.createElement('span');
          status.className = 'auth-session-status';
          status.style.alignSelf = 'center';
          status.textContent = 'Checking sign-in status...';

          controls.append(status, authorize, logout);
          topbar.appendChild(controls);

          fetch('/api/v1/auth/status', { credentials: 'same-origin' })
            .then((response) => {
              if (!response.ok) throw new Error('Sign-in status is unavailable.');
              return response.json();
            })
            .then((session) => {
              if (session.authenticated) {
                status.textContent = 'Signed in as ' + session.username;
                window.ui?.preauthorizeApiKey('sessionCookie', 'authenticated');
              } else {
                status.textContent = 'Not signed in';
              }
            })
            .catch(() => {
              status.textContent = 'Unable to check sign-in status';
            });
        };

        new MutationObserver(addAuthControls).observe(document.body, {
          childList: true,
          subtree: true,
        });
        addAuthControls();
      })();
    `,
    ...swaggerInitOptions
}));
app.use('/api/v1', authRoutes);
app.use('/', indexRoutes);
// app.use('/api/v1', isAuthentication, userRoutes);
app.use('/api/v1/categories', isAuthentication, categoryRoutes);
app.use('/api/v1/suppliers', isAuthentication, supplierRoutes);
app.use('/api/v1/products', isAuthentication, productRoutes);
app.use('/api/v1/transactions', isAuthentication, transactionRoutes);
// ---------- 404 ----------
app.use((req, res, next) => {
    next(createHttpError(404, 'Route not found'));
});

app.use(errorHandler);


// -------------------------- Start Server -------------------------

const startServer = async () => {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        })
    }
    catch (error) {
        process.exit(1);

    }
}


startServer();