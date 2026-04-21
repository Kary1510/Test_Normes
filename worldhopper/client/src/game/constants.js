// ─── TILEMAPS ────────────────────────────────────────────────────────────────
// 0=floor  1=wall  2=void/danger  3=portal  4=item

export const TILEMAPS = {
  forest: [
    "1111111111111111111111",
    "1000000010000000000011",
    "1011100010000110000011",
    "1000000000000100000011",
    "1022220000000100000011",
    "1022220001000000010011",
    "1000000001000000000011",
    "1001000000000000000031",
    "1001111000000100000011",
    "1000000000000100010011",
    "1010001100000000010011",
    "1000040000010000000011",
    "1000000004000000004011",
    "1000010000000000000011",
    "1111111111111111111111",
  ],
  space: [
    "1111111111111111111111",
    "1220000002000000002211",
    "1200000002000000000211",
    "1200111000000011100211",
    "1200111000000011100211",
    "1200000000000000000211",
    "1220000000000000000211",
    "1200040000000000004031",
    "1200000000000000000211",
    "1220000000000000000211",
    "1200111000000011100211",
    "1200111000000011100211",
    "1200000002000000000211",
    "1220000002000000002211",
    "1111111111111111111111",
  ],
  medieval: [
    "1111111111111111111111",
    "1000000001000000000011",
    "1011110001000001111011",
    "1010010001000001000011",
    "1010010000000001000011",
    "1011110000400001111011",
    "1000000000000000000011",
    "1000000000000000000031",
    "1000000000000000000011",
    "1001111100000111110011",
    "1001000100000100010011",
    "1001000040000100010011",
    "1001000100000100010011",
    "1001111100000111110011",
    "1111111111111111111111",
  ],
  volcano: [
    "1111111111111111111111",
    "1000000000000000000011",
    "1022200000100000000011",
    "1002200001100000222011",
    "1000200001100000200011",
    "1000000001100000000011",
    "1000000000000400000011",
    "1000000000000000000031",
    "1000400000000000000011",
    "1000000000011100000011",
    "1000002200001100000011",
    "1000002200000000000011",
    "1000000000000000400011",
    "1000000100000001000011",
    "1111111111111111111111",
  ],
};

// ─── WORLDS ──────────────────────────────────────────────────────────────────
export const WORLDS = {
  forest: {
    id: "forest",
    label: "🌲 Forêt Enchantée",
    tilemap: TILEMAPS.forest,
    // floor/wall colors
    fc: 0x3a7d44,   // floor green
    wc: 0x1a4a1f,   // wall dark green
    // sky / fog
    sky: 0x1a3a1a,
    fog: 0x1a3a1a,
    fogDensity: 0.04,
    // ambient & sun
    amb: 0x3a5c2a,
    sun: 0xffcc88,
    sunInt: 1.2,
    // portal color, item color, item emoji, item value
    pc: 0x00ff88,
    ic: 0xffee44,
    pcHex: "#00ff88",
    itemEmoji: "⭐",
    itemValue: 5,
    // void is just missing floor (space below)
    voidDanger: false,
    nextWorld: "space",
  },
  space: {
    id: "space",
    label: "🚀 Station Galactique",
    tilemap: TILEMAPS.space,
    fc: 0x1a2a4a,
    wc: 0x0a0a1a,
    sky: 0x050510,
    fog: 0x050510,
    fogDensity: 0.025,
    amb: 0x0a1a3a,
    sun: 0x4488ff,
    sunInt: 0.8,
    pc: 0x4488ff,
    ic: 0x00ffff,
    pcHex: "#4488ff",
    itemEmoji: "💎",
    itemValue: 10,
    voidDanger: true,
    nextWorld: "medieval",
  },
  medieval: {
    id: "medieval",
    label: "⚔️ Royaume du Roi",
    tilemap: TILEMAPS.medieval,
    fc: 0x9c7a3a,
    wc: 0x4a3a1a,
    sky: 0x8a6a3a,
    fog: 0x8a6a3a,
    fogDensity: 0.035,
    amb: 0x5a4a2a,
    sun: 0xffaa44,
    sunInt: 1.4,
    pc: 0xffaa00,
    ic: 0xffd700,
    pcHex: "#ffaa00",
    itemEmoji: "👑",
    itemValue: 15,
    voidDanger: false,
    nextWorld: "volcano",
  },
  volcano: {
    id: "volcano",
    label: "🌋 Monde de Feu",
    tilemap: TILEMAPS.volcano,
    fc: 0x4a1a0a,
    wc: 0x1a0a00,
    sky: 0x1a0500,
    fog: 0x2a0800,
    fogDensity: 0.045,
    amb: 0x3a1000,
    sun: 0xff4400,
    sunInt: 1.6,
    pc: 0xff4400,
    ic: 0xffaa00,
    pcHex: "#ff4400",
    itemEmoji: "💰",
    itemValue: 20,
    voidDanger: true,
    nextWorld: "forest",
  },
};

export const WORLD_ORDER = ["forest", "space", "medieval", "volcano"];

// ─── SKINS ───────────────────────────────────────────────────────────────────
export const SKINS = {
  default: { id: "default", emoji: "🧑", cost: 0,   rarity: "common",    color: 0x4488ff, hex: "#4488ff" },
  wizard:  { id: "wizard",  emoji: "🧙", cost: 60,  rarity: "rare",      color: 0x9955ee, hex: "#9955ee" },
  robot:   { id: "robot",   emoji: "🤖", cost: 100, rarity: "rare",      color: 0x00ccff, hex: "#00ccff" },
  ninja:   { id: "ninja",   emoji: "🥷", cost: 160, rarity: "epic",      color: 0x444466, hex: "#444466" },
  knight:  { id: "knight",  emoji: "🧝", cost: 220, rarity: "epic",      color: 0x8899cc, hex: "#8899cc" },
  witch:   { id: "witch",   emoji: "🧟", cost: 300, rarity: "legendary", color: 0x880088, hex: "#880088" },
  dragon:  { id: "dragon",  emoji: "🐲", cost: 450, rarity: "legendary", color: 0xff3300, hex: "#ff3300" },
};

export const SKIN_ORDER = ["default", "wizard", "robot", "ninja", "knight", "witch", "dragon"];

export const RARITY_COLORS = {
  common:    { bg: "bg-gray-700",   text: "text-gray-300",   border: "border-gray-500" },
  rare:      { bg: "bg-blue-900",   text: "text-blue-300",   border: "border-blue-500" },
  epic:      { bg: "bg-purple-900", text: "text-purple-300", border: "border-purple-500" },
  legendary: { bg: "bg-yellow-900", text: "text-yellow-300", border: "border-yellow-500" },
};

// ─── PHYSICS ─────────────────────────────────────────────────────────────────
export const GRAVITY       = -0.014;
export const JUMP_SPEED    = 0.22;
export const MOVE_SPEED    = 0.10;
export const TILE_SIZE     = 1;
export const PLAYER_RADIUS = 0.30;
export const RESPAWN_Y     = -5;

// ─── SOCKET EVENTS ───────────────────────────────────────────────────────────
export const EV = {
  JOIN:    "player:join",
  MOVE:    "player:move",
  COLLECT: "player:collect",
  WORLD:   "player:world",
  LEAVE:   "player:leave",
  CHAT:    "chat:message",
  STATE:   "world:state",
};
