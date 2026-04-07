import { useNavigate } from 'react-router-dom';
import { useRooms } from '../hooks/useRooms';
import RoomCard from './RoomCard';
import type { Room } from '../types';

interface Props {
  onContextMenu: (e: React.MouseEvent, room: Room) => void;
}

export default function RoomGrid({ onContextMenu }: Props) {
  const { data: rooms, isLoading, error } = useRooms();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">회의실 목록을 불러올 수 없습니다.</div>;
  }

  if (!rooms?.length) {
    return <div className="text-center py-12 text-gray-500">등록된 회의실이 없습니다.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onClick={() => navigate(`/rooms/${room.id}`)}
          onContextMenu={(e) => onContextMenu(e, room)}
        />
      ))}
    </div>
  );
}
