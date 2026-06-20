import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import RekamBacaan from './pages/RekamBacaan';
import BelajarTajwid from './pages/BelajarTajwid';
import Kuis from './pages/Kuis';
import ProgressDetail from './pages/ProgressDetail';
import TeacherGate from './pages/TeacherGate';
import TeacherOnboarding from './pages/TeacherOnboarding';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDetail from './pages/StudentDetail';
import MaterialUpload from './pages/MaterialUpload';
import { Toaster } from 'react-hot-toast';
import MaterialManage from './pages/MaterialManage';
import TeacherClassSelector from './pages/TeacherClassSelector';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rute Existing */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/rekam" element={<RekamBacaan />} />
        <Route path="/belajar" element={<BelajarTajwid />} />
        <Route path="/kuis" element={<Kuis />} />
        <Route path="/progress" element={<ProgressDetail />} />

        {/* Rute Baru: Portal Guru */}
        <Route path="/guru/gate" element={<TeacherGate />} />
        {<Route path="/guru/onboarding" element={<TeacherOnboarding />} />}
        {<Route path="/guru/dashboard" element={<TeacherDashboard />} />}
        <Route path="/guru/student/:userId" element={<StudentDetail />} />
        <Route path="/guru/material-upload" element={<MaterialUpload />} />
        <Route path="/guru/material-manage" element={<MaterialManage />} />
        <Route path="/guru/class-selector" element={<TeacherClassSelector />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A2E',
            color: '#E8DCC4',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#4fff00',
              secondary: '#0D1B2A',
            },
          },
          error: {
            iconTheme: {
              primary: '#E74C3C',
              secondary: '#0D1B2A',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;