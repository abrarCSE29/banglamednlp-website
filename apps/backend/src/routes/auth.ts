import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINS = 15;

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            await prisma.loginAudit.create({ data: { email, ip_address: ip, success: false } });
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (!user.is_active) {
            await prisma.loginAudit.create({ data: { user_id: user.id, email, ip_address: ip, success: false } });
            res.status(403).json({ message: 'Account deactivated' });
            return;
        }

        if (user.locked_at && new Date().getTime() - user.locked_at.getTime() < LOCKOUT_DURATION_MINS * 60000) {
            const remaining = Math.ceil((LOCKOUT_DURATION_MINS * 60000 - (new Date().getTime() - user.locked_at.getTime())) / 60000);
            res.status(423).json({ message: `Account locked. Try again in ${remaining} minutes.` });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            const newFailCount = user.failed_login_count + 1;
            const willLock = newFailCount >= LOCKOUT_THRESHOLD;

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failed_login_count: newFailCount,
                    locked_at: willLock ? new Date() : null
                }
            });

            await prisma.loginAudit.create({ data: { user_id: user.id, email, ip_address: ip, success: false } });
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        // Success
        await prisma.user.update({
            where: { id: user.id },
            data: { failed_login_count: 0, locked_at: null, last_login_at: new Date() }
        });

        await prisma.loginAudit.create({ data: { user_id: user.id, email, ip_address: ip, success: true } });

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.JWT_REFRESH_SECRET as string,
            { expiresIn: '7d' }
        );

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,  // must be false for HTTP on local network
            sameSite: 'lax', // 'strict' breaks cross-origin IP access on mobile
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, role: user.role, name: user.name });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies?.refreshToken; // Needs cookie-parser middleware in index.ts

    if (!refreshToken) {
        res.sendStatus(401);
        return;
    }

    try {
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });

        if (!user || !user.is_active) {
            res.sendStatus(403);
            return;
        }

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (error) {
        res.sendStatus(403);
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticateJWT, (req: any, res) => {
    res.json({ user: req.user });
});

export default router;
