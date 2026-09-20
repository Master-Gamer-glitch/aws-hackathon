// Theme registry — the pluggable "office theme" contract.
//
// Phase 0 of the TV-show-offices feature (card tvshow-phase0-abstraction):
// extract the ~40% of constants that were hard-coded inside OfficeFloor.tsx
// (errand spots, coffee-economy tile coords, prop anchors, seat names, tileset
// URLs, palette, monitor gids) into a ThemeConfig so the scene becomes
// swappable per show. This phase ships the EXISTING office unchanged as
// `theme: 'office'`: every value below is copied byte-for-byte from the old
// in-file literals, so the office renders and behaves identically.
//
// The engine (TiledMapRenderer / BFS pathfinding / Camera / sprite animation)
// is already fully generic and needs no change. cast.ts is read-only here
// (uncommitted human WIP) — the office theme references its existing exports.

import type { Texture } from 'pixi.js';
import { colors } from '@office/design/tokens';
import {
  CAST_BY_NAME,
  getCastFrames,
  DEFAULT_CHARACTER,
  type CastMember,
  type OfficeCharacterName,
} from './cast';

// Tileset atlases are served straight from /public (single copy of the art shared
// with the rest of the site); the browser fetches them by URL when the scene loads.
const officeTilesetUrl = '/munder-assets/tilesets/office-tileset.png';
const a5FloorsWallsUrl = '/munder-assets/tilesets/a5-office-floors-walls.png';
const interiorsUrl = '/munder-assets/tilesets/interiors.png';
// .tmj is Tiled JSON; imported as raw text (webpack `asset/source` rule in
// next.config.mjs) and parsed by the loader. Single copy lives in /public.
import officeMapRaw from '../../../../public/munder-assets/maps/office.tmj';
import crewdeskMapRaw from '../../../../public/munder-assets/maps/crewdesk-office.tmj';
import crewdeskLayout from './crewdeskLayout.json';

/** Theme identifiers. Only `office` exists in Phase 0; the five TV-show themes
 *  (friends, brooklyn99, siliconvalley, got, hogwarts) land in later phases. */
export type ThemeId =
  | 'office'
  | 'crewdesk'
  | 'friends'
  | 'brooklyn99'
  | 'siliconvalley'
  | 'got'
  | 'hogwarts';

export interface Tile { x: number; y: number; }
export type Facing = 'up' | 'down' | 'left' | 'right';

/** Kinds of small idle errands around the office (incl. plant watering).
 *  'smoke' is the boss special: cigar at the open window, god only. */
export type ErrandKind =
  | 'water' | 'window' | 'dispenser' | 'fridge' | 'shelf' | 'bin' | 'smoke'
  // CrewDesk zone visits: walk to another area of the office, linger, walk home
  | 'meet' | 'servers' | 'sync';

/** One idle-errand anchor: a stand tile + facing, an `fx` tile for the ambient
 *  animation, a duration, and an optional god-only restriction. */
export interface ErrandSpot {
  kind: ErrandKind;
  stand: Tile;
  facing: Facing;
  fx: Tile;
  duration: number;
  godOnly?: boolean;
}

/** One tileset atlas + its placement in the global gid space. `embedded` marks
 *  the atlas whose metadata already lives inline in the map's own `tilesets[0]`
 *  (the loader keeps the map's copy and only patches the appended atlases). */
export interface TilesetEntry {
  url: string;
  embedded?: boolean;
  firstgid?: number;
  image?: string;
  imagewidth?: number;
  imageheight?: number;
  tilewidth?: number;
  tileheight?: number;
  columns?: number;
  tilecount?: number;
}

/** Desk-monitor overlay gids. The map paints an OFF monitor block; DeskScreen
 *  overlays the matching ON tiles while the desk's agent is seated. */
export interface MonitorConfig {
  /** gid of the OFF monitor block's top-left tile, as painted in the map. */
  offTopLeftGid: number;
  /** Matching ON tiles as [gid, dx, dy] relative to the block's top-left. */
  onGids: ReadonlyArray<readonly [number, number, number]>;
}

/** The coffee economy's fixed tiles: sideboard (mug rack) → counter machine →
 *  sink → back to the sideboard. `maxCups` caps the clean-mug stock. */
export interface CoffeeConfig {
  /** Tile of the counter coffee machine (steam plays above it while brewing). */
  machineTile?: Tile;
  trayTile: Tile;
  trayStand: Tile;
  machineStand: Tile;
  sinkTile: Tile;
  sinkStand: Tile;
  maxCups: number;
}

/** Clickable prop anchors (tile coords). calendar → TRIGGERS, boards → TASKS,
 *  clock → CLOSING TIME, askBoard → ASK ME. */
export interface AnchorConfig {
  calendar: Tile;
  boards: Tile;
  clock: Tile;
  /** ASK ME board position: x in PIXELS, y in tiles (the board hangs on a wall base row).
   *  Defaults to the original office's spot. */
  askBoard?: { px: number; y: number };
  /** Horizontal padding (px) that centres the two cork boards + archive table on their wall run. */
  boardsPad?: number;
  /** Where actors stand to pin / take / archive task notes. */
  boardStands?: { pin: Tile; take: Tile; archive: Tile };
}

/** A room nameplate: an actual scene element (not part of the map art). Position is the
 *  plate's top-centre in TILE units (fractions allowed). */
export interface RoomSign {
  id: string;
  title: string;
  subtitle: string;
  x: number;
  y: number;
}

/** Where an agent goes for a given station (tool) — stand tile, facing, and whether it
 *  sits down there (another workstation) or stands (shelf, board, rack…). */
export interface StationSpot {
  stand: Tile;
  facing: Facing;
  sit?: boolean;
}

/** An opening in a wall, for the scene to frame with door posts.
 *  'v': a gap in a vertical wall (column x, rows y..y+len-1).
 *  'h': a gap in a horizontal wall band (columns x..x+len-1, `thick` rows starting at y). */
export interface Doorway { orient: 'v' | 'h'; x: number; y: number; len: number; thick?: number }

export type StationName = 'shelf' | 'terminal' | 'web' | 'board' | 'mailbox' | 'mcp';

/** Theme palette. `background` is the canvas clear color; `noteColors` are the
 *  kanban note colors keyed by task status. */
export interface PaletteConfig {
  background: number;
  noteColors: Record<string, number>;
}

/** Per-theme cast loader — the indirection point so a future show can swap its
 *  own roster + sprite frames. The office theme points at cast.ts's exports. */
export interface ThemeCast {
  byName: Record<string, CastMember>;
  getFrames: (name: string) => Promise<Texture[][]>;
  defaultCharacter: string;
}

/** The full contract a theme must supply. See report §A (theme contract). */
export interface ThemeConfig {
  id: ThemeId;
  /** Raw Tiled JSON text; parsed + tileset-patched by themeLoader. */
  mapRaw: string;
  /** Ordered atlases — order matches both the texture load order and the map's
   *  tileset array (texture[i] ↔ tilesets[i]). */
  tilesets: TilesetEntry[];
  /** Desk-claim order, by spawn-point name (seat 0 = god / desk-ceo). */
  primarySeatNames: string[];
  /** Paired café table seats, in order. */
  cafeSeatNames: string[];
  /** Café standing spots: [spawn-point name, kind]. */
  cafeStands: ReadonlyArray<readonly [string, 'coffee' | 'vending']>;
  coffee: CoffeeConfig;
  anchors: AnchorConfig;
  /** Agent id → spawn-point name of the desk it calls home (role → room). */
  agentSeats?: Record<string, string>;
  /** Where tool-use stations are on this floor (see applyState in OfficeFloor). */
  stations?: Partial<Record<StationName, StationSpot[]>>;
  /** Room nameplates drawn by the scene. */
  signs?: RoomSign[];
  /** Wall openings, framed with door posts by the scene. */
  doorways?: Doorway[];
  errandSpots: ErrandSpot[];
  monitor: MonitorConfig;
  palette: PaletteConfig;
  cast: ThemeCast;
}

/** The existing office, expressed as a theme. Values are copied verbatim from
 *  the former in-file constants in OfficeFloor.tsx / DeskScreen.ts. */
export const OFFICE_THEME: ThemeConfig = {
  id: 'office',
  mapRaw: officeMapRaw,
  tilesets: [
    // office-tileset.png — embedded in the map (firstgid 1); keep the map's copy.
    { url: officeTilesetUrl, embedded: true },
    { url: a5FloorsWallsUrl, firstgid: 513, image: 'a5', imagewidth: 256, imageheight: 512, tilewidth: 16, tileheight: 16, columns: 16, tilecount: 512 },
    { url: interiorsUrl, firstgid: 1025, image: 'interiors', imagewidth: 256, imageheight: 1424, tilewidth: 16, tileheight: 16, columns: 16, tilecount: 1424 },
  ],
  primarySeatNames: [
    'desk-ceo',
    'pc-1', 'pc-2', 'pc-3', 'pc-4', 'pc-5', 'pc-6',
    'desk-chief-architect', 'desk-product-manager', 'desk-team-lead',
    'desk-backend-engineer', 'desk-ui-ux-expert', 'desk-data-engineer',
    'desk-project-manager', 'desk-market-researcher', 'desk-agent-organizer',
  ],
  cafeSeatNames: ['cafe-seat-1', 'cafe-seat-2', 'cafe-seat-3', 'cafe-seat-4'],
  cafeStands: [
    ['cafe-stand-coffee', 'coffee'],
    ['cafe-stand-vending', 'vending'],
  ],
  coffee: {
    trayTile: { x: 29, y: 15 },     // the sideboard (counter piece)
    trayStand: { x: 29, y: 16 },
    machineStand: { x: 26, y: 20 }, // below the counter machine
    sinkTile: { x: 28, y: 18 },     // free counter top, right end
    sinkStand: { x: 28, y: 20 },
    maxCups: 4,
  },
  anchors: {
    calendar: { x: 4, y: 1 },
    boards: { x: 6, y: 10 },
    clock: { x: 1, y: 1 },
  },
  errandSpots: [
    // plants (droplets ride on the character via startWatering)
    { kind: 'water', stand: { x: 2, y: 20 }, facing: 'left', fx: { x: 1, y: 20 }, duration: 4.5 },
    { kind: 'water', stand: { x: 22, y: 20 }, facing: 'right', fx: { x: 23, y: 20 }, duration: 4.5 },
    { kind: 'water', stand: { x: 30, y: 20 }, facing: 'right', fx: { x: 31, y: 20 }, duration: 4.5 },
    // the CEO office is the god's domain: its plant, window, cigar. Workers
    // never set foot in there for errands.
    { kind: 'water', stand: { x: 6, y: 4 }, facing: 'up', fx: { x: 6, y: 3 }, duration: 4.5, godOnly: true },
    { kind: 'smoke', stand: { x: 2, y: 3 }, facing: 'up', fx: { x: 2, y: 1 }, duration: 18, godOnly: true },
    { kind: 'water', stand: { x: 17, y: 4 }, facing: 'up', fx: { x: 17, y: 3 }, duration: 4.5 },
    // the two public wall windows — wind streaks drift into the room
    { kind: 'window', stand: { x: 10, y: 3 }, facing: 'up', fx: { x: 10, y: 1 }, duration: 5 },
    { kind: 'window', stand: { x: 15, y: 3 }, facing: 'up', fx: { x: 14, y: 1 }, duration: 5 },
    // water dispensers (hallway + the top-right corner one)
    { kind: 'dispenser', stand: { x: 16, y: 3 }, facing: 'down', fx: { x: 16, y: 4 }, duration: 3.5 },
    { kind: 'dispenser', stand: { x: 32, y: 4 }, facing: 'up', fx: { x: 32, y: 3 }, duration: 3.5 },
    // the café fridge (door light spills out) + the shelf beside it
    { kind: 'fridge', stand: { x: 29, y: 20 }, facing: 'up', fx: { x: 29, y: 19 }, duration: 3.2 },
    { kind: 'shelf', stand: { x: 30, y: 20 }, facing: 'up', fx: { x: 30, y: 18 }, duration: 4 },
    // garbage bins (entrance + café) — a paper ball arcs in
    { kind: 'bin', stand: { x: 18, y: 20 }, facing: 'left', fx: { x: 17, y: 20 }, duration: 2.6 },
    { kind: 'bin', stand: { x: 31, y: 16 }, facing: 'right', fx: { x: 32, y: 16 }, duration: 2.6 },
  ],
  monitor: {
    offTopLeftGid: 365,
    onGids: [
      [367, 0, 0], [368, 1, 0],
      [383, 0, 1], [384, 1, 1],
    ],
  },
  palette: {
    background: colors.ink[900],
    noteColors: { todo: 0xf2df8a, doing: 0x9ecbf0, blocked: 0xf0a3a3, done: 0xa8e0b0 },
  },
  cast: {
    byName: CAST_BY_NAME as Record<string, CastMember>,
    getFrames: (name: string) => getCastFrames(name as OfficeCharacterName),
    defaultCharacter: DEFAULT_CHARACTER,
  },
};

/** The CrewDesk floor — a structured six-department office (see scripts/build-crewdesk-map.mjs).
 *
 *   CODER / Engineering     LEAD / Command Center     DESIGN / Design Studio
 *   RAG / Research          MEETING / Conference      QA / Review & Testing
 *   LAUNCH / Marketing      LOUNGE / Break Area       SERVERS / Infrastructure
 *
 *  Map, seats, stations, errands, signs and doorways all come from the generator's
 *  crewdeskLayout.json, so they can never drift from the tile map. Tileset art, monitor
 *  overlay, palette and cast are shared with the base office theme. */
const layout = crewdeskLayout as unknown as Pick<ThemeConfig,
  'primarySeatNames' | 'agentSeats' | 'coffee' | 'anchors' | 'errandSpots' | 'stations' | 'signs' | 'doorways'>;

export const CREWDESK_THEME: ThemeConfig = {
  id: 'crewdesk',
  mapRaw: crewdeskMapRaw,
  tilesets: OFFICE_THEME.tilesets,
  ...layout,
  cafeSeatNames: ['cafe-seat-1', 'cafe-seat-2', 'cafe-seat-3', 'cafe-seat-4'],
  cafeStands: [
    ['cafe-stand-coffee', 'coffee'],
    ['cafe-stand-vending', 'vending'],
  ],
  monitor: OFFICE_THEME.monitor,
  palette: OFFICE_THEME.palette,
  cast: OFFICE_THEME.cast,
};

/** All registered themes. Phase 0 ships only the office; show themes register
 *  here as their content lands (Phase 2). */
export const THEMES: Partial<Record<ThemeId, ThemeConfig>> = {
  office: OFFICE_THEME,
  crewdesk: CREWDESK_THEME,
};

/** Look up a theme by id, falling back to the office theme if unknown/missing
 *  (a bad/absent show bundle must never break the floor — see report §E). */
export function getTheme(id: ThemeId): ThemeConfig {
  return THEMES[id] ?? CREWDESK_THEME;
}
