// Audits the CrewDesk map + layout: every seat, station, errand, kitchen and board spot must sit on a
// walkable tile that is reachable from the entrance (BFS, same rules as the engine).
//   node scripts/check-crewdesk-map.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = JSON.parse(fs.readFileSync(path.join(root, 'public/munder-assets/maps/crewdesk-office.tmj'), 'utf8'));
const layout = JSON.parse(fs.readFileSync(path.join(root, 'src/live-office/scene/office/crewdeskLayout.json'), 'utf8'));
const { width: W, height: H } = map;
const layer = (n) => map.layers.find((l) => l.name === n);
const col = layer('collision').data;
const spawns = Object.fromEntries(layer('spawn-points').objects.map((o) => [o.name, { x: Math.floor(o.x / 16), y: Math.floor(o.y / 16) }]));
const walk = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !col[y * W + x]));
for (const [n, p] of Object.entries(spawns)) if (/^(desk-|pc-|warroom-|entrance)/.test(n)) walk[p.y][p.x] = true;
const ok = (x, y) => x >= 0 && y >= 0 && x < W && y < H && walk[y][x];

const seen = Array.from({ length: H }, () => Array(W).fill(-1));
const start = spawns.entrance; const q = [start]; seen[start.y][start.x] = 0;
while (q.length) { const c = q.shift(); for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) { const x = c.x + dx, y = c.y + dy; if (ok(x, y) && seen[y][x] < 0) { seen[y][x] = seen[c.y][c.x] + 1; q.push({ x, y }); } } }

let bad = 0, checked = 0;
const check = (label, x, y) => {
  checked++;
  if (!ok(x, y)) { console.log(`✗ ${label} (${x},${y}) is NOT walkable`); bad++; }
  else if (seen[y][x] < 0) { console.log(`✗ ${label} (${x},${y}) unreachable from the entrance`); bad++; }
};
for (const [n, p] of Object.entries(spawns)) check(`spawn ${n}`, p.x, p.y);
for (const e of layout.errandSpots) check(`errand ${e.kind}`, e.stand.x, e.stand.y);
for (const [k, list] of Object.entries(layout.stations)) for (const s of list) check(`station ${k}`, s.stand.x, s.stand.y);
for (const [k, t] of Object.entries(layout.coffee)) if (/Stand$/.test(k)) check(`coffee ${k}`, t.x, t.y);
for (const [k, t] of Object.entries(layout.anchors.boardStands)) check(`board ${k}`, t.x, t.y);
// every doorway must be open floor on both faces
for (const d of layout.doorways) {
  if (d.orient === 'v') for (let i = 0; i < d.len; i++) { check('doorway (west face)', d.x - 1, d.y + i); check('doorway (east face)', d.x + 1, d.y + i); }
}
// density: share of interior floor that is furnished (solid props) vs open — walls excluded
const wallsL = layer('walls').data; let floorTiles = 0, solid = 0;
for (let y = 3; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (wallsL[y * W + x]) continue; floorTiles++; if (col[y * W + x]) solid++; }
const floorL = layer('floor').data; let carpetTiles = 0, covered = 0;
for (let y = 3; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const g = floorL[y * W + x]; const rug = g === 777 || g === 778 || g === 793 || g === 794; if (!wallsL[y * W + x] && rug) carpetTiles++; if (!wallsL[y * W + x] && (rug || col[y * W + x])) covered++; }
const reach = seen.flat().filter((v) => v >= 0).length;
console.log(`covered by furniture or rugs ${(100 * covered / floorTiles).toFixed(0)}% · plain open floor ${(100 - 100 * covered / floorTiles).toFixed(0)}%`);
console.log(`solid furniture ${(100 * solid / floorTiles).toFixed(0)}% · carpeted ${(100 * carpetTiles / floorTiles).toFixed(0)}% · bare floor/walking ${(100 - 100 * solid / floorTiles).toFixed(0)}%  (${solid} solid, ${carpetTiles} carpet of ${floorTiles} floor tiles; ${reach} reachable)`);
console.log(bad ? `\n${bad} problem(s) of ${checked} checks` : `all ${checked} spawn points, stations, errands, kitchen and board spots are walkable and reachable (max path ${Math.max(...seen.flat())} tiles from the door)`);
process.exit(bad ? 1 : 0);
