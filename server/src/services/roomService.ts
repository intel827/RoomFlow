import db from '../db/connection';
import { Room, RoomWithStatus } from '../types';

export const getAllRooms = (): RoomWithStatus[] => {
  return db.prepare(`
    SELECT r.*,
      CASE WHEN EXISTS (
        SELECT 1 FROM reservations rv
        WHERE rv.room_id = r.id AND rv.status = 'active'
          AND rv.start_time <= datetime('now') AND rv.end_time > datetime('now')
      ) THEN 'occupied' ELSE 'available' END AS current_status
    FROM rooms r
    ORDER BY r.name
  `).all() as RoomWithStatus[];
};

export const getRoomById = (id: number) => {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id) as Room | undefined;
  if (!room) return null;

  const reservations = db.prepare(`
    SELECT rv.*, u.name AS user_name, u.employee_id
    FROM reservations rv
    JOIN users u ON u.id = rv.user_id
    WHERE rv.room_id = ? AND rv.end_time > datetime('now')
    ORDER BY rv.start_time
  `).all(id);

  return { ...room, reservations };
};

export const createRoom = (name: string, capacity: number, location: string | null) => {
  const result = db.prepare(
    'INSERT INTO rooms (name, capacity, location) VALUES (?, ?, ?)'
  ).run(name, capacity, location);
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid) as Room;
};

export const hasFutureReservations = (id: number): boolean => {
  const row = db.prepare(
    "SELECT 1 FROM reservations WHERE room_id = ? AND status = 'active' AND end_time > datetime('now') LIMIT 1"
  ).get(id);
  return !!row;
};

export const deleteRoom = (id: number): boolean => {
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
  return result.changes > 0;
};
