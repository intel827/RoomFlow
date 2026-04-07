import type { Room } from '../types';

interface Props {
  room: Room;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export default function RoomCard({ room, onClick, onContextMenu }: Props) {
  const isOccupied = room.current_status === 'occupied';

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900">{room.name}</h3>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            isOccupied
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isOccupied ? 'bg-red-500' : 'bg-green-500'
            }`}
          />
          {isOccupied ? '사용중' : '사용 가능'}
        </span>
      </div>
      <div className="text-sm text-gray-500 space-y-1">
        <p>수용 인원: {room.capacity}명</p>
        {room.location && <p>위치: {room.location}</p>}
      </div>
    </div>
  );
}
