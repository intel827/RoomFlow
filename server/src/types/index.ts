export interface User {
  id: number;
  employee_id: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
  created_at: string;
}

export interface RoomWithStatus extends Room {
  current_status: 'available' | 'occupied';
}

export interface Reservation {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'cancelled';
  cancel_reason: string | null;
  cancelled_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface JwtPayload {
  id: number;
  employee_id: string;
  name: string;
  role: 'user' | 'admin';
}
