# Commentube

YouTube 영상 링크를 댓글 기반 미니게임으로 바꾸는 React + Vite 앱입니다. 현재 MVP는 `댓글 배틀`을 지원하고, `진짜 댓글 찾기`는 AI 생성 댓글 품질을 다듬은 뒤 공개하는 모드로 남겨두었습니다.

## Features

- Vercel `/api` 함수로 YouTube API key 보호
- `YOUTUBE_API_KEYS` 콤마 구분 다중 key 등록 및 라운드로빈 사용
- quota/key 오류 발생 시 다음 key로 재시도
- 영상 정보 사전 분석: 제목, 채널, 썸네일, 길이, 조회수, 좋아요 수, 댓글 수
- 댓글 100개 이상 영상만 댓글 배틀 활성화
- `relevance`와 `time` 댓글 수집 레인 병렬 실행 후 dedupe
- 영상 댓글 결과 30분 인메모리 캐싱
- 작성자 마스킹, 공개 속도, 다국어 설정
- 한국어/영어/일본어 UI

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vercel 배포 환경 변수:

```bash
YOUTUBE_API_KEYS=key_one,key_two,key_three
```

## Notes

YouTube `commentThreads.list`는 `nextPageToken` 기반 페이지네이션이라 같은 정렬 기준 안에서 모든 페이지를 임의 병렬 호출할 수 없습니다. 대신 MVP에서는 `relevance`와 `time` 정렬을 동시에 수집해서 빠르게 후보 풀을 만들고, 좋아요가 있는 댓글 중 격차가 비슷한 쌍을 라운드로 구성합니다.
