<p align="center">
  <img src="./public/logo.png" alt="Commentube logo" width="96" />
</p>

<h1 align="center">Commentube</h1>

<p align="center">
  YouTube 댓글을 빠르게 수집하고, 방송과 숏폼에 어울리는 댓글 기반 미니게임으로 바꾸는 웹 서비스입니다.
</p>

---

## 서비스 개요

Commentube는 YouTube 영상 링크 하나로 영상 정보를 분석하고, 댓글을 모아 바로 플레이 가능한 게임을 제공합니다. 현재는 `댓글 배틀`과 AI 기반 `AI 댓글 찾기`를 지원합니다.

## 게임 모드

### 댓글 배틀

좋아요 수가 비슷한 댓글 두 개를 보여주고, 더 많은 좋아요를 받은 댓글을 맞히는 게임입니다.

- 영상 썸네일과 영상 정보를 상단에 표시합니다.
- 좋아요가 어느 정도 있는 댓글을 우선 후보로 사용합니다.
- 초반에는 좋아요가 높은 댓글을 랜덤하게 섞고, 후반으로 갈수록 낮은 좋아요 구간으로 내려갑니다.
- 정답을 고르면 양쪽 댓글의 좋아요 수가 공개됩니다.
- 틀릴 때까지 연속 정답 수를 기록합니다.

### AI 댓글 찾기

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
- Google AI (Gemini) 프리티어 API key 우선 사용 및 결제용 API key fallback
- 작성자 마스킹, 공개 속도, 언어 설정 제공
- 한국어, 영어, 일본어 UI 지원
- PC와 모바일 반응형 UI

## Gemini API key 설정

`GEMINI_FREE_TIER_API_KEYS`에 프리티어 키를 쉼표로 구분해 등록하면 등록된 순서대로 호출합니다. 한 키가 quota·rate limit·일시적 장애 등으로 실패하면 다음 프리티어 키를 시도하고, 프리티어 키가 모두 실패했을 때만 `GEMINI_PAID_API_KEYS`를 사용합니다.

```env
GEMINI_FREE_TIER_API_KEYS=gemini_free_key_one,gemini_free_key_two
GEMINI_PAID_API_KEYS=gemini_paid_key_one
GEMINI_MODEL=gemini-2.5-flash-lite
```

기존 `GEMINI_API_KEYS` 또는 `GEMINI_API_KEY`만 설정된 환경도 새 프리티어 변수가 없으면 프리티어 키로 계속 동작합니다.
