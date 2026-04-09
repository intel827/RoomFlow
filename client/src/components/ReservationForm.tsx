import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Reservation } from '../types';

interface Props {
  roomId: number;
  roomName: string;
  reservation?: Reservation | null;
  onSubmit: (data: { title: string; start_time: string; end_time: string }) => void;
  onClose: () => void;
}

const ALL_TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 8; h < 18; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('18:00');
  return slots;
})();

const getAvailableTimeSlots = (selectedDate: string, preserveSlots?: string[]) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  if (selectedDate !== today) return ALL_TIME_SLOTS;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  // 다음 30분 단위로 올림 (예: 12:31 → 13:00)
  const nextSlotMinutes = Math.ceil(currentMinutes / 30) * 30;

  return ALL_TIME_SLOTS.filter((slot) => {
    if (preserveSlots?.includes(slot)) return true;
    const [h, m] = slot.split(':').map(Number);
    return h * 60 + m >= nextSlotMinutes;
  });
};

export default function ReservationForm({ roomId: _roomId, roomName, reservation, onSubmit, onClose }: Props) {
  const [initialized, setInitialized] = useState(!reservation);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const preserveSlots = reservation
    ? [format(new Date(reservation.start_time), 'HH:mm'), format(new Date(reservation.end_time), 'HH:mm')]
    : undefined;
  const availableSlots = getAvailableTimeSlots(date, preserveSlots);

  useEffect(() => {
    if (reservation) {
      setTitle(reservation.title);
      const start = new Date(reservation.start_time);
      const end = new Date(reservation.end_time);
      setDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndTime(format(end, 'HH:mm'));
      setInitialized(true);
    }
  }, [reservation]);

  // 날짜 변경 시 선택된 시간이 가용 슬롯에 없으면 첫 번째 슬롯으로 리셋
  useEffect(() => {
    if (!initialized) return;
    if (availableSlots.length === 0) return;
    if (!availableSlots.includes(startTime)) {
      setStartTime(availableSlots[0]);
      setEndTime(availableSlots.length > 1 ? availableSlots[1] : availableSlots[0]);
    } else if (!availableSlots.includes(endTime) || endTime <= startTime) {
      const startIdx = availableSlots.indexOf(startTime);
      setEndTime(availableSlots[Math.min(startIdx + 1, availableSlots.length - 1)]);
    }
  }, [date, availableSlots, startTime, endTime, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);

    if (start < new Date()) {
      alert('현재 시각 이전으로는 예약할 수 없습니다.');
      return;
    }

    onSubmit({ title, start_time: start.toISOString(), end_time: end.toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold mb-4 pr-8">
          {reservation ? '예약 수정' : '새 예약'} - {roomName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">회의 제목</label>
              <span className={`text-xs ${title.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="회의 제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onFocus={(e) => e.target.showPicker()}
              onKeyDown={(e) => e.preventDefault()}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableSlots.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {reservation ? '수정' : '예약'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
