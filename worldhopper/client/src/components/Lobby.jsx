import { useState } from 'react';
import { SKINS, SKIN_ORDER, WORLDS } from '../game/constants.js';

export default function Lobby({ onJoin, supabase }) {
  const { signIn, signUp, signInWithGoogle, loading } = supabase;
  const [mode,     setMode]     = useState('login');  // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [skinId,   setSkinId]   = useState('default');
  const [error,    setError]    = useState('');
  const [busy,     setBusy]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    let err;
    if (mode === 'login') {
      ({ error: err } = await signIn(email, password));
    } else {
      ({ error: err } = await signUp(email, password, username || 'Joueur'));
    }
    setBusy(false);
    if (err) { setError(err.message); return; }
    onJoin(skinId);
  };

  const handleDemo = () => onJoin(skinId);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #0d1b2a 0%, #000 100%)' }}>
      {/* Stars bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white opacity-60"
            style={{ width: 1 + Math.random() * 2, height: 1 + Math.random() * 2,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s` }} />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1.8rem', textShadow: '0 0 20px #00ff88' }}>
            🌀 WorldHopper
          </h1>
          <p className="text-green-400 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Explore des mondes, collecte des items, change de skin !
          </p>
        </div>

        {/* Auth card */}
        <div className="bg-gray-900 bg-opacity-90 rounded-2xl p-6 border border-gray-700 shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-gray-800 rounded-xl p-1">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${mode === m ? 'bg-green-500 text-black' : 'text-gray-400 hover:text-white'}`}
                style={{ fontFamily: "'Nunito', sans-serif" }}>
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input className="lobby-input" placeholder="Pseudo" value={username} onChange={e => setUsername(e.target.value)} />
            )}
            <input className="lobby-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="lobby-input" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />

            {/* Skin picker */}
            <div>
              <p className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>Choisis ton skin de départ :</p>
              <div className="grid grid-cols-4 gap-2">
                {SKIN_ORDER.slice(0, 4).map(id => (
                  <button key={id} type="button" onClick={() => setSkinId(id)}
                    className={`p-2 rounded-xl text-2xl text-center border-2 transition ${skinId === id ? 'border-green-400 bg-green-900 bg-opacity-40' : 'border-gray-700 hover:border-gray-500'}`}>
                    {SKINS[id].emoji}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs" style={{ fontFamily: "'Nunito', sans-serif" }}>{error}</p>}

            <button type="submit" disabled={busy || loading}
              className="w-full py-3 rounded-xl font-bold text-black bg-green-400 hover:bg-green-300 disabled:opacity-50 transition"
              style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem' }}>
              {busy ? '...' : mode === 'login' ? '▶ JOUER' : '✨ CRÉER'}
            </button>
          </form>

          {/* Google */}
          <button onClick={signInWithGoogle}
            className="mt-3 w-full py-2 rounded-xl text-sm text-white border border-gray-600 hover:bg-gray-800 transition flex items-center justify-center gap-2"
            style={{ fontFamily: "'Nunito', sans-serif" }}>
            <span>🌐</span> Connexion Google
          </button>

          {/* Demo */}
          <button onClick={handleDemo}
            className="mt-2 w-full py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 transition"
            style={{ fontFamily: "'Nunito', sans-serif" }}>
            Jouer sans compte (démo)
          </button>
        </div>

        {/* World preview */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.values(WORLDS).map(w => (
            <div key={w.id} className="text-center p-2 rounded-xl bg-gray-900 bg-opacity-60 border border-gray-800">
              <div className="text-lg">{w.label.split(' ')[0]}</div>
              <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>{w.itemEmoji} +{w.itemValue}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .lobby-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          background: #1a2535;
          border: 1px solid #374151;
          color: white;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          outline: none;
        }
        .lobby-input:focus { border-color: #00ff88; }
        .lobby-input::placeholder { color: #6b7280; }
      `}</style>
    </div>
  );
}
