export type User = {
  id: number;
  employee_id: string;
  name: string;
  role: 'user' | 'admin';
};

export type Room = {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
  current_status: 'available' | 'occupied';
};

export type Reservation = {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'cancelled';
  cancel_reason: string | null;
  cancelled_by: number | null;
  user_name?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
};

export type RoomDetail = Room & {
  reservations: Reservation[];
};
