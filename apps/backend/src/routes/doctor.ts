import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireDoctor, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateJWT, requireDoctor);

// GET Doctor Dashboard Progress
router.get('/progress', async (req: AuthRequest, res) => {
    try {
        const doctorId = req.user!.userId;

        // In a real scenario, we might assign specific subsets to doctors. 
        // If not, we use the global total minus what they verified.
        const totalRecords = await prisma.triageRecord.count();
        const verifiedCount = await prisma.verification.count({
            where: { doctor_id: doctorId }
        });

        res.json({ totalRecords, verifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching progress' });
    }
});

// GET the next unverified record in the queue
router.get('/queue', async (req: AuthRequest, res) => {
    try {
        const doctorId = req.user!.userId;

        // Find the first TriageRecord that DOES NOT have a Verification from this doctor
        const nextRecord = await prisma.triageRecord.findFirst({
            where: {
                verifications: {
                    none: { doctor_id: doctorId }
                }
            },
            orderBy: { id: 'asc' }
        });

        if (!nextRecord) {
            res.status(200).json({ message: 'Queue complete', record: null });
            return;
        }

        res.json({ record: nextRecord });
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({ message: 'Error fetching queue' });
    }
});

// GET a specific record (e.g. to review/amend past submissions)
router.get('/records/:id', async (req: AuthRequest, res) => {
    const { id } = req.params;
    const doctorId = req.user!.userId;

    try {
        const record = await prisma.triageRecord.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!record) {
            res.status(404).json({ message: 'Record not found' });
            return;
        }

        const verification = await prisma.verification.findUnique({
            where: { record_id_doctor_id: { record_id: parseInt(id as string), doctor_id: doctorId } }
        });

        res.json({ record, verification });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching record' });
    }
});

// POST Submit Verification
router.post('/verifications', async (req: AuthRequest, res) => {
    const doctorId = req.user!.userId;
    const { record_id, verified_departments, clinical_note, is_unable_to_assess } = req.body;

    try {
        const verification = await prisma.verification.upsert({
            where: {
                record_id_doctor_id: { record_id: parseInt(record_id), doctor_id: doctorId }
            },
            update: {
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
                submitted_at: new Date()
            },
            create: {
                record_id: parseInt(record_id),
                doctor_id: doctorId,
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
                submitted_at: new Date()
            }
        });
        res.status(201).json({ message: 'Verification submitted', verification });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting verification' });
    }
});

// PUT Amend past verification
router.put('/verifications/:id', async (req: AuthRequest, res) => {
    const doctorId = req.user!.userId;
    const record_id = parseInt(req.params.id as string);
    const { verified_departments, clinical_note, is_unable_to_assess } = req.body;

    try {
        const verification = await prisma.verification.update({
            where: {
                record_id_doctor_id: { record_id, doctor_id: doctorId }
            },
            data: {
                verified_departments,
                clinical_note,
                is_unable_to_assess: is_unable_to_assess || false,
            }
        });
        res.json({ message: 'Verification updated', verification });
    } catch (error) {
        res.status(500).json({ message: 'Error updating verification' });
    }
});

// PUT Auto-save draft
router.put('/verifications/:id/draft', async (req: AuthRequest, res) => {
    const doctorId = req.user!.userId;
    const record_id = parseInt(req.params.id as string);
    const { draft } = req.body;

    try {
        // Try to update if Verification exists, or upsert? 
        // Drafts happen BEFORE submission. So we need upsert.
        const upserted = await prisma.verification.upsert({
            where: {
                record_id_doctor_id: { record_id, doctor_id: doctorId }
            },
            update: { draft },
            create: {
                record_id,
                doctor_id: doctorId,
                verified_departments: {},
                draft,
            }
        });
        res.json({ message: 'Draft saved' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving draft' });
    }
});

export default router;
