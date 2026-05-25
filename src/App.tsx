import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';

export default function App() {
  return (
    <Routes>
      <Route path="/"      element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*"      element={<HomePage />} />
    </Routes>
  );
}
