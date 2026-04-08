import db from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { Reservation } from '../types';

const checkOverlap = (roomId: number, startTime: string, endTime: string, excludeId?: number) => {
  const sql = `
    SELECT id FROM reservations
    WHERE room_id = ? AND status = 'active'
      AND start_time < ? AND end_time > ?
      ${excludeId ? 'AND id != ?' : ''}
  `;
  const params = excludeId
    ? [roomId, endTime, startTime, excludeId]
    : [roomId, endTime, startTime];

  return db.prepare(sql).get(...params);
};

export const createReservation = db.transaction(
  (roomId: number, userId: number, title: string, startTime: string, endTime: string) => {
    if (new Date(startTime) < new Date()) {
      throw new AppError(400, 'PAST_TIME', '현재 시각 이전으로는 예약할 수 없습니다.');
    }

    const conflict = checkOverlap(roomId, startTime, endTime);
    if (conflict) {
      throw new AppError(409, 'DUPLICATE_BOOKING', '해당 시간에 이미 예약이 존재합니다.');
    }

    const result = db.prepare(`
      INSERT INTO reservations (room_id, user_id, title, start_time, end_time)
      VALUES (?, ?, ?, ?, ?)
    `).run(roomId, userId, title, startTime, endTime);

    return db.prepare('SELECT * FROM reservations WHERE id = ?')
      .get(result.lastInsertRowid) as Reservation;
  }
);

export const updateReservation = db.transaction(
  (id: number, userId: number, title: string, startTime: string, endTime: string) => {
    const existing = db.prepare(
      'SELECT * FROM reservations WHERE id = ? AND status = ?'
    ).get(id, 'active') as Reservation | undefined;

    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', '예약을 찾을 수 없습니다.');
    }
    if (existing.user_id !== userId) {
      throw new AppError(403, 'FORBIDDEN', '본인의 예약만 수정할 수 있습니다.');
    }

    const conflict = checkOverlap(existing.room_id, startTime, endTime, id);
    if (conflict) {
      throw new AppError(409, 'DUPLICATE_BOOKING', '해당 시간에 이미 예약이 존재합니다.');
    }

    db.prepare(`
      UPDATE reservations
      SET title = ?, start_time = ?, end_time = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(title, startTime, endTime, id);

    return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as Reservation;
  }
);

export const deleteReservation = (id: number, userId: number) => {
  const existing = db.prepare(
    'SELECT * FROM reservations WHERE id = ? AND status = ?'
  ).get(id, 'active') as Reservation | undefined;

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', '예약을 찾을 수 없습니다.');
  }
  if (existing.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', '본인의 예약만 삭제할 수 있습니다.');
  }

  db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
  return true;
};

export const cancelReservation = (id: number, adminId: number, reason: string) => {
  const existing = db.prepare(
    'SELECT * FROM reservations WHERE id = ? AND status = ?'
  ).get(id, 'active') as Reservation | undefined;

  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', '예약을 찾을 수 없습니다.');
  }

  db.prepare(`
    UPDATE reservations
    SET status = 'cancelled', cancel_reason = ?, cancelled_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(reason, adminId, id);

  return db.prepare('SELECT * FROM reservations WHERE id = ?').get(id) as Reservation;
};

export const getStats = () => {
  const totalReservations = db.prepare(
    'SELECT COUNT(*) AS count FROM reservations'
  ).get() as { count: number };

  const activeReservations = db.prepare(
    "SELECT COUNT(*) AS count FROM reservations WHERE status = 'active'"
  ).get() as { count: number };

  const cancelledReservations = db.prepare(
    "SELECT COUNT(*) AS count FROM reservations WHERE status = 'cancelled'"
  ).get() as { count: number };

  const roomUsage = db.prepare(`
    SELECT r.name, COUNT(rv.id) AS reservation_count
    FROM rooms r
    LEFT JOIN reservations rv ON rv.room_id = r.id AND rv.status = 'active'
    GROUP BY r.id
    ORDER BY reservation_count DESC
  `).all();

  return {
    total: totalReservations.count,
    active: activeReservations.count,
    cancelled: cancelledReservations.count,
    roomUsage,
  };
};
