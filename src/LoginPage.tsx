import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [busy,     setBusy]     = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-navy-800/60 border border-gold-400/15 rounded-xl p-7 backdrop-blur"
      >
        <h1 className="font-serif text-3xl text-gold-300 text-center mb-2">Acceso administrador</h1>
        <p className="text-gray-400 text-sm text-center mb-6">Iglesia Bautista Bíblica</p>

        <label className="block text-sm text-gray-300 mb-1.5">Correo</label>
        <input
          type="email" required autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
        />

        <label className="block text-sm text-gray-300 mb-1.5">Contraseña</label>
        <input
          type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 bg-navy-950/60 border border-gold-400/20 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
        />

        {error && (
          <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
        )}

        <button
          type="submit" disabled={busy}
          className="w-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-900 font-semibold py-3 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed transition"
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="text-center mt-5">
          <Link to="/" className="text-gold-400/70 hover:text-gold-300 text-sm">← Volver al sitio</Link>
        </p>
      </form>
    </div>
  );
}
