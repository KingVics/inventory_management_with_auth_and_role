import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/connection.js';
import createHttpError from 'http-errors';
import { errorHandler } from './middleware/errorHandler.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger/swagger.js'
import { swaggerInitOptions } from './swagger-init.js';
import { isAuthentication } from './middleware/authentication.js';

// Import routes
import userRoutes from './route/user.js';
import authRoutes from './route/auth.js';
import categoryRoutes from './route/category.js';
import supplierRoutes from "./route/supplier.js";
import productRoutes from "./route/product.js"



const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8000',
    "https://inventory-management-with-auth-and-role.onrender.com"
];


// -------------------------- Middleware -------------------------
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use(express.json({
    limit: '50mb',
    verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.set('trust proxy', 1);
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS: origin ${origin} not allowed`));
            }
        },
        credentials: true,
    })
);
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, x-Requested-With, Content-type, Accept, z-Key, Authorization',
    );
    res.setHeader(
        'Access-Control-Allow-Methods',
        'POST, GET, PUT, PATCH, OPTIONS, DELETE',
    );
    next();
});
app.use(cors({ methods: ['GET', 'POST', 'UPDATE', 'DELETE', 'PUT', 'PATCH'] }));
app.use(helmet());

// -------------------------- Routes -------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerInitOptions));
app.use('/api/v1', authRoutes);
app.use('/api/v1', isAuthentication, userRoutes);
app.use('/api/v1/categories', isAuthentication, categoryRoutes);
app.use('/api/v1/suppliers', isAuthentication, supplierRoutes);
app.use('/api/v1/products', isAuthentication, productRoutes);


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