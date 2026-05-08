import { describe, it, expect, vi } from 'vitest';
import { authenticateJWT, requireAdmin, requireDoctor } from '../src/middleware/auth.middleware';
import jwt from 'jsonwebtoken';

vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
    describe('authenticateJWT', () => {
        it('should return 401 if no token is provided', () => {
            const req = { headers: {} as any } as any;
            const res = {
                status: vi.fn().mockReturnThis(),
                sendStatus: vi.fn(),
                json: vi.fn()
            } as any;
            const next = vi.fn();

            authenticateJWT(req, res, next);
            expect(res.sendStatus).toHaveBeenCalledWith(401);
        });

        it('should populate req.user and call next on valid token', () => {
            const req = { headers: { authorization: 'Bearer validtoken' } } as any;
            const res = {} as any;
            const next = vi.fn();

            const mockUser = { userId: 1, email: 'test@example.com', role: 'ADMIN' };
            (jwt.verify as any).mockImplementation((token: string, secret: string, cb: any) => {
                cb(null, mockUser);
            });

            authenticateJWT(req, res, next);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });
    });

    describe('RBAC Middlewares', () => {
        it('requireAdmin should call next if user is ADMIN', () => {
            const req = { user: { role: 'ADMIN' } } as any;
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
            const next = vi.fn();
            requireAdmin(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('requireAdmin should return 403 if user is not ADMIN', () => {
            const req = { user: { role: 'DOCTOR' } } as any;
            const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
            const next = vi.fn();
            requireAdmin(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Admin access required.' });
        });
    });
});
