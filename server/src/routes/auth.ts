import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/connection';
import { JWT_SECRET } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/login', (req, res) => {
  const { employee_id } = req.body;

  if (!employee_id || typeof employee_id !== 'string') {
    res.status(400).json({ error: '사번을 입력해주세요.', code: 'VALIDATION_ERROR' });
    return;
  }

  const user = db.prepare(
    'SELECT * FROM users WHERE employee_id = ?'
  ).get(employee_id) as User | undefined;

  if (!user) {
    res.status(401).json({ error: '등록되지 않은 사번입니다.', code: 'UNAUTHORIZED' });
    return;
  }

  const token = jwt.sign(
    { id: user.id, employee_id: user.employee_id, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { id: user.id, employee_id: user.employee_id, name: user.name, role: user.role } });
});

export default router;
