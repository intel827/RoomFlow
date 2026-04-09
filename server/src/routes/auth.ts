import { Router } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db/connection';
import { JWT_SECRET } from '../middleware/auth';
import { User } from '../types';
import { exchangeCodeForToken, fetchUserInfo, getAuthorizationUrl } from '../services/hiworksAuth';

const router = Router();

function issueToken(user: User) {
  const payload = { id: user.id, employee_id: user.employee_id, name: user.name, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  return { token, user: payload };
}

// 로그인 방식 설정 반환
router.get('/config', (_req, res) => {
  res.json({
    hiworks_enabled: !!process.env.HIWORKS_CLIENT_ID,
    employee_login_enabled: process.env.ENABLE_EMPLOYEE_LOGIN === 'true',
  });
});

// 기존 사번 로그인
router.post('/login', (req, res) => {
  if (process.env.ENABLE_EMPLOYEE_LOGIN !== 'true') {
    res.status(403).json({ error: '사번 로그인이 비활성화되었습니다.', code: 'FORBIDDEN' });
    return;
  }

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

  res.json(issueToken(user));
});

// 하이웍스 OAuth2 설정 (클라이언트용)
router.get('/hiworks/config', (_req, res) => {
  if (!process.env.HIWORKS_CLIENT_ID) {
    res.status(503).json({ error: '하이웍스 SSO가 설정되지 않았습니다.', code: 'NOT_CONFIGURED' });
    return;
  }

  res.json({
    authorization_url: getAuthorizationUrl(),
    client_id: process.env.HIWORKS_CLIENT_ID,
    redirect_uri: process.env.HIWORKS_REDIRECT_URI,
  });
});

// 하이웍스 OAuth2 콜백 처리 + JIT Provisioning
router.post('/hiworks/callback', async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'authorization code가 필요합니다.', code: 'VALIDATION_ERROR' });
      return;
    }

    // 1. code → access_token 교환
    const tokenData = await exchangeCodeForToken(code);

    // 2. access_token → 사용자 정보 조회
    const hiworksUser = await fetchUserInfo(tokenData.access_token);

    // 3. JIT Provisioning
    let user: User | undefined;

    // 3-1. hiworks_user_no로 검색
    user = db.prepare(
      'SELECT * FROM users WHERE hiworks_user_no = ?'
    ).get(hiworksUser.user_no) as User | undefined;

    if (user) {
      // 이름 변경 시 업데이트
      if (user.name !== hiworksUser.name) {
        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
          .run(hiworksUser.name, hiworksUser.email, user.id);
        user.name = hiworksUser.name;
        user.email = hiworksUser.email;
      }
    } else {
      // 3-2. employee_id로 검색 (기존 로컬 계정 연동)
      user = db.prepare(
        'SELECT * FROM users WHERE employee_id = ?'
      ).get(hiworksUser.id) as User | undefined;

      if (user) {
        db.prepare(
          'UPDATE users SET hiworks_user_no = ?, auth_provider = ?, email = ?, name = ? WHERE id = ?'
        ).run(hiworksUser.user_no, 'hiworks', hiworksUser.email, hiworksUser.name, user.id);
        user.auth_provider = 'hiworks';
        user.hiworks_user_no = hiworksUser.user_no;
        user.email = hiworksUser.email;
        user.name = hiworksUser.name;
      } else {
        // 3-3. 신규 사용자 생성
        const result = db.prepare(
          `INSERT INTO users (employee_id, name, role, auth_provider, hiworks_user_no, email)
           VALUES (?, ?, 'user', 'hiworks', ?, ?)`
        ).run(hiworksUser.id, hiworksUser.name, hiworksUser.user_no, hiworksUser.email);

        user = db.prepare('SELECT * FROM users WHERE id = ?')
          .get(result.lastInsertRowid) as User;
      }
    }

    res.json(issueToken(user));
  } catch (err) {
    next(err);
  }
});

export default router;
