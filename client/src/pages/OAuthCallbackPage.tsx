import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const { loginWithOAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const savedState = sessionStorage.getItem('oauth_state');

    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    if (!state || state !== savedState) {
      setError('유효하지 않은 인증 요청입니다.');
      return;
    }

    sessionStorage.removeItem('oauth_state');

    loginWithOAuth(code)
      .then(() => navigate('/', { replace: true }))
      .catch((err: any) => {
        setError(err.response?.data?.error || '로그인 처리 중 오류가 발생했습니다.');
      });
  }, [searchParams, loginWithOAuth, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <a href="/login" className="text-blue-600 text-sm hover:underline">
            로그인 페이지로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center">
        <p className="text-gray-600 text-sm">로그인 처리 중...</p>
      </div>
    </div>
  );
}
