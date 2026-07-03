import { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, onSend, connected }) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="absolute bottom-20 left-3 z-30">
      {/* Toggle button */}
      <button onClick={() => setOpen(o => !o)}
        className="mb-1 px-3 py-1.5 rounded-xl text-xs text-white"
        style={{ background: 'rgba(0,0,0,0.7)', fontFamily: "'Nunito', sans-serif", backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
        💬 {open ? 'Fermer' : 'Chat'} {!open && messages.length > 0 && <span className="ml-1 bg-green-500 text-black rounded-full px-1 text-xs">{Math.min(messages.length, 9)}</span>}
      </button>

      {open && (
        <div className="w-64 rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}>
          {/* Message list */}
          <div ref={listRef} className="h-40 overflow-y-auto p-2 space-y-1 scroll-smooth">
            {messages.length === 0 && (
              <p className="text-gray-600 text-xs text-center pt-4" style={{ fontFamily: "'Nunito', sans-serif" }}>Pas encore de messages</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="text-xs leading-snug">
                <span className="text-green-400 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>{m.name}: </span>
                <span className="text-gray-200" style={{ fontFamily: "'Nunito', sans-serif" }}>{m.text}</span>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={submit} className="flex gap-1 p-2 border-t border-gray-800">
            <input value={text} onChange={e => setText(e.target.value)} disabled={!connected}
              placeholder={connected ? 'Message...' : 'Hors ligne'}
              className="flex-1 bg-gray-800 rounded-xl px-2 py-1 text-xs text-white outline-none"
              style={{ fontFamily: "'Nunito', sans-serif" }} />
            <button type="submit" disabled={!connected}
              className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded-xl text-xs disabled:opacity-40 transition">
              ↵
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
