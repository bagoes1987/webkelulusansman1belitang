import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { QRCodeSVG } from 'qrcode.react';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!state?.student) {
      navigate('/');
    } else if (state.student.status === 'LULUS') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 8000);
    }
  }, [state, navigate]);

  if (!state?.student) return null;

  const { student } = state;
  const isLulus = student.status === 'LULUS';

  // Format date correctly if it's yyyy-mm-dd to dd/mm/yyyy
  const formatDOB = (dobStr) => {
    try {
      const parts = dobStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dobStr;
    } catch {
      return dobStr;
    }
  };

  const qrPayload = `VERIFIKASI ASLI:\nDinyatakan bahwa [${student.name}] dengan NISN [${student.nisn}] adalah resmi ${student.status} dari SMAN 1 Belitang.`;

  return (
    <div className="page-fade-in" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', background: '#212529', position: 'relative', zIndex: 10 }}>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={400} />}

      {/* Header Banner - Merah / Biru */}
      <div style={{ 
        background: isLulus ? '#16428a' : '#dc3545', 
        padding: '0.75rem 1.25rem', 
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '45px', marginRight: '0.75rem' }} />
          <div style={{ fontSize: '0.85rem', fontWeight: '800', lineHeight: 1.2, letterSpacing: '0.5px' }}>
            SMA NEGERI 1 BELITANG<br/>
            <span style={{ fontSize: '0.7rem', fontWeight: '600', opacity: 0.8 }}>NPSN 10603301</span>
          </div>
        </div>

        <div style={{ fontWeight: '800', textTransform: 'uppercase', marginBottom: isLulus ? '0.5rem' : '0.5rem', lineHeight: 1.3 }}>
          {isLulus ? (
            <>
              <div style={{ fontSize: 'clamp(0.7rem, 4.2vw, 1.1rem)', whiteSpace: 'nowrap' }}>SELAMAT! ANDA DINYATAKAN LULUS</div>
              <div style={{ fontSize: 'clamp(0.65rem, 3.8vw, 1rem)' }}>DARI SMAN 1 BELITANG</div>
              <div style={{ fontSize: 'clamp(0.65rem, 3.8vw, 1rem)' }}>TAHUN PELAJARAN 2025/2026</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'clamp(0.7rem, 4.2vw, 1.1rem)', whiteSpace: 'nowrap' }}>ANDA DINYATAKAN TIDAK LULUS</div>
              <div style={{ fontSize: 'clamp(0.65rem, 3.8vw, 1rem)' }}>DARI SMAN 1 BELITANG</div>
              <div style={{ fontSize: 'clamp(0.65rem, 3.8vw, 1rem)' }}>TAHUN PELAJARAN 2025/2026</div>
            </>
          )}
        </div>
        
      </div>

      {/* Body Section */}
      <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ background: 'white', padding: '0.4rem', display: 'inline-block', borderRadius: '8px', marginBottom: '0.25rem' }}>
             <QRCodeSVG value={qrPayload} size={70} />
          </div>
          <div style={{ fontSize: '0.6rem', color: '#adb5bd', letterSpacing: '1px', textTransform: 'uppercase' }}>
            NISN {student.nisn} - VERIFIKASI QR
          </div>
        </div>

        <div style={{ fontSize: 'clamp(1rem, 5vw, 1.3rem)', fontWeight: '900', color: 'white', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '1.25rem' }}>
          {student.name}
        </div>

        {/* Data Rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>NISN / NIS</div>
            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700' }}>{student.nisn} / {student.nis || '-'}</div>
          </div>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Jenis Kelamin</div>
            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700' }}>{student.gender === 'P' ? 'PEREMPUAN' : 'LAKI-LAKI'}</div>
          </div>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Tempat, Tgl Lahir</div>
            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700' }}>{student.pob || '-'}, {formatDOB(student.dob)}</div>
          </div>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Kelas</div>
            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700' }}>{student.kelas || '-'}</div>
          </div>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem', gridColumn: 'span 2' }}>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Asal Sekolah</div>
            <div style={{ fontSize: '0.8rem', color: 'white', fontWeight: '700' }}>SMA NEGERI 1 BELITANG</div>
          </div>
        </div>

      </div>

      {/* Footer Instructions */}
      <div style={{ background: 'white', padding: '0.75rem 1.25rem', borderTop: '2px solid #e9ecef' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#212529', marginBottom: '0.5rem' }}>
          Silakan lakukan instruksi berikut:
        </div>
        <div style={{ fontSize: '0.75rem', color: '#495057', lineHeight: 1.5, fontWeight: '500' }}>
          {(!student.notes || student.notes.includes('Mohon maaf') || student.notes.includes('Selamat! Anda dinyatakan LULUS')) 
            ? 'untuk pengambilan SKHU menunggu informasi dari TU SMAN 1 Belitang.' 
            : student.notes}
        </div>
        <button 
           onClick={() => navigate('/')} 
           style={{ 
             background: 'linear-gradient(135deg, #212529 0%, #343a40 100%)', 
             color: 'white', 
             padding: '0.65rem 1rem', 
             width: '100%', 
             borderRadius: '8px', 
             border: 'none', 
             marginTop: '0.75rem', 
             fontWeight: 'bold',
             cursor: 'pointer',
             boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
           }}
        >
          KEMBALI KE BERANDA
        </button>
      </div>

    </div>
  );
}
