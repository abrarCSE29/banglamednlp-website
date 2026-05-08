import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse';

// Mocking simple Express App to isolate CSV Parser middleware logic we implemented
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/test-upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    parse(req.file.buffer, {
        columns: (header: string[]) => header.map(h => h.trim().toLowerCase()),
        skip_empty_lines: true,
        bom: true,
        delimiter: [',', '\t', ';']
    }, (err, records) => {
        const dataRecords = records as any[];
        if (err || !dataRecords || dataRecords.length === 0) {
            return res.status(400).json({ message: 'CSV is empty or missing headers' });
        }

        const headers = Object.keys(dataRecords[0]);
        const expectedHeaders = [
            'id', 'symptom_text', 'departments', 'num_labels',
            'medicine', 'neurology', 'surgery', 'gastroenterology',
            'pediatrics', 'cardiology', 'ent', 'orthopedics',
            'endocrinology', 'nephrology', 'psychiatry', 'dermatology',
            'pulmonology', 'ophthalmology', 'hematology', 'urology',
            'gynecology', 'rheumatology'
        ];

        const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));
        if (!hasAllHeaders) {
            return res.status(400).json({ message: 'Invalid CSV schema' });
        }

        res.status(200).json({ message: 'Dataset valid', lineCount: records.length });
    });
});

describe('CSV Parser Requirements', () => {
    it('should reject missing file', async () => {
        const res = await request(app).post('/test-upload');
        expect(res.status).toBe(400);
        expect(res.body.message).toBe('No file uploaded');
    });

    it('should reject malformed or missing headers', async () => {
        const falseCsv = 'id,symptom_text,departments\n1,"Headache","neurology"';
        const res = await request(app)
            .post('/test-upload')
            .attach('file', Buffer.from(falseCsv, 'utf-8'), 'test.csv');

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Invalid CSV schema');
    });

    it('should accept properly formatted CSV files with valid correct columns', async () => {
        const validHeaders = 'id,symptom_text,departments,num_labels,medicine,neurology,surgery,gastroenterology,pediatrics,cardiology,ent,orthopedics,endocrinology,nephrology,psychiatry,dermatology,pulmonology,ophthalmology,hematology,urology,gynecology,rheumatology';
        const validRow = '1,"Severe stomach ache","gastroenterology",1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0';

        const validCsv = `${validHeaders}\n${validRow}`;
        const res = await request(app)
            .post('/test-upload')
            .attach('file', Buffer.from(validCsv, 'utf-8'), 'dataset.csv');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dataset valid');
    });

    it('should accept capitalized headers and TSV format', async () => {
        const validHeaders = 'Id\tSymptom_text\tDepartments\tnum_labels\tMedicine\tNeurology\tSurgery\tGastroenterology\tPediatrics\tCardiology\tENT\tOrthopedics\tEndocrinology\tNephrology\tPsychiatry\tDermatology\tPulmonology\tOphthalmology\tHematology\tUrology\tGynecology\tRheumatology';
        const validRow = '1\t"Headache"\t"Neurology"\t1\t0\t1\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0';

        const tsv = `${validHeaders}\n${validRow}`;
        const res = await request(app)
            .post('/test-upload')
            .attach('file', Buffer.from(tsv, 'utf-8'), 'dataset.tsv');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Dataset valid');
    });
});
