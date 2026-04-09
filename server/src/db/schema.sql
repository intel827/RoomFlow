CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id     TEXT    NOT NULL UNIQUE,
  name            TEXT    NOT NULL,
  role            TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  auth_provider   TEXT    NOT NULL DEFAULT 'local' CHECK(auth_provider IN ('local', 'hiworks')),
  hiworks_user_no TEXT    UNIQUE,
  email           TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL UNIQUE,
  capacity   INTEGER NOT NULL DEFAULT 10,
  location   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reservations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id       INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  title         TEXT    NOT NULL CHECK(length(title) <= 100),
  start_time    TEXT    NOT NULL,
  end_time      TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
  cancel_reason TEXT    CHECK(cancel_reason IS NULL OR length(cancel_reason) <= 200),
  cancelled_by  INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
