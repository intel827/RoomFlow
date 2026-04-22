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

### Node.js 버전을 바꾼 뒤로 서버가 안 켜져요

**증상**: `nvm use`로 Node 버전을 바꾸거나 새 버전을 설치한 뒤 서버 실행 시 아래와 비슷한 오류가 나옵니다.

```
Error: The module '.../better_sqlite3.node' was compiled against a different Node.js version
using NODE_MODULE_VERSION XXX. This version of Node.js requires NODE_MODULE_VERSION YYY.
```

**원인**: `better-sqlite3`는 네이티브 애드온(C++로 작성된 모듈)이라 설치 시점의 Node.js ABI 버전에 맞춰 컴파일됩니다. Node.js 주 버전이 바뀌면 ABI 번호도 바뀌어서 기존 바이너리가 새 Node와 호환되지 않습니다 (예: Node 20 → 115, Node 22 → 127, Node 24 → 137).

**해결**: 네이티브 모듈만 현재 Node 버전으로 재컴파일합니다.

```bash
cd server
npm rebuild better-sqlite3
```

그래도 해결되지 않으면 `node_modules`를 통째로 재설치하세요.

```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

> 프로젝트 루트에 `.nvmrc` 파일로 Node 버전을 고정해두면, 본인이나 팀원이 다른 환경에서 작업할 때 `nvm use` 한 번으로 자동 전환됩니다.
> ```bash
> echo "24" > .nvmrc
> ```

### "로그인 방식이 설정되지 않았습니다"라고 나와요

**증상**: 로그인 화면에 `로그인 방식이 설정되지 않았습니다`라는 문구만 보이고 사번 입력 폼이나 하이웍스 로그인 버튼이 아예 뜨지 않습니다.

**원인**: `server/.env` 파일이 없어서 사번 로그인과 하이웍스 SSO가 둘 다 비활성 상태입니다. 서버는 `ENABLE_EMPLOYEE_LOGIN=true`일 때만 사번 로그인을, `HIWORKS_CLIENT_ID`가 있을 때만 하이웍스 SSO를 노출합니다. 둘 다 꺼져 있으면 프론트엔드가 위 메시지를 표시합니다.

**해결**: `server/.env.example`을 `.env`로 복사하면 기본값이 주입됩니다.

```bash
cp server/.env.example server/.env
```

복사 후 서버를 재시작하세요 (`Ctrl + C` → `npm run dev`). 서버 기동 로그에 `injected env (5) from .env`가 보이면 환경변수가 정상 주입된 것입니다.

> 하이웍스 SSO까지 사용하려면 `server/.env`의 `HIWORKS_CLIENT_ID`와 `HIWORKS_CLIENT_SECRET`에 발급받은 값을 채운 뒤 서버를 재시작하세요. 비워두면 사번 로그인만 활성화됩니다.

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
