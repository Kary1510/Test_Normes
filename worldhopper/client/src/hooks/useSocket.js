import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { EV } from '../game/constants.js';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket({ userId, username, skinId, worldId, enabled = true }) {
  const socketRef = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [players,   setPlayers]     = useState({});
  const [messages,  setMessages]    = useState([]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit(EV.JOIN, { id: socket.id, worldId, skinId, name: username });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on(EV.MOVE, (data) => {
      setPlayers(prev => ({ ...prev, [data.id]: data }));
    });

    socket.on(EV.LEAVE, (data) => {
      setPlayers(prev => {
        const next = { ...prev };
        delete next[data.id];
        return next;
      });
    });

    socket.on(EV.WORLD, (data) => {
      // Player moved to another world — remove from current list
      setPlayers(prev => {
        if (prev[data.id]?.worldId === worldId && data.worldId !== worldId) {
          const next = { ...prev };
          delete next[data.id];
          return next;
        }
        return prev;
      });
    });

    socket.on(EV.CHAT, (msg) => {
      setMessages(prev => [...prev.slice(-49), msg]);
    });

    return () => {
      socket.emit(EV.LEAVE, { id: socket.id });
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  // We intentionally run once on mount with initial values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, userId]);

  const sendChat = (text) => {
    if (!socketRef.current || !text.trim()) return;
    socketRef.current.emit(EV.CHAT, { id: socketRef.current.id, name: username, text, ts: Date.now() });
  };

  return { socket: socketRef.current, connected, players, messages, sendChat };
}
