import { useEffect } from 'react';

const DURATION = 2800;

export default function Toast({ toasts, onPop }) {
  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onPop={onPop} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onPop }) {
  useEffect(() => {
    const id = setTimeout(() => onPop(toast.id), DURATION);
    return () => clearTimeout(id);
  }, [toast.id, onPop]);

  return (
    <div className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold shadow-2xl animate-toast"
      style={{
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        fontFamily: "'Nunito', sans-serif",
        animation: 'toast-in 0.3s ease-out',
      }}>
      {toast.text}
    </div>
  );
}
