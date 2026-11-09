const { Client } = require('pg');
const path = require('path');

// Muat .env dari root dan server dengan override agar perubahan terbaru langsung aktif
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
require('dotenv').config({ path: path.join(__dirname, '.env'), override: false });

const { initDb } = require('./db.js');

async function setup() {
    console.log('====================================================');
    console.log('🛠️  MIRZA SYSTEM - POSTGRESQL DATABASE SETUP WIZARD');
    console.log('====================================================\n');

    const dbName = process.env.DB_NAME;
    const dbHost = process.env.DB_HOST;
    const dbPort = process.env.DB_PORT;
    const targetUser = process.env.DB_USER;
    const targetPassword = String(process.env.DB_PASSWORD || 'postgres');

    console.log(`📌 Konfigurasi Target dari .env:`);
    console.log(`   Host:     ${dbHost}:${dbPort}`);
    console.log(`   User:     ${targetUser}`);
    console.log(`   Database: ${dbName}\n`);

    if (process.env.DATABASE_URL) {
        console.log(`🌐 Menggunakan DATABASE_URL untuk koneksi.`);
    } else {
        console.log(`🔍 [1/3] Menyiapkan User & Database baru di PostgreSQL...`);

        // PENTING: Untuk membuat database baru, adminClient HARUS konek ke database 'postgres' (default maintenance db)
        // Kita coba konek dengan kredensial target terlebih dahulu, jika gagal kita coba dengan superuser default 'postgres'
        let adminClient = new Client({
            host: dbHost,
            port: parseInt(dbPort, 10),
            user: targetUser,
            password: targetPassword,
            database: 'postgres' // Wajib 'postgres', BUKAN dbName karena dbName belum dibuat!
        });

        let connectedAsAdmin = false;

        try {
            await adminClient.connect();
            connectedAsAdmin = true;
        } catch (err) {
            // Jika login dengan targetUser gagal (misal user 'pgajah' belum ada), gunakan akun default 'postgres'
            if (targetUser !== 'postgres') {
                console.log(`ℹ️  User "${targetUser}" belum terdaftar atau kredensial beda. Masuk via superuser "postgres"...`);
                try {
                    adminClient = new Client({
                        host: dbHost,
                        port: parseInt(dbPort, 10),
                        user: 'postgres',
                        password: 'postgres',
                        database: 'postgres'
                    });
                    await adminClient.connect();
                    connectedAsAdmin = true;

                    // Buat user target baru jika belum ada
                    const userCheck = await adminClient.query(
                        "SELECT 1 FROM pg_roles WHERE rolname = $1",
                        [targetUser]
                    );

                    if (userCheck.rows.length === 0) {
                        console.log(`⚡ Membuat user/role baru: "${targetUser}"...`);
                        await adminClient.query(
                            `CREATE ROLE "${targetUser}" WITH LOGIN PASSWORD '${targetPassword}' CREATEDB SUPERUSER;`
                        );
                        console.log(`✅ User "${targetUser}" berhasil dibuat!`);
                    } else {
                        // Perbarui password user jika sudah ada
                        await adminClient.query(
                            `ALTER ROLE "${targetUser}" WITH PASSWORD '${targetPassword}';`
                        );
                        console.log(`✅ User "${targetUser}" sudah ada (password diperbarui).`);
                    }
                } catch (fallbackErr) {
                    console.warn(`⚠️ Gagal konek dengan superuser default: ${fallbackErr.message}`);
                }
            }
        }

        if (connectedAsAdmin) {
            try {
                // Periksa apakah database baru sudah ada
                const checkRes = await adminClient.query(
                    "SELECT 1 FROM pg_database WHERE datname = $1",
                    [dbName]
                );

                if (checkRes.rows.length === 0) {
                    console.log(`⚡ Database "${dbName}" belum ada. Membuat database "${dbName}"...`);
                    await adminClient.query(`CREATE DATABASE "${dbName}" OWNER "${targetUser}"`);
                    console.log(`✅ Database "${dbName}" berhasil dibuat dengan owner "${targetUser}"!`);
                } else {
                    console.log(`✅ Database "${dbName}" sudah ada.`);
                }
            } catch (createErr) {
                console.warn(`⚠️ Catatan pembuatan database: ${createErr.message}`);
            } finally {
                await adminClient.end();
            }
        }
    }

    // 2. Hubungkan ke database target yang baru dan buat tabel 'rcas'
    console.log(`\n🔍 [2/3] Menguji koneksi ke database "${dbName}" & membuat tabel...`);
    try {
        await initDb();
        console.log(`✅ [3/3] SETUP SELESAI DENGAN SUKSES!`);
        console.log(`\nSilakan jalankan website dengan:`);
        console.log(`   npm start`);
        console.log(`Lalu buka di browser: http://localhost:${process.env.PORT || 5000}\n`);
        process.exit(0);
    } catch (err) {
        console.error(`\n❌ GAGAL MENGHUBUNGKAN KE POSTGRESQL:`);
        console.error(`   ${err.message || err.code || err}\n`);
        console.log('💡 TIPS:');
        console.log('   1. Pastikan service PostgreSQL aktif (berjalan di port 5432).');
        console.log('   2. Periksa kembali user dan password di file .env.');
        process.exit(1);
    }
}

setup();