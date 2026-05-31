import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import doctorRoutes from './routes/doctor';

dotenv.config();

const app = express();

const FRONTEND_URL = (process.env.FRONTEND_URL ?? '*') as string;
// Expose the configured FRONTEND_URL in logs to help debug production env values
console.log('FRONTEND_URL=', FRONTEND_URL);

app.use(cors({
    origin: (origin, callback) => {
        if (FRONTEND_URL === '*') return callback(null, true);
        const allowed = FRONTEND_URL.split(',').map(s => s.trim().replace(/\/$/, ''));
        if (!origin || allowed.includes((origin as string).replace(/\/$/, ''))) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));


app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));

// Lightweight unauthenticated health endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);

const PORT = process.env.PORT || 3001;

// Only listen locally, Vercel handling via export
if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Backend server listening on port ${PORT} (all interfaces)`);
    });
}

export default app;
