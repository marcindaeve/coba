const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Menghubungkan ke MongoDB Compass Lokal (Database: coba_mirza)
mongoose.connect('mongodb://localhost:27017/coba_mirza', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Berhasil terhubung ke MongoDB Compass Lokal (coba_mirza)!'))
.catch((err) => console.error('❌ Gagal terhubung ke MongoDB:', err));

// Skema Database RCA (Menyesuaikan dengan Input 1 & 2 MIRZA)
const rcaSchema = new mongoose.Schema({
    rcaId: String,
    equipment: String,
    tagNumber: String,
    area: String,
    stopReason: String,
    stopDate: String,
    downtime: String,
    rcaDate: String,
    status: String,
    rootCauses: Array
});

const RcaModel = mongoose.model('RcaRecord', rcaSchema);

// API Endpoint untuk Ambil Data RCA (GET)
app.get('/api/rcas', async (req, res) => {
    try {
        const data = await RcaModel.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Endpoint untuk Simpan Data RCA Baru (POST)
app.post('/api/rcas', async (req, res) => {
    try {
        const newRca = new RcaModel(req.body);
        const savedRca = await newRca.save();
        res.status(201).json(savedRca);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Jalankan Server Backend di Port 5000
app.listen(5000, () => {
    console.log('🚀 Server backend MIRZA berjalan di http://localhost:5000');
});