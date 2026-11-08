const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db.js');

// PEMERIKSAAN KONEKSI
console.log('============================');
console.log('MIRZA DATABASE DIAGNOSTIC');
console.log('============================');

console.log('Lokasi db.js:', require.resolve('./db.js'));
console.log('Tipe pool:', typeof pool);
console.log('Constructor:', pool?.constructor?.name);
console.log('Tipe pool.query:', typeof pool?.query);

console.log('============================');

const app = express();

app.use(cors());
app.use(express.json());

// GET: Mengambil seluruh data RCA dari PostgreSQL
app.get('/api/rcas', async (req, res) => {
    try {
        const query = `
            SELECT
                id,
                equipment,
                tag_number,
                stop_reason,
                stop_date,
                downtime,
                rca_date,
                doc_description,
                root_causes,
                created_at
            FROM rcas
            ORDER BY id DESC
        `;

        const result = await pool.query(query);

        return res.json(result.rows);

    } catch (err) {
        console.error('GET RCA ERROR:', err);

        return res.status(500).json({
            error: err.message
        });
    }
});


app.post('/api/rcas', async (req, res) => {
    let client;

    try {
        client = await pool.connect();

        const {
            equipment,
            tagNumber,
            stopReason,
            stopDate,
            downtime,
            rcaDate,
            docDescription,
            rootCauses
        } = req.body;

        await client.query('BEGIN');

        // Simpan RCA utama
        const result = await client.query(
            `INSERT INTO rcas (
                equipment,
                tag_number,
                stop_reason,
                stop_date,
                downtime,
                rca_date,
                doc_description,
                root_causes
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING id`,
            [
                equipment || null,
                tagNumber || null,
                stopReason || null,
                stopDate || null,
                downtime || null,
                rcaDate || null,
                docDescription || null,
                JSON.stringify(rootCauses || [])
            ]
        );

        // ID otomatis dari PostgreSQL
        const rcaId = result.rows[0].id;

        // Generate kode RCA untuk frontend
        const year = new Date().getFullYear();
        const rcaCode =
            `RCA-${year}-${String(rcaId).padStart(4, '0')}`;

        await client.query('COMMIT');

        console.log('RCA berhasil disimpan:', rcaCode);

        return res.status(201).json({
            success: true,
            message: 'RCA berhasil disimpan ke PostgreSQL',
            rcaId,
            rcaCode
        });

    } catch (err) {

        if (client) {
            await client.query('ROLLBACK');
        }

        console.error('POST RCA ERROR:', err);

        return res.status(500).json({
            success: false,
            error: err.message
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`MIRZA Backend running at http://localhost:${PORT}`);
});