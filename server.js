const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, app.js, style.css, etc.)
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));

// Diagnostic & Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW() as current_time, current_database() as database');
        client.release();
        return res.json({
            status: 'ok',
            database: result.rows[0].database,
            dbTime: result.rows[0].current_time,
            message: 'Terhubung ke PostgreSQL dengan sukses'
        });
    } catch (err) {
        return res.status(503).json({
            status: 'error',
            error: err.message,
            message: 'Gagal terhubung ke database PostgreSQL. Pastikan PostgreSQL berjalan dan konfigurasi .env sudah sesuai.'
        });
    }
});

// GET: Mengambil seluruh data RCA dari PostgreSQL
app.get('/api/rcas', async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                rca_code,
                equipment,
                tag_number,
                area,
                stop_reason,
                stop_date,
                downtime,
                rca_date,
                doc_description,
                additional_docs,
                root_causes,
                created_at
            FROM rcas
            ORDER BY id DESC;
        `;

        const result = await pool.query(query);

        // Format data agar konsisten dengan frontend state
        const formattedRows = result.rows.map(row => ({
            id: row.id,
            rcaId: row.rca_code || `RCA-${new Date(row.created_at || Date.now()).getFullYear()}-${String(row.id).padStart(3, '0')}`,
            equipment: row.equipment,
            tagNumber: row.tag_number,
            area: row.area || 'Kiln Department',
            stopReason: row.stop_reason,
            stopDate: row.stop_date,
            downtime: row.downtime,
            rcaDate: row.rca_date,
            docDescription: row.doc_description,
            additionalDocs: Array.isArray(row.additional_docs) ? row.additional_docs : (typeof row.additional_docs === 'string' ? JSON.parse(row.additional_docs || '[]') : []),
            rootCauses: Array.isArray(row.root_causes) ? row.root_causes : (typeof row.root_causes === 'string' ? JSON.parse(row.root_causes || '[]') : []),
            createdAt: row.created_at
        }));

        return res.json(formattedRows);
    } catch (err) {
        console.error('GET RCA ERROR:', err.message);
        return res.status(500).json({
            error: `Gagal mengambil data dari database: ${err.message}`
        });
    }
});

// POST: Menyimpan data RCA baru ke PostgreSQL
app.post('/api/rcas', async (req, res) => {
    let client;
    try {
        client = await pool.connect();

        const {
            equipment = '',
            tagNumber = '',
            area = 'Kiln Department',
            stopReason = '',
            stopDate = null,
            downtime = '',
            rcaDate = null,
            docDescription = '',
            additionalDocs = [],
            rootCauses = []
        } = req.body;

        if (!equipment || !stopReason) {
            return res.status(400).json({
                success: false,
                error: 'Field "equipment" dan "stopReason" wajib diisi.'
            });
        }

        await client.query('BEGIN');

        // Simpan RCA
        const insertQuery = `
            INSERT INTO rcas (
                rca_code,
                equipment,
                tag_number,
                area,
                stop_reason,
                stop_date,
                downtime,
                rca_date,
                doc_description,
                additional_docs,
                root_causes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, created_at;
        `;

        // Dummy code dulu untuk mendapatkan ID
        const tempCode = `RCA-TEMP`;
        const values = [
            tempCode,
            equipment,
            tagNumber,
            area,
            stopReason,
            stopDate,
            downtime,
            rcaDate,
            docDescription,
            JSON.stringify(additionalDocs || []),
            JSON.stringify(rootCauses || [])
        ];

        const insertRes = await client.query(insertQuery, values);
        const rcaId = insertRes.rows[0].id;
        const year = new Date().getFullYear();
        const rcaCode = `RCA-${year}-${String(rcaId).padStart(3, '0')}`;

        // Update kode RCA resmi
        await client.query('UPDATE rcas SET rca_code = $1 WHERE id = $2', [rcaCode, rcaId]);

        await client.query('COMMIT');

        console.log(`RCA baru berhasil disimpan: [${rcaCode}] - ${equipment}`);

        return res.status(201).json({
            success: true,
            message: 'RCA berhasil disimpan ke PostgreSQL',
            rcaId: rcaId,
            rcaCode: rcaCode,
            data: {
                id: rcaId,
                rcaId: rcaCode,
                equipment,
                tagNumber,
                area,
                stopReason,
                stopDate,
                downtime,
                rcaDate,
                docDescription,
                additionalDocs,
                rootCauses
            }
        });
    } catch (err) {
        if (client) {
            await client.query('ROLLBACK').catch(() => { });
        }
        console.error('POST RCA ERROR:', err.message);
        return res.status(500).json({
            success: false,
            error: `Gagal menyimpan ke database: ${err.message}`
        });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// PUT: Update RCA (misal update status Root Causes & Action Plans)
app.put('/api/rcas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rootCauses, equipment, tagNumber, area, stopReason, stopDate, downtime, rcaDate, docDescription, additionalDocs } = req.body;

        const updateFields = [];
        const values = [];
        let index = 1;

        if (rootCauses !== undefined) {
            updateFields.push(`root_causes = $${index++}`);
            values.push(JSON.stringify(rootCauses));
        }
        if (equipment !== undefined) {
            updateFields.push(`equipment = $${index++}`);
            values.push(equipment);
        }
        if (tagNumber !== undefined) {
            updateFields.push(`tag_number = $${index++}`);
            values.push(tagNumber);
        }
        if (area !== undefined) {
            updateFields.push(`area = $${index++}`);
            values.push(area);
        }
        if (stopReason !== undefined) {
            updateFields.push(`stop_reason = $${index++}`);
            values.push(stopReason);
        }
        if (stopDate !== undefined) {
            updateFields.push(`stop_date = $${index++}`);
            values.push(stopDate);
        }
        if (downtime !== undefined) {
            updateFields.push(`downtime = $${index++}`);
            values.push(downtime);
        }
        if (rcaDate !== undefined) {
            updateFields.push(`rca_date = $${index++}`);
            values.push(rcaDate);
        }
        if (docDescription !== undefined) {
            updateFields.push(`doc_description = $${index++}`);
            values.push(docDescription);
        }
        if (additionalDocs !== undefined) {
            updateFields.push(`additional_docs = $${index++}`);
            values.push(JSON.stringify(additionalDocs));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Tidak ada data untuk diperbarui' });
        }

        values.push(id);
        const query = `
            UPDATE rcas
            SET ${updateFields.join(', ')}
            WHERE id::text = $${index} OR rca_code = $${index}
            RETURNING *;
        `;

        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Data RCA tidak ditemukan' });
        }

        return res.json({ success: true, message: 'RCA berhasil diperbarui', data: result.rows[0] });
    } catch (err) {
        console.error('PUT RCA ERROR:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE: Hapus data RCA
app.delete('/api/rcas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM rcas WHERE id::text = $1 OR rca_code = $1 RETURNING id, rca_code', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Data RCA tidak ditemukan' });
        }
        return res.json({ success: true, message: `RCA ${result.rows[0].rca_code || id} berhasil dihapus.` });
    } catch (err) {
        console.error('DELETE RCA ERROR:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Start Server dan Auto-Inisialisasi Database
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`=======================================================`);
    console.log(`Running http://localhost:${PORT}`);
    console.log(`=======================================================`);

    try {
        await initDb();
        console.log('PostgreSQL & tabel "rcas" verified');
    } catch (err) {
        console.warn('Cant connect to PostgreSQL.');
        console.warn('Err' + err.message);
        console.warn('Check server connection on .env');
    }
});
