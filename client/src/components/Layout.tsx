import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1
            className="text-xl font-bold text-gray-900 cursor-pointer"
            onClick={() => navigate('/')}
          >
            RoomFlow
          </h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                관리자
              </span>
            )}
            <span className="text-sm text-gray-600">
              {user?.name} ({user?.employee_id})
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
