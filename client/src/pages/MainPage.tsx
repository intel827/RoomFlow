import { useState, useCallback } from 'react';
import RoomGrid from '../components/RoomGrid';
import ContextMenu from '../components/ContextMenu';
import type { MenuItem } from '../components/ContextMenu';
import ReservationForm from '../components/ReservationForm';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useCreateReservation } from '../hooks/useReservations';
import type { Room } from '../types';
import api from '../api/client';

interface AddRoomFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddRoomForm({ onClose, onSuccess }: AddRoomFormProps) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(10);
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/rooms', { name, capacity, location: location || null });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">회의실 추가</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회의실 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">수용 인원</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              min={1}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">위치</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: 3층 동쪽"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">취소</button>
            <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">추가</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MainPage() {
  const { isAdmin } = useAuth();
  const createReservation = useCreateReservation();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; room: Room } | null>(null);
  const [reservationForm, setReservationForm] = useState<{ roomId: number; roomName: string } | null>(null);
  const [addRoomForm, setAddRoomForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, room: Room) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, room });
  }, []);

  const getMenuItems = (room: Room): MenuItem[] => {
    const items: MenuItem[] = [
      {
        label: '예약 추가',
        onClick: () => setReservationForm({ roomId: room.id, roomName: room.name }),
      },
    ];

    if (isAdmin) {
      items.push({
        label: '회의실 삭제',
        danger: true,
        onClick: async () => {
          if (!confirm(`"${room.name}" 회의실을 삭제하시겠습니까?`)) return;

          try {
            await api.delete(`/rooms/${room.id}`);
            setToast({ message: '회의실이 삭제되었습니다.', type: 'success' });
            window.location.reload();
          } catch (err: any) {
            if (err.response?.data?.code === 'HAS_FUTURE_RESERVATIONS') {
              if (confirm(`"${room.name}" 회의실에 예정된 예약이 존재합니다. 그래도 삭제하시겠습니까?`)) {
                try {
                  await api.delete(`/rooms/${room.id}?force=true`);
                  setToast({ message: '회의실이 삭제되었습니다.', type: 'success' });
                  window.location.reload();
                } catch {
                  setToast({ message: '회의실 삭제에 실패했습니다.', type: 'error' });
                }
              }
            } else {
              setToast({ message: '회의실 삭제에 실패했습니다.', type: 'error' });
            }
          }
        },
      });
    }

    return items;
  };

  const handleCreateReservation = async (data: { title: string; start_time: string; end_time: string }) => {
    try {
      await createReservation.mutateAsync({
        room_id: reservationForm!.roomId,
        ...data,
      });
      setReservationForm(null);
      setToast({ message: '예약이 생성되었습니다.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || '예약 생성에 실패했습니다.', type: 'error' });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">회의실 목록</h2>
        {isAdmin && (
          <button
            onClick={() => setAddRoomForm(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            회의실 추가
          </button>
        )}
      </div>

      <RoomGrid onContextMenu={handleContextMenu} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getMenuItems(contextMenu.room)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {reservationForm && (
        <ReservationForm
          roomId={reservationForm.roomId}
          roomName={reservationForm.roomName}
          onSubmit={handleCreateReservation}
          onClose={() => setReservationForm(null)}
        />
      )}

      {addRoomForm && (
        <AddRoomForm
          onClose={() => setAddRoomForm(false)}
          onSuccess={() => {
            setAddRoomForm(false);
            setToast({ message: '회의실이 추가되었습니다.', type: 'success' });
            window.location.reload();
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
