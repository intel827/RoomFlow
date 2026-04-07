import db from './connection';

const seedData = () => {
  // Clear existing data
  db.exec('DELETE FROM reservations');
  db.exec('DELETE FROM rooms');
  db.exec('DELETE FROM users');

  // Seed users
  const insertUser = db.prepare(
    'INSERT INTO users (employee_id, name, role) VALUES (?, ?, ?)'
  );
  insertUser.run('ADMIN001', '관리자', 'admin');
  insertUser.run('EMP001', '김철수', 'user');
  insertUser.run('EMP002', '이영희', 'user');
  insertUser.run('EMP003', '박민수', 'user');

  // Seed rooms
  const insertRoom = db.prepare(
    'INSERT INTO rooms (name, capacity, location) VALUES (?, ?, ?)'
  );
  insertRoom.run('회의실 A', 6, '3층 동쪽');
  insertRoom.run('회의실 B', 10, '3층 서쪽');
  insertRoom.run('회의실 C', 4, '4층 동쪽');
  insertRoom.run('대회의실', 20, '5층');

  console.log('Seed data inserted successfully.');
};

seedData();
