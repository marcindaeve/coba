const { useState } = React;

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ name: 'Budi Santoso', role: 'Reliability Engineer' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRcaDetail, setSelectedRcaDetail] = useState(null);

  // State Database RCA & Action Plans (Relasional Bertingkat)
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
      status: 'On Progress',
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
              deadline: '2026-10-24',
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

  // State Form Input RCA Baru (Input 1 & 2)
  const [newRcaForm, setNewRcaForm] = useState({
    equipment: '',
    tagNumber: '',
    area: 'Kiln Department',
    stopReason: '',
    stopDate: new Date().toISOString().split('T')[0],
    downtime: '',
    rcaDate: new Date().toISOString().split('T')[0],
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
          id: `RC-${newRcaForm.rootCauses.length + 1}`,
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

  // Submit RCA Baru ke State
  const handleSaveRca = (e) => {
    e.preventDefault();
    const newRcaEntry = {
      rcaId: `RCA-2026-00${rcas.length + 1}`,
      equipment: newRcaForm.equipment,
      tagNumber: newRcaForm.tagNumber,
      area: newRcaForm.area,
      stopReason: newRcaForm.stopReason,
      stopDate: newRcaForm.stopDate,
      downtime: newRcaForm.downtime,
      rcaDate: newRcaForm.rcaDate,
      status: 'On Progress',
      rootCauses: newRcaForm.rootCauses
    };
    setRcas([newRcaEntry, ...rcas]);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Header Utama */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-bold p-2 rounded-lg">M</div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">MIRZA - SBI Narogong</h1>
              <p className="text-xs text-slate-400">Maintenance Integrated Reliability System and Automation</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <p className="text-xs text-blue-400">Role: {currentUser.role}</p>
            </div>
            <select 
              value={currentUser.role}
              onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
              className="bg-slate-800 text-xs text-white border border-slate-700 rounded px-2 py-1 focus:outline-none"
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
        <div className="max-w-7xl mx-auto px-4 flex space-x-8">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`py-3 text-sm font-medium border-b-2 ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            Dashboard Utama
          </button>
          <button 
            onClick={() => setActiveTab('input-rca')} 
            className={`py-3 text-sm font-medium border-b-2 ${activeTab === 'input-rca' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            + Input RCA Baru (Input 1 & 2)
          </button>
        </div>
      </nav>

      {/* Konten Utama */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Dashboard Utama & Action Log Monitoring</h2>
                <p className="text-xs text-slate-500">Plant Narogong - Solusi Bangun Indonesia</p>
              </div>
              <button 
                onClick={() => setActiveTab('input-rca')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition flex items-center space-x-2"
              >
                <span>+ Buat RCA Baru</span>
              </button>
            </div>

            {/* Tabel Dashboard Ringkas (RCA, RCA Date, Status, Action) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800">Daftar Rekapitulasi RCA & Action Plan</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  Total RCA: {rcas.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-4">RCA (Equipment & Stop Reason)</th>
                      <th className="py-3 px-4">RCA Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {rcas.map((rca) => (
                      <tr key={rca.rcaId} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-600">{rca.rcaId}</span> - <span className="font-semibold text-slate-800">{rca.equipment}</span>
                          <div className="text-xs text-slate-500 mt-0.5">Kendala: {rca.stopReason}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-xs whitespace-nowrap">
                          {rca.rcaDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            rca.status === 'Done' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            {rca.status}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Form Input RCA Lengkap (Input 1 & 2) */}
        {activeTab === 'input-rca' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl mx-auto">
            <div className="border-b pb-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Formulir Input RCA & Action Plan (Input 1 & 2)</h2>
                <p className="text-xs text-slate-500">Plant Narogong - Solusi Bangun Indonesia</p>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="text-slate-500 hover:text-slate-800 text-sm font-semibold"
              >
                &larr; Kembali ke Dashboard
              </button>
            </div>

            <form onSubmit={handleSaveRca} className="space-y-6">
              {/* Bagian 1: Informasi Umum Equipment & Stop Reason */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">1. Informasi Permasalahan & Equipment (Input 1)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Name / Deskripsi</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Raw Mill 1 Hydraulic Power Unit"
                      value={newRcaForm.equipment}
                      onChange={(e) => setNewRcaForm({...newRcaForm, equipment: e.target.value})}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment Tag Number</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 531-RM1"
                      value={newRcaForm.tagNumber}
                      onChange={(e) => setNewRcaForm({...newRcaForm, tagNumber: e.target.value})}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Stop Reason / Kendala</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Filter Blockage"
                      value={newRcaForm.stopReason}
                      onChange={(e) => setNewRcaForm({...newRcaForm, stopReason: e.target.value})}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Stop</label>
                    <input 
                      type="date" 
                      required
                      value={newRcaForm.stopDate}
                      onChange={(e) => setNewRcaForm({...newRcaForm, stopDate: e.target.value})}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Downtime</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 4 Jam"
                      value={newRcaForm.downtime}
                      onChange={(e) => setNewRcaForm({...newRcaForm, downtime: e.target.value})}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2 & 3: Root Cause & Action Plan Bertingkat (Multiple) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wide">2 & 3. Root Cause & Action Plan (Multiple)</h3>
                  <button 
                    type="button"
                    onClick={handleAddRootCauseForm}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  >
                    + Tambah Root Cause Baru
                  </button>
                </div>

                {newRcaForm.rootCauses.map((rc, rcIndex) => (
                  <div key={rc.id} className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">Root Cause #{rcIndex + 1} (Akar Masalah)</label>
                      <input 
                        type="text"
                        required
                        placeholder="Deskripsikan akar penyebab kerusakan..."
                        value={rc.description}
                        onChange={(e) => {
                          const updated = [...newRcaForm.rootCauses];
                          updated[rcIndex].description = e.target.value;
                          setNewRcaForm({...newRcaForm, rootCauses: updated});
                        }}
                        className="w-full text-sm border border-blue-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>

                    {/* Action Plans di bawah Root Cause ini */}
                    <div className="pl-4 border-l-2 border-blue-300 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-700">Daftar Action Plan untuk Root Cause ini:</span>
                        <button 
                          type="button"
                          onClick={() => handleAddActionForm(rcIndex)}
                          className="text-xs bg-blue-600 text-white px-2.5 py-1 rounded hover:bg-blue-700 font-medium transition"
                        >
                          + Tambah Action Plan
                        </button>
                      </div>

                      {rc.actionPlans.map((act, actIndex) => (
                        <div key={act.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-3 shadow-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Action Plan Description</label>
                              <input 
                                type="text"
                                required
                                placeholder="Tindakan perbaikan..."
                                value={act.description}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].description = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Responsible (PIC)</label>
                              <input 
                                type="text"
                                required
                                placeholder="Nama PIC..."
                                value={act.responsible}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].responsible = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Deadline</label>
                              <input 
                                type="date"
                                required
                                value={act.deadline}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].deadline = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status (Input 2)</label>
                              <select 
                                value={act.status}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].status = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none bg-white font-semibold"
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
                                placeholder={act.status === 'Done' ? 'Tidak perlu alasan' : 'Alasan / kendala...'}
                                value={act.whyReason}
                                onChange={(e) => {
                                  const updated = [...newRcaForm.rootCauses];
                                  updated[rcIndex].actionPlans[actIndex].whyReason = e.target.value;
                                  setNewRcaForm({...newRcaForm, rootCauses: updated});
                                }}
                                className="w-full text-xs border border-slate-300 rounded px-2.5 py-1.5 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow transition"
                >
                  Simpan & Daftarkan RCA
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Modal Detail & Grafik Garis Horizontal Progres */}
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

            {/* Grafik Garis Horizontal Progres */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Grafik Linier Status Progres (Output Visual)</h4>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="relative flex justify-between items-center px-6">
                  {/* Garis Horizontal */}
                  <div className="absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-300 z-0"></div>

                  {/* Titik Not Yet */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                    <span className="text-[11px] font-semibold mt-1 text-slate-600">Not Yet</span>
                  </div>

                  {/* Titik On Progress */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                    <span className="text-[11px] font-semibold mt-1 text-amber-700">On Progress</span>
                  </div>

                  {/* Titik Done */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                    <span className="text-[11px] font-semibold mt-1 text-emerald-700">Done</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Root Causes & Action Plans Hierarkis */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wide">Analisis Akar Masalah & Action Plan</h4>
              {selectedRcaDetail.rootCauses.map((rc, idx) => (
                <div key={rc.id} className="bg-blue-50/40 border border-blue-100 p-3 rounded-lg space-y-2">
                  <div className="text-xs font-bold text-blue-900">Root Cause #{idx + 1}: {rc.description}</div>
                  <div className="pl-4 space-y-2 border-l-2 border-blue-200">
                    {rc.actionPlans.map((act) => (
                      <div key={act.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span>{act.description}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            act.status === 'Done' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>{act.status}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">PIC: {act.responsible} | Deadline: {act.deadline}</div>
                        {act.whyReason && <div className="text-blue-700 bg-blue-50 p-1 rounded"><strong>Why / Reason:</strong> {act.whyReason}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4 border-t">
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