// The rooms this browser knows about. The backend has no "list rooms" call, so the browser keeps
// its own short list (localStorage) and asks the backend for the live state of each one.

export interface SavedRoom {
  roomId: string;
  /** what the user called this device when creating or joining */
  name: string;
  /** master = created here; slave = joined as a device; watch = just looking */
  role: 'master' | 'slave' | 'watch';
  lastOpened: number;
}

const KEY = 'airstream.rooms.v1';
const LAST_KEY = 'airstream.lastRoom.v1';
const MAX = 12;

// localStorage can throw (private mode, blocked storage): never let that break a page.
const read = (k: string): string | null => { try { return window.localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { window.localStorage.setItem(k, v); } catch { /* ignore */ } };

export function loadRooms(): SavedRoom[] {
  try {
    const raw = read(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? list.filter((r): r is SavedRoom => !!r && typeof r.roomId === 'string').sort((a, b) => b.lastOpened - a.lastOpened)
      : [];
  } catch { return []; }
}

export function saveRoom(room: Omit<SavedRoom, 'lastOpened'>): void {
  const others = loadRooms().filter((r) => r.roomId !== room.roomId);
  write(KEY, JSON.stringify([{ ...room, lastOpened: Date.now() }, ...others].slice(0, MAX)));
  write(LAST_KEY, room.roomId);
}

export function forgetRoom(roomId: string): void {
  write(KEY, JSON.stringify(loadRooms().filter((r) => r.roomId !== roomId)));
  if (read(LAST_KEY) === roomId) write(LAST_KEY, '');
}

export const lastRoomId = (): string | null => read(LAST_KEY) || null;

/** The device name the user last used, shared with the /airstream console. */
export const savedDeviceName = (): string => read('airstream.deviceName.v1') || 'My Browser';
export const saveDeviceName = (name: string): void => write('airstream.deviceName.v1', name);

/** Forget which room was open last, so the next visit starts at the room list. */
export const clearLastRoom = (): void => write(LAST_KEY, '');
