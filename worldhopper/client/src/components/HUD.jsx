import { WORLDS, SKINS } from '../game/constants.js';

export default function HUD({ coins, worldId, skinId, connected, onOpenShop, itemProgress, playerCount }) {
  const world    = WORLDS[worldId] || WORLDS.forest;
  const skin     = SKINS[skinId]   || SKINS.default;
  const progress = itemProgress?.[worldId] || { collected: 0, total: 0 };
  const pct      = progress.total > 0 ? Math.round(progress.collected / progress.total * 100) : 0;
  const complete = progress.total > 0 && progress.collected >= progress.total;

  return (
    <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 pointer-events-none">

      {/* ─── Left column ─── */}
      <div className="flex flex-col gap-2">

        {/* World badge */}
        <div className="hud-pill" style={{ borderColor: world.pcHex }}>
          <span className="text-base">{world.label.split(' ')[0]}</span>
          <span className="text-xs" style={{ fontFamily: "'Nunito', sans-serif", color: world.pcHex }}>
            {world.label.slice(world.label.indexOf(' ') + 1)}
          </span>
        </div>

        {/* Item progress */}
        {progress.total > 0 && (
          <div className="hud-pill" style={{
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 4,
            minWidth: 120,
            borderColor: complete ? '#fbbf24' : 'rgba(255,255,255,0.2)',
            boxShadow: complete ? '0 0 10px rgba(251,191,36,0.4)' : 'none',
          }}>
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm">{world.itemEmoji}</span>
              <span style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '0.55rem',
                color: complete ? '#fbbf24' : '#e5e7eb',
                flex: 1,
              }}>
                {progress.collected}/{progress.total}
              </span>
              {complete && <span className="text-xs text-yellow-400">✓ COMPLET</span>}
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: complete ? '#fbbf24' : world.pcHex,
                borderRadius: 2,
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        )}

        {/* Coins */}
        <div className="hud-pill" style={{ borderColor: '#fbbf24' }}>
          <span className="text-sm">🪙</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#fbbf24' }}>
            {coins}
          </span>
        </div>
      </div>

      {/* ─── Right column ─── */}
      <div className="flex flex-col items-end gap-2">

        {/* Active skin (opens shop) */}
        <div className="hud-pill pointer-events-auto cursor-pointer" onClick={onOpenShop}
          style={{ borderColor: skin.hex }}>
          <span className="text-lg">{skin.emoji}</span>
          <span className="text-xs capitalize" style={{ fontFamily: "'Nunito', sans-serif", color: skin.hex }}>
            {skin.id}
          </span>
        </div>

        {/* Players online */}
        {playerCount > 0 && (
          <div className="hud-pill" style={{ borderColor: '#22c55e' }}>
            <span className="text-sm">👥</span>
            <span className="text-xs" style={{ fontFamily: "'Nunito', sans-serif", color: '#86efac' }}>
              {playerCount} joueur{playerCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Connection status */}
        <div className="hud-pill" style={{ borderColor: connected ? '#22c55e' : '#ef4444' }}>
          <span className="w-2 h-2 rounded-full inline-block"
            style={{ background: connected ? '#22c55e' : '#ef4444' }} />
          <span className="text-xs" style={{ fontFamily: "'Nunito', sans-serif", color: '#9ca3af' }}>
            {connected ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
      </div>

      <style>{`
        .hud-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.72);
          border: 1px solid;
          border-radius: 999px;
          backdrop-filter: blur(8px);
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
