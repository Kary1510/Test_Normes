import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { addPlayer, updatePlayer, removePlayer, getPlayer, getPlayersInWorld } from './players.js';
import { markCollected, getWorldState, getRoomName } from './rooms.js';

const PORT       = process.env.PORT       || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app    = express();
const server = createServer(app);
const io     = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, players: getPlayersInWorld('forest').length }));

// ── Socket events ─────────────────────────────────────────────────────────
const EV = {
  JOIN:    'player:join',
  MOVE:    'player:move',
  COLLECT: 'player:collect',
  WORLD:   'player:world',
  LEAVE:   'player:leave',
  CHAT:    'chat:message',
  STATE:   'world:state',
};

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id} connected`);

  // ── Join ────────────────────────────────────────────────────────────────
  socket.on(EV.JOIN, (data) => {
    const worldId = data.worldId || 'forest';
    addPlayer(socket.id, { worldId, skinId: data.skinId || 'default', name: data.name || 'Joueur' });

    // Join Socket.io room
    socket.join(getRoomName(worldId));

    // Send current world state (collected items) to this player
    socket.emit(EV.STATE, getWorldState(worldId));

    // Broadcast to others in same world
    socket.to(getRoomName(worldId)).emit(EV.JOIN, { id: socket.id, ...data });

    console.log(`[~] ${socket.id} joined world ${worldId}`);
  });

  // ── Move ─────────────────────────────────────────────────────────────────
  socket.on(EV.MOVE, (data) => {
    const p = getPlayer(socket.id);
    if (!p) return;
    updatePlayer(socket.id, { x: data.x, y: data.y, z: data.z, rotY: data.rotY });
    // Broadcast to same world only
    socket.to(getRoomName(p.worldId)).emit(EV.MOVE, { id: socket.id, ...data, worldId: p.worldId });
  });

  // ── Collect ───────────────────────────────────────────────────────────────
  socket.on(EV.COLLECT, (data) => {
    const p = getPlayer(socket.id);
    if (!p) return;
    markCollected(p.worldId, data.itemKey);
    // Tell all others in world to remove this item
    socket.to(getRoomName(p.worldId)).emit(EV.COLLECT, { id: socket.id, itemKey: data.itemKey });
  });

  // ── World change ──────────────────────────────────────────────────────────
  socket.on(EV.WORLD, (data) => {
    const p = getPlayer(socket.id);
    if (!p) return;

    // Leave old room
    socket.leave(getRoomName(p.worldId));
    socket.to(getRoomName(p.worldId)).emit(EV.WORLD, { id: socket.id, worldId: data.worldId });

    // Update player world
    updatePlayer(socket.id, { worldId: data.worldId });

    // Join new room
    socket.join(getRoomName(data.worldId));
    socket.emit(EV.STATE, getWorldState(data.worldId));

    console.log(`[~] ${socket.id} → world ${data.worldId}`);
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on(EV.CHAT, (data) => {
    const p = getPlayer(socket.id);
    const msg = {
      id:   socket.id,
      name: p?.name || data.name || 'Joueur',
      text: String(data.text || '').slice(0, 200),
      ts:   Date.now(),
    };
    // Broadcast to all
    io.emit(EV.CHAT, msg);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const p = getPlayer(socket.id);
    if (p) {
      socket.to(getRoomName(p.worldId)).emit(EV.LEAVE, { id: socket.id });
    }
    removePlayer(socket.id);
    console.log(`[-] ${socket.id} disconnected`);
  });

  socket.on(EV.LEAVE, () => {
    const p = getPlayer(socket.id);
    if (p) socket.to(getRoomName(p.worldId)).emit(EV.LEAVE, { id: socket.id });
    removePlayer(socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`WorldHopper server running on :${PORT}`);
});
