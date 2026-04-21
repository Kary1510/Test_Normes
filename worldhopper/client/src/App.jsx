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

// Detect touch device
const IS_TOUCH = 'ontouchstart' in window;

export default function App() {
  const supabase = useSupabase();
  const { user, profile, loading, addCoins: dbAddCoins, buySkin, setActiveSkin } = supabase;

  const { state, setWorld, addCoins, setSkin, setTab, pushToast, popToast, syncProfile } = useGame();
  const { worldId, coins, activeSkin, toasts, tab } = state;

  const [gameReady, setGameReady] = useState(false);
  const [showShop,  setShowShop]  = useState(false);
  const [dpad,      setDpad]      = useState({ left: false, right: false, up: false, down: false, jump: false });

  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  // Socket — only once user is in game
  const socketHook = useSocket({
    userId:  user?.id,
    username: profile?.username || 'Joueur',
    skinId:  activeSkin,
    worldId,
    enabled: gameReady,
  });
  const { socket, connected, messages, sendChat } = socketHook;

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
        pushToast(`+${val} 🪙`);
      },
      onWorldChange: (wid) => {
        setWorld(wid);
        pushToast(`🌀 Bienvenue en ${WORLDS[wid].label} !`);
      },
      onToast: pushToast,
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  // We only want to (re)init when gameReady flips or socket connects
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
    if (ok) {
      pushToast(`✨ Skin ${skinId} débloqué !`);
    }
  }, [buySkin, pushToast]);

  const handleEquip = useCallback(async (skinId) => {
    setSkin(skinId);
    await setActiveSkin(skinId);
    pushToast(`👕 Skin ${skinId} équipé !`);
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
        <div className="absolute bottom-4 right-4 z-20 text-xs text-gray-600 text-right"
          style={{ fontFamily: "'Nunito', sans-serif" }}>
          WASD / ↑↓←→ déplacer · Espace sauter
        </div>
      )}
    </div>
  );
}
