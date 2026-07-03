import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine }  from './game/Engine.js';
import { WORLDS }      from './game/constants.js';
import { useGame }     from './hooks/useGame.js';
import { useSocket }   from './hooks/useSocket.js';
import { useSupabase } from './hooks/useSupabase.js';
import Lobby           from './components/Lobby.jsx';
import HUD             from './components/HUD.jsx';
import Shop            from './components/Shop.jsx';
import Chat            from './components/Chat.jsx';
import Toast           from './components/Toast.jsx';
import DPad, { JumpButton } from './components/DPad.jsx';

const IS_TOUCH = 'ontouchstart' in window;

// ─── Tutorial overlay ─────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  { icon: '🕹️', title: 'Se déplacer',   text: 'WASD ou flèches pour bouger · Espace pour sauter' },
  { icon: '⭐', title: 'Collecter',      text: 'Approche-toi des orbes lumineux pour gagner des pièces' },
  { icon: '🌀', title: 'Changer monde', text: 'Collecte tous les items puis trouve le portail !' },
];

function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(4px)' }}>
      <div className="rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl"
        style={{ background: '#0f1923', border: '1px solid rgba(0,255,136,0.25)', animation: 'toast-in 0.3s ease-out' }}>

        <div className="text-5xl mb-4">{s.icon}</div>

        <h3 className="text-white font-bold mb-2"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.85rem', lineHeight: 1.5 }}>
          {s.title}
        </h3>

        <p className="text-gray-300 text-sm mb-6" style={{ fontFamily: "'Nunito', sans-serif", lineHeight: 1.6 }}>
          {s.text}
        </p>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-6">
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? '#00ff88' : 'rgba(255,255,255,0.25)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div className="flex gap-2">
          {step < TUTORIAL_STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-2.5 rounded-xl font-bold text-black transition hover:scale-105"
              style={{ background: '#00ff88', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>
              Suivant →
            </button>
          ) : (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-black transition hover:scale-105"
              style={{ background: '#00ff88', fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem' }}>
              ▶ Jouer !
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-500 hover:text-white text-sm transition"
            style={{ fontFamily: "'Nunito', sans-serif" }}>
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const supabase = useSupabase();
  const { user, profile, loading, addCoins: dbAddCoins, buySkin, setActiveSkin } = supabase;

  const {
    state, setWorld, addCoins, setSkin, setTab, pushToast, popToast,
    syncProfile, setItemProgress, setTutorial,
  } = useGame();
  const { worldId, coins, activeSkin, toasts, itemProgress, showTutorial } = state;

  const [gameReady, setGameReady] = useState(false);
  const [showShop,  setShowShop]  = useState(false);
  const [dpad,      setDpad]      = useState({ left: false, right: false, up: false, down: false, jump: false });

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Socket — only once user is in game
  const socketHook = useSocket({
    userId:   user?.id,
    username: profile?.username || 'Joueur',
    skinId:   activeSkin,
    worldId,
    enabled:  gameReady,
  });
  const { socket, connected, messages, sendChat, playerCount } = socketHook;

  // Sync profile coins/skin to game state once loaded
  useEffect(() => {
    if (profile) syncProfile(profile);
  }, [profile, syncProfile]);

  // ── Start game ───────────────────────────────────────────────────────────
  const handleJoin = useCallback((skinId) => {
    setGameReady(true);
    setSkin(skinId);
  }, [setSkin]);

  // ── Init Three.js engine once canvas + gameReady ─────────────────────────
  useEffect(() => {
    if (!gameReady || !canvasRef.current) return;

    const engine = new GameEngine({
      canvas: canvasRef.current,
      skinId: activeSkin,
      worldId,
      socket,
      onCollect: (key, val) => {
        addCoins(val);
        dbAddCoins(val);
        pushToast(`+${val} ${WORLDS[worldId]?.itemEmoji || '🪙'}`);
      },
      onWorldChange: (wid) => {
        setWorld(wid);
        pushToast(`🌀 Bienvenue en ${WORLDS[wid].label} !`);
      },
      onToast: pushToast,
      onItemProgress: (wid, collected, total) => {
        setItemProgress(wid, collected, total);
      },
      onWorldComplete: (wid) => {
        pushToast(`🎉 Monde complété ! Trouve le portail 🌀`);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameReady, socket]);

  // Pass dpad state to engine every render
  useEffect(() => {
    engineRef.current?.setDpad(dpad);
  }, [dpad]);

  // Sync skin changes to engine
  useEffect(() => {
    engineRef.current?.changeSkin(activeSkin);
  }, [activeSkin]);

  // ── Shop actions ─────────────────────────────────────────────────────────
  const handleBuy = useCallback(async (skinId) => {
    const ok = await buySkin(skinId);
    if (ok) pushToast(`✨ Skin ${skinId} débloqué !`);
  }, [buySkin, pushToast]);

  const handleEquip = useCallback(async (skinId) => {
    setSkin(skinId);
    await setActiveSkin(skinId);
    pushToast(`👕 Skin équipé !`);
  }, [setSkin, setActiveSkin, pushToast]);

  const handleTravel = useCallback((wid) => {
    engineRef.current?.travelToWorld(wid);
    setShowShop(false);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div style={{ fontFamily: "'Press Start 2P', monospace", color: '#00ff88', fontSize: '0.8rem' }}>
          Chargement…
        </div>
      </div>
    );
  }

  if (!gameReady) {
    return <Lobby onJoin={handleJoin} supabase={supabase} />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Three.js canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD */}
      <HUD
        coins={coins}
        worldId={worldId}
        skinId={activeSkin}
        connected={connected}
        onOpenShop={() => setShowShop(true)}
        itemProgress={itemProgress}
        playerCount={playerCount}
      />

      {/* Shop button (bottom center) */}
      <button onClick={() => setShowShop(true)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-2xl text-sm font-bold text-white transition hover:scale-105"
        style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', fontFamily: "'Nunito', sans-serif", backdropFilter: 'blur(4px)' }}>
        🛒 Boutique
      </button>

      {/* Mobile controls */}
      {IS_TOUCH && (
        <>
          <DPad onDpad={setDpad} />
          <JumpButton onDpad={setDpad} />
        </>
      )}

      {/* Chat */}
      <Chat messages={messages} onSend={sendChat} connected={connected} />

      {/* Toasts */}
      <Toast toasts={toasts} onPop={popToast} />

      {/* Shop overlay */}
      {showShop && (
        <Shop
          coins={coins}
          ownedSkins={profile?.ownedSkins || new Set(['default'])}
          activeSkin={activeSkin}
          currentWorldId={worldId}
          onBuy={handleBuy}
          onEquip={handleEquip}
          onTravel={handleTravel}
          onClose={() => setShowShop(false)}
        />
      )}

      {/* Controls hint */}
      {!IS_TOUCH && (
        <div className="absolute bottom-4 right-4 z-20 text-xs text-right"
          style={{ fontFamily: "'Nunito', sans-serif", color: 'rgba(255,255,255,0.35)' }}>
          WASD / ↑↓←→ · Espace = saut
        </div>
      )}

      {/* Tutorial overlay */}
      {showTutorial && gameReady && (
        <Tutorial onClose={() => setTutorial(false)} />
      )}
    </div>
  );
}
