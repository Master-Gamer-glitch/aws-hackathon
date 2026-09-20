import type { BackendTask, RoomStatus } from './api';

/**
 * The tasks a room works on: its current plan, plus project-level tasks that belong to no room.
 * Mirrors tasksForRoom() in the backend so the screen counts exactly what distribute and collect do.
 */
export function tasksForRoom(tasks: BackendTask[], roomId: string, room: Pick<RoomStatus, 'planId'> | null): BackendTask[] {
  return tasks
    .filter((t) => !t.roomId || (t.roomId === roomId && (!room?.planId || t.planId === room.planId)))
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
}
