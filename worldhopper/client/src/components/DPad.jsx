import { useCallback } from 'react';

const BTN = 'select-none flex items-center justify-center rounded-xl text-white text-lg font-bold transition active:scale-95';
const STYLE = { background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', width: 52, height: 52 };

export default function DPad({ onDpad }) {
  const press   = useCallback((dir, val) => onDpad(d => ({ ...d, [dir]: val })), [onDpad]);
  const bind    = (dir) => ({
    onPointerDown: (e) => { e.preventDefault(); press(dir, true); },
    onPointerUp:   (e) => { e.preventDefault(); press(dir, false); },
    onPointerLeave:(e) => { e.preventDefault(); press(dir, false); },
  });

  return (
    <div className="absolute bottom-4 left-4 z-30 select-none">
      {/* 3×3 D-pad grid */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 52px)', gap: 4 }}>
        <div />
        <button className={BTN} style={STYLE} {...bind('up')}>▲</button>
        <div />

        <button className={BTN} style={STYLE} {...bind('left')}>◀</button>
        <div style={{ ...STYLE, background: 'rgba(255,255,255,0.04)', borderRadius: 12 }} />
        <button className={BTN} style={STYLE} {...bind('right')}>▶</button>

        <div />
        <button className={BTN} style={STYLE} {...bind('down')}>▼</button>
        <div />
      </div>
    </div>
  );
}

export function JumpButton({ onDpad }) {
  const bind = {
    onPointerDown: (e) => { e.preventDefault(); onDpad(d => ({ ...d, jump: true })); },
    onPointerUp:   (e) => { e.preventDefault(); onDpad(d => ({ ...d, jump: false })); },
    onPointerLeave:(e) => { e.preventDefault(); onDpad(d => ({ ...d, jump: false })); },
  };

  return (
    <button className="absolute bottom-4 right-4 z-30 select-none flex items-center justify-center rounded-full text-2xl font-bold text-white active:scale-95 transition"
      style={{ width: 68, height: 68, background: 'rgba(0, 200, 120, 0.25)', border: '2px solid rgba(0, 255, 150, 0.5)', backdropFilter: 'blur(4px)' }}
      {...bind}>
      ⬆
    </button>
  );
}
