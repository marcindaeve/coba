require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

app.use(cors());
app.use(express.json());

// Mengambil konfigurasi dari file .env secara otomatis
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'coba_mirza',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'MirzaRCA2026!',
});

app.post('/api/rcas', async (req, res) => {
  try {
const { 
      equipment = '', 
      tagNumber = '', 
      stopReason = '', 
      stopDate = null, 
      downtime = '', 
      rcaDate = null, 
      docDescription = '', 
      rootCauses = '' 
    } = req.body;
// Pastikan tidak ada pemanggilan .toLowerCase() pada variabel di bawah ini jika nilainya bisa kosong
    const query = `
      INSERT INTO rcas (equipment, tag_number, stop_reason, stop_date, downtime, rca_date, doc_description, root_causes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    
    const values = [
      equipment, 
      tagNumber, 
      stopReason, 
      stopDate, 
      downtime, 
      rcaDate, 
      docDescription, 
      rootCauses
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('DETAIL ERROR POSTGRESQL:', err.message);
    res.status(500).json({ 
      success: false, 
      error: `DB Error: ${err.message}` 
    });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server berjalan di port ${process.env.PORT || 5000}`);
});