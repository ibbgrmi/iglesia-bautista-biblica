import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminPage() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gold-300">Cargando…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="font-serif text-3xl text-gold-300">Panel de administración</h1>
        <button onClick={signOut} className="text-sm text-gold-400 hover:text-gold-300">Cerrar sesión</button>
      </header>

      <p className="text-gray-300 mb-2">Sesión iniciada como <strong className="text-gold-300">{user.email}</strong></p>
      <p className="text-gray-500 text-sm mb-8">ID: {user.id}</p>

      <div className="bg-navy-800/60 border border-gold-400/15 rounded-xl p-6">
        <h2 className="font-serif text-xl text-gold-300 mb-3">Próximamente</h2>
        <ul className="text-gray-300 space-y-2 list-disc list-inside">
          <li>Editor de eventos / calendario</li>
          <li>Anuncios para la página principal</li>
          <li>Bandeja de peticiones de oración</li>
          <li>Mensajes del formulario de contacto</li>
        </ul>
      </div>
    </div>
  );
}
