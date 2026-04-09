import { useState, useCallback, useEffect } from 'react';
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
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [reservationForm, setReservationForm] = useState(false);

  useEffect(() => {
    if (!showRoomInfo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRoomInfo(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRoomInfo]);

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
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 cursor-pointer hover:shadow-md transition-shadow select-none"
        onClick={() => setShowRoomInfo(true)}
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
        <p className="mt-2 text-xs text-gray-400">클릭하여 상세 정보 · 우클릭으로 메뉴</p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 목록</h3>

      {room.reservations.length === 0 ? (
        <p className="text-sm text-gray-500">예약이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {room.reservations.map((rv) => (
            <div
              key={rv.id}
              onClick={() => rv.status === 'active' && rv.user_id === user?.id && setEditingReservation(rv)}
              className={`bg-white rounded-lg border p-4 ${
                rv.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200'
              } ${rv.status === 'active' && rv.user_id === user?.id ? 'cursor-pointer hover:border-blue-300 hover:border-2' : ''}`}
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
                  <div className="flex items-center gap-0.5">
                    {rv.user_id === user?.id && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingReservation(rv); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                          title="수정"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(rv.id); }}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                          title="삭제"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </>
                    )}
                    {isAdmin && rv.user_id !== user?.id && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCancellingId(rv.id); }}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                        title="강제 취소"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
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

      {showRoomInfo && (() => {
        const now = new Date();
        const currentMeeting = room.reservations.find(
          (rv) => rv.status === 'active' && new Date(rv.start_time) <= now && new Date(rv.end_time) > now
        );
        const nextMeeting = room.reservations.find(
          (rv) => rv.status === 'active' && new Date(rv.start_time) > now
        );
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRoomInfo(false)}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowRoomInfo(false)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3 mb-4 pr-8">
                <h2 className="text-lg font-semibold text-gray-900">{room.name}</h2>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    room.current_status === 'occupied' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${room.current_status === 'occupied' ? 'bg-red-500' : 'bg-green-500'}`} />
                  {room.current_status === 'occupied' ? '사용중' : '사용 가능'}
                </span>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>수용 인원: {room.capacity}명</p>
                {room.location && <p>위치: {room.location}</p>}
              </div>

              <hr className="mb-4" />

              {currentMeeting ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                  <p className="text-sm font-medium text-red-800">현재 진행 중인 회의</p>
                  <p className="text-sm text-red-700 mt-1">{currentMeeting.title}</p>
                  <p className="text-xs text-red-600 mt-1">
                    {format(new Date(currentMeeting.start_time), 'HH:mm')} ~ {format(new Date(currentMeeting.end_time), 'HH:mm')}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    예약자: {currentMeeting.user_name} ({currentMeeting.employee_id})
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                  <p className="text-sm font-medium text-green-800">현재 사용 가능합니다</p>
                </div>
              )}

              {nextMeeting && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
                  <p className="text-sm font-medium text-gray-700">다음 예약</p>
                  <p className="text-sm text-gray-600 mt-1">{nextMeeting.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(nextMeeting.start_time), 'M월 d일 HH:mm', { locale: ko })} ~ {format(new Date(nextMeeting.end_time), 'HH:mm')}
                  </p>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
