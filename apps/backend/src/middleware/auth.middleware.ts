import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: string;
        email: string;
    };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                res.sendStatus(403);
                return;
            }
            req.user = user as any;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ message: 'Forbidden: Admin access required.' });
        return;
    }
    next();
};

export const requireDoctor = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== 'DOCTOR') {
        res.status(403).json({ message: 'Forbidden: Doctor access required.' });
        return;
    }
    next();
};
