import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import crowdRoutes from './routes/crowd';

dotenv.config();

const app = express();

const normalizeOrigin = (value: string) => {
    const trimmed = value.trim().replace(/\/$/, '');

    if (trimmed === '*') {
        return '*';
    }

    try {
        return new URL(trimmed).origin;
    } catch {
        return trimmed.replace(/\/[^/]*$/, '');
    }
};

const rawFrontendOrigins = [process.env.FRONTEND_URLS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .join(',');

const allowedOrigins = rawFrontendOrigins
    ? rawFrontendOrigins.split(',').map(normalizeOrigin).filter(Boolean)
    : ['*'];

// Expose the configured FRONTEND_URL(S) in logs to help debug production env values.
console.log('ALLOWED_FRONTEND_ORIGINS=', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (allowedOrigins.includes('*')) return callback(null, true);

        const normalizedOrigin = origin ? normalizeOrigin(origin) : origin;
        if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
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
app.use('/api/crowd', crowdRoutes);

const PORT = process.env.PORT || 3001;

// Only listen locally, Vercel handling via export
if (process.env.NODE_ENV !== 'production') {
    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`Backend server listening on port ${PORT} (all interfaces)`);
    });
}

export default app;
