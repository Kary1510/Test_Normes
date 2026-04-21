import { SKINS, SKIN_ORDER, RARITY_COLORS, WORLDS, WORLD_ORDER } from '../game/constants.js';

export default function Shop({ coins, ownedSkins, activeSkin, onBuy, onEquip, onTravel, onClose, currentWorldId }) {
  const ownedSet = ownedSkins instanceof Set ? ownedSkins : new Set(ownedSkins || ['default']);

  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '1rem', color: '#fbbf24' }}>
          🛒 Boutique
        </h2>
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: '#fbbf24' }}>
            🪙 {coins}
          </span>
          <button onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition">✕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Skins grid */}
        <section>
          <h3 className="text-sm text-gray-300 mb-3" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
            Skins de personnage
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {SKIN_ORDER.map(id => {
              const skin   = SKINS[id];
              const owned  = ownedSet.has(id);
              const active = activeSkin === id;
              const can    = !owned && coins >= skin.cost;
              const rc     = RARITY_COLORS[skin.rarity];

              return (
                <div key={id}
                  className={`relative rounded-2xl p-3 border-2 flex flex-col items-center gap-2 transition ${rc.bg} ${active ? 'border-yellow-400' : rc.border} ${owned ? 'opacity-100' : 'opacity-80'}`}>
                  {/* Rarity badge */}
                  <span className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full ${rc.text}`}
                    style={{ fontFamily: "'Nunito', sans-serif", fontSize: '0.6rem', fontWeight: 700 }}>
                    {skin.rarity}
                  </span>

                  <span className="text-4xl">{skin.emoji}</span>
                  <span className="text-white text-sm font-bold capitalize" style={{ fontFamily: "'Nunito', sans-serif" }}>{id}</span>

                  {/* Price or owned */}
                  {owned ? (
                    <button onClick={() => onEquip(id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${active ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                      style={{ fontFamily: "'Nunito', sans-serif" }}>
                      {active ? '✓ Équipé' : 'Équiper'}
                    </button>
                  ) : (
                    <button onClick={() => onBuy(id)} disabled={!can}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${can ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
                      style={{ fontFamily: "'Nunito', sans-serif" }}>
                      🪙 {skin.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* World travel */}
        <section>
          <h3 className="text-sm text-gray-300 mb-3" style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>
            Téléportation
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {WORLD_ORDER.map(wid => {
              const w = WORLDS[wid];
              const isCurrent = wid === currentWorldId;
              return (
                <button key={wid} onClick={() => !isCurrent && onTravel(wid)} disabled={isCurrent}
                  className={`p-4 rounded-2xl border-2 text-left transition ${isCurrent ? 'border-green-400 bg-green-900 bg-opacity-30' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                  <div className="text-2xl mb-1">{w.label.split(' ')[0]}</div>
                  <div className="text-sm text-white font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {w.label.slice(w.label.indexOf(' ') + 1)}
                  </div>
                  <div className="text-xs mt-1" style={{ color: w.pcHex, fontFamily: "'Nunito', sans-serif" }}>
                    {w.itemEmoji} +{w.itemValue} pièces par item
                  </div>
                  {isCurrent && (
                    <span className="text-xs text-green-400 mt-1 block" style={{ fontFamily: "'Nunito', sans-serif" }}>← Vous êtes ici</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
