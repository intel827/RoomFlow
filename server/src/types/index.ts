export interface User {
  id: number;
  employee_id: string;
  name: string;
  role: 'user' | 'admin';
  auth_provider: 'local' | 'hiworks';
  hiworks_user_no: string | null;
  email: string | null;
  created_at: string;
}

export interface HiworksTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface HiworksUserInfo {
  user_no: string;
  name: string;
  email: string;
  id: string;
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
