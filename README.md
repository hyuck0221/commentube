<p align="center">
  <img src="./public/logo.png" alt="Commentube logo" width="96" />
</p>

<h1 align="center">Commentube</h1>

<p align="center">
  YouTube 댓글을 빠르게 수집하고, 방송과 숏폼에 어울리는 댓글 기반 미니게임으로 바꾸는 웹 서비스입니다.
</p>

---

## 서비스 개요

Commentube는 YouTube 영상 링크 하나로 영상 정보를 분석하고, 댓글을 모아 바로 플레이 가능한 게임을 제공합니다. 현재는 `댓글 배틀`과 AI 기반 `진짜 댓글 찾기`를 지원합니다.

## 게임 모드

### 댓글 배틀

좋아요 수가 비슷한 댓글 두 개를 보여주고, 더 많은 좋아요를 받은 댓글을 맞히는 게임입니다.

- 영상 썸네일과 영상 정보를 상단에 표시합니다.
- 좋아요가 어느 정도 있는 댓글을 우선 후보로 사용합니다.
- 초반에는 좋아요가 높은 댓글을 랜덤하게 섞고, 후반으로 갈수록 낮은 좋아요 구간으로 내려갑니다.
- 정답을 고르면 양쪽 댓글의 좋아요 수가 공개됩니다.
- 틀릴 때까지 연속 정답 수를 기록합니다.

### 진짜 댓글 찾기

실제 댓글 사이에 AI가 작성한 댓글 하나를 숨겨두고, 사용자가 AI 댓글을 찾아내는 게임입니다.

- 시작 전 후보 개수를 `2~10개` 중 선택할 수 있습니다.
- 실제 댓글 최대 50개를 AI 학습 샘플로 전달해 영상 댓글 분위기를 반영합니다.
- AI 댓글에는 타임스탬프를 넣지 않도록 지시합니다.
- AI 댓글의 작성자명은 실제 댓글 작성자 중 하나를 빌려 사용합니다.
- 같은 라운드 안에서는 작성자명이 중복되지 않도록 구성합니다.
- 준비된 AI 댓글이 소진되면 새 배치를 생성합니다.

## 주요 기능

- YouTube 영상 링크 분석
- 제목, 채널, 썸네일, 길이, 조회수, 좋아요 수, 댓글 수 표시
- 댓글 100개 이상 영상만 게임 플레이 허용
- YouTube API key 다중 등록 및 라운드로빈 사용
- `relevance`, `time` 정렬 댓글을 병렬 수집 후 중복 제거
- 영상별 댓글 결과 30분 인메모리 캐싱
- Google AI (Gemini) API key 다중 등록 및 라운드로빈 사용
- 작성자 마스킹, 공개 속도, 언어 설정 제공
- 한국어, 영어, 일본어 UI 지원
- PC와 모바일 반응형 UI

## 실행 방법

```bash
npm install
npm run dev
```

Vite 개발 서버는 기본적으로 아래 주소에서 실행됩니다.

```text
http://localhost:5173
```

Vercel API 함수까지 함께 테스트하려면 아래 명령을 사용합니다.

```bash
npm run dev:vercel
```

## 환경 변수

로컬 개발에서는 프로젝트 루트에 `.env.local`을 생성합니다.

```env
YOUTUBE_API_KEYS=youtube_key_one,youtube_key_two
VITE_RECAPTCHA_SITE_KEY=recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=recaptcha_v3_secret_key
RECAPTCHA_MIN_SCORE=0.5
GEMINI_API_KEYS=gemini_key_one,gemini_key_two
GEMINI_MODEL=gemini-2.5-flash-lite
```

### YouTube API

`YOUTUBE_API_KEYS`는 콤마로 여러 개를 등록할 수 있습니다. quota 또는 key 오류가 발생하면 다음 key로 재시도합니다.

### reCAPTCHA v3

영상 분석 버튼을 누르는 시점에 reCAPTCHA v3 토큰을 발급하고, `/api/video`에서 Google `siteverify` API로 검증합니다.

```env
VITE_RECAPTCHA_SITE_KEY=recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=recaptcha_v3_secret_key
RECAPTCHA_MIN_SCORE=0.5
```

`VITE_RECAPTCHA_SITE_KEY`는 프론트에서 사용하는 public key이고, `RECAPTCHA_SECRET_KEY`는 Vercel 서버리스 함수에서만 사용하는 secret key입니다. `RECAPTCHA_SECRET_KEY`가 없으면 로컬 개발 편의를 위해 검증을 건너뜁니다.

### Google AI (Gemini) API

AI 댓글 생성은 Google AI의 Gemini API만 사용합니다.

`GEMINI_API_KEYS`는 콤마로 여러 개를 등록할 수 있으며, 요청마다 등록된 key를 라운드로빈 방식으로 사용합니다.

```env
GEMINI_MODEL=gemini-2.5-flash-lite
```

Gemma 계열을 사용할 경우 모델 ID는 보통 아래처럼 `-it`가 붙는 형태입니다.

```env
GEMINI_MODEL=gemma-3-4b-it
```

Gemini는 JSON 응답을 안정적으로 받기 위해 구조화 출력 옵션을 사용합니다. Gemma 모델에서 구조화 출력 옵션이 거절되면 Gemini Flash Lite 계열을 사용하거나, Gemma 전용 JSON 파싱 대체 처리를 추가해야 합니다.

## 배포

Vercel 배포 시에는 프로젝트 설정의 Environment Variables에 동일한 값을 등록합니다.

```env
YOUTUBE_API_KEYS=youtube_key_one,youtube_key_two
VITE_RECAPTCHA_SITE_KEY=recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=recaptcha_v3_secret_key
RECAPTCHA_MIN_SCORE=0.5
GEMINI_API_KEYS=gemini_key_one,gemini_key_two
GEMINI_MODEL=gemini-2.5-flash-lite
```

프론트엔드는 Vite로 빌드되고, `/api` 디렉터리의 서버리스 함수가 YouTube와 Google AI Gemini 요청을 처리합니다.

## API 흐름

1. 사용자가 YouTube 링크를 입력합니다.
2. `/api/video`가 영상 기본 정보를 조회합니다.
3. 플레이 가능한 게임 목록을 표시합니다.
4. 게임 시작 시 `/api/comments` 또는 `/api/real-comment-rounds`가 댓글을 수집합니다.
5. 댓글 결과는 영상 기준으로 약 30분 동안 메모리에 캐싱됩니다.
6. 프론트엔드는 받은 라운드 데이터를 사용해 게임 화면을 렌더링합니다.

## 참고 사항

YouTube `commentThreads.list`는 `nextPageToken` 기반 페이지네이션을 사용합니다. 같은 정렬 기준 안에서 모든 페이지를 완전 병렬로 가져올 수는 없기 때문에, Commentube는 `relevance`와 `time` 두 정렬 레인을 동시에 수집해 빠르게 후보 풀을 만듭니다.
