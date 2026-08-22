import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = express.Router();

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MINS = 15;

// POST /api/auth/login — admin login only
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Email and password required' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        if (!user.is_active) {
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

            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { failed_login_count: 0, locked_at: null, last_login_at: new Date() }
        });

        const accessToken = jwt.sign(
            { userId: user.id, role: user.role, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({ accessToken, role: user.role, name: user.name });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticateJWT, (req: any, res) => {
    res.json({ user: req.user });
});

export default router;
