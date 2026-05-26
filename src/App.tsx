import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './Layout';
import HomePage from './HomePage';
import PropositoPage from './PropositoPage';
import MisionPage from './MisionPage';
import ServiciosPage from './ServiciosPage';
import CalendarioPage from './CalendarioPage';
import SermonesPage from './SermonesPage';
import EscuelaDominicalPage from './EscuelaDominicalPage';
import SalvacionPage from './SalvacionPage';
import PeticionPage from './PeticionPage';
import ContactoPage from './ContactoPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import PrintPeticionesPage from './PrintPeticionesPage';

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
        <Route path="/admin/peticiones/print" element={<PrintPeticionesPage />} />

        {/* Public routes — share the Layout (nav + footer) via Outlet */}
        <Route element={<Layout />}>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/proposito"         element={<PropositoPage />} />
          <Route path="/mision"            element={<MisionPage />} />
          <Route path="/servicios"         element={<ServiciosPage />} />
          <Route path="/calendario"        element={<CalendarioPage />} />
          <Route path="/sermones"          element={<SermonesPage />} />
          <Route path="/escuela-dominical" element={<EscuelaDominicalPage />} />
          <Route path="/plandesalvacion"   element={<SalvacionPage />} />
          <Route path="/peticion"          element={<PeticionPage />} />
          <Route path="/petition"          element={<PeticionPage />} />
          <Route path="/contacto"          element={<ContactoPage />} />

          {/* Backwards-compat redirects.
              - /salvacion was the previous canonical path; QR codes still
                point at it.
              - The legacy hand-coded site at iglesia-website used .html paths
                that may still be in search results / on printed materials. */}
          <Route path="/salvacion"             element={<Navigate to="/plandesalvacion" replace />} />
          <Route path="/index.html"            element={<Navigate to="/"                 replace />} />
          <Route path="/index-en.html"         element={<Navigate to="/"                 replace />} />
          <Route path="/proposito.html"        element={<Navigate to="/proposito"        replace />} />
          <Route path="/mision.html"           element={<Navigate to="/mision"           replace />} />
          <Route path="/servicios.html"        element={<Navigate to="/servicios"        replace />} />
          <Route path="/calendario.html"       element={<Navigate to="/calendario"       replace />} />
          <Route path="/sermones.html"         element={<Navigate to="/sermones"         replace />} />
          <Route path="/contacto.html"         element={<Navigate to="/contacto"         replace />} />

          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}
