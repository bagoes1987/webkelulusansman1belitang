import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Result from './pages/Result';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="bg-glow"></div>
      <div className="app-wrapper" style={{ paddingBottom: '12vh' }}>
        <div style={{ width: '100%' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <div style={{ position: 'fixed', bottom: '1rem', left: 0, width: '100vw', textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '500', zIndex: 50, paddingBottom: 'env(safe-area-inset-bottom)' }}>
          &copy; Tim Kurikulum SMAN 1 Belitang. All Rights Reserved
        </div>
      </div>
    </Router>
  );
}

export default App;
