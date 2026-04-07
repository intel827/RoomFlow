# RoomFlow - 사내 회의실 예약 시스템

## 시작하기

### 사전 준비

Node.js가 설치되어 있어야 합니다. 터미널에서 확인:

```bash
node -v   # v18 이상 권장
npm -v
```

설치되어 있지 않다면 https://nodejs.org 에서 LTS 버전을 다운로드합니다.

### 최초 설치

프로젝트 폴더에서 의존성을 설치합니다:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 서버 실행

```bash
npm run dev
```

이 명령 하나로 클라이언트(화면)와 서버(API)가 동시에 실행됩니다.

- 화면: http://localhost:5173
- 서버: http://localhost:3001

브라우저에서 http://localhost:5173 을 열면 됩니다.

> 종료하려면 터미널에서 `Ctrl + C`를 누릅니다.

### 최초 실행 시 테스트 데이터 넣기

처음 실행하면 DB는 자동 생성되지만 사용자 데이터가 없어서 로그인이 안 됩니다.
테스트 데이터를 넣으려면:

```bash
npm run db:seed
```

이 명령으로 아래 계정과 회의실이 생성됩니다:

| 사번 | 이름 | 권한 |
|------|------|------|
| ADMIN001 | 관리자 | 관리자 |
| EMP001 | 김철수 | 일반 |
| EMP002 | 이영희 | 일반 |
| EMP003 | 박민수 | 일반 |

| 회의실 | 수용인원 | 위치 |
|--------|----------|------|
| 회의실 A | 6명 | 3층 동쪽 |
| 회의실 B | 10명 | 3층 서쪽 |
| 회의실 C | 4명 | 4층 동쪽 |
| 대회의실 | 20명 | 5층 |

로그인 화면에서 사번(예: `EMP001`)을 입력하면 됩니다. 비밀번호는 없습니다.

---

## 사용자 추가/관리

현재 사용자 등록 화면은 없습니다 (향후 하이웍스 SSO 연동 예정).
사용자를 추가하려면 DB에 직접 넣어야 합니다.

### SQLite CLI로 추가하기

```bash
# 서버 폴더의 DB 파일을 엽니다
sqlite3 server/roomflow.db
```

```sql
-- 일반 사용자 추가
INSERT INTO users (employee_id, name, role) VALUES ('EMP004', '홍길동', 'user');

-- 관리자 추가
INSERT INTO users (employee_id, name, role) VALUES ('ADMIN002', '김관리', 'admin');

-- 현재 사용자 목록 확인
SELECT * FROM users;

-- 나가기
.quit
```

> `sqlite3` 명령이 안 되면 macOS에서는 기본 설치되어 있으니 터미널을 다시 열어보세요.

### 사용자 삭제

```sql
-- 사번으로 삭제
DELETE FROM users WHERE employee_id = 'EMP004';
```

> 해당 사용자의 예약이 있으면 먼저 예약을 삭제해야 합니다.

---

## 데이터베이스

- **파일 위치**: `server/roomflow.db`
- 서버를 처음 실행하면 파일이 없어도 **자동으로 생성**됩니다
- DB 파일을 삭제하면 초기화됩니다 (모든 데이터 사라짐)
- 초기화 후에는 `npm run db:seed`로 테스트 데이터를 다시 넣어야 합니다

### DB 내용 직접 확인하기

```bash
sqlite3 server/roomflow.db

-- 사용자 목록
SELECT * FROM users;

-- 회의실 목록
SELECT * FROM rooms;

-- 예약 목록
SELECT r.title, rm.name as room, u.name as user, r.start_time, r.end_time, r.status
FROM reservations r
JOIN rooms rm ON r.room_id = rm.id
JOIN users u ON r.user_id = u.id;
```

---

## 장애 대응

### 서버가 안 켜져요

**증상**: `npm run dev` 했는데 에러가 나요

1. **node_modules가 없는 경우** — `npm install` 후 `cd client && npm install && cd ../server && npm install`
2. **포트가 이미 사용 중인 경우** — 이전에 종료를 안 했을 수 있습니다
   ```bash
   # 3001 포트 사용 중인 프로세스 확인
   lsof -i :3001
   # 5173 포트 사용 중인 프로세스 확인
   lsof -i :5173
   # 해당 프로세스 종료 (PID는 위 명령 결과에서 확인)
   kill -9 <PID>
   ```
3. **Node.js 버전이 너무 낮은 경우** — `node -v`로 확인, v18 이상 필요

### 로그인이 안 돼요

- 시드 데이터를 넣었는지 확인: `npm run db:seed`
- DB에 해당 사번이 있는지 확인:
  ```bash
  sqlite3 server/roomflow.db "SELECT * FROM users WHERE employee_id = '사번';"
  ```

### 화면이 안 뜨거나 API 오류가 나요

- 서버가 켜져 있는지 확인 (터미널에서 로그 확인)
- 브라우저 개발자 도구(F12) → Network 탭에서 빨간색 요청이 있는지 확인
- 서버를 껐다 다시 켜보기: `Ctrl + C` 후 `npm run dev`

### DB를 처음부터 다시 만들고 싶어요

```bash
# DB 파일 삭제
rm server/roomflow.db

# 서버 재시작 (DB 자동 생성)
npm run dev

# 다른 터미널에서 테스트 데이터 삽입
npm run db:seed
```

### 예약 데이터만 초기화하고 싶어요

```bash
sqlite3 server/roomflow.db "DELETE FROM reservations;"
```

---

## 관리자 기능

관리자 계정(`ADMIN001`)으로 로그인하면 추가 기능을 사용할 수 있습니다:

- 회의실 추가/삭제
- 다른 사람의 예약 강제 취소 (사유 작성 필수)
- 예약 통계 조회

일반 사용자는 본인 예약만 수정/삭제할 수 있습니다.

---

## 참고

- 예약은 30분 단위로만 가능합니다 (예: 09:00, 09:30, 10:00...)
- 같은 회의실에 같은 시간대 중복 예약은 불가합니다
- 로그인 세션은 8시간 후 만료됩니다 (다시 로그인하면 됩니다)
