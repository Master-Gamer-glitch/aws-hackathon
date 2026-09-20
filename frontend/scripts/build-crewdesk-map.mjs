// Generates the CrewDesk floor plan:
//   public/munder-assets/maps/crewdesk-office.tmj              (Tiled map rendered by the live engine)
//   src/live-office/scene/office/crewdeskLayout.json           (seats, stations, errands, signs, doorways…)
//
//   node scripts/build-crewdesk-map.mjs && node scripts/check-crewdesk-map.mjs
//
// The office is a real Tiled map rendered by the live engine (TiledMapRenderer): floors, walls, furniture
// and collision are tile layers; spawn points + zones are object layers. Everything is assembled from the
// project's EXISTING tilesets (office-tileset / a5 floors+walls / interiors) — either by copying furniture
// "stamps" out of the original office.tmj (desks, café, plants…) or by addressing tile rectangles in the
// atlases. Nothing here is an image of the office.
//
// Floor plan (48 x 38 tiles), three tiers of nine-ish rows:
//
//        CODER          LEAD (command center)       DESIGN
//        RAG              MEETING                     QA
//        LAUNCH           LOUNGE  (entrance)          SERVERS
//
// Every prop answers one question: does it show what this team does, or does it make the office lived-in?
// Corridors only carry 1-wide props on the wall side, so walking lanes stay clear.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapsDir = path.join(root, 'public/munder-assets/maps');
const layoutOut = path.join(root, 'src/live-office/scene/office/crewdeskLayout.json');
const src = JSON.parse(fs.readFileSync(path.join(mapsDir, 'office.tmj'), 'utf8'));

const W = 48, H = 38, TS = 16;
const mk = () => new Array(W * H).fill(0);
const L = { floor: mk(), walls: mk(), below: mk(), above: mk(), col: mk() };
const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
const put = (layer, x, y, g) => { if (inb(x, y)) L[layer][y * W + x] = g; };
const block = (x, y, v = 1) => { if (inb(x, y)) L.col[y * W + x] = v; };

// ── atlas addressing ─────────────────────────────────────────────────────────
const BASE = { office: 1, a5: 513, interiors: 1025 };
const gidOf = (atlas, r, c) => BASE[atlas] + r * 16 + c;

/** Copy an atlas rectangle (rows r.., cols c..) to the map at (x, y).
 *  collide: 'all' | 'bottom' (last row only) | 'none' */
function rect(atlas, r, c, w, h, x, y, layer = 'below', collide = 'all') {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    put(layer, x + i, y + j, gidOf(atlas, r + j, c + i));
    if (collide === 'all' || (collide === 'bottom' && j === h - 1)) block(x + i, y + j);
  }
}

// ── stamps lifted from the original map ─────────────────────────────────────
const SW = src.width;
const SL = Object.fromEntries(src.layers.map((l) => [l.name, l]));
const srcAt = (layer, x, y) => (SL[layer].data[y * SW + x] & 0x1fffffff);
function stamp(sx, sy, w, h, dx, dy, { collision = true } = {}) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const b = srcAt('furniture-below', sx + i, sy + j);
    const a = srcAt('furniture-above', sx + i, sy + j);
    const c = srcAt('collision', sx + i, sy + j);
    if (b) put('below', dx + i, dy + j, b);
    if (a) put('above', dx + i, dy + j, a);
    if (collision && c) block(dx + i, dy + j);
  }
}

// ── floors ───────────────────────────────────────────────────────────────────
const sage = (x, y) => 783 + ((x + 1) % 2) + 16 * ((y + 1) % 2);
for (let y = 3; y <= H - 2; y++) for (let x = 1; x <= W - 2; x++) put('floor', x, y, sage(x, y));
/** Warm tan carpet (a5 atlas, row 16 col 8 block) over a rectangle. */
function carpet(x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    put('floor', x, y, gidOf('a5', 16, 8) + ((x - x0) % 2) + 16 * ((y - y0) % 2));
  }
}

// ── walls ────────────────────────────────────────────────────────────────────
const WALL = { cap: 522, face: 554, base: 570, vTop: 611, vBody: 643, left: 530, right: 533,
  tl: 514, tr: 517, bl: 578, bm: 579, br: 581 };
const wall = (x, y, g) => { put('walls', x, y, g); block(x, y); };
function hBand(x0, x1, y) {
  for (let x = x0; x <= x1; x++) { wall(x, y, WALL.cap); wall(x, y + 1, WALL.face); wall(x, y + 2, WALL.base); }
}
function vWall(x, y0, y1, gaps = []) {
  for (let y = y0; y <= y1; y++) {
    if (gaps.some(([a, b]) => y >= a && y <= b)) continue;
    wall(x, y, y === y0 ? WALL.vTop : WALL.vBody);
  }
}

// Tiers (rows):  T1 3..11 | band 12..14 | T2 15..23 | band 24..26 | T3 27..36 | bottom wall 37
// Columns:       rooms 1..13 | wall 14 | corridor 15..17 | wall 18 | meeting 19..28 | wall 29 | corridor 30..32 | wall 33 | rooms 34..46
const DOORS_L = [[9, 10], [19, 20], [31, 32]];      // gaps in wall x=14
const DOORS_R = [[9, 10], [19, 20], [28, 29]];      // gaps in wall x=33 (servers door sits above the kitchenette)

for (let x = 1; x < W - 1; x++) { wall(x, 0, WALL.cap); wall(x, 1, WALL.face); wall(x, 2, WALL.base); }
wall(0, 0, WALL.tl); wall(W - 1, 0, WALL.tr);
for (let y = 1; y <= H - 2; y++) { wall(0, y, WALL.left); wall(W - 1, y, WALL.right); }
wall(0, H - 1, WALL.bl); wall(W - 1, H - 1, WALL.br);
for (let x = 1; x < W - 1; x++) { if (x === 23 || x === 24) continue; wall(x, H - 1, WALL.bm); }   // entrance gap 23-24

vWall(14, 3, H - 2, DOORS_L);
vWall(33, 3, H - 2, DOORS_R);
hBand(1, 13, 12); hBand(1, 13, 24);      // coder/rag, rag/launch
hBand(34, 46, 12); hBand(34, 46, 24);    // design/qa, qa/servers
hBand(18, 22, 12); hBand(25, 29, 12);    // meeting room top    (gap 23-24)
hBand(18, 22, 24); hBand(25, 29, 24);    // meeting room bottom (gap 23-24)
vWall(18, 15, 23, [[19, 20]]);
vWall(29, 15, 23, [[19, 20]]);

// ── prefab library ──────────────────────────────────────────────────────────
const spawns = [];
const spawn = (name, x, y) => spawns.push({ name, x, y });

/** A desk with monitor. (sx, sy) is the SEAT tile: monitor sy-2..sy-1, desktop sy-1, legs+chair sy, chair tail sy+1. */
function desk(sx, sy) {
  for (let i = -1; i <= 1; i++) put('below', sx + i, sy - 1, [2, 3, 4][i + 1]);
  put('above', sx, sy - 2, 365); put('above', sx + 1, sy - 2, 366);
  put('above', sx, sy - 1, 381); put('above', sx + 1, sy - 1, 382);
  for (let i = -1; i <= 1; i++) put('above', sx + i, sy, [18, 19, 20][i + 1]);
  put('below', sx, sy, 289); put('below', sx, sy + 1, 305);
  for (let i = -1; i <= 1; i++) block(sx + i, sy - 1);
  block(sx, sy - 2); block(sx + 1, sy - 2);
  block(sx - 1, sy); block(sx + 1, sy);
}
const plant = (x, y) => { put('above', x, y, 452); put('below', x, y + 1, 468); block(x, y + 1); };   // pot on row y+1
const windowAt = (x, y) => { put('above', x, y, 343); put('above', x + 1, y, 344); };
const cooler2 = (x, y) => stamp(31, 2, 2, 2, x, y);                                                // water cooler + bin
const roundTable = (x, y) => stamp(27, 14, 2, 3, x, y);                                            // 2x3 table with four stools

// named atlas props: [atlas, row, col, w, h]
const P = {
  chalk: ['office', 26, 0, 2, 2], chart: ['office', 26, 2, 2, 2], pie: ['office', 26, 4, 2, 2],
  bars: ['office', 26, 6, 2, 2], pieBig: ['office', 28, 0, 2, 2],
  printerA: ['office', 26, 11, 2, 2], printerB: ['office', 26, 13, 2, 2],
  boxC: ['office', 28, 10, 2, 2],
  grayOpen: ['office', 8, 11, 2, 3], grayFiles: ['office', 8, 13, 2, 3], woodShelf: ['office', 6, 13, 2, 2],
  woodBooks: ['office', 9, 8, 3, 2], cabinet: ['office', 2, 5, 2, 2], workbench: ['office', 2, 0, 3, 2],
  counterWood: ['office', 0, 8, 3, 2],
  benchWood: ['office', 18, 4, 2, 2], lowTable: ['office', 20, 0, 2, 2],
  monBlue: ['office', 22, 14, 2, 2], pcBlack: ['office', 22, 8, 2, 2], pcBlue: ['office', 22, 10, 2, 2],
  screenFold: ['office', 24, 10, 2, 2],
  rackWide: ['office', 11, 12, 2, 3], rackWideB: ['office', 11, 14, 2, 3],
  rack1: ['office', 11, 8, 1, 3], rack2: ['office', 11, 9, 1, 3], rack3: ['office', 11, 10, 1, 3], rack4: ['office', 11, 11, 1, 3],
  armF: ['office', 16, 0, 1, 1], armS: ['office', 16, 2, 1, 1],
  cooler: ['office', 16, 9, 1, 2],
  smallScrA: ['office', 30, 7, 1, 1], smallScrB: ['office', 31, 7, 1, 1],
  globe: ['interiors', 36, 13, 1, 2], cork: ['interiors', 41, 0, 2, 1], readDesk: ['interiors', 36, 5, 2, 2],
  palm: ['interiors', 44, 13, 2, 3],
  libA: ['interiors', 68, 10, 2, 3], libB: ['interiors', 68, 12, 2, 3], libC: ['interiors', 68, 14, 2, 3],
  sofaTan: ['interiors', 72, 7, 3, 2], sofaMaroon: ['interiors', 18, 8, 2, 2], armMaroon: ['interiors', 18, 10, 1, 2],
  lampBlue: ['interiors', 53, 12, 1, 3], stool: ['interiors', 13, 6, 1, 1],
  matTan: ['office', 30, 2, 2, 1], matBlue: ['office', 30, 4, 2, 1], matTeal: ['office', 30, 0, 2, 1],
};
/** Place a named prefab. Wall art → layer 'above', collide 'none'; floor props default to solid. */
function prop(name, x, y, { layer = 'below', collide = 'all' } = {}) {
  const [a, r, c, w, h] = P[name];
  rect(a, r, c, w, h, x, y, layer, collide);
}
const wallArt = (name, x, y) => prop(name, x, y, { layer: 'above', collide: 'none' });
const shelf = (name, x, y) => prop(name, x, y, { collide: 'bottom' });        // tall prop against a wall: only its foot is solid

// ── layout data (shared with the engine theme) ──────────────────────────────
const homeSeats = { lead: 'desk-lead', coder: 'desk-coder', design: 'desk-design', research: 'desk-rag', qa: 'desk-qa', marketing: 'desk-launch' };
const seatTiles = {};        // spawn name → [x, y]
const extraSeats = [];       // spawn names of spare workstations (excluding the server-room consoles)
const serverSeats = [];
function workRoom(prefix, seats) {
  seats.forEach(([sx, sy], i) => {
    desk(sx, sy);
    const name = i === 0 ? `desk-${prefix}` : `desk-${prefix}-${i + 1}`;
    spawn(name, sx, sy); seatTiles[name] = [sx, sy];
    if (prefix === 'servers') serverSeats.push(name);
    else if (i > 0) extraSeats.push(name);
  });
}

// ════════════════════════════ TIER 1 ═══════════════════════════════════════
// CODER — engineering: five workstations, technical shelf, network cabinets, planning board, printer
workRoom('coder', [[3, 6], [7, 6], [11, 6], [5, 10], [9, 10]]);
wallArt('bars', 1, 1);                       // engineering planning board
windowAt(10, 2);
shelf('woodShelf', 12, 2);                   // technical bookshelf
plant(1, 3);
prop('rack1', 1, 5);                         // network cabinet
prop('rack2', 13, 4);                        // cabinet on the east wall
plant(13, 7);
prop('printerA', 1, 9);                      // build-log printer
wallArt('smallScrA', 12, 1); wallArt('smallScrB', 13, 1);   // code / terminal screens

// DESIGN — studio: four workstations, colour boards, collaboration table, mood-board partition
workRoom('design', [[36, 6], [42, 6], [39, 10], [45, 10]]);
cooler2(34, 2);
windowAt(36, 2);
wallArt('pieBig', 43, 1);                    // colour / palette board
wallArt('pie', 45, 1);                       // mockup board
plant(46, 3); plant(34, 7);
carpet(34, 9, 37, 11);
roundTable(35, 9);                           // small round collaboration table
prop('workbench', 41, 9);                     // creative desk
wallArt('pcBlue', 41, 8);                    // mockup display on the creative desk

// COMMAND CENTER — the anchor: a bank of three monitor desks + two support stations, mission / DAG boards
carpet(17, 4, 30, 11);
workRoom('lead', [[23, 6], [20, 6], [26, 6], [20, 10], [26, 10]]);
wallArt('chart', 16, 1);                     // DAG display
wallArt('pieBig', 29, 1);                    // mission board
wallArt('bars', 31, 1);                      // status display
windowAt(18, 2); windowAt(27, 2);
put('above', 20, 2, 370);                    // wall clock (also the CLOSING TIME button)
plant(15, 3); plant(32, 3);
prop('rack1', 15, 5); prop('rack2', 32, 5); // utility cabinets on the corridor walls
prop('printerB', 16, 4);                     // mission printout
prop('cabinet', 29, 4);                      // storage
prop('workbench', 16, 8);                    // planning table
plant(16, 10);
prop('boxC', 30, 9);                         // supplies
prop('palm', 30, 6);                         // command-center palm

// ════════════════════════════ TIER 2 ═══════════════════════════════════════
// RAG — research: three workstations, walls of books, reading corner, knowledge board
workRoom('rag', [[4, 18], [10, 18], [7, 22]]);
shelf('libA', 1, 13); shelf('libB', 3, 13); shelf('libC', 10, 13);   // floor-to-wall library shelves
wallArt('chart', 12, 13);                    // knowledge board
plant(13, 15);
plant(1, 17); plant(13, 17);
carpet(1, 20, 5, 23);
prop('readDesk', 3, 21);                     // reading desk with an open book
prop('globe', 2, 21);                        // reference globe
prop('grayFiles', 11, 21);                   // document / reference shelf

// QA — review & testing: four workstations, checklist + bug boards, equipment shelf
workRoom('qa', [[36, 18], [42, 18], [39, 22], [45, 22]]);
wallArt('chalk', 34, 13);                    // checklist board
wallArt('cork', 36, 14);                     // bug / review board
wallArt('bars', 43, 13);                     // QA status display
cooler2(45, 14);
prop('grayOpen', 34, 21);                    // test-equipment shelf
prop('workbench', 38, 15);                   // testing bench …
wallArt('pcBlack', 38, 15);                  // … with a test monitor on it
plant(34, 16); plant(46, 17);

// MEETING — conference: table for twelve, wall displays, whiteboard, side cabinets with the conference PC
carpet(19, 15, 28, 23);
{
  const x0 = 20, y0 = 18;
  for (let i = 0; i < 6; i++) put('below', x0 + 1 + i, y0, 257);                              // chairs, north side
  put('below', x0 + 1, y0 + 1, 178); put('below', x0 + 1, y0 + 2, 177);                        // table rim
  for (let i = 2; i <= 5; i++) { put('below', x0 + i, y0 + 1, 229); put('below', x0 + i, y0 + 2, 229); }
  put('below', x0 + 6, y0 + 1, 178); put('below', x0 + 6, y0 + 2, 177);
  for (let i = 0; i < 6; i++) { put('below', x0 + 1 + i, y0 + 3, 274); put('above', x0 + 1 + i, y0 + 2, 258); } // chairs, south side
  for (let i = 1; i <= 6; i++) for (let j = 0; j <= 3; j++) block(x0 + i, y0 + j);
}
wallArt('bars', 19, 13);                     // presentation screen
wallArt('chalk', 21, 13);                    // whiteboard
prop('cabinet', 19, 22);                     // side cabinet …
wallArt('monBlue', 19, 21);                  // … with the conference PC on top
prop('cabinet', 27, 22);
plant(19, 15); plant(28, 17);

// ════════════════════════════ TIER 3 ═══════════════════════════════════════
// LAUNCH — marketing: three workstations, analytics + campaign walls, collaboration table, creative corner
workRoom('launch', [[4, 30], [10, 30], [7, 34]]);
wallArt('bars', 1, 25);                      // analytics screen
wallArt('cork', 3, 26);                      // campaign board
wallArt('chart', 12, 25);                    // presentation display
plant(1, 28);
prop('boxC', 12, 27);                         // campaign material
prop('cabinet', 7, 27);                      // print storage
prop('printerA', 1, 31);                     // flyer printer
roundTable(11, 33);                          // small collaboration table
carpet(1, 33, 3, 36);
prop('sofaMaroon', 1, 35);                   // creative corner sofa
plant(1, 33);

// SERVERS — infrastructure: two rows of racks, monitoring wall, two technical stations
{
  const row = (y) => {
    prop('rackWide', 35, y); prop('rack1', 37, y); prop('rack2', 38, y); prop('rack3', 39, y); prop('rack4', 40, y);
    prop('rackWideB', 41, y);
  };
  row(28); row(33);
  wallArt('smallScrA', 35, 26); wallArt('smallScrB', 36, 26); wallArt('smallScrA', 37, 26);   // monitoring wall
  wallArt('chart', 44, 25);
  workRoom('servers', [[45, 30], [45, 35]]);          // two technical stations (network + storage consoles)
  plant(43, 27); plant(43, 34);
}

// LOUNGE — break area: sofas + rug, lounge chairs, coffee table, bookshelf, kitchenette, reception
carpet(17, 29, 25, 35);
prop('sofaTan', 18, 29);                     // main sofa
prop('sofaMaroon', 22, 29);                  // second sofa
prop('armMaroon', 24, 29);                   // lounge chair
prop('armF', 18, 32); prop('armS', 24, 32);  // lounge chairs facing the table
prop('lowTable', 20, 32);                    // coffee table
prop('stool', 22, 32);                       // side table
prop('lampBlue', 17, 29);                    // floor lamp
shelf('woodBooks', 25, 26);                  // lounge bookshelf
shelf('woodShelf', 28, 26);                  // small shelf beside it
plant(31, 27);
prop('palm', 15, 34);                        // big palm by the door
// kitchenette: seats + table, sideboard, coffee machine, counters, fridge, vending (from the original map, moved down 16)
stamp(26, 14, 4, 7, 26, 30);
stamp(30, 15, 3, 6, 30, 31);
// reception / entrance
prop('counterWood', 17, 34);                 // reception desk
wallArt('monBlue', 17, 33);                  // reception terminal
wallArt('smallScrB', 20, 34);                // access panel
prop('benchWood', 21, 35);                   // waiting bench
plant(20, 35);
rect('office', 30, 2, 2, 1, 23, 36, 'below', 'none');      // door mat

// ════════════════ CORRIDORS (1-wide props on the wall side; 2-wide lanes stay clear) ═══════════════
plant(15, 12); prop('cooler', 15, 15); plant(15, 17); prop('rack1', 15, 21); plant(15, 25);   // west
plant(32, 12); prop('cooler', 32, 15); plant(32, 17); prop('rack3', 32, 21); plant(32, 25);   // east

// door mats just inside every room doorway (floor decor, walkable)
DOORS_L.forEach(([a, b], i) => { for (let y = a; y <= b; y++) prop(['matTan', 'matBlue', 'matTeal'][(i + y) % 3], 12, y, { collide: 'none' }); });
DOORS_R.forEach(([a, b], i) => { if (i < 2) for (let y = a; y <= b; y++) prop(['matBlue', 'matTan', 'matTeal'][(i + y) % 3], 34, y, { collide: 'none' }); });

// ── spawn points ────────────────────────────────────────────────────────────
spawn('entrance', 24, 36);
// café (original block moved down 16): seats + standing spots
spawn('cafe-seat-1', 27, 30); spawn('cafe-seat-2', 27, 32);
spawn('cafe-seat-3', 28, 30); spawn('cafe-seat-4', 28, 32);
spawn('cafe-stand-coffee', 26, 36);
spawn('cafe-stand-vending', 30, 36);

// ── zones ───────────────────────────────────────────────────────────────────
const ZONES = {
  lead: [15, 3, 18, 9], coder: [1, 3, 13, 9], design: [34, 3, 13, 9],
  rag: [1, 15, 13, 9], meeting: [19, 15, 10, 9], qa: [34, 15, 13, 9],
  launch: [1, 27, 13, 10], lounge: [15, 27, 18, 10], servers: [34, 27, 13, 10],
};

// ── engine layout (theme data) ──────────────────────────────────────────────
const st = (x, y, facing, sit = false) => ({ stand: { x, y }, facing, ...(sit ? { sit: true } : {}) });
const seatSpot = (n) => st(seatTiles[n][0], seatTiles[n][1], 'up', true);
const err = (kind, x, y, facing, duration, extra = {}) => ({ kind, stand: { x, y }, facing, fx: { x, y }, duration, ...extra });
const layout = {
  primarySeatNames: ['desk-lead', 'desk-coder', 'desk-design', 'desk-rag', 'desk-qa', 'desk-launch', ...extraSeats, ...serverSeats],
  agentSeats: homeSeats,
  coffee: {
    machineTile: { x: 26, y: 33 }, trayTile: { x: 29, y: 31 }, trayStand: { x: 29, y: 32 },
    machineStand: { x: 26, y: 36 }, sinkTile: { x: 28, y: 34 }, sinkStand: { x: 28, y: 36 }, maxCups: 4,
  },
  anchors: {
    calendar: { x: 4, y: 1 },                                     // engineering wall → TRIGGERS
    boards: { x: 25, y: 14 }, boardsPad: 0,                       // task boards, meeting-room wall → TASKS
    boardStands: { pin: { x: 26, y: 15 }, take: { x: 27, y: 15 }, archive: { x: 28, y: 15 } },
    clock: { x: 20, y: 1 },                                       // command-center clock → CLOSING TIME
    askBoard: { px: 163, y: 26 },                                 // launch wall → ASK ME
  },
  errandSpots: [
    { kind: 'water', stand: { x: 2, y: 4 }, facing: 'left', fx: { x: 1, y: 4 }, duration: 4.5 },
    { kind: 'water', stand: { x: 45, y: 4 }, facing: 'right', fx: { x: 46, y: 4 }, duration: 4.5 },
    { kind: 'water', stand: { x: 2, y: 18 }, facing: 'left', fx: { x: 1, y: 18 }, duration: 4.5 },
    { kind: 'water', stand: { x: 45, y: 18 }, facing: 'right', fx: { x: 46, y: 18 }, duration: 4.5 },
    { kind: 'water', stand: { x: 2, y: 29 }, facing: 'left', fx: { x: 1, y: 29 }, duration: 4.5 },
    { kind: 'water', stand: { x: 12, y: 29 }, facing: 'right', fx: { x: 13, y: 29 }, duration: 4.5 },
    { kind: 'water', stand: { x: 30, y: 28 }, facing: 'right', fx: { x: 31, y: 28 }, duration: 4.5 },
    { kind: 'water', stand: { x: 17, y: 10 }, facing: 'left', fx: { x: 16, y: 11 }, duration: 4.5, godOnly: true },
    { kind: 'window', stand: { x: 11, y: 3 }, facing: 'up', fx: { x: 10, y: 1 }, duration: 5 },
    { kind: 'window', stand: { x: 37, y: 3 }, facing: 'up', fx: { x: 36, y: 1 }, duration: 5 },
    { kind: 'dispenser', stand: { x: 34, y: 4 }, facing: 'up', fx: { x: 34, y: 3 }, duration: 3.5 },
    { kind: 'dispenser', stand: { x: 16, y: 16 }, facing: 'left', fx: { x: 15, y: 16 }, duration: 3.5 },
    { kind: 'fridge', stand: { x: 29, y: 36 }, facing: 'up', fx: { x: 29, y: 35 }, duration: 3.2 },
    { kind: 'shelf', stand: { x: 11, y: 3 }, facing: 'right', fx: { x: 12, y: 2 }, duration: 4 },
    { kind: 'shelf', stand: { x: 2, y: 16 }, facing: 'up', fx: { x: 2, y: 14 }, duration: 4 },
    { kind: 'shelf', stand: { x: 26, y: 28 }, facing: 'up', fx: { x: 26, y: 26 }, duration: 4 },
    // zone visits
    err('meet', 22, 17, 'down', 7), err('meet', 25, 17, 'down', 7),
    err('meet', 19, 19, 'right', 7), err('meet', 28, 20, 'left', 7),
    err('servers', 36, 31, 'up', 5), err('servers', 40, 31, 'up', 5),
    err('sync', 8, 7, 'down', 5), err('sync', 40, 4, 'down', 5), err('sync', 7, 16, 'down', 5),
    err('sync', 40, 17, 'down', 5), err('sync', 6, 29, 'down', 5), err('sync', 23, 9, 'up', 5),
    // the lead's rounds: meeting room → another department → back to the command center
    err('meet', 24, 17, 'down', 7, { godOnly: true }),
    err('sync', 9, 7, 'down', 5, { godOnly: true }), err('sync', 39, 4, 'down', 5, { godOnly: true }),
    err('sync', 8, 16, 'down', 5, { godOnly: true }), err('sync', 39, 17, 'down', 5, { godOnly: true }),
    err('sync', 8, 29, 'down', 5, { godOnly: true }), err('servers', 38, 31, 'up', 5, { godOnly: true }),
  ],
  stations: {
    shelf: [st(11, 3, 'right'), st(2, 16, 'up'), st(3, 16, 'up'), st(36, 22, 'left'), st(26, 28, 'up')],
    terminal: extraSeats.map(seatSpot),
    web: [seatSpot('desk-rag'), seatSpot('desk-rag-2'), seatSpot('desk-rag-3')],
    board: [st(26, 15, 'up'), st(27, 15, 'up'), st(22, 17, 'down'), st(25, 17, 'down')],
    mcp: [st(36, 31, 'up'), st(38, 31, 'up'), st(40, 31, 'up'), st(42, 31, 'up')],
    mailbox: [st(22, 28, 'down')],
  },
  signs: [
    { id: 'lead', title: 'LEAD', subtitle: 'COMMAND CENTER', x: 24, y: 1.05 },
    { id: 'coder', title: 'CODER', subtitle: 'ENGINEERING', x: 7.5, y: 1.05 },
    { id: 'design', title: 'DESIGN', subtitle: 'DESIGN STUDIO', x: 40.5, y: 1.05 },
    { id: 'rag', title: 'RAG', subtitle: 'RESEARCH', x: 7.5, y: 13.05 },
    { id: 'meeting', title: 'MEETING', subtitle: 'CONFERENCE', x: 22.5, y: 15.15 },
    { id: 'qa', title: 'QA', subtitle: 'REVIEW & TESTING', x: 40.5, y: 13.05 },
    { id: 'launch', title: 'LAUNCH', subtitle: 'MARKETING', x: 7.5, y: 25.05 },
    { id: 'lounge', title: 'LOUNGE', subtitle: 'BREAK AREA', x: 21, y: 25.05 },
    { id: 'servers', title: 'SERVERS', subtitle: 'INFRASTRUCTURE', x: 40.5, y: 25.05 },
    { id: 'entry', title: 'CREWDESK', subtitle: 'RECEPTION / ENTRY', x: 23, y: 33.2 },
  ],
  doorways: [
    ...DOORS_L.map(([a, b]) => ({ orient: 'v', x: 14, y: a, len: b - a + 1 })),
    ...DOORS_R.map(([a, b]) => ({ orient: 'v', x: 33, y: a, len: b - a + 1 })),
    { orient: 'v', x: 18, y: 19, len: 2 }, { orient: 'v', x: 29, y: 19, len: 2 },
    { orient: 'h', x: 23, y: 12, len: 2, thick: 3 }, { orient: 'h', x: 23, y: 24, len: 2, thick: 3 },
    { orient: 'h', x: 23, y: 37, len: 2, thick: 1 },
  ],
};
fs.writeFileSync(layoutOut, JSON.stringify(layout, null, 1));

// ── output ──────────────────────────────────────────────────────────────────
const tile = (name, data) => ({ data, height: H, id: 0, name, opacity: 1, type: 'tilelayer', visible: true, width: W, x: 0, y: 0 });
let oid = 1;
const obj = (name, x, y, w = 0, h = 0) => ({ id: oid++, name, type: '', x, y, width: w, height: h, rotation: 0, visible: true, ...(w || h ? {} : { point: true }) });
const out = {
  compressionlevel: -1, height: H, infinite: false,
  layers: [
    { ...tile('floor', L.floor), id: 1 }, { ...tile('walls', L.walls), id: 2 },
    { ...tile('furniture-below', L.below), id: 3 }, { ...tile('furniture-above', L.above), id: 4 },
    { ...tile('collision', L.col), id: 5 },
    { draworder: 'topdown', id: 6, name: 'spawn-points', opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0,
      objects: spawns.map((s) => obj(s.name, s.x * TS, s.y * TS)) },
    { draworder: 'topdown', id: 7, name: 'zones', opacity: 1, type: 'objectgroup', visible: true, x: 0, y: 0,
      objects: Object.entries(ZONES).map(([n, [x, y, w, h]]) => obj(n, x * TS, y * TS, w * TS, h * TS)) },
  ],
  nextlayerid: 8, nextobjectid: oid, orientation: 'orthogonal', renderorder: 'right-down',
  tiledversion: '1.12.0', tileheight: TS, tilesets: src.tilesets, tilewidth: TS, type: 'map', version: '1.10', width: W,
};
fs.writeFileSync(path.join(mapsDir, 'crewdesk-office.tmj'), JSON.stringify(out));
console.log(`crewdesk-office.tmj written (${W}x${H}, ${spawns.length} spawn points, ${Object.keys(seatTiles).length} workstations)`);
console.log(`layout → ${path.relative(root, layoutOut)}`);
