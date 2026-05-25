import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './Layout';
import HomePage from './HomePage';
import PropositoPage from './PropositoPage';
import MisionPage from './MisionPage';
import ServiciosPage from './ServiciosPage';
import CalendarioPage from './CalendarioPage';
import SalvacionPage from './SalvacionPage';
import ContactoPage from './ContactoPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin routes — clean fullscreen, no Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPage />} />

        {/* Public routes — share the Layout (nav + footer) via Outlet */}
        <Route element={<Layout />}>
          <Route path="/"           element={<HomePage />} />
          <Route path="/proposito"  element={<PropositoPage />} />
          <Route path="/mision"     element={<MisionPage />} />
          <Route path="/servicios"  element={<ServiciosPage />} />
          <Route path="/calendario" element={<CalendarioPage />} />
          <Route path="/salvacion"  element={<SalvacionPage />} />
          <Route path="/contacto"   element={<ContactoPage />} />
          <Route path="*"           element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}
