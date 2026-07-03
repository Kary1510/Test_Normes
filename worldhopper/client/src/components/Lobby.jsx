import { useState } from 'react';
import { SKINS, SKIN_ORDER, WORLDS, WORLD_ORDER } from '../game/constants.js';

export default function Lobby({ onJoin, supabase }) {
  const { signIn, signUp, signInWithGoogle, loading } = supabase;
  const [mode,     setMode]     = useState('login');
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
    <div className="fixed inset-0 overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0a1f12 0%, #000 100%)' }}>

      {/* Animated star background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: 1 + (i % 3),
              height: 1 + (i % 3),
              left: `${(i * 13.7) % 100}%`,
              top: `${(i * 7.3) % 100}%`,
              opacity: 0.2 + (i % 5) * 0.1,
            }} />
        ))}
      </div>

      <div className="relative z-10 min-h-full flex flex-col items-center justify-center py-8 px-4">

        {/* ── Title ── */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌀</div>
          <h1 style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            color: '#ffffff',
            textShadow: '0 0 30px #00ff88, 0 0 60px #00ff8855',
            letterSpacing: '0.05em',
          }}>
            WorldHopper
          </h1>
          <p className="mt-3 text-green-400 text-sm" style={{ fontFamily: "'Nunito', sans-serif" }}>
            Explore 4 mondes · Collecte des items · Débloque des skins
          </p>
        </div>

        {/* ── World preview strip ── */}
        <div className="w-full max-w-lg mb-6">
          <div className="grid grid-cols-4 gap-2">
            {WORLD_ORDER.map(wid => {
              const w = WORLDS[wid];
              return (
                <div key={wid} className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${w.pcHex}33` }}>
                  <div className="text-xl mb-1">{w.label.split(' ')[0]}</div>
                  <div className="text-xs font-bold" style={{ color: w.pcHex, fontFamily: "'Nunito', sans-serif" }}>
                    {w.itemEmoji} +{w.itemValue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Auth card ── */}
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-6 shadow-2xl"
            style={{ background: 'rgba(10,20,15,0.95)', border: '1px solid rgba(0,255,136,0.15)' }}>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold transition"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    background: mode === m ? '#00ff88' : 'transparent',
                    color: mode === m ? '#000' : '#9ca3af',
                  }}>
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <input className="lobby-input" placeholder="Pseudo" value={username}
                  onChange={e => setUsername(e.target.value)} />
              )}
              <input className="lobby-input" type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <input className="lobby-input" type="password" placeholder="Mot de passe" value={password}
                onChange={e => setPassword(e.target.value)} required />

              {/* Skin picker — all 7 skins */}
              <div>
                <p className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Skin de départ :
                </p>
                <div className="grid grid-cols-7 gap-1.5">
                  {SKIN_ORDER.map(id => {
                    const skin = SKINS[id];
                    const sel  = skinId === id;
                    return (
                      <button key={id} type="button" onClick={() => setSkinId(id)}
                        className="relative rounded-xl p-1.5 text-center text-2xl transition"
                        style={{
                          background: sel ? `${skin.hex}22` : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${sel ? skin.hex : 'rgba(255,255,255,0.1)'}`,
                          transform: sel ? 'scale(1.15)' : 'scale(1)',
                        }}
                        title={`${id} ${skin.cost > 0 ? `(${skin.cost}🪙)` : '(gratuit)'}`}>
                        {skin.emoji}
                      </button>
                    );
                  })}
                </div>
                {SKINS[skinId]?.cost > 0 && (
                  <p className="text-yellow-500 text-xs mt-1.5" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    💡 Ce skin coûte {SKINS[skinId].cost}🪙 — collecte des items pour l'acheter !
                  </p>
                )}
              </div>

              {error && (
                <p className="text-red-400 text-xs" style={{ fontFamily: "'Nunito', sans-serif" }}>{error}</p>
              )}

              <button type="submit" disabled={busy || loading}
                className="w-full py-3 rounded-xl font-bold text-black disabled:opacity-50 transition hover:scale-105"
                style={{ background: '#00ff88', fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem' }}>
                {busy ? '…' : mode === 'login' ? '▶ JOUER' : '✨ CRÉER'}
              </button>
            </form>

            {/* Google */}
            <button onClick={signInWithGoogle}
              className="mt-3 w-full py-2 rounded-xl text-sm text-white border transition hover:opacity-80 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Nunito', sans-serif", borderColor: 'rgba(255,255,255,0.12)' }}>
              🌐 Connexion Google
            </button>

            {/* Demo */}
            <button onClick={handleDemo}
              className="mt-2 w-full py-2 rounded-xl text-xs transition hover:text-white"
              style={{ color: '#6b7280', fontFamily: "'Nunito', sans-serif" }}>
              Jouer sans compte (démo)
            </button>
          </div>
        </div>

      </div>

      <style>{`
        .lobby-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
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
