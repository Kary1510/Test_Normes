import { WORLDS, SKINS } from '../game/constants.js';

export default function HUD({ coins, worldId, skinId, connected, onOpenShop }) {
  const world = WORLDS[worldId] || WORLDS.forest;
  const skin  = SKINS[skinId]   || SKINS.default;

  return (
    <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 pointer-events-none">
      {/* Left: world + coins */}
      <div className="flex flex-col gap-2">
        {/* World badge */}
        <div className="hud-pill" style={{ borderColor: world.pcHex }}>
          <span className="text-base">{world.label.split(' ')[0]}</span>
          <span className="text-xs" style={{ fontFamily: "'Nunito', sans-serif", color: world.pcHex }}>
            {world.label.slice(world.label.indexOf(' ') + 1)}
          </span>
        </div>

        {/* Coins */}
        <div className="hud-pill" style={{ borderColor: '#fbbf24' }}>
          <span className="text-sm">🪙</span>
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#fbbf24' }}>
            {coins}
          </span>
        </div>
      </div>

      {/* Right: skin + shop button */}
      <div className="flex flex-col items-end gap-2">
        {/* Active skin */}
        <div className="hud-pill pointer-events-auto cursor-pointer" onClick={onOpenShop}
          style={{ borderColor: skin.hex }}>
          <span className="text-lg">{skin.emoji}</span>
          <span className="text-xs capitalize" style={{ fontFamily: "'Nunito', sans-serif", color: skin.hex }}>
            {skin.id}
          </span>
        </div>

        {/* Multiplayer dot */}
        <div className="hud-pill" style={{ borderColor: connected ? '#22c55e' : '#ef4444' }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: connected ? '#22c55e' : '#ef4444' }} />
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
          background: rgba(0,0,0,0.7);
          border: 1px solid;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          pointer-events: auto;
        }
      `}</style>
    </div>
  );
}
