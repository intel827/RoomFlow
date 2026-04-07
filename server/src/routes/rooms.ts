import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as roomService from '../services/roomService';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const createRoomSchema = z.object({
  name: z.string().min(1, '회의실 이름을 입력해주세요.'),
  capacity: z.number().int().positive().default(10),
  location: z.string().nullable().default(null),
});

router.get('/', authenticate, (_req, res) => {
  const rooms = roomService.getAllRooms();
  res.json(rooms);
});

router.get('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id as string);
  const room = roomService.getRoomById(id);
  if (!room) {
    throw new AppError(404, 'NOT_FOUND', '회의실을 찾을 수 없습니다.');
  }
  res.json(room);
});

router.post('/', authenticate, requireAdmin, (req, res) => {
  const data = createRoomSchema.parse(req.body);
  const room = roomService.createRoom(data.name, data.capacity, data.location);
  res.status(201).json(room);
});

router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id as string);
  const deleted = roomService.deleteRoom(id);
  if (!deleted) {
    throw new AppError(404, 'NOT_FOUND', '회의실을 찾을 수 없습니다.');
  }
  res.json({ message: '회의실이 삭제되었습니다.' });
});

export default router;
