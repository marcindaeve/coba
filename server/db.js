const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

// Test koneksi database
pool.connect()
    .then(client => {
        console.log('BERHASIL TERHUBUNG KE POSTGRESQL!');
        client.release();
    })
    .catch(err => {
        console.error('KONEKSI DATABASE GAGAL:', err.message);
    });

module.exports = pool;
