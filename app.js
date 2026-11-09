const { useState, useMemo, useEffect } = React;
const API_BASE = window.location.origin.startsWith('http') ? '' : 'http://localhost:5000';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ name: 'Budi Santoso', role: 'Reliability Engineer' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRcaDetail, setSelectedRcaDetail] = useState(null);

  // State untuk Fitur Search & Filter di Dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Helper untuk menghitung status otomatis dari Root Causes & Action Plans
  const calculateRcaStatus = (rootCauses) => {
    let hasNotYet = false;
    let hasOnProgress = false;
    let allDone = true;

    if (!rootCauses || rootCauses.length === 0) return 'Not Yet';

    rootCauses.forEach(rc => {
      rc.actionPlans.forEach(act => {
        if (act.status === 'Not Yet') hasNotYet = true;
        if (act.status === 'On Progress') hasOnProgress = true;
        if (act.status !== 'Done') allDone = false;
      });
    });

    if (allDone) return 'Done';
    if (hasNotYet) return 'Not Yet';
    if (hasOnProgress) return 'On Progress';
    return 'Not Yet';
  };

  // Helper untuk Reminder Deadline (Overdue, Due Soon, On Track)
  const getDeadlineBadge = (deadlineDate, status) => {
    if (status === 'Done') {
      return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-300">Completed</span>;
    }
    if (!deadlineDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deadlineDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded border border-red-300 animate-pulse">⚠️ Overdue ({Math.abs(diffDays)} hari lalu)</span>;
    } else if (diffDays <= 3) {
      return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300">⏳ Due Soon ({diffDays} hari lagi)</span>;
    } else {
      return <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-300">✅ On Track</span>;
    }
  };

  // State Database RCA & Action Plans Awal
  const [rcas, setRcas] = useState([
    {
      rcaId: 'RCA-2026-001',
      equipment: 'Kiln 1 Main Drive & Gearbox System',
      tagNumber: '441-KL1-M01',
      area: 'Kiln Department',
      stopReason: 'Kiln Main Drive Overheat & Vibration Spike',
      stopDate: '2026-10-01',
      downtime: '6.5 Jam',
      rcaDate: '2026-10-02',
      docDescription: 'Laporan hasil termografi bearing dan analisis vibrasi awal.',
      additionalDocs: ['Termografi_Kiln1.pdf', 'Vibration_Analysis.jpg'],
      rootCauses: [
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
      ]
    }
  ]);

  // State Form Input RCA Baru
  const [newRcaForm, setNewRcaForm] = useState({
    equipment: '',
    tagNumber: '',
    area: 'Kiln Department',
    stopReason: '',
    stopDate: new Date().toISOString().split('T')[0],
    downtime: '',
    rcaDate: new Date().toISOString().split('T')[0],
    docDescription: '',
    additionalDocs: [],
    rootCauses: [
      {
        id: 'RC-1',
        description: '',
        actionPlans: [
          {
            id: 'ACT-1',
            description: '',
            responsible: '',
            department: 'Mechanical MTC',
            deadline: '',
            status: 'Not Yet',
            whyReason: '',
            completionDate: '',
            evidencePhoto: null
          }
        ]
      }
    ]
  });

  // Handler Tambah Root Cause pada Form
  const handleAddRootCauseForm = () => {
    setNewRcaForm({
      ...newRcaForm,
      rootCauses: [
        ...newRcaForm.rootCauses,
        {
          id: `RC-${Date.now()}`,
          description: '',
          actionPlans: [
            {
              id: `ACT-${Date.now()}`,
              description: '',
              responsible: '',
              department: 'Mechanical MTC',
              deadline: '',
              status: 'Not Yet',
              whyReason: '',
              completionDate: '',
              evidencePhoto: null
            }
          ]
        }
      ]
    });
  };

  // Handler Hapus Root Cause pada Form
  const handleRemoveRootCauseForm = (rcIndex) => {
    if (newRcaForm.rootCauses.length === 1) {
      alert("Minimal harus ada 1 Root Cause.");
      return;
    }
    const updated = newRcaForm.rootCauses.filter((_, idx) => idx !== rcIndex);
    setNewRcaForm({ ...newRcaForm, rootCauses: updated });
  };

  // Handler Tambah Action Plan pada Root Cause tertentu
  const handleAddActionForm = (rcIndex) => {
    const updatedRCs = [...newRcaForm.rootCauses];
    updatedRCs[rcIndex].actionPlans.push({
      id: `ACT-${Date.now()}`,
      description: '',
      responsible: '',
      department: 'Mechanical MTC',
      deadline: '',
      status: 'Not Yet',
      whyReason: '',
      completionDate: '',
      evidencePhoto: null
    });
    setNewRcaForm({ ...newRcaForm, rootCauses: updatedRCs });
  };

  // Handler Hapus Action Plan
  const handleRemoveActionForm = (rcIndex, actIndex) => {
    const updatedRCs = [...newRcaForm.rootCauses];
    if (updatedRCs[rcIndex].actionPlans.length === 1) {
      alert("Setiap Root Cause minimal harus memiliki 1 Action Plan.");
      return;
    }
    updatedRCs[rcIndex].actionPlans = updatedRCs[rcIndex].actionPlans.filter((_, idx) => idx !== actIndex);
    setNewRcaForm({ ...newRcaForm, rootCauses: updatedRCs });
  };

  // Handler Upload Additional Documentation
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileNames = files.map(f => f.name);
    setNewRcaForm({
      ...newRcaForm,
      additionalDocs: [...newRcaForm.additionalDocs, ...fileNames]
    });
  };

  const handleRemoveDoc = (docIndex) => {
    const updatedDocs = newRcaForm.additionalDocs.filter((_, idx) => idx !== docIndex);
    setNewRcaForm({ ...newRcaForm, additionalDocs: updatedDocs });
  };

  // State status koneksi ke Backend PostgreSQL
  const [dbStatus, setDbStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi Fetch RCA dari API PostgreSQL
  const fetchRcas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/api/rcas`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setRcas(data);
        }
        setDbStatus('connected');
      } else {
        setDbStatus('disconnected');
      }
    } catch (err) {
      console.warn('Backend API tidak merespon, menggunakan data lokal:', err.message);
      setDbStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // Panggil fetchRcas saat aplikasi dimuat pertama kali
  useEffect(() => {
    fetchRcas();
  }, []);

  const handleSaveRca = async (e) => {
    e.preventDefault();

    try {
      // 1. Kirim data RCA ke PostgreSQL
      const response = await fetch(`${API_BASE}/api/rcas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRcaForm)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal menyimpan RCA');
      }

      console.log('RCA berhasil disimpan ke PostgreSQL:', result);

      // 2. Siapkan data untuk Dashboard
      const newRcaEntry = result.data ? {
        id: result.data.id,
        rcaId: result.data.rcaId || result.rcaCode,
        equipment: result.data.equipment,
        tagNumber: result.data.tagNumber,
        area: result.data.area,
        stopReason: result.data.stopReason,
        stopDate: result.data.stopDate,
        downtime: result.data.downtime,
        rcaDate: result.data.rcaDate,
        docDescription: result.data.docDescription,
        additionalDocs: result.data.additionalDocs,
        rootCauses: result.data.rootCauses
      } : {
        rcaId: result.rcaCode,
        equipment: newRcaForm.equipment,
        tagNumber: newRcaForm.tagNumber,
        area: newRcaForm.area,
        stopReason: newRcaForm.stopReason,
        stopDate: newRcaForm.stopDate,
        downtime: newRcaForm.downtime,
        rcaDate: newRcaForm.rcaDate,
        docDescription: newRcaForm.docDescription,
        additionalDocs: newRcaForm.additionalDocs,
        rootCauses: newRcaForm.rootCauses
      };

      // 3. Perbarui Dashboard
      setRcas(prev => [newRcaEntry, ...prev]);
      setDbStatus('connected');

      // 4. Reset Form
      setNewRcaForm({
        equipment: '',
        tagNumber: '',
        area: 'Kiln Department',
        stopReason: '',
        stopDate: new Date().toISOString().split('T')[0],
        downtime: '',
        rcaDate: new Date().toISOString().split('T')[0],
        docDescription: '',
        additionalDocs: [],
        rootCauses: [
          {
            id: 'RC-1',
            description: '',
            actionPlans: [
              {
                id: 'ACT-1',
                description: '',
                responsible: '',
                department: 'Mechanical MTC',
                deadline: '',
                status: 'Not Yet',
                whyReason: '',
                completionDate: '',
                evidencePhoto: null
              }
            ]
          }
        ]
      });

      // 5. Kembali ke Dashboard
      setActiveTab('dashboard');

      alert(`✅ Sukses! RCA ${result.rcaCode} berhasil disimpan ke PostgreSQL!`);

    } catch (err) {
      console.error('SAVE RCA ERROR:', err);
      alert(`Gagal menyimpan RCA ke database: ${err.message}`);
    }
  };

  // Filter & Search Logic
  const filteredRcas = useMemo(() => {
    return rcas.filter(rca => {
      const computedStatus = calculateRcaStatus(rca.rootCauses);
      const matchesSearch = 
        rca.rcaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rca.equipment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rca.stopReason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rca.tagNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || computedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rcas, searchQuery, statusFilter]);

  // Statistik untuk Kartu di Dashboard
  const stats = useMemo(() => {
    let total = rcas.length;
    let onProgress = 0;
    let done = 0;
    let notYet = 0;

    rcas.forEach(rca => {
      const st = calculateRcaStatus(rca.rootCauses);
      if (st === 'Done') done++;
      else if (st === 'On Progress') onProgress++;
      else notYet++;
    });

    return { total, onProgress, done, notYet };
  }, [rcas]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header Utama dengan Identitas Formal */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b-4 border-cyan-600">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-cyan-600 text-white font-bold px-3 py-2 rounded-lg text-lg shadow">SBI</div>
            <div>
              <h1 className="font-bold text-base md:text-lg tracking-wide">MIRZA - Maintenance Integrated Reliability System and Automation</h1>
              <p className="text-xs text-cyan-400 font-medium">PT Solusi Bangun Indonesia Tbk — Plant Narogong</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-cyan-300">Role: {currentUser.role}</p>
            </div>
            <select 
              value={currentUser.role}
              onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
              className="bg-slate-800 text-xs text-white border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              <option value="Operator">Operator</option>
              <option value="Maintenance Planner">Maintenance Planner</option>
              <option value="Reliability Engineer">Reliability Engineer</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
        </div>
      </header>

      {/* Navigasi Modul */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex space-x-8">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`py-3 text-sm font-semibold transition border-b-2 ${activeTab === 'dashboard' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              Dashboard Utama
            </button>
            <button 
              onClick={() => setActiveTab('input-rca')} 
              className={`py-3 text-sm font-semibold transition border-b-2 ${activeTab === 'input-rca' ? 'border-cyan-600 text-cyan-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
            >
              + Input RCA Baru
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
              dbStatus === 'connected' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : dbStatus === 'checking'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${
                dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
              }`}></span>
              {dbStatus === 'connected' ? 'PostgreSQL: Terhubung' : dbStatus === 'checking' ? 'Memeriksa DB...' : 'PostgreSQL: Offline / Belum Terhubung'}
            </span>
            <button
              onClick={fetchRcas}
              disabled={isLoading}
              title="Refresh data dari PostgreSQL"
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium transition"
            >
              {isLoading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dashboard Utama & Action Log Monitoring</h2>
                <p className="text-xs text-slate-500">PT Solusi Bangun Indonesia Tbk - Plant Narogong</p>
              </div>
              <button 
                onClick={() => setActiveTab('input-rca')}
                className="bg-cyan-700 hover:bg-cyan-800 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition flex items-center space-x-2"
              >
                <span>+ Buat RCA Baru</span>
              </button>
            </div>

            {/* Statistik Kartu Atas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Total RCA</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">📊</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">On Progress</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.onProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">⏳</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Done (Selesai)</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.done}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">✅</div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Not Yet / Pending</p>
                  <p className="text-2xl font-bold text-slate-600 mt-1">{stats.notYet}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold">⚠️</div>
              </div>
            </div>

            {/* Panel Search & Filter Status */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="w-full md:w-1/2 relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari berdasarkan ID RCA, Equipment, Tag Number, atau Kendala..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50"
                />
              </div>

              <div className="w-full md:w-auto flex items-center space-x-3">
                <span className="text-xs font-semibold text-slate-600">Filter Status:</span>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
                >
                  <option value="All">Semua Status</option>
                  <option value="Not Yet">Not Yet</option>
                  <option value="On Progress">On Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>

            {/* Tabel Dashboard Rekapitulasi */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Daftar Rekapitulasi RCA & Action Plan</h3>
                <span className="text-xs bg-cyan-100 text-cyan-800 px-2.5 py-1 rounded-full font-semibold">
                  Menampilkan: {filteredRcas.length} dari {rcas.length} RCA
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">RCA (Equipment & Stop Reason)</th>
                      <th className="py-3 px-4">RCA Date</th>
                      <th className="py-3 px-4">Status Kesimpulan</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredRcas.length > 0 ? (
                      filteredRcas.map((rca) => {
                        const computedStatus = calculateRcaStatus(rca.rootCauses);
                        return (
                          <tr key={rca.rcaId} className="hover:bg-slate-50 transition">
                            <td className="py-3 px-4">
                              <span className="font-bold text-cyan-700">{rca.rcaId}</span> - <span className="font-semibold text-slate-800">{rca.equipment}</span>
                              <div className="text-xs text-slate-500 mt-0.5">Kendala: {rca.stopReason}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                              {rca.rcaDate}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                computedStatus === 'Done' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                computedStatus === 'On Progress' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-slate-200 text-slate-700 border-slate-300'
                              }`}>
                                {computedStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => { setSelectedRcaDetail(rca); setIsModalOpen(true); }}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded text-xs font-medium transition"
                              >
                                Detail & Grafik Progres
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-slate-400 text-xs">
                          Tidak ada data RCA yang sesuai dengan pencarian atau filter Anda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Form Input RCA Enterprise Style */}
        {activeTab === 'input-rca' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-300 max-w-5xl mx-auto overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold tracking-wide">Formulir Input RCA & Action Plan</h2>
                <p className="text-xs text-slate-400">PT Solusi Bangun Indonesia Tbk — Plant Narogong</p>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                &larr; Kembali ke Dashboard
              </button>
            </div>

            <form onSubmit={handleSaveRca} className="p-6 space-y-6">
              {/* SECTION 1: INFORMASI PERMASALAHAN & EQUIPMENT */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Informasi Permasalahan & Equipment</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name / Deskripsi <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Kiln 1 Main Drive & Gearbox System"
                      value={newRcaForm.equipment}
                      onChange={(e) => setNewRcaForm({...newRcaForm, equipment: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Tag Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 441-KL1-M01"
                      value={newRcaForm.tagNumber}
                      onChange={(e) => setNewRcaForm({...newRcaForm, tagNumber: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stop Reason / Kendala <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Overheat & Vibration Spike"
                      value={newRcaForm.stopReason}
                      onChange={(e) => setNewRcaForm({...newRcaForm, stopReason: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Stop <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      required
                      value={newRcaForm.stopDate}
                      onChange={(e) => setNewRcaForm({...newRcaForm, stopDate: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Downtime <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 6.5 Jam"
                      value={newRcaForm.downtime}
                      onChange={(e) => setNewRcaForm({...newRcaForm, downtime: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 & 3: ROOT CAUSE & ACTION PLAN HIERARKIS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                    <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Root Cause & Action Plan Hierarkis</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddRootCauseForm}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition flex items-center space-x-1"
                  >
                    <span>+ Tambah Root Cause Baru</span>
                  </button>
                </div>

                {newRcaForm.rootCauses.map((rc, rcIndex) => (
                  <div key={rc.id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-300 space-y-4 shadow-sm relative">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-4">
                        <label className="block text-xs font-bold text-blue-900 mb-1">Root Cause #{rcIndex + 1} (Akar Masalah) <span className="text-red-500">*</span></label>
                        <input 
                          type="text"
                          required
                          placeholder="Deskripsikan akar penyebab kegagalan equipment..."
                          value={rc.description}
                          onChange={(e) => {
                            const updated = [...newRcaForm.rootCauses];
                            updated[rcIndex].description = e.target.value;
                            setNewRcaForm({...newRcaForm, rootCauses: updated});
                          }}
                          className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      {newRcaForm.rootCauses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRootCauseForm(rcIndex)}
                          className="text-red-600 hover:text-red-800 text-xs font-semibold px-2.5 py-1.5 bg-red-100 rounded-lg mt-5"
                        >
                          Hapus &times;
                        </button>
                      )}
                    </div>

                    <div className="pl-4 border-l-4 border-blue-600 space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Action Plan Perbaikan:</span>
                        <button 
                          type="button"
                          onClick={() => handleAddActionForm(rcIndex)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded transition"
                        >
                          + Tambah Action Plan
                        </button>
                      </div>

                      {rc.actionPlans.map((act, actIndex) => (
                        <div key={act.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-3 relative">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-500">Action Plan #{actIndex + 1}</span>
                            {rc.actionPlans.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveActionForm(rcIndex, actIndex)}
                                className="text-red-500 hover:text-red-700 text-xs font-semibold"
                              >
                                Hapus &times;
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Action Plan Description <span className="text-red-500">*</span></label>
                              <input 
                                type="text"
                                required
                                placeholder="Tindakan perbaikan spesifik..."
                                value={act.description}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].description = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Responsible (PIC) <span className="text-red-500">*</span></label>
                              <input 
                                type="text"
                                required
                                placeholder="Nama PIC / Department..."
                                value={act.responsible}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].responsible = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Deadline <span className="text-red-500">*</span></label>
                              <input 
                                type="date"
                                required
                                value={act.deadline}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].deadline = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status Eksekusi <span className="text-red-500">*</span></label>
                              <select 
                                value={act.status}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].status = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none bg-white font-semibold text-slate-700"
                              >
                                <option value="Not Yet">Not Yet</option>
                                <option value="On Progress">On Progress</option>
                                <option value="Done">Done</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Why / Reason {act.status !== 'Done' ? <span className="text-red-500">*Wajib</span> : '(Opsional)'}
                              </label>
                              <input 
                                type="text"
                                required={act.status !== 'Done'}
                                placeholder={act.status === 'Done' ? 'Selesai' : 'Kendala / Alasan belum tuntas...'}
                                value={act.whyReason}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].whyReason = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 4: ADDITIONAL DOCUMENTATION */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">Additional Documentation</h3>
                <p className="text-xs text-slate-500">Unggah laporan pendukung, foto termografi, atau file analisis terkait RCA.</p>
                
                <div className="flex items-center space-x-3">
                  <label className="cursor-pointer bg-white border border-dashed border-slate-400 hover:border-blue-600 rounded-lg px-4 py-2 flex items-center space-x-2 text-xs font-semibold text-slate-700 transition">
                    <span className="text-lg font-bold text-blue-600">+</span>
                    <span>Upload File</span>
                    <input type="file" multiple onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">Format: PDF, JPG, PNG</span>
                </div>

                {newRcaForm.additionalDocs.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-700">File Terunggah:</span>
                    <ul className="space-y-1">
                      {newRcaForm.additionalDocs.map((docName, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-white border border-slate-200 px-3 py-1.5 rounded text-xs">
                          <span className="text-blue-700 font-medium">📄 {docName}</span>
                          <button type="button" onClick={() => handleRemoveDoc(idx)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 mt-3">Keterangan / Deskripsi Dokumen</label>
                  <textarea 
                    rows="2"
                    placeholder="Tambahkan catatan keterangan mengenai dokumentasi di atas..."
                    value={newRcaForm.docDescription}
                    onChange={(e) => setNewRcaForm({...newRcaForm, docDescription: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 outline-none bg-white focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons Bawah */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('dashboard')}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition"
                >
                  Simpan & Daftarkan RCA ke Sistem
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Modal Detail, Reminder Reminder, Export PDF & Grafik Garis Horizontal Progres */}
      {isModalOpen && selectedRcaDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Detail RCA & Grafik Garis Progres</h3>
                <p className="text-xs text-slate-500">{selectedRcaDetail.rcaId} - {selectedRcaDetail.equipment}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            {/* Informasi Umum */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-xs">
              <div><strong>Stop Reason:</strong> {selectedRcaDetail.stopReason}</div>
              <div><strong>RCA Date:</strong> {selectedRcaDetail.rcaDate}</div>
              <div><strong>Tag Number:</strong> {selectedRcaDetail.tagNumber}</div>
              <div><strong>Downtime:</strong> {selectedRcaDetail.downtime}</div>
            </div>

            {/* Status Kesimpulan Progres */}
            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-lg flex justify-between items-center text-xs">
              <span className="font-bold text-cyan-900">Status Kesimpulan RCA:</span>
              <span className={`font-bold px-3 py-1 rounded-full border ${
                calculateRcaStatus(selectedRcaDetail.rootCauses) === 'Done' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                calculateRcaStatus(selectedRcaDetail.rootCauses) === 'On Progress' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {calculateRcaStatus(selectedRcaDetail.rootCauses)}
              </span>
            </div>

            {/* Grafik Garis Horizontal Progres */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Grafik Linier Status Progres (Output Visual)</h4>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="relative flex justify-between items-center px-6">
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-300 z-0"></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    <span className="text-[11px] font-semibold mt-1 text-slate-600">Not Yet</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                    <span className="text-[11px] font-semibold mt-1 text-amber-700">On Progress</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                    <span className="text-[11px] font-semibold mt-1 text-emerald-700">Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Root Causes & Action Plans Hierarkis dengan Reminder Badge */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Analisis Akar Masalah & Action Plan (Dilengkapi Reminder Deadline)</h4>
              {selectedRcaDetail.rootCauses.map((rc, idx) => (
                <div key={rc.id} className="bg-cyan-50/40 border border-cyan-100 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-cyan-900">Root Cause #{idx + 1}: {rc.description}</div>
                  <div className="pl-4 space-y-2 border-l-2 border-cyan-200">
                    {rc.actionPlans.map((act) => (
                      <div key={act.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs space-y-1.5 shadow-sm">
                        <div className="flex justify-between items-center font-semibold">
                          <span>{act.description}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            act.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 
                            act.status === 'On Progress' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                          }`}>{act.status}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500 text-[11px]">
                          <span>PIC: <strong>{act.responsible}</strong> | Deadline: {act.deadline}</span>
                          {getDeadlineBadge(act.deadline, act.status)}
                        </div>
                        {act.whyReason && <div className="text-cyan-800 bg-cyan-50 p-1.5 rounded text-[11px]"><strong>Why / Reason:</strong> {act.whyReason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Documentation di Modal */}
            {(selectedRcaDetail.additionalDocs?.length > 0 || selectedRcaDetail.docDescription) && (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <h4 className="font-bold text-slate-700 uppercase tracking-wide">Additional Documentation</h4>
                {selectedRcaDetail.additionalDocs?.length > 0 && (
                  <div>
                    <strong>Files: </strong>
                    <span className="text-cyan-700">{selectedRcaDetail.additionalDocs.join(', ')}</span>
                  </div>
                )}
                {selectedRcaDetail.docDescription && (
                  <div>
                    <strong>Description: </strong>
                    <p className="text-slate-600 mt-0.5">{selectedRcaDetail.docDescription}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tombol Aksi Bawah Modal (Ekspor PDF & Tutup) */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow"
              >
                <span>🖨️ Cetak / Ekspor Laporan PDF</span>
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));