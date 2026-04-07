import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, Home as HomeIcon, Lock, Users, Settings, 
  Plus, Trash2, Edit2, X, Check, ChevronDown, 
  FileSpreadsheet, Download, Upload, AlertCircle,
  Search, CalendarDays
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Tabs state
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'settings'

  // Settings State
  const [datetime, setDatetime] = useState('');
  const [message, setMessage] = useState('');

  // Students State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedClass, setSelectedClass] = useState('SEMUA');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    nisn: '',
    dob: '',
    name: '',
    kelas: '',
    gender: 'L',
    nis: '',
    pob: '',
    status: 'LULUS',
    notes: 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.'
  });

  // UI Helpers
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    // Handle YYYY-MM-DD -> DD/MM/YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const uniqueClasses = ['SEMUA', ...new Set(students.map(s => s.kelas).filter(Boolean))].sort((a, b) => {
    if (a === 'SEMUA') return -1;
    if (b === 'SEMUA') return 1;
    return a.localeCompare(b, undefined, { numeric: true });
  });

  const filteredStudents = students.filter(s => {
    const matchClass = selectedClass === 'SEMUA' || s.kelas === selectedClass;
    const matchSearch = String(s.name).toLowerCase().includes(searchTerm.toLowerCase()) || 
                       String(s.nisn).includes(searchTerm);
    return matchClass && matchSearch;
  });

  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, searchTerm, pageSize]);

  // --- Responsive State ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    const fetchSettings = async () => {
      const { data } = await supabase.from('students').select('*').eq('nisn', '__CONFIG_TIMER__').single();
      if (data && data.notes) {
        setDatetime(data.notes);
      } else {
        const storedTime = localStorage.getItem('announcementTime');
        if (storedTime) setDatetime(storedTime);
      }
    };
    fetchSettings();
    
    if (isAuthenticated) {
      fetchStudents();
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('Password salah!');
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .neq('nisn', '__CONFIG_TIMER__')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      setMessage('Gagal mengambil data siswa: ' + error.message);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleSaveSetting = async (e) => {
    e.preventDefault();
    if (!datetime) {
      setMessage('Tanggal dan waktu harus diisi!');
      return;
    }
    
    const configRow = {
      nisn: '__CONFIG_TIMER__',
      dob: '2000-01-01',
      name: 'SYSTEM_CONFIG',
      status: 'CONFIG',
      notes: datetime
    };

    const { data: existing } = await supabase.from('students').select('id').eq('nisn', '__CONFIG_TIMER__').single();

    if (existing) {
      await supabase.from('students').update({ notes: datetime }).eq('id', existing.id);
    } else {
      await supabase.from('students').insert([configRow]);
    }
    
    localStorage.setItem('announcementTime', datetime);
    setMessage('Berhasil! Waktu pengumuman tersimpan secara Global!');
    setTimeout(() => setMessage(''), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'status') {
      const defaultNotes = 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.';
      setFormData(prev => ({ 
        ...prev, 
        status: value,
        notes: defaultNotes
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleResetForm = () => {
    setFormData({
      nisn: '',
      dob: '',
      name: '',
      kelas: '',
      gender: 'L',
      nis: '',
      pob: '',
      status: 'LULUS',
      notes: 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (student) => {
    setFormData({
      nisn: student.nisn,
      dob: student.dob,
      name: student.name,
      kelas: student.kelas || '',
      gender: student.gender || 'L',
      nis: student.nis || '',
      pob: student.pob || '',
      status: student.status,
      notes: student.notes || ''
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data siswa ini?')) {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
      } else {
        fetchStudents();
      }
    }
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    if (!formData.nisn || !formData.dob || !formData.name) {
      alert('NISN, Tgl Lahir, dan Nama wajib diisi!');
      return;
    }

    setLoading(true);
    let error;

    if (editingId) {
      const { error: updateError } = await supabase.from('students').update(formData).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('students').insert([formData]);
      error = insertError;
    }

    if (error) {
      alert('Gagal menyimpan: ' + error.message);
    } else {
      fetchStudents();
      handleResetForm();
    }
    setLoading(false);
  };

  // --- Excel Operations ---
  const downloadTemplate = () => {
    const template = [
      { 
        "nisn": "0012345678", 
        "tanggal_lahir": "31-08-2008", 
        "nama": "BAGUS PANCA WIRATAMA", 
        "kelas": "XII.1", 
        "status": "LULUS" 
      },
      { 
        "nisn": "0087654321", 
        "tanggal_lahir": "15-12-2007", 
        "nama": "SITI AMINAH", 
        "kelas": "XII.2", 
        "status": "TIDAK LULUS" 
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Kelulusan");
    XLSX.writeFile(wb, "Template_Data_Kelulusan_2026.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setImporting(true);
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Map data with support for Indonesian headers & Date formatting
        const formattedData = data.map(item => {
          const rawDob = item.tanggal_lahir || item.dob || item.tanggal || '';
          let finalDob = String(rawDob).trim();

          // Logika Konversi Tanggal: DD-MM-YYYY -> YYYY-MM-DD
          const parts = finalDob.split(/[-/]/);
          if (parts.length === 3) {
            // Jika bagian pertama bukan tahun (kurang dari 4 digit), asumsikan format Indonesia (DD-MM-YYYY)
            if (parts[0].length < 4) {
              const d = parts[0].padStart(2, '0');
              const m = parts[1].padStart(2, '0');
              const y = parts[2];
              finalDob = `${y}-${m}-${d}`;
            } else {
              // Jika sudah YYYY-MM-DD, pastikan padding nol benar
              const y = parts[0];
              const m = parts[1].padStart(2, '0');
              const d = parts[2].padStart(2, '0');
              finalDob = `${y}-${m}-${d}`;
            }
          }
          
          return {
            nisn: String(item.nisn || ''),
            dob: finalDob,
            name: String(item.nama || item.name || '').toUpperCase(),
            kelas: String(item.kelas || item.kls || ''),
            gender: String(item.jenis_kelamin || item.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
            nis: String(item.nis || ''),
            pob: String(item.tempat_lahir || item.pob || ''),
            status: String(item.status || 'LULUS').toUpperCase(),
            notes: 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.'
          };
        }).filter(item => item.nisn && item.dob);

        if (formattedData.length === 0) {
          alert('Format Excel tidak valid atau data kosong. Pastikan kolom bernama nisn, tanggal_lahir, nama, kelas, status.');
          setImporting(false);
          return;
        }

        const { error } = await supabase.from('students').insert(formattedData);
        if (error) throw error;

        setMessage(`Berhasil mengimpor ${formattedData.length} data siswa!`);
        fetchStudents();
      } catch (err) {
        console.error(err);
        alert('Gagal mengimpor: ' + err.message);
      }
      setImporting(false);
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-center" style={{ minHeight: '80vh', padding: '1rem' }}>
        <div className="glass-container page-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '3rem 2.5rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          
          {/* Decorative Glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(22, 66, 138, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }}></div>

          <div className="text-center" style={{ position: 'relative', zIndex: 1, marginBottom: '3.5rem' }}>
            <div className="flex-center mb-6">
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', inset: '-15px', background: 'rgba(22, 66, 138, 0.2)', filter: 'blur(20px)', borderRadius: '50%', zIndex: -1 }}></div>
                <div style={{ background: 'linear-gradient(135deg, rgba(22, 66, 138, 0.2) 0%, rgba(22, 66, 138, 0.1) 100%)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(22, 66, 138, 0.3)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                  <Lock size={40} color="var(--primary-color)" />
                </div>
              </div>
            </div>
            <h2 className="title" style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '0.5rem' }}>Akses Admin</h2>
            <p style={{ color: 'var(--text-light)', opacity: 0.7, fontSize: '0.875rem', fontWeight: '500' }}>Sistem Kelulusan SMAN 1 Belitang</p>
          </div>
          
          <form onSubmit={handleLogin} className="scale-in" style={{ position: 'relative', zIndex: 1 }}>
            {message && (
              <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.875rem', borderRadius: '14px', marginBottom: '1.5rem', fontSize: '0.8rem', textAlign: 'center', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /> {message}
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <Input 
                label="Masukan Password" 
                type="password"
                placeholder="Masukkan kata sandi"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mt-8" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Button type="submit" style={{ padding: '1rem', borderRadius: '16px', fontSize: '1rem', fontWeight: '800', boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)' }}>
                Masuk ke Dasbor
              </Button>
              
              <button 
                type="button"
                onClick={() => navigate('/')} 
                style={{ 
                  background: 'transparent', 
                  color: 'rgba(255,255,255,0.5)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  padding: '0.875rem', 
                  borderRadius: '16px', 
                  fontSize: '0.875rem', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'white'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <HomeIcon size={18} /> Kembali ke Beranda
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page-fade-in" style={{ 
      width: '100%',
      maxWidth: isMobile ? '100%' : '1200px', 
      margin: isMobile ? '0' : '2rem auto', 
      padding: '0', 
      background: isMobile ? 'rgba(15, 23, 42, 0.95)' : 'var(--glass-bg)',
      backdropFilter: 'blur(20px)',
      borderRadius: isMobile ? '0' : '28px', 
      minHeight: isMobile ? '100vh' : 'auto',
      overflow: 'hidden', 
      border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
      boxShadow: isMobile ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    }}>
      
      {/* Sidebar-style Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        padding: isMobile ? '1.25rem 1rem' : '2.5rem 3rem', 
        display: 'flex', 
        flexDirection: isMobile ? 'row' : 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: isMobile ? '1rem' : '0',
        borderBottom: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <div>
          <h2 className="title" style={{ fontSize: isMobile ? '1.25rem' : '2rem', margin: 0, textAlign: 'left', fontWeight: '900', letterSpacing: '-0.5px' }}>Dasbor Admin</h2>
          <p style={{ color: 'var(--text-light)', fontSize: isMobile ? '0.7rem' : '1rem', marginTop: '0.2rem', opacity: 0.8 }}>Pengelolaan Kelulusan 2026</p>
        </div>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.75rem', borderRadius: '12px', fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' }}>
          {isMobile ? <X size={18} /> : 'Keluar Dasbor'}
        </button>
      </div>

      <div style={{ padding: isMobile ? '1rem' : '3rem' }}>
        {/* Navigation Tabs - Segmented Control Style */}
        <div style={{ 
          display: 'flex', 
          gap: '0.25rem', 
          marginBottom: isMobile ? '1.5rem' : '3rem', 
          background: 'rgba(255,255,255,0.03)', 
          padding: '0.35rem', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.06)', 
          maxWidth: isMobile ? '100%' : '500px' 
        }}>
          <button onClick={() => setActiveTab('students')} style={{ flex: 1, padding: isMobile ? '0.65rem' : '1.1rem', borderRadius: '12px', border: 'none', background: activeTab === 'students' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'students' ? 'white' : 'var(--text-light)', cursor: 'pointer', fontWeight: '800', fontSize: isMobile ? '0.8rem' : '1rem', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.4rem' : '0.75rem' }}>
            <Users size={isMobile ? 16 : 22} /> <span style={{ whiteSpace: 'nowrap' }}>Data Siswa</span>
          </button>
          <button onClick={() => setActiveTab('settings')} style={{ flex: 1, padding: isMobile ? '0.65rem' : '1.1rem', borderRadius: '12px', border: 'none', background: activeTab === 'settings' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'settings' ? 'white' : 'var(--text-light)', cursor: 'pointer', fontWeight: '800', fontSize: isMobile ? '0.8rem' : '1rem', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '0.4rem' : '0.75rem' }}>
            <Settings size={isMobile ? 16 : 22} /> <span style={{ whiteSpace: 'nowrap' }}>Jadwal Buka</span>
          </button>
        </div>

        {activeTab === 'settings' && (
          <div className="scale-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: isMobile ? '1.5rem' : '3rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '16px' }}>
                  <Clock size={isMobile ? 24 : 28} color="var(--primary-color)" />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', margin: 0, fontWeight: '800' }}>Waktu Pengumuman</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', opacity: 0.6 }}>Atur akses cek kelulusan siswa</p>
                </div>
              </div>
              <form onSubmit={handleSaveSetting}>
                {message && (
                  <div style={{ background: (message.includes('berhasil') || message.includes('Berhasil')) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${(message.includes('berhasil') || message.includes('Berhasil')) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: (message.includes('berhasil') || message.includes('Berhasil')) ? '#10b981' : '#f87171', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Check size={18} /> {message}
                  </div>
                )}
                <Input 
                  label="Jadwal Akses" 
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                />
                <div className="mt-8"><Button type="submit" style={{ padding: '1rem' }}>Update Waktu</Button></div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="scale-in">
            {!showForm ? (
              <>
                {/* Responsive Toolbar */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '1.25rem', width: '100%' }}>
                    <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
                      <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                      <input 
                        type="text" 
                        placeholder="Cari Nama atau NISN..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field" 
                        style={{ paddingLeft: '3.25rem', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }} 
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto auto', gap: '0.75rem', width: '100%', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                      <input type="file" ref={fileInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" style={{ display: 'none' }} />
                      <button onClick={() => downloadTemplate()} style={{ minWidth: isMobile ? 'auto' : '140px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Download size={16} /> Template
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ minWidth: isMobile ? 'auto' : '140px', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <Upload size={16} /> {importing ? '...' : 'Impor'}
                      </button>
                      <button onClick={() => setShowForm(true)} style={{ gridColumn: isMobile ? '1 / span 2' : 'auto', minWidth: isMobile ? '100%' : '180px', background: 'var(--primary-color)', color: 'white', border: 'none', padding: '0.85rem 1.75rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: '0 8px 20px rgba(22, 66, 138, 0.3)' }}>
                        <Plus size={20} /> Tambah Siswa
                      </button>
                    </div>
                  </div>

                  {/* Class Tabs - Horizontal Scrollable */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.6rem', 
                    overflowX: 'auto', 
                    paddingBottom: '0.5rem', 
                    marginTop: '0.5rem',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }}>
                    {uniqueClasses.map(cls => (
                      <button 
                        key={cls}
                        onClick={() => setSelectedClass(cls)}
                        style={{ 
                          whiteSpace: 'nowrap',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '10px',
                          border: '1px solid ' + (selectedClass === cls ? 'var(--primary-color)' : 'rgba(255,255,255,0.06)'),
                          background: selectedClass === cls ? 'rgba(22, 66, 138, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                          color: selectedClass === cls ? 'var(--primary-color)' : 'rgba(255,255,255,0.6)',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>

                {message && message.includes('impor') && (
                   <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '1rem', borderRadius: '14px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <Check size={18} /> {message}
                   </div>
                )}

                {loading ? (
                  <div className="text-center" style={{ padding: '4rem', color: 'var(--text-light)', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <div className="loader mb-4" style={{ margin: '0 auto' }}></div>
                    Menyelaraskan data dengan database...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center" style={{ padding: '4rem', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '1.1rem' }}>Data tidak ditemukan.</p>
                    <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Coba ubah filter kelas atau kata kunci pencarian Anda.</p>
                  </div>
                ) : isMobile ? (
                  /* Mobile Card View - Refined */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {paginatedStudents.map((student, index) => (
                      <div key={student.id} style={{ 
                        background: 'rgba(30, 41, 59, 1)', 
                        borderRadius: '16px', 
                        padding: '1.25rem', 
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        {/* Mobile Seq Number Badge */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '-8px', 
                          left: '-8px', 
                          width: '24px', 
                          height: '24px', 
                          background: 'var(--primary-color)', 
                          color: 'white', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.65rem', 
                          fontWeight: '900',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          border: '2px solid #0f172a',
                          zIndex: 2
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                            <div style={{ fontWeight: '800', color: 'white', fontSize: '1.05rem', lineHeight: '1.4', marginBottom: '0.2rem' }}>{student.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                              NISN: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{student.nisn}</span> • {student.kelas} • {student.gender}
                            </div>
                          </div>
                          <span style={{ 
                            padding: '0.3rem 0.6rem', 
                            borderRadius: '8px', 
                            fontSize: '0.65rem', 
                            fontWeight: '900',
                            background: student.status === 'LULUS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: student.status === 'LULUS' ? '#10b981' : '#f87171',
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap'
                          }}>
                            {student.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CalendarDays size={12} /> {formatDateDisplay(student.dob)}
                          </div>
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button onClick={() => handleEdit(student)} style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(student.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View */
                  <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', width: '50px' }}>No</th>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Siswa</th>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>NISN / Tgl Lahir</th>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Kelas</th>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                          <th style={{ padding: '1.25rem 1.5rem', color: 'var(--text-light)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody style={{ verticalAlign: 'middle' }}>
                        {paginatedStudents.map((student, index) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
                            <td style={{ padding: '1.25rem 1.5rem', color: 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: '0.85rem' }}>
                              {index + 1}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ fontWeight: '700', color: 'white', fontSize: '1rem' }}>{student.name}</div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <div style={{ color: 'var(--text-light)', fontWeight: '600' }}>{student.nisn}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>{student.pob}, {formatDateDisplay(student.dob)}</div>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#94a3b8', fontWeight: '500' }}>
                              {student.kelas} <br/>
                              <span style={{ fontSize: '0.7rem' }}>NIS: {student.nis} • {student.gender}</span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                              <span style={{ 
                                padding: '0.4rem 0.8rem', 
                                borderRadius: '10px', 
                                fontSize: '0.75rem', 
                                fontWeight: '800',
                                background: student.status === 'LULUS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: student.status === 'LULUS' ? '#10b981' : '#f87171',
                                letterSpacing: '0.5px'
                              }}>
                                {student.status}
                              </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button onClick={() => handleEdit(student)} style={{ background: 'rgba(96, 165, 250, 0.1)', border: 'none', color: '#60a5fa', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(student.id)} style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}><Trash2 size={18} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredStudents.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '2rem',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                      <span>Menampilkan</span>
                      <select 
                        value={pageSize} 
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        style={{ 
                          background: 'rgba(15, 23, 42, 0.6)', 
                          color: 'white', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          padding: '0.4rem 0.6rem', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>baris dari {filteredStudents.length} siswa</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ 
                          padding: '0.6rem 1rem', 
                          borderRadius: '10px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                          color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'white',
                          cursor: currentPage === 1 ? 'default' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '800'
                        }}
                      >
                        Kembali
                      </button>
                      
                      <div style={{ 
                        padding: '0.6rem 1.2rem', 
                        borderRadius: '10px', 
                        background: 'rgba(15, 23, 42, 0.4)', 
                        color: 'white', 
                        fontSize: '0.8rem', 
                        fontWeight: '800',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {currentPage} / {totalPages}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ 
                          padding: '0.6rem 1rem', 
                          borderRadius: '10px', 
                          border: '1px solid rgba(255,255,255,0.1)', 
                          background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                          color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'white',
                          cursor: currentPage === totalPages ? 'default' : 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '800'
                        }}
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', position: 'relative', overflow: 'hidden' }}>
              
              {/* Decorative Accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, var(--primary-color), transparent)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    {editingId ? <Edit2 size={24} color="var(--primary-color)" /> : <Plus size={24} color="var(--primary-color)" />}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-0.5px' }}>{editingId ? 'Edit Data Siswa' : 'Daftarkan Siswa Baru'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', opacity: 0.6, margin: 0 }}>Kelola detail profil dan status kelulusan</p>
                  </div>
                </div>
                <button onClick={handleResetForm} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.65rem', borderRadius: '50%', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}>
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitStudent}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.75rem', marginBottom: '1.75rem' }}>
                  <Input 
                    label="NISN (10 Digit)" 
                    name="nisn" 
                    value={formData.nisn} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: 0012345678" 
                    icon={Search}
                    required 
                  />
                  <Input 
                    label="Tanggal Lahir" 
                    type="date" 
                    name="dob" 
                    value={formData.dob} 
                    onChange={handleInputChange} 
                    icon={Clock}
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 2 }}>
                    <Input 
                      label="Nama Lengkap" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="Masukkan nama lengkap" 
                      icon={Users}
                      required 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="input-group">
                      <label className="input-label">Jenis Kelamin</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="input-field" style={{ padding: '0.8rem' }}>
                        <option value="L">LAKI-LAKI (L)</option>
                        <option value="P">PEREMPUAN (P)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <Input 
                    label="NIS" 
                    name="nis" 
                    value={formData.nis} 
                    onChange={handleInputChange} 
                    placeholder="Masukkan NIS" 
                    icon={Search}
                  />
                  <Input 
                    label="Tempat Lahir" 
                    name="pob" 
                    value={formData.pob} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: OKU TIMUR" 
                    icon={HomeIcon}
                  />
                  <Input 
                    label="Kelas" 
                    name="kelas" 
                    value={formData.kelas} 
                    onChange={handleInputChange} 
                    placeholder="Contoh: XII.1" 
                    icon={HomeIcon}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: '1.75rem' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--primary-color)' }}><ChevronDown size={16} /></div> Status Kelulusan Akhir
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="input-field" style={{ paddingLeft: '1.25rem', appearance: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '1rem', border: '1px solid rgba(255,255,255,0.12)' }}>
                      <option value="LULUS">✅ DINYATAKAN LULUS</option>
                      <option value="TIDAK LULUS">❌ TIDAK LULUS</option>
                    </select>
                    <div style={{ position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ color: 'var(--primary-color)' }}><Edit2 size={16} /></div> Instruksi & Pesan Khusus (SKHU)
                  </label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} className="input-field" style={{ paddingLeft: '1.25rem', minHeight: '110px', paddingTop: '1rem', fontSize: '0.9rem', lineHeight: 1.6, resize: 'none', border: '1px solid rgba(255,255,255,0.12)' }} placeholder="Tuliskan detail waktu atau tempat pengambilan SKHU..."></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    onClick={handleResetForm} 
                    style={{ flex: 1, padding: '1rem', borderRadius: '16px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = 'white'; }}
                    onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'rgba(255,255,255,0.5)'; }}
                  >
                    Batalkan
                  </button>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    style={{ 
                      flex: 2, 
                      padding: '1rem', 
                      fontSize: '1rem', 
                      fontWeight: '800', 
                      borderRadius: '16px', 
                      boxShadow: '0 10px 20px rgba(22, 66, 138, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    {loading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan Data' : 'Daftarkan Siswa Sekarang')}
                  </Button>
                </div>
              </form>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
