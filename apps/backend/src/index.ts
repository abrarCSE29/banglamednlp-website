import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctor';

dotenv.config();

const app = express();

app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins in development
        if (!origin || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            const allowed = [process.env.FRONTEND_URL || 'http://localhost:3000'];
            if (allowed.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});
