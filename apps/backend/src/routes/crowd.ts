import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = express.Router();
const CLAIM_DURATION_MINUTES = 2;

// POST /api/crowd/enter — crowd worker enters email + optional BMDC reg number (no auth required)
router.post('/enter', async (req, res) => {
    const { email, bmdc_reg_number } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
        res.status(400).json({ message: 'Email is required' });
        return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const worker = await prisma.crowdWorker.upsert({
            where: { email: normalizedEmail },
            update: { bmdc_reg_number: bmdc_reg_number || null },
            create: { email: normalizedEmail, bmdc_reg_number: bmdc_reg_number || null },
        });

        const token = jwt.sign(
            { workerId: worker.id, email: worker.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({ accessToken: token, worker: { id: worker.id, email: worker.email, bmdc_reg_number: worker.bmdc_reg_number } });
    } catch (error: any) {
        console.error('Enter error:', error);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Middleware: verify crowd token
const authenticateWorker = (req: any, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.sendStatus(401);
        return;
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        req.worker = decoded;
        next();
    });
};

router.use(authenticateWorker);

// GET /api/crowd/next — get next unverified, unclaimed record (or expired claim)
router.get('/next', async (req: any, res) => {
    const workerId = req.worker.workerId;
    const claimExpiry = new Date(Date.now() - CLAIM_DURATION_MINUTES * 60 * 1000);

    try {
        // Find a record that:
        // 1. Has no submitted verification by ANY worker
        // 2. Either has no active claim, or the claim has expired
        const nextRecord = await prisma.$queryRaw<{ id: number }[]>`
            SELECT r.id
            FROM triage_records r
            WHERE NOT EXISTS (
                SELECT 1 FROM verifications v
                WHERE v.record_id = r.id AND v.is_submitted = true
            )
            AND (
                NOT EXISTS (
                    SELECT 1 FROM verifications v
                    WHERE v.record_id = r.id AND v.is_submitted = false
                )
                OR EXISTS (
                    SELECT 1 FROM verifications v
                    WHERE v.record_id = r.id
                    AND v.is_submitted = false
                    AND v.claimed_at < ${claimExpiry}
                )
            )
            ORDER BY RANDOM()
            LIMIT 1
        `;

        if (nextRecord.length === 0) {
            res.json({ message: 'All records verified', record: null });
            return;
        }

        const recordId = nextRecord[0].id;

        // Upsert a claim for this worker
        await prisma.verification.upsert({
            where: { record_id_worker_id: { record_id: recordId, worker_id: workerId } },
            update: { claimed_at: new Date(), is_submitted: false },
            create: {
                record_id: recordId,
                worker_id: workerId,
                claimed_at: new Date(),
                is_submitted: false,
                verified_departments: {},
            },
        });

        const record = await prisma.triageRecord.findUnique({ where: { id: recordId } });
        res.json({ record });
    } catch (error) {
        console.error('Error fetching next record:', error);
        res.status(500).json({ message: 'Error fetching next record' });
    }
});

// GET /api/crowd/records/:id — get a specific record (for re-entry)
router.get('/records/:id', async (req: any, res) => {
    const recordId = parseInt(req.params.id);
    const workerId = req.worker.workerId;

    try {
        const record = await prisma.triageRecord.findUnique({ where: { id: recordId } });
        if (!record) {
            res.status(404).json({ message: 'Record not found' });
            return;
        }

        const verification = await prisma.verification.findUnique({
            where: { record_id_worker_id: { record_id: recordId, worker_id: workerId } },
        });

        res.json({ record, verification });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching record' });
    }
});

// POST /api/crowd/verify — submit verification
router.post('/verify', async (req: any, res) => {
    const workerId = req.worker.workerId;
    const { record_id, verified_departments, clinical_note, is_unable_to_assess } = req.body;

    try {
        const verification = await prisma.verification.upsert({
            where: { record_id_worker_id: { record_id: parseInt(record_id), worker_id: workerId } },
            update: {
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
                submitted_at: new Date(),
                is_submitted: true,
            },
            create: {
                record_id: parseInt(record_id),
                worker_id: workerId,
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
                submitted_at: new Date(),
                claimed_at: new Date(),
                is_submitted: true,
            },
        });
        res.status(201).json({ message: 'Verification submitted', verification });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting verification' });
    }
});

// PUT /api/crowd/verify/:id — amend past verification
router.put('/verify/:id', async (req: any, res) => {
    const workerId = req.worker.workerId;
    const recordId = parseInt(req.params.id);
    const { verified_departments, clinical_note, is_unable_to_assess } = req.body;

    try {
        const verification = await prisma.verification.update({
            where: { record_id_worker_id: { record_id: recordId, worker_id: workerId } },
            data: {
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
            },
        });
        res.json({ message: 'Verification updated', verification });
    } catch (error) {
        res.status(500).json({ message: 'Error updating verification' });
    }
});

// PUT /api/crowd/draft/:id — save draft
router.put('/draft/:id', async (req: any, res) => {
    const workerId = req.worker.workerId;
    const recordId = parseInt(req.params.id);
    const { draft, clinical_note, is_unable_to_assess } = req.body;

    try {
        await prisma.verification.upsert({
            where: { record_id_worker_id: { record_id: recordId, worker_id: workerId } },
            update: { draft, clinical_note, is_unable_to_assess },
            create: {
                record_id: recordId,
                worker_id: workerId,
                verified_departments: {},
                draft,
                clinical_note,
                is_unable_to_assess,
                claimed_at: new Date(),
            },
        });
        res.json({ message: 'Draft saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving draft' });
    }
});

// GET /api/crowd/progress — global stats
router.get('/progress', async (req: any, res) => {
    try {
        const totalRecords = await prisma.triageRecord.count();
        const verifiedCount = await prisma.verification.count({
            where: { is_submitted: true },
        });

        res.json({ totalRecords, verifiedCount, progress: totalRecords > 0 ? Math.round((verifiedCount / totalRecords) * 100) : 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
});

export default router;
