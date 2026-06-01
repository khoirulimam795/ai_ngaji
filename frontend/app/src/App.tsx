import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StarField from '@/components/StarField';
import Dashboard from '@/pages/Dashboard';
import BelajarTajwid from '@/pages/BelajarTajwid';
import Kuis from '@/pages/Kuis';
import RekamBacaan from '@/pages/RekamBacaan';
import ProgressDetail from '@/pages/ProgressDetail';

export default function App() {
  return (
    <BrowserRouter>
      <StarField />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/belajar" element={<BelajarTajwid />} />
        <Route path="/kuis" element={<Kuis />} />
        <Route path="/rekam" element={<RekamBacaan />} />
        <Route path="/progress" element={<ProgressDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
