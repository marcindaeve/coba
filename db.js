const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' || process.env.DATABASE_URL.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : false
    }
    : {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: String(process.env.DB_PASSWORD),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
    console.error('⚠️ PostgreSQL Pool Error:', err.message);
});

// Helper untuk inisialisasi tabel rcas jika belum ada
async function initDb() {
    const client = await pool.connect();
    try {
        console.log('Checking & Initializing skema database PostgreSQL...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS rcas (
                id SERIAL PRIMARY KEY,
                rca_code VARCHAR(50),
                equipment VARCHAR(255) NOT NULL,
                tag_number VARCHAR(100),
                area VARCHAR(100),
                stop_reason TEXT,
                stop_date VARCHAR(50),
                downtime VARCHAR(50),
                rca_date VARCHAR(50),
                doc_description TEXT,
                additional_docs JSONB DEFAULT '[]'::jsonb,
                root_causes JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Cek apakah tabel kosong, jika iya masukkan data sampel awal
        const countRes = await client.query('SELECT COUNT(*) FROM rcas');
        const count = parseInt(countRes.rows[0].count, 10);

        if (count === 0) {
            console.log('Adding data sampel RCA ke PostgreSQL...');
            const sampleRootCauses = [
                {
                    id: 'RC-01',
                    description: 'Bearing inner ring micro-cracking due to slight shaft angular misalignment.',
                    actionPlans: [
                        {
                            id: 'ACT-001',
                            description: 'Re-align Kiln 1 Main Gearbox Input Shaft using Laser Alignment tool.',
                            responsible: 'Eko Prasetyo',
                            department: 'Mechanical MTC',
                            deadline: '2026-11-15',
                            status: 'On Progress',
                            whyReason: 'Menunggu ketersediaan jam stop kilang untuk eksekusi final alignment.',
                            completionDate: '',
                            evidencePhoto: null
                        }
                    ]
                }
            ];

            await client.query(`
                INSERT INTO rcas (
                    rca_code, equipment, tag_number, area, stop_reason,
                    stop_date, downtime, rca_date, doc_description,
                    additional_docs, root_causes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
                'RCA-2026-001',
                'Kiln 1 Main Drive & Gearbox System',
                '441-KL1-M01',
                'Kiln Department',
                'Kiln Main Drive Overheat & Vibration Spike',
                '2026-10-01',
                '6.5 Jam',
                '2026-10-02',
                'Laporan hasil termografi bearing dan analisis vibrasi awal.',
                JSON.stringify(['Termografi_Kiln1.pdf', 'Vibration_Analysis.jpg']),
                JSON.stringify(sampleRootCauses)
            ]);
            console.log('Data sampel berhasil ditambahkan!');
        }

        console.log('Skema tabel rcas siap digunakan.');
        return true;
    } catch (err) {
        console.error('Failed initializing tabel rcas:', err.message || err.code || err);
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    pool,
    initDb
};