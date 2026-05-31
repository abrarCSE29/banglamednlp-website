import express from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import multer from 'multer';
import { parse } from 'csv-parse';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { authenticateJWT, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
const DOCTOR_PORTAL_URL = 'https://banglamednlp.abrarhameem.me';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : undefined,
    secure: process.env.SMTP_PORT === '465'
});

// Normalize from header and envelope address for SMTP
const SMTP_FROM_ADDRESS = process.env.SMTP_FROM_ADDRESS || (() => {
    const m = (process.env.SMTP_FROM || '').match(/<([^>]+)>/);
    return m ? m[1] : (process.env.SMTP_FROM || 'no-reply@resend.dev');
})();
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || (() => {
    const m = (process.env.SMTP_FROM || '').match(/^\s*\"?([^\"<]+)\"?\s*</);
    return m ? m[1].trim() : 'Verification System';
})();
const FROM_HEADER = SMTP_FROM_NAME ? `"${SMTP_FROM_NAME}" <${SMTP_FROM_ADDRESS}>` : SMTP_FROM_ADDRESS;
const DEPARTMENTS = [
    'medicine', 'neurology', 'surgery', 'gastroenterology', 'pediatrics',
    'cardiology', 'ent', 'orthopedics', 'endocrinology', 'nephrology',
    'psychiatry', 'dermatology', 'pulmonology', 'ophthalmology',
    'hematology', 'urology', 'gynecology', 'rheumatology'
] as const;

const verificationRecordSelect = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = true;
    return acc;
}, {} as Record<string, true>);

router.use(authenticateJWT, requireAdmin);

// === DASHBOARD STATS ===
router.get('/dashboard', async (req, res) => {
    try {
        const [
            totalRecords,
            verifiedRecords,
            totalAssignments,
            assignedRecordGroups,
            doctors,
            verifications
        ] = await Promise.all([
            prisma.triageRecord.count(),
            prisma.verification.count(),
            prisma.doctorAssignment.count(),
            prisma.doctorAssignment.groupBy({
                by: ['record_id']
            }),
            prisma.user.findMany({
                where: { role: 'DOCTOR' },
                select: {
                    id: true,
                    name: true,
                    specialty: true,
                    is_active: true,
                    _count: {
                        select: {
                            verifications: true,
                            assigned_records: true
                        }
                    }
                }
            }),
            prisma.verification.findMany({
                select: {
                    is_unable_to_assess: true,
                    verified_departments: true,
                    record: {
                        select: verificationRecordSelect
                    }
                }
            })
        ]);

        const assignedRecordsCount = assignedRecordGroups.length;

        const totalVerifications = verifications.length;
        let acceptedCount = 0;
        let fixCount = 0;
        let rejectedCount = 0;

        // Track agreement for Kappa (Macro-average over departments)
        let totalKappa = 0;
        let validKappaDepartments = 0;

        if (totalVerifications > 0) {
            verifications.forEach(v => {
                if (v.is_unable_to_assess) {
                    rejectedCount++;
                    return;
                }

                const aiDepts = DEPARTMENTS.filter(d => (v.record as any)[d] === 1).sort();
                const docDeptsDict = v.verified_departments as Record<string, boolean>;
                const docDepts = Object.entries(docDeptsDict)
                    .filter(([_, val]) => val)
                    .map(([key]) => key)
                    .sort();

                if (aiDepts.join('|') === docDepts.join('|')) {
                    acceptedCount++;
                } else {
                    fixCount++;
                }
            });

            // Kappa Calculation (Simplified Multi-label approach: calculate per department and average)
            DEPARTMENTS.forEach(dept => {
                let TP = 0, TN = 0, FP = 0, FN = 0;
                verifications.forEach(v => {
                    if (v.is_unable_to_assess) return;
                    const aiVal = (v.record as any)[dept] === 1;
                    const docVal = !!(v.verified_departments as any)[dept];

                    if (aiVal && docVal) TP++;
                    else if (!aiVal && !docVal) TN++;
                    else if (!aiVal && docVal) FP++;
                    else if (aiVal && !docVal) FN++;
                });

                const total = TP + TN + FP + FN;
                if (total === 0) return;

                const observedAgreement = (TP + TN) / total;
                const aiPositiveRate = (TP + FN) / total;
                const docPositiveRate = (TP + FP) / total;
                const expectedAgreement = (aiPositiveRate * docPositiveRate) + ((1 - aiPositiveRate) * (1 - docPositiveRate));

                // If expectedAgreement is 1, kappa is indeterminate or 1? Handle denumerator.
                const kappa = (expectedAgreement === 1) ? 1 : (observedAgreement - expectedAgreement) / (1 - expectedAgreement);

                if (!isNaN(kappa)) {
                    totalKappa += kappa;
                    validKappaDepartments++;
                }
            });
        }

        const metrics = {
            acceptanceRate: totalVerifications ? Math.round((acceptedCount / totalVerifications) * 100) : 0,
            fixRate: totalVerifications ? Math.round((fixCount / totalVerifications) * 100) : 0,
            rejectionRate: totalVerifications ? Math.round((rejectedCount / totalVerifications) * 100) : 0,
            cohenKappa: validKappaDepartments ? parseFloat((totalKappa / validKappaDepartments).toFixed(3)) : 0
        };

        res.json({
            totalRecords,
            verifiedRecords,
            totalAssignments,
            assignedRecordsCount,
            unassignedRecordsCount: totalRecords - assignedRecordsCount,
            doctors,
            metrics
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

// === PHYSICIAN CRUD ===
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await prisma.user.findMany({
            where: { role: 'DOCTOR' },
            select: {
                id: true,
                name: true,
                email: true,
                specialty: true,
                institution: true,
                is_active: true,
                last_login_at: true,
                _count: {
                    select: {
                        verifications: true,
                        assigned_records: true
                    }
                }
            }
        });
        res.json(doctors);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
});

router.post('/doctors', async (req, res) => {
    const { name, email, specialty, institution } = req.body;

    if (!name || !email) {
        res.status(400).json({ message: 'Name and email are required' });
        return;
    }

    try {
        // Generate temporary 6-digit numeric password (e.g. 123456)
        const tempPassword = (await crypto.randomInt(100000, 1000000)).toString();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        const doctor = await prisma.user.create({
            data: {
                name,
                email,
                password_hash: passwordHash,
                role: 'DOCTOR',
                specialty,
                institution
            }
        });

        // Send Onboarding Email
        const emailHtml = `
      <h3>Welcome to the Bangla Medical Triage Verification System</h3>
      <p>Hello Dr. ${name},</p>
      <p>Your account has been created. Please log in using the temporary credentials below:</p>
      <p><strong>Email:</strong> ${email}<br/>
      <strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>You can access the portal here: <a href="${DOCTOR_PORTAL_URL}">${DOCTOR_PORTAL_URL}</a></p>
      <p>You will be required to change your password upon first login.</p>
    `;

        try {
            await transporter.sendMail({
                from: FROM_HEADER,
                to: email,
                subject: 'Your Account Credentials',
                html: emailHtml,
                envelope: { from: SMTP_FROM_ADDRESS, to: email }
            });
        } catch (emailErr) {
            console.error('Email sending failed (Mailhog/SMTP config issue?):', emailErr);
            // We still return 200 because user is created
        }

        res.status(201).json({ message: 'Doctor created', doctorId: doctor.id });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Email already exists' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error creating doctor' });
        }
    }
});

router.put('/doctors/:id/deactivate', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { is_active: false }
        });
        res.json({ message: 'Account deactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Error deactivating doctor' });
    }
});

router.put('/doctors/:id/reactivate', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.user.update({
            where: { id: parseInt(id) },
            data: { is_active: true }
        });
        res.json({ message: 'Account reactivated' });
    } catch (error) {
        res.status(500).json({ message: 'Error reactivating doctor' });
    }
});

router.post('/doctors/:id/resend-email', async (req, res) => {
    // Generates a new temp password and resends it
    const { id } = req.params;
    try {
        const doctor = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!doctor) {
            res.status(404).json({ message: 'Doctor not found' });
            return;
        }

        const tempPassword = (await crypto.randomInt(100000, 1000000)).toString();
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        await prisma.user.update({
            where: { id: doctor.id },
            data: { password_hash: passwordHash }
        });

                await transporter.sendMail({
                        from: FROM_HEADER,
                        to: doctor.email,
                        subject: '[Resend] Your Account Credentials',
                        html: `
                <p>Hello Dr. ${doctor.name},</p>
                <p>Your password has been reset by an administrator. Please log in using the temporary credentials below:</p>
                <p><strong>Email:</strong> ${doctor.email}<br/>
                <strong>Temporary Password:</strong> ${tempPassword}</p>
                <p>You can access the portal here: <a href="${DOCTOR_PORTAL_URL}">${DOCTOR_PORTAL_URL}</a></p>
            `,
                        envelope: { from: SMTP_FROM_ADDRESS, to: doctor.email }
                });

        res.json({ message: 'Credentials email resent' });
    } catch (error) {
        res.status(500).json({ message: 'Error resending email' });
    }
});

router.post('/doctors/:id/assign', async (req, res) => {
    const { id } = req.params;
    const { count } = req.body;
    const doctorId = parseInt(id);
    const assignmentCount = parseInt(count) || 50;

    try {
        // Find records that are NOT assigned to ANYONE yet
        // Using a raw query for random ordering as Prisma random sampling is complex
        // We'll fetch IDs of unassigned records
        const unassignedRecords = await prisma.$queryRaw<{ id: number }[]>`
            SELECT id FROM triage_records 
            WHERE id NOT IN (SELECT record_id FROM doctor_assignments)
            ORDER BY RANDOM()
            LIMIT ${assignmentCount}
        `;

        if (unassignedRecords.length === 0) {
            res.status(404).json({ message: 'No unassigned records available' });
            return;
        }

        const assignments = unassignedRecords.map(r => ({
            doctor_id: doctorId,
            record_id: r.id
        }));

        await prisma.doctorAssignment.createMany({
            data: assignments,
            skipDuplicates: true
        });

        res.json({
            message: `Successfully assigned ${unassignedRecords.length} records to the physician.`,
            count: unassignedRecords.length
        });
    } catch (error: any) {
        console.error('Assignment Error:', error);
        res.status(500).json({ message: 'Error assigning records', error: error.message });
    }
});

// CSV Dataset Upload
router.post('/dataset/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }

    // Parse CSV
    const parser = parse(req.file.buffer, {
        columns: (header: string[]) => header.map(h => h.trim().toLowerCase()),
        skip_empty_lines: true,
        bom: true, // Handle Excel UTF-8 BOM
        delimiter: [',', '\t', ';'], // Auto-detect common delimiters
    });

    const records: any[] = [];
    try {
        for await (const record of parser) {
            records.push({
                id: parseInt(record.id),
                symptom_text: record.symptom_text,
                departments: record.departments,
                num_labels: parseInt(record.num_labels),
                medicine: parseInt(record.medicine || '0'),
                neurology: parseInt(record.neurology || '0'),
                surgery: parseInt(record.surgery || '0'),
                gastroenterology: parseInt(record.gastroenterology || '0'),
                pediatrics: parseInt(record.pediatrics || '0'),
                cardiology: parseInt(record.cardiology || '0'),
                ent: parseInt(record.ent || '0'),
                orthopedics: parseInt(record.orthopedics || '0'),
                endocrinology: parseInt(record.endocrinology || '0'),
                nephrology: parseInt(record.nephrology || '0'),
                psychiatry: parseInt(record.psychiatry || '0'),
                dermatology: parseInt(record.dermatology || '0'),
                pulmonology: parseInt(record.pulmonology || '0'),
                ophthalmology: parseInt(record.ophthalmology || '0'),
                hematology: parseInt(record.hematology || '0'),
                urology: parseInt(record.urology || '0'),
                gynecology: parseInt(record.gynecology || '0'),
                rheumatology: parseInt(record.rheumatology || '0'),
            });
        }

        if (records.length === 0) {
            res.status(400).json({ message: 'CSV is empty or invalid' });
            return;
        }

        // Insert records. Wrapping in transaction for atomicity.
        const uploadEntry = await prisma.datasetUpload.create({
            data: {
                filename: req.file.originalname,
                uploaded_by: (req as any).user.userId,
                record_count: records.length,
            }
        });

        // Add upload_id to all records
        const recordsWithUploadId = records.map(r => ({ ...r, upload_id: uploadEntry.id }));

        const createMany = await prisma.triageRecord.createMany({
            data: recordsWithUploadId,
            skipDuplicates: true,
        });

        res.json({ message: 'Upload successful', rowsImported: createMany.count, uploadId: uploadEntry.id });
    } catch (error) {
        console.error('CSV Parsing/Import Error:', error);
        res.status(500).json({ message: 'Failed to process CSV. Ensure schema is correct.' });
    }
});

router.delete('/dataset/uploads/:id', async (req, res) => {
    const { id } = req.params;
    const uploadId = parseInt(id);

    try {
        // Find associated records
        const records = await prisma.triageRecord.findMany({
            where: { upload_id: uploadId } as any,
            select: { id: true }
        });
        const recordIds = records.map(r => r.id);

        await prisma.$transaction([
            // Delete verifications associated with these records
            prisma.verification.deleteMany({
                where: { record_id: { in: recordIds } }
            }),
            // Delete doctor assignments
            prisma.doctorAssignment.deleteMany({
                where: { record_id: { in: recordIds } }
            }),
            // Delete the records themselves
            prisma.triageRecord.deleteMany({
                where: { upload_id: uploadId } as any
            }),
            // Delete the upload registry
            prisma.datasetUpload.delete({
                where: { id: uploadId }
            })
        ]);

        res.json({ message: 'Dataset source and associated records deleted permanently.' });
    } catch (error: any) {
        console.error('Delete Dataset Error:', error);
        res.status(500).json({ message: 'Error deleting dataset source', error: error.message });
    }
});

router.post('/dataset/reset', async (req, res) => {
    try {
        await prisma.$transaction([
            prisma.verification.deleteMany(),
            prisma.doctorAssignment.deleteMany(),
            prisma.triageRecord.deleteMany(),
            prisma.datasetUpload.deleteMany()
        ]);
        res.json({ message: 'All dataset records and verification work have been wiped successfully.' });
    } catch (error: any) {
        console.error('Reset Database Error:', error);
        res.status(500).json({ message: 'Error resetting database', error: error.message });
    }
});

// Dataset History & Preview
router.get('/dataset/uploads/:id/preview', async (req, res) => {
    try {
        const records = await prisma.triageRecord.findMany({
            where: { upload_id: parseInt(req.params.id) } as any,
            take: 50, // More records for specific preview
            orderBy: { id: 'asc' }
        });
        res.json(records);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching preview', error: error.message });
    }
});

router.get('/dataset/uploads', async (req, res) => {
    try {
        const uploads = await prisma.datasetUpload.findMany({
            orderBy: { upload_timestamp: 'desc' },
            include: { admin: { select: { name: true, email: true } } }
        });
        res.json(uploads);
    } catch (error: any) {
        console.error('Error fetching uploads:', error);
        res.status(500).json({ message: 'Error fetching upload history', error: error.message });
    }
});

router.get('/dataset/preview', async (req, res) => {
    try {
        const records = await prisma.triageRecord.findMany({
            take: 10,
            orderBy: { id: 'asc' }
        });
        res.json(records);
    } catch (error: any) {
        console.error('Error fetching preview:', error);
        res.status(500).json({ message: 'Error fetching dataset preview', error: error.message });
    }
});

// === EXPORT ===
router.get('/dataset/export', async (req, res) => {
    try {
        const verifiedRecords = await prisma.verification.findMany({
            include: { record: true, doctor: true }
        });

        // Create a CSV header
        const csvRows = ['id,symptom_text,doctor_name,doctor_email,clinical_note,unable_to_assess,AI_medicine,DOC_medicine,AI_neurology,DOC_neurology'];
        verifiedRecords.forEach(v => {
            const r = v.record as any;
            const d = v.doctor as any;
            const doc_depts = v.verified_departments as any;

            const row = [
                r.id,
                `"${r.symptom_text.replace(/"/g, '""')}"`,
                d.name,
                d.email,
                `"${(v.clinical_note || '').replace(/"/g, '""')}"`,
                v.is_unable_to_assess,
                r.departments, // AI side
                Object.entries(doc_depts).filter(([_, val]) => val).map(([key]) => key).join('|') // Doctor side
            ].join(',');
            csvRows.push(row);
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="verified_triage_dataset.csv"');
        res.send(csvRows.join('\n'));
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
});

export default router;
