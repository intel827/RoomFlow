import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRoom } from '../hooks/useRooms';
import { useUpdateReservation, useDeleteReservation, useCancelReservation } from '../hooks/useReservations';
import { useAuth } from '../context/AuthContext';
import ReservationForm from '../components/ReservationForm';
import CancelDialog from '../components/CancelDialog';
import Toast from '../components/Toast';
import type { Reservation } from '../types';

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { data: room, isLoading } = useRoom(Number(id));
  const updateReservation = useUpdateReservation();
  const deleteReservation = useDeleteReservation();
  const cancelReservation = useCancelReservation();

  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{room.name}</h2>
        <div className="mt-2 text-sm text-gray-500 space-y-1">
          <p>수용 인원: {room.capacity}명</p>
          {room.location && <p>위치: {room.location}</p>}
        </div>
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
