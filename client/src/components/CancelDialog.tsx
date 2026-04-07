import { useState } from 'react';

interface Props {
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export default function CancelDialog({ onConfirm, onClose }: Props) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-red-600">예약 강제 취소</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 (필수)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="취소 사유를 입력하세요"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            닫기
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            취소 확인
          </button>
        </div>
      </div>
    </div>
  );
}
