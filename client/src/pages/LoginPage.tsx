import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

interface AuthConfig {
  hiworks_enabled: boolean;
  employee_login_enabled: boolean;
}

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmployeeLogin, setShowEmployeeLogin] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get<AuthConfig>('/auth/config').then(({ data }) => setAuthConfig(data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(employeeId.trim());
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
      setEmployeeId('');
    } finally {
      setLoading(false);
    }
  };

  const handleHiworksLogin = async () => {
    try {
      const { data } = await api.get<{ authorization_url: string }>('/auth/hiworks/config');
      const state = crypto.randomUUID();
      sessionStorage.setItem('oauth_state', state);
      window.location.href = `${data.authorization_url}&state=${state}`;
    } catch {
      setError('하이웍스 로그인 설정을 불러올 수 없습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">RoomFlow</h1>
        <p className="text-sm text-gray-500 text-center mb-6">사내 회의실 예약 시스템</p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {authConfig?.hiworks_enabled && (
          <button
            onClick={handleHiworksLogin}
            className="w-full bg-blue-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 mb-4"
          >
            하이웍스로 로그인
          </button>
        )}

        {authConfig?.hiworks_enabled && authConfig?.employee_login_enabled && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">또는</span>
            </div>
          </div>
        )}

        {authConfig?.employee_login_enabled && (
          <>
            {authConfig?.hiworks_enabled ? (
              <button
                type="button"
                onClick={() => setShowEmployeeLogin(!showEmployeeLogin)}
                className="w-full text-gray-500 text-xs hover:text-gray-700 mb-3"
              >
                {showEmployeeLogin ? '사번 로그인 닫기' : '사번으로 로그인'}
              </button>
            ) : null}

            {(!authConfig?.hiworks_enabled || showEmployeeLogin) && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사번</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    placeholder="사번을 입력하세요"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-600 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </button>
              </form>
            )}
          </>
        )}

        {authConfig && !authConfig.hiworks_enabled && !authConfig.employee_login_enabled && (
          <p className="text-sm text-gray-500 text-center">로그인 방식이 설정되지 않았습니다.</p>
        )}
      </div>
    </div>
  );
}
