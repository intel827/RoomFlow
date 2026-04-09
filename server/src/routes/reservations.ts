import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import * as reservationService from '../services/reservationService';
import { z } from 'zod';

const router = Router();

const timeSchema = z.string().datetime().refine((val) => {
  const minutes = new Date(val).getMinutes();
  return minutes === 0 || minutes === 30;
}, '시간은 30분 단위로만 설정할 수 있습니다.').refine((val) => {
  const hours = new Date(val).getHours();
  const minutes = new Date(val).getMinutes();
  return hours >= 8 && (hours < 18 || (hours === 18 && minutes === 0));
}, '예약 가능 시간은 08:00~18:00입니다.');

const reservationSchema = z.object({
  room_id: z.number().int().positive(),
  title: z.string().min(1).max(100),
  start_time: timeSchema,
  end_time: timeSchema,
}).refine((data) => {
  const diff = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60);
  return diff >= 30 && diff % 30 === 0;
}, '예약 시간은 최소 30분이며 30분 단위여야 합니다.');

const updateSchema = z.object({
  title: z.string().min(1).max(100),
  start_time: timeSchema,
  end_time: timeSchema,
}).refine((data) => {
  const diff = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60);
  return diff >= 30 && diff % 30 === 0;
}, '예약 시간은 최소 30분이며 30분 단위여야 합니다.');

const cancelSchema = z.object({
  reason: z.string().min(1, '취소 사유를 입력해주세요.').max(200, '취소 사유는 200자 이내로 입력해주세요.'),
});

router.post('/', authenticate, (req, res) => {
  const data = reservationSchema.parse(req.body);
  const reservation = reservationService.createReservation(
    data.room_id, req.user!.id, data.title, data.start_time, data.end_time
  );
  res.status(201).json(reservation);
});

router.put('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id as string);
  const data = updateSchema.parse(req.body);
  const reservation = reservationService.updateReservation(
    id, req.user!.id, data.title, data.start_time, data.end_time
  );
  res.json(reservation);
});

router.delete('/:id', authenticate, (req, res) => {
  const id = parseInt(req.params.id as string);
  reservationService.deleteReservation(id, req.user!.id);
  res.json({ message: '예약이 삭제되었습니다.' });
});

router.post('/:id/cancel', authenticate, requireAdmin, (req, res) => {
  const id = parseInt(req.params.id as string);
  const data = cancelSchema.parse(req.body);
  const reservation = reservationService.cancelReservation(id, req.user!.id, data.reason);
  res.json(reservation);
});

router.get('/stats', authenticate, requireAdmin, (_req, res) => {
  const stats = reservationService.getStats();
  res.json(stats);
});

export default router;
