# Roommate — 개발 계획서 (`plan.md`)

## 1. 프로젝트 개요

- **프로젝트명**: `roommate`
- **목적**: 여러 대학교 및 지역의 대학생을 대상으로 한 **범용 룸메이트 매칭 웹 애플리케이션** (과제 시연용)
- **지원 주거 유형**:
  - **기숙사**: 같은 학교 소속 학생 매칭
  - **자취 / 쉐어**: 희망 지역·예산·입주 시기 기반 매칭
  - 사용자는 프로필 및 모집글에서 주거 유형을 선택 가능

---

## 2. 기술 스택 및 아키텍처

| 영역         | 선택 기술                                          | 비고                                                                            |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------------------- |
| 프레임워크   | SvelteKit 3 + Svelte 5 (Runes 모드) + TypeScript   | 단일 풀스택 리포지토리                                                          |
| 데이터베이스 | **SQLite** (로컬 파일 DB) + **Drizzle ORM**        | 외부 DB 설치 없이 즉시 실행·시연 가능 (`data/roommate.db`)                      |
| 실시간 통신  | **SSE (Server-Sent Events)**                       | SvelteKit `+server.ts` 기반 1:1 실시간 채팅 스트림 (`?after=` 재연결 누락 방지) |
| 인증/세션    | HTTP-only 세션 쿠키 (`sessions` 테이블)            | 과제 시연용 원클릭 가입, 학교명 직접 선택                                       |
| 파일 저장    | 로컬 파일 시스템 (`data/uploads/`) + 전용 API 서빙 | 프로필 사진 최대 6장 업로드·순서 변경·삭제                                      |
| 스타일링     | **순수 CSS** + CSS 커스텀 프로퍼티(디자인 토큰)    | 모바일 우선, 데스크톱에서는 최대 `430px` 중앙 정렬 프레임                       |

---

## 3. 정보 구조(IA) 및 라우트·API 설계

하단 플로팅 탭바(`Navigator.svelte`)는 5개 탭으로 구성하며, 현재 경로(`page.url.pathname`)와 활성 탭을 자동 연동한다.

### 3.1 페이지 라우트 (`+page.server.ts` `load` + Form Actions 중심)

페이지 조회는 `+page.server.ts`의 `load()` + URL 쿼리스트링으로 처리하고, 폼 제출·상태 변경은 SvelteKit Form Actions(`use:enhance`)로 처리해 중복 REST API와 수동 상태 동기화를 줄인다.

- **인증**
  - `/login` — 로그인 (`load` + `actions.default`)
  - `/signup` — 회원가입 (기본 정보 + 학교명 직접 선택 후 버튼 클릭 시 즉시 가입 및 세션 발급)
  - `/logout` — 로그아웃 액션 (`POST`)
- **메인 5탭**
  1. `/discover` (**탐색**): URL 쿼리스트링 기반 다중 필터링 + 생활습관 일치율(%) 계산 (`load`), 관심 보내기(짧은 메시지 선택)/패스, 빈 상태 시 **패스한 후보 다시 보기(초기화)** 제공
  2. `/posts` (**모집글**): 룸메 구하기 게시판 목록 + 조건 필터 (`load`)
     - `/posts/new` — 모집글 작성 (Form Action)
     - `/posts/[id]` — 모집글 상세 + 작성자 프로필 요약 카드 + 바로 관심 보내기 (작성자 본인일 경우 삭제/모집상태 변경 Action)
     - `/posts/[id]/edit` — 모집글 수정 (Form Action)
  3. `/likes` (**관심**): 내가 받은 관심(짧은 메시지 포함) 목록 및 수락/거절 Form Action (보낸 관심 상태 탭 포함)
  4. `/matches` (**매칭**): 상호 매칭 성사 목록 (상대 첫 번째 사진 또는 대체 아바타 + 최근 메시지 미리보기)
     - `/matches/[id]` — 1:1 실시간 인앱 채팅방 (초기 메시지 `load` + SSE 실시간 스트림)
  5. `/profile` (**내 프로필**): 내 기본 정보·주거 선호 조건·11개 생활습관(`profile_traits`) 편집 (Form Action), 프로필 사진 관리(최대 6장 업로드/순서 변경/삭제), 로그아웃
- **리다이렉트 / 정리**
  - `/` — 로그인 상태면 `/discover`, 비로그인 시 `/login`으로 이동
  - `/usertest` — 기존 UI 프로토타입 실험 페이지 (정식 구현 완료 후 제거)

### 3.2 전용 `+server.ts` API 엔드포인트 (공용·바이너리·실시간 전용)

여러 페이지에서 공통 호출하거나 파일 업로드·스트리밍이 필요한 작업만 `/api/*`로 유지한다.

- **공용 탐색/매칭 인터랙션**
  - `POST /api/likes` — 관심 보내기 (탐색·모집글 공용, 선택적 짧은 메시지 포함, 역방향 `pending` 존재 시 자동 매칭 성사 및 `{ matched: true, matchId }` 반환)
  - `POST /api/passes` — 탐색에서 패스 처리
  - `DELETE /api/passes` — 내 패스 기록 초기화 ("패스한 후보 다시 보기")
- **프로필 사진 업로드 및 서빙**
  - `POST /api/profile/photos` — 사진 업로드 (최대 6장 제한)
  - `PATCH /api/profile/photos/reorder` — 사진 표시 순서(`display_order`) 트랜잭션 재할당
  - `DELETE /api/profile/photos/[photoId]` — 사진 삭제 및 순서 정리
  - `GET /api/uploads/[key]` — 업로드된 이미지 바이너리 서빙
- **실시간 1:1 채팅**
  - `POST /api/matches/[matchId]/messages` — 메시지 저장 및 SSE 브로드캐스트 (매칭 참여자 권한 검증 필수)
  - `GET /api/matches/[matchId]/stream?after=<timestamp>` — 1:1 실시간 채팅 SSE 스트림 (권한 검증 + 재연결 시 `after` 이후 누락 메시지 복구)

---

## 4. 핵심 기능 상세 스펙

### 4.1 회원가입 및 로그인 (과제 시연 최적화)

- 일반 앱과 동일한 로그인/회원가입 UI를 제공한다.
- 별도의 이메일 인증 없이 **회원가입 버튼 클릭 시 즉시 계정이 생성**되고 HTTP-only 세션 쿠키가 설정된다.
- 학교명(`school`)은 주요 대학 프리셋 목록 + 직접 입력을 지원한다.
- 지역(`preferred_region` / `region`)은 필터링 일관성을 위해 **표준 권역 프리셋 목록**(`src/lib/domain/constants.ts`)으로 통일해 관리한다.

### 4.2 프로필 및 사진 규칙

- **한 줄 소개(bio)는 두지 않는다.** 프로필은 기본 정보, 주거 선호, 프로필 사진(선택), 11개 생활습관으로 구성한다.
- **프로필 사진**:
  - 최대 **6장**까지 업로드 가능하며, **순서 변경(`display_order`)** 및 **삭제**를 지원한다.
  - **사진을 등록하지 않은 경우**, 프로필 카드(`/discover`, `/posts/[id]`, `/likes`)에서 **사진 영역 자체를 렌더링하지 않는다.**
  - **채팅 목록 및 채팅창의 작은 원형 프로필 이미지**에는 등록된 **첫 번째 사진**(`display_order` 최소값)을 사용하며, 등록된 사진이 없으면 **기본 대체 이미지**(`fallback.svg`)를 표시한다.

### 4.3 생활습관(`profile_traits`) 11개 항목 및 일치율 계산

기존 `README.md`에 정의된 11개 지표를 `src/lib/domain/traits.ts`에 상수·타입·한글 질문·선택지 라벨·아이콘 키와 함께 중앙화한다.

1. `sleep_schedule` (취침 시간): `early` | `regular` | `late` | `varies`
2. `wake_up_schedule` (기상 시간): `very_early` | `early` | `regular` | `late` | `varies`
3. `cleanliness` (청결/정리 빈도): `very_tidy` | `tidy` | `relaxed` | `messy`
4. `noise_tolerance` (소음 민감도): `sensitive` | `normal` | `tolerant`
5. `lights_out` (소등 시간): `early` | `regular` | `late` | `no_preference`
6. `smoking` (흡연 빈도): `no` | `occasionally` | `often`
7. `drinking` (음주 빈도): `no` | `occasionally` | `often` | `prefer_not_to_say`
8. `room_food` (방 안 취식): `rarely` | `sometimes` | `often`
9. `weekend_routine` (주말 루틴): `mostly_out` | `mostly_in` | `mixed`
10. `snoring` (코골이): `never` | `occasionally` | `often` | `unsure`
11. `room_call_frequency` (방 안 통화): `rarely` | `sometimes` | `often`

- **생활습관 일치율(%) 계산**:
  - 두 사용자 모두 응답한 항목(단, `prefer_not_to_say` / `unsure`는 모수에서 제외)을 비교한다.
  - 순서형 지표는 완전 일치 시 `1.0`, 인접 단계 시 `0.5`, 그 외 `0.0`으로 점수화하며, `no_preference`는 높은 호환성(`0.9`), `varies`는 중간 호환성(`0.5`)을 부여한다.
  - 최종 점수를 백분율(0~100%)로 환산해 프로필 카드 상단 배지로 표시한다. 비교 가능한 항목이 없으면 `null`(미산출)로 처리한다.

### 4.4 탐색 및 다중 필터 (`/discover`)

- **기본 필터**: 내 성별과 동일한 **동성 필터를 기본 적용**하되, 필터 바텀시트에서 성별 조건(`동성` / `전체` / `남성` / `여성`)을 변경할 수 있다.
- **지원 필터 항목**:
  - 성별, 주거 유형(`전체` / `기숙사` / `자취·쉐어`), 학교명(DB에 존재하는 학교 + 프리셋), 희망 지역(표준 권역 목록), 보증금/월세 상한, 11개 생활습관 다중 선택
- **인터랙션**:
  - 후보가 모두 소진된 빈 상태 화면에 **"패스한 후보 다시 보기"** 버튼을 제공해 시연 중 원활하게 재탐색할 수 있도록 한다.
  - **관심 보내기**: 선택적으로 짧은 메시지를 입력하는 바텀시트 오픈 → `POST /api/likes` 호출.
  - **패스**: `POST /api/passes` 호출 후 다음 후보로 이동.

### 4.5 룸메 구하기 모집글 (`/posts`)

- **게시글 구성**: 주거 유형(`dorm` / `off_campus`), 학교명, 희망 지역(표준 권역), 보증금/월세 예산, 입주 희망 시기, 제목, 본문, 모집 상태(`open` / `closed`).
- **필터 및 연동**: 주거 유형, 학교/지역, 예산, 모집중만 보기 필터링 제공. 상세 페이지에서 작성자 프로필 요약 카드(메타데이터, 일치율 %, 주요 생활습관) 및 **바로 관심 보내기** 버튼 연동.

### 4.6 관심·매칭 및 실시간 1:1 채팅 (`/likes`, `/matches`)

- **상호 관심 자동 매칭**: A→B 관심이 `pending`인 상태에서 B가 A에게 관심을 보내면 자동으로 매칭을 생성하고 기존 관심을 `accepted`로 전환한다.
- **관심 수락**: `/likes`에서 수락 시 `matches` 레코드를 생성하고, 상대가 남긴 짧은 메시지(`likes.message`)가 있으면 채팅방의 첫 메시지로 자동 기록한다.
- **실시간 1:1 채팅 (`/matches/[id]`)**:
  - 서버 메모리 구독 맵(EventEmitter) + SSE(`/api/matches/[matchId]/stream`)로 메시지 저장과 동시에 상대방 클라이언트에 즉시 푸시한다.
  - 모든 채팅 조회/전송/SSE 구독 요청에서 현재 로그인 사용자가 해당 `match`의 참여자(`user_a_id` 또는 `user_b_id`)인지 반드시 검증한다.
  - SSE 재연결 시 `?after=<lastCreatedAt>` 쿼리를 통해 끊김 사이 누락된 메시지를 자동 보충한다.

---

## 5. 데이터베이스 스키마 설계 (SQLite + Drizzle ORM)

- **`users`**:
  - `id` (TEXT PK, UUID)
  - `email` (TEXT UNIQUE NOT NULL)
  - `password_hash` (TEXT NOT NULL)
  - `nickname` (TEXT NOT NULL)
  - `sex` (TEXT NOT NULL — `'male' | 'female'`)
  - `birth_year` (INTEGER NOT NULL)
  - `admission_year` (INTEGER NOT NULL)
  - `school` (TEXT NOT NULL)
  - `major` (TEXT NOT NULL)
  - `housing_type` (TEXT NOT NULL — `'dorm' | 'off_campus' | 'both'`)
  - `preferred_region` (TEXT)
  - `budget_deposit` (INTEGER)
  - `budget_monthly` (INTEGER)
  - `move_in_timing` (TEXT)
  - `created_at` (INTEGER NOT NULL)
- **`sessions`**:
  - `id` (TEXT PK), `user_id` (FK → `users.id` ON DELETE CASCADE), `expires_at` (INTEGER NOT NULL)
- **`profile_photos`**:
  - `id` (TEXT PK, UUID)
  - `user_id` (FK → `users.id` ON DELETE CASCADE)
  - `storage_key` (TEXT NOT NULL)
  - `display_order` (INTEGER NOT NULL)
  - `created_at` (INTEGER NOT NULL)
  - INDEX `(user_id, display_order)` _(SQLite 재정렬 시 UNIQUE 충돌 방지를 위해 일반 인덱스 사용, 트랜잭션 내 `0..N-1` 재할당)_
- **`profile_traits`**:
  - `user_id` (TEXT PK, FK → `users.id` ON DELETE CASCADE)
  - 11개 trait 컬럼 (`sleep_schedule`, `wake_up_schedule`, `cleanliness`, `noise_tolerance`, `lights_out`, `smoking`, `drinking`, `room_food`, `weekend_routine`, `snoring`, `room_call_frequency`)
- **`posts`**:
  - `id` (TEXT PK, UUID)
  - `author_id` (FK → `users.id` ON DELETE CASCADE)
  - `housing_type` (TEXT NOT NULL — `'dorm' | 'off_campus'`)
  - `school` (TEXT)
  - `region` (TEXT)
  - `budget_deposit` (INTEGER)
  - `budget_monthly` (INTEGER)
  - `move_in_timing` (TEXT)
  - `title` (TEXT NOT NULL)
  - `content` (TEXT NOT NULL)
  - `status` (TEXT NOT NULL DEFAULT `'open'` — `'open' | 'closed'`)
  - `created_at` (INTEGER NOT NULL), `updated_at` (INTEGER NOT NULL)
  - INDEX `(status, created_at)`
- **`likes`**:
  - `id` (TEXT PK, UUID)
  - `from_user_id` (FK → `users.id` ON DELETE CASCADE)
  - `to_user_id` (FK → `users.id` ON DELETE CASCADE)
  - `post_id` (FK → `posts.id` ON DELETE SET NULL, nullable)
  - `message` (TEXT, nullable)
  - `status` (TEXT NOT NULL DEFAULT `'pending'` — `'pending' | 'accepted' | 'rejected'`)
  - `created_at` (INTEGER NOT NULL)
  - UNIQUE `(from_user_id, to_user_id)`
  - INDEX `(to_user_id, status)`
- **`passes`**:
  - `from_user_id` (FK → `users.id` ON DELETE CASCADE)
  - `to_user_id` (FK → `users.id` ON DELETE CASCADE)
  - `created_at` (INTEGER NOT NULL)
  - PK `(from_user_id, to_user_id)`
- **`matches`**:
  - `id` (TEXT PK, UUID)
  - `user_a_id` (FK → `users.id` ON DELETE CASCADE)
  - `user_b_id` (FK → `users.id` ON DELETE CASCADE)
  - `created_at` (INTEGER NOT NULL)
  - UNIQUE `(user_a_id, user_b_id)` (항상 `user_a_id < user_b_id` 정렬 저장)
- **`messages`**:
  - `id` (TEXT PK, UUID)
  - `match_id` (FK → `matches.id` ON DELETE CASCADE)
  - `sender_id` (FK → `users.id` ON DELETE CASCADE)
  - `content` (TEXT NOT NULL)
  - `created_at` (INTEGER NOT NULL)
  - INDEX `(match_id, created_at)`

---

## 6. 시드 데이터 전략

- 앱 첫 요청 시(DB에 유저가 0명이면 자동 1회 실행) 또는 `npm run db:seed` 실행 시 데모 데이터를 생성한다.
- **구성**:
  - 여러 대학교(연세대, 고려대, 서울대, 한양대, 성균관대, 서강대 등) 및 남/여 각 6~7명씩 **가상 유저 14명**
  - 기숙사/자취/둘 다 유형을 골고루 분포시키고, 11개 생활습관을 뚜렷한 페르소나로 다양하게 설정
  - 일부 유저는 샘플 SVG/이미지 프로필 사진 보유, 일부 유저는 사진 미등록(사진 미표시 규칙 & 채팅 기본 대체 아바타 확인 가능)
  - 다양한 조건의 **룸메 구하기 모집글 10건** (모집중/모집완료 포함)
  - 시드 유저 간 기본 로그인 테스트 계정 제공 (비밀번호 통일, 일반 로그인 화면에서 바로 로그인 가능)

---

## 7. UI / 디자인 시스템 방침

- **순수 CSS 유지**: `src/app.css`에 컬러, 타이포그래피, 라운딩, 간격, 그림자 디자인 토큰 정의.
- **모바일 앱 프레임**: 데스크톱 뷰포트에서는 중앙 정렬된 최대 너비 `430px` 컨테이너로 표시하고, 모바일 기기에서는 전체 화면(`100dvh`)으로 자연스럽게 동작하도록 구성.
- **기존 컴포넌트 고도화**:
  - `Navigator.svelte`: 5개 정식 탭(`탐색`, `모집글`, `관심`, `매칭`, `프로필`), 현재 URL 기준 활성 표시, 미확인 관심 배지 지원.
  - `ProfileCard.svelte` & `MetadataRow.svelte`: 실제 유저/생활습관/일치율 props 기반 재사용 컴포넌트로 정비.

---

## 8. 단계별 구현 로드맵

### Phase 1. 기반 인프라 & 도메인 모델

- [x] SQLite + Drizzle ORM 패키지 설치 및 DB 연결·테이블 초기화 설정 (`src/lib/server/db/`)
- [x] `src/lib/domain/constants.ts` (학교/지역 프리셋, 주거유형) 및 `src/lib/domain/traits.ts` (11개 생활습관 상수, 한글 라벨, 질문, 일치율 계산 유틸) 구현
- [x] 시드 모듈(`src/lib/server/db/seed.ts`) 작성 및 데모 유저·모집글·샘플 사진 자동 시딩
- [x] 세션 쿠키 인증(`src/lib/server/auth.ts`, `src/hooks.server.ts`, `src/app.d.ts`) 및 `/login`, `/signup`, `/logout`, `/` 리다이렉트 구현

### Phase 2. 디자인 시스템 & 공통 레이아웃 정비

- [x] `src/app.css` 디자인 토큰 및 데스크톱 `430px` 모바일 프레임 레이아웃 구축 (`src/app.html` `lang="ko"` 포함)
- [x] `+layout.svelte`, `+layout.server.ts`, `Navigator.svelte` 정비 (5탭 라우트 연결, 미확인 관심 배지, 인증 페이지에서는 탭바 숨김)
- [x] 공용 컴포넌트(`ProfileCard`, `MetadataRow`, `Avatar`, `BottomSheet`, `Header`) 구현

### Phase 3. 내 프로필 & 사진 관리 (`/profile`)

- [x] 기본 정보, 주거 선호 조건, 11개 생활습관 설문 편집 Form Action 구현 (가입 직후 `/profile?onboarding=1` 온보딩 구성 단계 연동 포함)
- [x] 로컬 파일 업로드 API (`/api/profile/photos`, `/api/profile/photos/reorder`, `/api/profile/photos/[photoId]`, `/api/uploads/[key]`) 구현
- [x] 최대 6장 사진 업로드, 순서 변경, 삭제 UI 구현

### Phase 4. 탐색 & 다중 필터 (`/discover`)

- [x] 다중 필터(기본 동성 + 성별 변경, 주거유형, 학교/지역, 예산, 11개 생활습관) 조회 및 일치율(%) 계산 구현
- [x] 필터 바텀시트 UI 및 후보 카드 탐색 화면 구현 (사진 미등록 시 사진 영역 미표시)
- [x] 공용 `POST /api/likes`(상호 관심 자동 매칭 포함), `POST /api/passes`, `DELETE /api/passes`(다시 보기) 연동

### Phase 5. 룸메 구하기 모집글 (`/posts`)

- [x] 모집글 목록 + 조건 필터 UI 및 Form Actions CRUD 구현
- [x] 모집글 작성(`/posts/new`), 수정(`/posts/[id]/edit`), 모집 상태 전환 구현
- [x] 모집글 상세(`/posts/[id]`)에 작성자 프로필 요약 카드 및 바로 관심 보내기 연동

### Phase 6. 관심 수락·매칭 & 실시간 채팅 (`/likes`, `/matches`)

- [x] 받은 관심 목록(`/likes`) 및 수락/거절 Action 연동 (수락 시 `matches` 생성 + 짧은 메시지 첫 채팅 기록)
- [x] 매칭 목록(`/matches`) — 첫 번째 프로필 사진 또는 기본 대체 아바타 + 마지막 메시지 표시
- [x] SSE 기반 실시간 1:1 채팅(`/matches/[id]`, `/api/matches/[matchId]/messages`, `/api/matches/[matchId]/stream?after=...`) 구현

### Phase 7. 시연 점검 및 마무리

- [ ] 두 개의 브라우저 세션(일반 창 + 시크릿 창)으로 전체 시나리오 E2E 점검
- [ ] 프로토타입 라우트(`/usertest`) 정리 및 `npm run check`, `npm run lint` 통과 확인
