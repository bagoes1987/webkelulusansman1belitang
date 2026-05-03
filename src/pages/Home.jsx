import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarDays } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [nisn, setNisn] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const monthRef = useRef(null);
  const yearRef = useRef(null);

  const [error, setError] = useState('');
  const [isTimeYet, setIsTimeYet] = useState(true);
  
  // State baru untuk timer proporsional ala SNBP
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [targetDateString, setTargetDateString] = useState('');
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    const fetchAndStartTimer = async () => {
      // Ambil waktu dari Supabase sebagai sumber kebenaran utama
      const { data } = await supabase.from('students').select('*').eq('nisn', '__CONFIG_TIMER__').single();
      
      let announceDateString = null;
      if (data && data.notes) {
        announceDateString = data.notes;
        localStorage.setItem('announcementTime', announceDateString); // cache lokal
      } else {
        announceDateString = localStorage.getItem('announcementTime');
      }

      if (announceDateString) {
        const announceDate = new Date(announceDateString);
        
        // Pemformatan tanggal ala Indonesia: "31 MARET 2026 15:00 WIB"
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
        let formattedDate = announceDate.toLocaleDateString('id-ID', options).toUpperCase().replace('PUKUL ', '');
        setTargetDateString(formattedDate);

        const checkTime = () => {
          const announceTime = announceDate.getTime();
          const now = new Date().getTime();
          const distance = announceTime - now;

          if (distance > 0) {
            setIsTimeYet(false);
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            
            setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
          } else {
            setIsTimeYet(true);
          }
        };

        checkTime();
        timer = setInterval(checkTime, 1000);
      } else {
        setIsTimeYet(true);
      }
    };

    fetchAndStartTimer();
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nisn || !day || !month || !year) {
      setError('NISN dan Tanggal Lahir harus diisi lengkap!');
      return;
    }

    setLoading(true);
    setError('');

    // Gabungkan Tanggal Lahir (YYYY-MM-DD)
    const formattedDob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Query ke Supabase
    const { data: students, error: apiError } = await supabase
      .from('students')
      .select('*')
      .eq('nisn', nisn)
      .eq('dob', formattedDob);

    const { data: configMsg } = await supabase
      .from('students')
      .select('*')
      .eq('nisn', '__CONFIG_MESSAGES__')
      .single();

    if (apiError) {
      setError('Terjadi kesalahan jaringan/database.');
    } else if (students && students.length > 0) {
      let customMessages = null;
      if (configMsg && configMsg.notes) {
        try { customMessages = JSON.parse(configMsg.notes); } catch(e) {}
      }
      navigate('/result', { state: { student: students[0], customMessages } });
    } else {
      setError('Data tidak ditemukan. Periksa NISN dan Tanggal Lahir Anda.');
    }
    setLoading(false);
  };

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    if (val.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    if (val.length === 2) {
      yearRef.current?.focus();
    }
  };

  return (
    <div className="glass-container page-fade-in" style={{ padding: '1.5rem 1rem 2.5rem 1rem' }}>
      <div className="header-logo scale-in">
        <div className="flex-center" style={{ marginBottom: '0.5rem' }}>
          <img 
            src="/logo.png" 
            alt="Logo SMAN 1 Belitang" 
            style={{ 
              width: '90px', 
              height: 'auto', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))'
            }} 
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.15rem', 
          marginBottom: '0.5rem',
          alignItems: 'center'
        }}>
          <h1 className="title" style={{ fontSize: '1.3rem', margin: 0, lineHeight: 1.2, letterSpacing: '0.05em' }}>
            PENGUMUMAN&nbsp;&nbsp;KELULUSAN
          </h1>
          <h1 className="title" style={{ fontSize: '1.3rem', margin: 0, lineHeight: 1.2, letterSpacing: '0.05em' }}>
            SMAN 1&nbsp;&nbsp;BELITANG
          </h1>
        </div>
        <p className="subtitle" style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1px', margin: 0 }}>
          TAHUN PELAJARAN 2025/2026
        </p>
      </div>

      {!isTimeYet ? (
        <div className="mt-8 page-fade-in" style={{ 
          background: 'var(--primary-color)', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center', color: 'white' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>HARI</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{String(timeLeft.days).padStart(2, '0')}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', opacity: 0.5, marginTop: '1.5rem' }}>:</div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>JAM</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{String(timeLeft.hours).padStart(2, '0')}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', opacity: 0.5, marginTop: '1.5rem' }}>:</div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>MENIT</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{String(timeLeft.minutes).padStart(2, '0')}</div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', opacity: 0.5, marginTop: '1.5rem' }}>:</div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.8, marginBottom: '0.5rem' }}>DETIK</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{String(timeLeft.seconds).padStart(2, '0')}</div>
            </div>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '1.25rem 0.5rem', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            gap: '0.4rem'
          }}>
            <div style={{ fontSize: 'clamp(0.75rem, 4vw, 0.95rem)', fontWeight: '800', color: '#1e293b', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
              PENGUMUMAN KELULUSAN 2026
            </div>
            <div style={{ fontSize: 'clamp(0.65rem, 3.5vw, 0.8rem)', color: '#64748b', fontWeight: '500', whiteSpace: 'nowrap' }}>
              DIBUKA TANGGAL {targetDateString}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 page-fade-in" style={{ animationDelay: '0.2s', padding: '0 0.5rem' }}>
          {error && (
            <div className="scale-in" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--error-color)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: '500' }}>
              {error}
            </div>
          )}
          
          <Input 
            label="NISN" 
            placeholder="Masukan NISN anda"
            icon={Search}
            value={nisn}
            onChange={(e) => setNisn(e.target.value)}
          />
          
          <div className="input-group">
            <label className="input-label">Tanggal Lahir</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Tanggal" 
                value={day} 
                onChange={handleDayChange}
                className="input-field" 
                style={{ textAlign: 'center', padding: '1rem 0.5rem' }}
              />
              <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>/</span>
              <input 
                ref={monthRef}
                type="text" 
                placeholder="Bulan" 
                value={month} 
                onChange={handleMonthChange}
                className="input-field" 
                style={{ textAlign: 'center', padding: '1rem 0.5rem' }}
              />
              <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>/</span>
              <input 
                ref={yearRef}
                type="text" 
                placeholder="Tahun" 
                value={year} 
                onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="input-field" 
                style={{ textAlign: 'center', padding: '1rem 0.5rem' }}
              />
            </div>
          </div>
          
          <div className="mt-8">
            <Button type="submit" disabled={loading}>
              {loading ? 'MEMERIKSA DATA...' : 'LIHAT HASIL KELULUSAN'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
