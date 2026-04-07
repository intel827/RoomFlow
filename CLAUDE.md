# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RoomFlow는 사내 회의실 예약 시스템입니다. 회의실을 시각적으로 보여주고, 우클릭으로 예약 CRUD, 관리자는 회의실 추가/삭제 및 예약 강제 취소가 가능합니다.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via `better-sqlite3` (동기식, 트랜잭션으로 중복 예약 방지)
- **State**: `@tanstack/react-query` (서버 상태, 30초 폴링) + React Context (인증)
- **Validation**: `zod` (서버 요청 검증)

## Commands

```bash
# 개발 서버 (클라이언트 + 서버 동시 실행)
npm run dev

# 개별 실행
npm run dev:client    # Vite dev server (port 5173)
npm run dev:server    # Express server (port 3001)

# DB 시드 데이터 삽입
npm run db:seed

# 빌드
npm run build

# 타입 체크
cd server && npx tsc --noEmit
cd client && npx tsc --noEmit
```

## Architecture

모노레포 구조: `client/` (React SPA) + `server/` (Express API).

**Backend 구조**: `routes/` → `services/` → `db/`. 별도 repository 레이어 없이 서비스에서 `better-sqlite3` prepared statements 직접 사용. 중복 예약 방지는 `db.transaction()`의 BEGIN IMMEDIATE로 원자성 보장.

**Frontend 구조**: `pages/` (라우트별 페이지) + `components/` (재사용 UI) + `hooks/` (react-query 래퍼) + `context/` (인증). API 호출은 `api/client.ts`의 axios 인스턴스를 통해 이루어지며, JWT 토큰 자동 첨부 및 401 시 로그인 리다이렉트 처리.

**인증**: 사번 입력으로 로그인 → JWT 발급 (8시간 만료). 향후 하이웍스 OAuth2 SSO 연동 예정. `users` 테이블의 `employee_id`가 기본 식별자.

**회의실 상태**: DB에 저장하지 않고 쿼리 시 `datetime('now')` 기준으로 계산.

## Business Rules

- 예약 시간: 30분 단위 (분은 0 또는 30만 허용)
- 중복 예약 불가 (트랜잭션 내 overlap 체크)
- 관리자만 회의실 추가/삭제 가능
- 관리자만 예약 강제 취소 가능 (사유 필수, soft-delete로 이력 보존)
- 일반 사용자는 본인 예약만 수정/삭제 가능

## Test Accounts (시드 데이터)

- `ADMIN001` — 관리자
- `EMP001`, `EMP002`, `EMP003` — 일반 사용자
