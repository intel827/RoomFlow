import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'roomflow-dev-secret';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export { JWT_SECRET };

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.', code: 'UNAUTHORIZED' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: '관리자 권한이 필요합니다.', code: 'FORBIDDEN' });
    return;
  }
  next();
};
