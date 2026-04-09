import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoom } from '../hooks/useRooms';
import { useUpdateReservation, useDeleteReservation, useCancelReservation, useCreateReservation } from '../hooks/useReservations';
import { useAuth } from '../context/AuthContext';
import ReservationForm from '../components/ReservationForm';
import CancelDialog from '../components/CancelDialog';
import ContextMenu from '../components/ContextMenu';
import type { MenuItem } from '../components/ContextMenu';
import Toast from '../components/Toast';
import type { Reservation } from '../types';
import api from '../api/client';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: room, isLoading } = useRoom(Number(id));
  const updateReservation = useUpdateReservation();
  const deleteReservation = useDeleteReservation();
  const cancelReservation = useCancelReservation();
  const createReservation = useCreateReservation();

  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [reservationForm, setReservationForm] = useState(false);

  const handleRoomContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const getContextMenuItems = (): MenuItem[] => {
    if (!room) return [];
    const items: MenuItem[] = [];

    // 예약 추가
    items.push({
      label: '예약 추가',
      onClick: () => setReservationForm(true),
    });

    // 내 활성 예약이 있으면 수정/삭제 메뉴
    const myActiveReservations = room.reservations.filter(
      (rv) => rv.status === 'active' && rv.user_id === user?.id
    );
    if (myActiveReservations.length > 0) {
      const myRv = myActiveReservations[0];
      items.push({
        label: `내 예약 수정 (${myRv.title})`,
        onClick: () => setEditingReservation(myRv),
      });
      items.push({
        label: `내 예약 삭제 (${myRv.title})`,
        danger: true,
        onClick: () => handleDelete(myRv.id),
      });
    }

    // 관리자: 회의실 삭제
    if (isAdmin) {
      items.push({
        label: '회의실 삭제',
        danger: true,
        onClick: async () => {
          if (!confirm(`"${room.name}" 회의실을 삭제하시겠습니까?`)) return;
          try {
            await api.delete(`/rooms/${room.id}`);
            setToast({ message: '회의실이 삭제되었습니다.', type: 'success' });
            navigate('/');
          } catch (err: any) {
            if (err.response?.data?.code === 'HAS_FUTURE_RESERVATIONS') {
              if (confirm(`"${room.name}" 회의실에 예정된 예약이 존재합니다. 그래도 삭제하시겠습니까?`)) {
                try {
                  await api.delete(`/rooms/${room.id}?force=true`);
                  setToast({ message: '회의실이 삭제되었습니다.', type: 'success' });
                  navigate('/');
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
      await createReservation.mutateAsync({ room_id: Number(id), ...data });
      setReservationForm(false);
      setToast({ message: '예약이 생성되었습니다.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || '예약 생성에 실패했습니다.', type: 'error' });
    }
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">로딩 중...</div>;
  if (!room) return <div className="text-center py-12 text-red-500">회의실을 찾을 수 없습니다.</div>;

  const handleUpdate = async (data: { title: string; start_time: string; end_time: string }) => {
    try {
      await updateReservation.mutateAsync({ id: editingReservation!.id, ...data });
      setEditingReservation(null);
      setToast({ message: '예약이 수정되었습니다.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || '예약 수정에 실패했습니다.', type: 'error' });
    }
  };

  const handleDelete = async (reservationId: number) => {
    if (!confirm('예약을 삭제하시겠습니까?')) return;
    try {
      await deleteReservation.mutateAsync(reservationId);
      setToast({ message: '예약이 삭제되었습니다.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || '예약 삭제에 실패했습니다.', type: 'error' });
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      await cancelReservation.mutateAsync({ id: cancellingId!, reason });
      setCancellingId(null);
      setToast({ message: '예약이 취소되었습니다.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || '예약 취소에 실패했습니다.', type: 'error' });
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:text-blue-800 mb-4">
        &larr; 목록으로
      </button>

      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 cursor-context-menu select-none"
        onContextMenu={handleRoomContextMenu}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">{room.name}</h2>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
              room.current_status === 'occupied'
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                room.current_status === 'occupied' ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
            {room.current_status === 'occupied' ? '사용중' : '사용 가능'}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-500 space-y-1">
          <p>수용 인원: {room.capacity}명</p>
          {room.location && <p>위치: {room.location}</p>}
        </div>
        <p className="mt-2 text-xs text-gray-400">우클릭으로 메뉴를 열 수 있습니다</p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 목록</h3>

      {room.reservations.length === 0 ? (
        <p className="text-sm text-gray-500">예약이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {room.reservations.map((rv) => (
            <div
              key={rv.id}
              className={`bg-white rounded-lg border p-4 ${
                rv.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{rv.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(new Date(rv.start_time), 'yyyy년 M월 d일 (EEE) HH:mm', { locale: ko })}
                    {' ~ '}
                    {format(new Date(rv.end_time), 'HH:mm')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    예약자: {rv.user_name} ({rv.employee_id})
                  </p>
                  {rv.status === 'cancelled' && rv.cancel_reason && (
                    <p className="text-xs text-red-600 mt-2">
                      취소 사유: {rv.cancel_reason}
                    </p>
                  )}
                </div>
                {rv.status === 'active' && (
                  <div className="flex gap-2">
                    {rv.user_id === user?.id && (
                      <>
                        <button
                          onClick={() => setEditingReservation(rv)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(rv.id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </>
                    )}
                    {isAdmin && rv.user_id !== user?.id && (
                      <button
                        onClick={() => setCancellingId(rv.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        강제 취소
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems()}
          onClose={() => setContextMenu(null)}
        />
      )}

      {reservationForm && (
        <ReservationForm
          roomId={Number(id)}
          roomName={room.name}
          onSubmit={handleCreateReservation}
          onClose={() => setReservationForm(false)}
        />
      )}

      {editingReservation && (
        <ReservationForm
          roomId={Number(id)}
          roomName={room.name}
          reservation={editingReservation}
          onSubmit={handleUpdate}
          onClose={() => setEditingReservation(null)}
        />
      )}

      {cancellingId !== null && (
        <CancelDialog
          onConfirm={handleCancel}
          onClose={() => setCancellingId(null)}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
