import { z } from 'zod';

const HIWORKS_AUTH_URL = 'https://api.hiworks.com/open/auth';
const HIWORKS_API_URL = 'https://api.hiworks.com/user/v2';

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
});

const userInfoSchema = z.object({
  data: z.object({
    user_no: z.coerce.string(),
    name: z.string(),
    email: z.string().email(),
    id: z.string(),
  }),
});

export async function exchangeCodeForToken(code: string) {
  const res = await fetch(`${HIWORKS_AUTH_URL}/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: process.env.HIWORKS_CLIENT_ID,
      client_secret: process.env.HIWORKS_CLIENT_SECRET,
      redirect_uri: process.env.HIWORKS_REDIRECT_URI,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`하이웍스 토큰 교환 실패: ${res.status} ${text}`);
  }

  const json = await res.json();
  return tokenResponseSchema.parse(json);
}

export async function fetchUserInfo(accessToken: string) {
  const res = await fetch(`${HIWORKS_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`하이웍스 사용자 정보 조회 실패: ${res.status} ${text}`);
  }

  const json = await res.json();
  const parsed = userInfoSchema.parse(json);
  return parsed.data;
}

export function getAuthorizationUrl() {
  const clientId = process.env.HIWORKS_CLIENT_ID;
  const redirectUri = process.env.HIWORKS_REDIRECT_URI;
  return `${HIWORKS_AUTH_URL}/authform?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri || '')}&response_type=code`;
}
