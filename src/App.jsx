import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Download,
  Eye,
  Filter,
  FileSpreadsheet,
  Globe2,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Shuffle,
  Sparkles,
  Trash2,
  Trophy,
  X
} from "lucide-react";

const RECAPTCHA_ACTION = "analyze_video";
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
let recaptchaScriptPromise = null;

const dictionaries = {
  ko: {
    brand: "Commentube",
    tagline: "영상 아래 숨어 있는 반응을 플레이하세요.",
    heroTitle: "댓글이 게임이 되는 순간",
    heroCopy: "유튜브 링크 하나로 댓글의 분위기, 드립, 공감을 읽어내고 바로 플레이할 수 있는 미니게임을 만듭니다.",
    inputPlaceholder: "https://www.youtube.com/watch?v=...",
    analyze: "영상 분석",
    analyzing: "분석 중",
    settings: "설정",
    language: "언어",
    maskAuthors: "댓글 작성자 가리기",
    maskAuthorsHelp: "방송/공유 화면에서 닉네임 노출을 줄입니다.",
    revealSpeed: "공개 속도",
    fast: "빠름",
    normal: "보통",
    dramatic: "극적",
    close: "닫기",
    leaveGameTitle: "게임을 나가시겠습니까?",
    leaveGameCopy: "현재 진행 중인 라운드와 점수는 초기화됩니다.",
    stay: "계속하기",
    leave: "나가기",
    videoInfo: "영상 정보",
    waitingVideo: "분석할 영상을 기다리는 중",
    waitingHint: "링크를 넣으면 이 영역에 썸네일과 핵심 지표가 표시됩니다.",
    comments: "댓글",
    duration: "영상 길이",
    views: "조회수",
    likes: "좋아요",
    channel: "채널",
    availableGames: "진행 가능한 게임",
    participatoryContents: "참여형 콘텐츠",
    utilityContents: "간단 도구",
    comingSoon: "추후 공개",
    startBattle: "댓글 읽고 시작",
    loadingComments: "댓글 후보 수집 중",
    loadingTitle: "댓글 배틀 준비 중",
    loadingCopy: "좋아요가 있는 댓글을 모으고, 비슷한 점수대의 대결 후보를 만들고 있어요.",
    aiLoadingTitle: "AI 댓글 섞는 중",
    aiLoadingCopy: "실제 댓글의 말투와 분위기를 읽고, 자연스러운 가짜 댓글 묶음을 만들고 있어요.",
    aiPreparing: "AI 라운드 구성",
    aiLoadingComments: "AI 댓글 생성 중",
    preparingBattle: "라운드 구성",
    correctCount: "정답",
    battleTitle: "댓글 배틀",
    battleDescription: "둘 중 좋아요 수가 더 높은 댓글을 고르세요. 틀리면 종료됩니다.",
    realCommentTitle: "진짜 댓글 찾기",
    realCommentDescription: "실제 댓글 사이에 숨어 있는 AI 댓글 하나를 찾아보세요.",
    candidateCount: "후보 개수",
    aiComment: "AI 댓글",
    findAiComment: "AI가 쓴 댓글 찾기",
    aiReveal: "AI 댓글이었습니다",
    realReveal: "실제 댓글",
    aiRefill: "AI 댓글을 다시 준비하고 있어요.",
    randomDrawTitle: "랜덤 댓글 추첨",
    randomDrawDescription: "댓글을 슬롯머신처럼 돌려 하나를 뽑습니다. 다시 뽑아도 이미 뽑힌 댓글은 제외돼요.",
    startDraw: "추첨 시작",
    drawAgain: "다시 뽑기",
    drawing: "돌리는 중",
    drawReady: "추첨 시작을 누르면 여기에서 댓글이 돌아갑니다.",
    drawFilterTitle: "추첨 필터",
    drawFilterHelp: "조건을 여러 개 추가하면 모든 조건을 만족하는 댓글만 추첨 후보가 됩니다.",
    addCondition: "조건 추가",
    clearConditions: "조건 초기화",
    matchedComments: "조건 일치",
    conditionContains: "포함 단어",
    conditionExcludes: "제외 단어",
    conditionNumber: "숫자 포함",
    conditionEnglish: "영어 포함",
    conditionKorean: "한글 포함",
    conditionUrl: "URL 포함",
    conditionRegex: "정규식 일치",
    conditionPlaceholder: "단어 또는 정규식 입력",
    drawLoadingTitle: "댓글 추첨 준비 중",
    drawLoadingCopy: "댓글을 모으고 추첨 슬롯에 넣고 있어요. 댓글 1만개 이하 영상만 사용할 수 있습니다.",
    drawPreparing: "추첨 데이터 구성",
    drawLoadingComments: "댓글 수집 중",
    pickedCount: "뽑은 댓글",
    remainingComments: "남은 댓글",
    noMoreComments: "더 이상 뽑을 댓글이 없습니다.",
    exportTitle: "댓글 추출",
    exportDescription: "수집한 댓글을 페이지가 있는 표로 확인하고 Excel 또는 CSV로 다운로드합니다.",
    includeReplies: "대댓글도 함께 추출",
    includeRepliesHelp: "대댓글은 상위 댓글 바로 아래에 정렬되고, 다운로드 파일에 대댓글 여부와 상위 댓글 정보가 표시됩니다.",
    startExport: "댓글 추출",
    exportLoadingTitle: "댓글 추출 준비 중",
    exportLoadingCopy: "다운로드 가능한 댓글 표를 만들고 있어요. 댓글 1만개 이하 영상만 지원합니다.",
    exportPreparing: "표 데이터 구성",
    exportLoadingComments: "댓글 수집 중",
    exportFilterTitle: "댓글 필터",
    exportFilterHelp: "조건을 여러 개 추가하면 모든 조건을 만족하는 댓글만 표와 다운로드 파일에 포함됩니다.",
    downloadScopeTitle: "어떤 댓글을 다운로드할까요?",
    downloadScopeCopy: "현재 댓글 필터가 적용되어 있습니다. 필터 결과만 받을지, 전체 댓글을 받을지 선택해주세요.",
    downloadFiltered: "필터 결과",
    downloadAll: "전체 댓글",
    downloadExcel: "Excel 다운로드",
    downloadCsv: "CSV 다운로드",
    tableAuthor: "작성자",
    tableComment: "댓글",
    tableLikes: "좋아요",
    tableReplies: "답글",
    tablePublished: "작성일",
    tableType: "유형",
    tableParent: "상위 댓글",
    topLevelComment: "댓글",
    replyComment: "대댓글",
    previousPage: "이전",
    nextPageLabel: "다음",
    pageLabel: "페이지",
    utilityBlocked: "댓글 1만개 이하 영상에서만 사용할 수 있어요.",
    score: "연속 정답",
    round: "라운드",
    nextRound: "다음 라운드",
    playAgain: "다시 하기",
    correct: "정답",
    wrong: "실패",
    gameOver: "게임 종료",
    finalScore: "최종 연속 정답",
    winner: "승리 댓글",
    minimumBlocked: "댓글 100개 이상 영상부터 플레이할 수 있어요.",
    pasteFirst: "먼저 유튜브 링크를 입력해주세요.",
    apiError: "요청에 실패했습니다.",
    cached: "캐시 사용",
    fresh: "신규 수집",
    fetched: "수집 댓글",
    invalidUrl: "유튜브 영상 링크를 입력해주세요."
  },
  en: {
    brand: "Commentube",
    tagline: "Play the reactions hiding beneath every video.",
    heroTitle: "Where comments become a game",
    heroCopy: "Paste a YouTube link and turn the jokes, moods, and moments in the comment section into an instant mini-game.",
    inputPlaceholder: "https://www.youtube.com/watch?v=...",
    analyze: "Analyze video",
    analyzing: "Analyzing",
    settings: "Settings",
    language: "Language",
    maskAuthors: "Mask comment authors",
    maskAuthorsHelp: "Reduces nickname exposure on shared screens.",
    revealSpeed: "Reveal speed",
    fast: "Fast",
    normal: "Normal",
    dramatic: "Dramatic",
    close: "Close",
    leaveGameTitle: "Leave the game?",
    leaveGameCopy: "Your current round and streak will be reset.",
    stay: "Keep playing",
    leave: "Leave",
    videoInfo: "Video info",
    waitingVideo: "Waiting for a video",
    waitingHint: "Paste a link to preview the thumbnail and core stats here.",
    comments: "Comments",
    duration: "Duration",
    views: "Views",
    likes: "Likes",
    channel: "Channel",
    availableGames: "Available games",
    participatoryContents: "Interactive content",
    utilityContents: "Simple tools",
    comingSoon: "Coming soon",
    startBattle: "Load comments",
    loadingComments: "Collecting comment candidates",
    loadingTitle: "Preparing Comment Battle",
    loadingCopy: "Collecting liked comments and matching close battle candidates.",
    aiLoadingTitle: "Mixing AI comments",
    aiLoadingCopy: "Reading the tone of real comments and creating a natural batch of fake comments.",
    aiPreparing: "Building AI rounds",
    aiLoadingComments: "Generating AI comments",
    preparingBattle: "Building rounds",
    correctCount: "Correct",
    battleTitle: "Comment Battle",
    battleDescription: "Pick the comment with more likes. One miss ends the run.",
    realCommentTitle: "Find the Real Comment",
    realCommentDescription: "Find the one AI comment hiding among real viewer comments.",
    candidateCount: "Choice count",
    aiComment: "AI comment",
    findAiComment: "Find the AI-written comment",
    aiReveal: "This was the AI comment",
    realReveal: "Real comment",
    aiRefill: "Preparing more AI comments.",
    randomDrawTitle: "Random Comment Draw",
    randomDrawDescription: "Spin through comments like a slot machine and pick one winner. Picked comments are excluded next time.",
    startDraw: "Start draw",
    drawAgain: "Draw again",
    drawing: "Spinning",
    drawReady: "Press start to spin comments here.",
    drawFilterTitle: "Draw filters",
    drawFilterHelp: "Add conditions to draw only comments that match every condition.",
    addCondition: "Add condition",
    clearConditions: "Clear conditions",
    matchedComments: "Matched",
    conditionContains: "Contains word",
    conditionExcludes: "Excludes word",
    conditionNumber: "Has number",
    conditionEnglish: "Has English",
    conditionKorean: "Has Korean",
    conditionUrl: "Has URL",
    conditionRegex: "Matches regex",
    conditionPlaceholder: "Enter word or regex",
    drawLoadingTitle: "Preparing Comment Draw",
    drawLoadingCopy: "Collecting comments and loading the draw slot. Available for videos with 10K comments or fewer.",
    drawPreparing: "Building draw data",
    drawLoadingComments: "Collecting comments",
    pickedCount: "Picked",
    remainingComments: "Remaining",
    noMoreComments: "No comments left to draw.",
    exportTitle: "Comment Export",
    exportDescription: "View collected comments in a paginated table and download Excel or CSV files.",
    includeReplies: "Include replies",
    includeRepliesHelp: "Replies are placed directly below their parent comment and exported with parent information.",
    startExport: "Export comments",
    exportLoadingTitle: "Preparing Comment Export",
    exportLoadingCopy: "Building a downloadable comment table. Available for videos with 10K comments or fewer.",
    exportPreparing: "Building table data",
    exportLoadingComments: "Collecting comments",
    exportFilterTitle: "Comment filters",
    exportFilterHelp: "Add conditions to include only comments that match every condition in the table and downloads.",
    downloadScopeTitle: "Which comments should be downloaded?",
    downloadScopeCopy: "Comment filters are currently applied. Choose filtered results or all comments.",
    downloadFiltered: "Filtered results",
    downloadAll: "All comments",
    downloadExcel: "Download Excel",
    downloadCsv: "Download CSV",
    tableAuthor: "Author",
    tableComment: "Comment",
    tableLikes: "Likes",
    tableReplies: "Replies",
    tablePublished: "Published",
    tableType: "Type",
    tableParent: "Parent comment",
    topLevelComment: "Comment",
    replyComment: "Reply",
    previousPage: "Previous",
    nextPageLabel: "Next",
    pageLabel: "Page",
    utilityBlocked: "Available for videos with 10K comments or fewer.",
    score: "Streak",
    round: "Round",
    nextRound: "Next round",
    playAgain: "Play again",
    correct: "Correct",
    wrong: "Miss",
    gameOver: "Game over",
    finalScore: "Final streak",
    winner: "Winning comment",
    minimumBlocked: "Playable from videos with 100+ comments.",
    pasteFirst: "Paste a YouTube link first.",
    apiError: "Request failed.",
    cached: "Cached",
    fresh: "Fresh",
    fetched: "Fetched",
    invalidUrl: "Please enter a YouTube video link."
  },
  ja: {
    brand: "Commentube",
    tagline: "動画の下に眠るリアクションを遊ぼう。",
    heroTitle: "コメントがゲームになる瞬間",
    heroCopy: "YouTubeリンクひとつで、コメント欄の空気、ネタ、共感をそのまま遊べるミニゲームに変えます。",
    inputPlaceholder: "https://www.youtube.com/watch?v=...",
    analyze: "動画を分析",
    analyzing: "分析中",
    settings: "設定",
    language: "言語",
    maskAuthors: "投稿者名を隠す",
    maskAuthorsHelp: "共有画面でニックネームの露出を減らします。",
    revealSpeed: "表示速度",
    fast: "速い",
    normal: "普通",
    dramatic: "演出あり",
    close: "閉じる",
    leaveGameTitle: "ゲームを終了しますか？",
    leaveGameCopy: "現在のラウンドとスコアはリセットされます。",
    stay: "続ける",
    leave: "終了",
    videoInfo: "動画情報",
    waitingVideo: "動画を待機中",
    waitingHint: "リンクを入力すると、サムネイルと主要データがここに表示されます。",
    comments: "コメント",
    duration: "長さ",
    views: "再生数",
    likes: "高評価",
    channel: "チャンネル",
    availableGames: "プレイ可能なゲーム",
    participatoryContents: "参加型コンテンツ",
    utilityContents: "シンプルツール",
    comingSoon: "近日公開",
    startBattle: "コメントを読み込む",
    loadingComments: "コメント候補を収集中",
    loadingTitle: "コメントバトル準備中",
    loadingCopy: "高評価のあるコメントを集め、近いスコアの対戦候補を作っています。",
    aiLoadingTitle: "AIコメントを混ぜています",
    aiLoadingCopy: "実際のコメントの空気を読み、自然なAIコメントをまとめて作っています。",
    aiPreparing: "AIラウンド生成",
    aiLoadingComments: "AIコメント生成中",
    preparingBattle: "ラウンド生成",
    correctCount: "正解",
    battleTitle: "コメントバトル",
    battleDescription: "高評価が多いコメントを選びます。外すと終了です。",
    realCommentTitle: "本物コメント探し",
    realCommentDescription: "実際のコメントに紛れたAIコメントを1つ見つけます。",
    candidateCount: "候補数",
    aiComment: "AIコメント",
    findAiComment: "AIが書いたコメントを探す",
    aiReveal: "AIコメントでした",
    realReveal: "実際のコメント",
    aiRefill: "AIコメントを追加準備しています。",
    randomDrawTitle: "ランダムコメント抽選",
    randomDrawDescription: "コメントをスロットのように回して1つ選びます。選ばれたコメントは次回除外されます。",
    startDraw: "抽選開始",
    drawAgain: "もう一度抽選",
    drawing: "抽選中",
    drawReady: "抽選開始を押すとここでコメントが回ります。",
    drawFilterTitle: "抽選フィルター",
    drawFilterHelp: "条件を追加すると、すべて満たすコメントだけが抽選候補になります。",
    addCondition: "条件追加",
    clearConditions: "条件初期化",
    matchedComments: "一致",
    conditionContains: "含む単語",
    conditionExcludes: "除外単語",
    conditionNumber: "数字を含む",
    conditionEnglish: "英語を含む",
    conditionKorean: "韓国語を含む",
    conditionUrl: "URLを含む",
    conditionRegex: "正規表現一致",
    conditionPlaceholder: "単語または正規表現を入力",
    drawLoadingTitle: "コメント抽選準備中",
    drawLoadingCopy: "コメントを集めて抽選スロットに入れています。コメント1万件以下の動画で利用できます。",
    drawPreparing: "抽選データ生成",
    drawLoadingComments: "コメント収集中",
    pickedCount: "抽選済み",
    remainingComments: "残りコメント",
    noMoreComments: "抽選できるコメントが残っていません。",
    exportTitle: "コメント抽出",
    exportDescription: "収集したコメントをページ付きの表で確認し、ExcelまたはCSVでダウンロードします。",
    includeReplies: "返信も含める",
    includeRepliesHelp: "返信は親コメントの直下に並び、ダウンロードファイルに返信 여부と親コメント情報が含まれます。",
    startExport: "コメント抽出",
    exportLoadingTitle: "コメント抽出準備中",
    exportLoadingCopy: "ダウンロード可能なコメント表を作成しています。コメント1万件以下の動画に対応します。",
    exportPreparing: "表データ生成",
    exportLoadingComments: "コメント収集中",
    exportFilterTitle: "コメントフィルター",
    exportFilterHelp: "条件を追加すると、すべて満たすコメントだけが表とダウンロードファイルに含まれます。",
    downloadScopeTitle: "どのコメントをダウンロードしますか？",
    downloadScopeCopy: "現在コメントフィルターが適用されています。フィルター結果か全コメントを選択してください。",
    downloadFiltered: "フィルター結果",
    downloadAll: "全コメント",
    downloadExcel: "Excelダウンロード",
    downloadCsv: "CSVダウンロード",
    tableAuthor: "投稿者",
    tableComment: "コメント",
    tableLikes: "高評価",
    tableReplies: "返信",
    tablePublished: "投稿日",
    tableType: "種類",
    tableParent: "親コメント",
    topLevelComment: "コメント",
    replyComment: "返信",
    previousPage: "前へ",
    nextPageLabel: "次へ",
    pageLabel: "ページ",
    utilityBlocked: "コメント1万件以下の動画で利用できます。",
    score: "連続正解",
    round: "ラウンド",
    nextRound: "次へ",
    playAgain: "もう一度",
    correct: "正解",
    wrong: "失敗",
    gameOver: "ゲーム終了",
    finalScore: "最終スコア",
    winner: "勝利コメント",
    minimumBlocked: "コメント100件以上の動画からプレイできます。",
    pasteFirst: "YouTubeリンクを入力してください。",
    apiError: "リクエストに失敗しました。",
    cached: "キャッシュ",
    fresh: "新規取得",
    fetched: "取得数",
    invalidUrl: "YouTube動画リンクを入力してください。"
  }
};

const languageNames = { ko: "한국어", en: "English", ja: "日本語" };
const revealDelays = { fast: 450, normal: 850, dramatic: 1350 };
const textFilterTypes = new Set(["contains", "excludes", "regex"]);

function number(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function compactNumber(value) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

function timestampToSeconds(value) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function splitTimestamps(text = "") {
  const pattern = /\b(?:(\d{1,2}:)?[0-5]?\d:[0-5]\d)\b/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const seconds = timestampToSeconds(match[0]);
    if (seconds !== null) {
      parts.push({ type: "timestamp", value: match[0], seconds });
    } else {
      parts.push({ type: "text", value: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

function looksLikeYoutubeUrl(value = "") {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(value.trim());
}

function shuffleRounds(rounds) {
  const sorted = [...rounds].sort((a, b) => {
    const aScore = Math.max(a.left.likeCount, a.right.likeCount);
    const bScore = Math.max(b.left.likeCount, b.right.likeCount);
    return bScore - aScore;
  });
  const bucketSize = 18;
  const buckets = [];

  for (let i = 0; i < sorted.length; i += bucketSize) {
    buckets.push(shuffle(sorted.slice(i, i + bucketSize)));
  }

  return buckets.flat().map((round, index) => ({ ...round, id: `round-${index + 1}` }));
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDrawFilter(type = "contains") {
  return {
    id: `filter-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    value: ""
  };
}

function matchesDrawFilter(comment, filter) {
  const text = String(comment.text || "");
  const normalized = text.toLowerCase();
  const value = String(filter.value || "").trim();
  const normalizedValue = value.toLowerCase();

  if (filter.type === "contains") return Boolean(normalizedValue) && normalized.includes(normalizedValue);
  if (filter.type === "excludes") return !normalizedValue || !normalized.includes(normalizedValue);
  if (filter.type === "number") return /\d/.test(text);
  if (filter.type === "english") return /[a-zA-Z]/.test(text);
  if (filter.type === "korean") return /[가-힣]/.test(text);
  if (filter.type === "url") return /(https?:\/\/|www\.|youtu\.be|youtube\.com)/i.test(text);
  if (filter.type === "regex") {
    if (!value) return false;
    try {
      return new RegExp(value, "i").test(text);
    } catch {
      return false;
    }
  }
  return true;
}

function filterDrawComments(comments, filters) {
  const activeFilters = filters.filter((filter) => {
    return !textFilterTypes.has(filter.type) || String(filter.value || "").trim();
  });
  if (!activeFilters.length) return comments;
  return comments.filter((comment) => activeFilters.every((filter) => matchesDrawFilter(comment, filter)));
}

function hasActiveFilters(filters) {
  return filters.some((filter) => {
    return !textFilterTypes.has(filter.type) || String(filter.value || "").trim();
  });
}

function loadRecaptcha(siteKey) {
  if (!siteKey) return Promise.resolve(null);
  if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
  if (recaptchaScriptPromise) return recaptchaScriptPromise;

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.grecaptcha);
    script.onerror = () => {
      recaptchaScriptPromise = null;
      reject(new Error("reCAPTCHA를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."));
    };
    document.head.appendChild(script);
  });

  return recaptchaScriptPromise;
}

async function createRecaptchaToken() {
  if (!RECAPTCHA_SITE_KEY) return "";
  const grecaptcha = await loadRecaptcha(RECAPTCHA_SITE_KEY);
  if (!grecaptcha) return "";

  return new Promise((resolve, reject) => {
    grecaptcha.ready(() => {
      grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
        .then(resolve)
        .catch(() => reject(new Error("reCAPTCHA 검증을 시작하지 못했습니다. 잠시 후 다시 시도해주세요.")));
    });
  });
}

function initialLanguage() {
  const saved = localStorage.getItem("commentube-language");
  if (saved && dictionaries[saved]) return saved;
  const browser = navigator.language?.slice(0, 2);
  return dictionaries[browser] ? browser : "ko";
}

function escapeCsv(value = "") {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(filename, mimeType, content) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function commentRows(comments, t = dictionaries.ko) {
  return comments.map((comment, index) => ({
    no: index + 1,
    type: comment.isReply ? t.replyComment : t.topLevelComment,
    author: comment.author || "",
    text: comment.text || "",
    likeCount: Number(comment.likeCount || 0),
    replyCount: Number(comment.replyCount || 0),
    publishedAt: comment.publishedAt || "",
    updatedAt: comment.updatedAt || "",
    parentId: comment.parentId || "",
    parentAuthor: comment.parentAuthor || "",
    parentText: comment.parentText || "",
    id: comment.id || ""
  }));
}

function downloadCommentsCsv(comments, videoId, t) {
  const headers = [
    "No",
    "Type",
    "Author",
    "Comment",
    "Likes",
    "Replies",
    "Published At",
    "Updated At",
    "Parent Comment ID",
    "Parent Author",
    "Parent Comment",
    "Comment ID"
  ];
  const rows = commentRows(comments, t).map((row) => [
    row.no,
    row.type,
    row.author,
    row.text,
    row.likeCount,
    row.replyCount,
    row.publishedAt,
    row.updatedAt,
    row.parentId,
    row.parentAuthor,
    row.parentText,
    row.id
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  downloadBlob(`commentube-${videoId}-comments.csv`, "text/csv;charset=utf-8", `\uFEFF${csv}`);
}

function downloadCommentsExcel(comments, videoId, t) {
  const headers = [
    "No",
    "Type",
    "Author",
    "Comment",
    "Likes",
    "Replies",
    "Published At",
    "Updated At",
    "Parent Comment ID",
    "Parent Author",
    "Parent Comment",
    "Comment ID"
  ];
  const rows = commentRows(comments, t);
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.no}</td>
          <td>${escapeHtml(row.type)}</td>
          <td>${escapeHtml(row.author)}</td>
          <td>${escapeHtml(row.text)}</td>
          <td>${row.likeCount}</td>
          <td>${row.replyCount}</td>
          <td>${escapeHtml(row.publishedAt)}</td>
          <td>${escapeHtml(row.updatedAt)}</td>
          <td>${escapeHtml(row.parentId)}</td>
          <td>${escapeHtml(row.parentAuthor)}</td>
          <td>${escapeHtml(row.parentText)}</td>
          <td>${escapeHtml(row.id)}</td>
        </tr>`
    )
    .join("");
  const headerRow = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("");
  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <table>
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
  downloadBlob(`commentube-${videoId}-comments.xls`, "application/vnd.ms-excel;charset=utf-8", html);
}

function App() {
  const [language, setLanguage] = useState(initialLanguage);
  const t = dictionaries[language];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [maskAuthors, setMaskAuthors] = useState(true);
  const [revealSpeed, setRevealSpeed] = useState("normal");
  const [url, setUrl] = useState("");
  const [video, setVideo] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [commentsMeta, setCommentsMeta] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [previewEntering, setPreviewEntering] = useState(false);
  const [candidateCount, setCandidateCount] = useState(4);
  const [gameType, setGameType] = useState("battle");
  const [loadingMode, setLoadingMode] = useState("battle");
  const [utilityComments, setUtilityComments] = useState([]);
  const [utilityMeta, setUtilityMeta] = useState(null);
  const [drawnIds, setDrawnIds] = useState([]);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const [slotComment, setSlotComment] = useState(null);
  const [slotSpinning, setSlotSpinning] = useState(false);
  const [drawFilters, setDrawFilters] = useState([]);
  const [drawFilterOpen, setDrawFilterOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState([]);
  const [exportFilterOpen, setExportFilterOpen] = useState(false);
  const [downloadScopePrompt, setDownloadScopePrompt] = useState(null);
  const [exportPage, setExportPage] = useState(1);
  const [exportIncludeReplies, setExportIncludeReplies] = useState(false);

  useEffect(() => {
    localStorage.setItem("commentube-language", language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateFromClipboard() {
      if (!navigator.clipboard?.readText) return;

      try {
        const text = await navigator.clipboard.readText();
        if (!cancelled && !url.trim() && looksLikeYoutubeUrl(text)) {
          setUrl(text.trim());
        }
      } catch {
        // Clipboard permission is optional; the input remains manual when blocked.
      }
    }

    hydrateFromClipboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentRound = rounds[roundIndex];
  const showPreviewPanel = Boolean(video || loading);

  const canBattle = useMemo(() => {
    return Boolean(video?.games?.find((game) => game.id === "comment-battle")?.available);
  }, [video]);

  const canUseUtility = useMemo(() => {
    return Boolean(video?.games?.find((game) => game.id === "comment-tools")?.available);
  }, [video]);

  const filteredExportComments = useMemo(() => {
    return filterDrawComments(utilityComments, exportFilters);
  }, [utilityComments, exportFilters]);

  useEffect(() => {
    if (phase !== "loading") return undefined;

    setLoadingProgress(4);
    const timer = window.setInterval(() => {
      setLoadingProgress((value) => {
        if (value >= 92) return value;
        const step = value < 36 ? 8 : value < 72 ? 5 : 2;
        return Math.min(value + step, 92);
      });
    }, 360);

    return () => window.clearInterval(timer);
  }, [phase]);

  async function requestJson(endpoint) {
    const response = await fetch(endpoint);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || t.apiError);
    return payload;
  }

  async function analyzeVideo(event) {
    event.preventDefault();
    if (!url.trim()) {
      setError(t.invalidUrl);
      return;
    }

    setLoading(true);
    setError("");
    setVideo(null);
    setRounds([]);
    setUtilityComments([]);
    setUtilityMeta(null);
    setDrawnIds([]);
    setDrawCurrent(null);
    setSlotComment(null);
    setDrawFilters([]);
    setDrawFilterOpen(false);
    setExportFilters([]);
    setExportFilterOpen(false);
    setDownloadScopePrompt(null);
    setExportPage(1);
    setExportIncludeReplies(false);
    setPhase("idle");
    setPreviewEntering(true);
    setGameType("battle");

    try {
      const recaptchaToken = await createRecaptchaToken();
      const params = new URLSearchParams({
        url: url.trim(),
        recaptchaAction: RECAPTCHA_ACTION
      });
      if (recaptchaToken) params.set("recaptchaToken", recaptchaToken);

      const payload = await requestJson(`/api/video?${params.toString()}`);
      setVideo(payload);
    } catch (err) {
      setError(err.message || t.apiError);
    } finally {
      setLoading(false);
      window.setTimeout(() => setPreviewEntering(false), 520);
    }
  }

  async function startBattle() {
    if (!video || !canBattle) return;
    setGameType("battle");
    setLoadingMode("battle");
    setLoading(true);
    setError("");
    setPhase("loading");
    setLoadingProgress(2);
    setCommentsMeta(null);

    try {
      const payload = await requestJson(`/api/comments?videoId=${encodeURIComponent(video.videoId)}&target=520`);
      setLoadingProgress(100);
      setRounds(payload.rounds || []);
      setCommentsMeta(payload);
      setRoundIndex(0);
      setScore(0);
      setSelected(null);
      setResult(null);
      window.setTimeout(() => setPhase("battle"), 450);
    } catch (err) {
      setError(err.message || t.apiError);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  async function startRealCommentGame({ fresh = false, preserveScore = false } = {}) {
    if (!video || !canBattle) return;
    setGameType("real");
    setLoadingMode("real");
    setLoading(true);
    setError("");
    setPhase("loading");
    setLoadingProgress(2);
    setCommentsMeta(null);

    try {
      const endpoint = `/api/real-comment-rounds?videoId=${encodeURIComponent(video.videoId)}&candidateCount=${candidateCount}&language=${language}${
        fresh ? "&fresh=1" : ""
      }`;
      const payload = await requestJson(endpoint);
      setLoadingProgress(100);
      setRounds(payload.rounds || []);
      setCommentsMeta(payload);
      setRoundIndex(0);
      setScore((value) => (preserveScore ? value : 0));
      setSelected(null);
      setResult(null);
      window.setTimeout(() => setPhase("real"), 450);
    } catch (err) {
      setError(err.message || t.apiError);
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  }

  async function loadUtilityComments(mode, { includeReplies = false } = {}) {
    if (!video || !canUseUtility) return null;
    setGameType(mode);
    setLoadingMode(mode);
    setLoading(true);
    setError("");
    setPhase("loading");
    setLoadingProgress(2);
    setCommentsMeta(null);

    try {
      const payload = await requestJson(
        `/api/comment-data?videoId=${encodeURIComponent(video.videoId)}${includeReplies ? "&includeReplies=1" : ""}`
      );
      setLoadingProgress(100);
      setUtilityComments(payload.comments || []);
      setUtilityMeta(payload);
      setCommentsMeta(payload);
      return payload;
    } catch (err) {
      setError(err.message || t.apiError);
      setPhase("idle");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function startDraw() {
    setGameType("draw");
    setLoadingMode("draw");
    const payload = utilityComments.length && !utilityMeta?.includeReplies ? { comments: utilityComments } : await loadUtilityComments("draw");
    if (!payload) return;
    setDrawnIds([]);
    setDrawCurrent(null);
    setSlotComment(null);
    setTimeout(() => setPhase("draw"), 450);
  }

  async function startExport() {
    setGameType("export");
    setLoadingMode("export");
    const payload =
      utilityComments.length && Boolean(utilityMeta?.includeReplies) === exportIncludeReplies
        ? { comments: utilityComments }
        : await loadUtilityComments("export", { includeReplies: exportIncludeReplies });
    if (!payload) return;
    setExportPage(1);
    setTimeout(() => setPhase("export"), 450);
  }

  function requestCommentDownload(format) {
    if (hasActiveFilters(exportFilters)) {
      setDownloadScopePrompt(format);
      return;
    }
    downloadCommentFile(format, utilityComments);
  }

  function downloadCommentFile(format, comments) {
    if (!video) return;
    if (format === "excel") {
      downloadCommentsExcel(comments, video.videoId, t);
      return;
    }
    downloadCommentsCsv(comments, video.videoId, t);
  }

  function drawRandomComment() {
    if (slotSpinning || !utilityComments.length) return;
    const drawn = new Set(drawnIds);
    const candidates = filterDrawComments(utilityComments, drawFilters).filter((comment) => !drawn.has(comment.id));
    if (!candidates.length) {
      setDrawCurrent(null);
      return;
    }

    setSlotSpinning(true);
    setDrawCurrent(null);
    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks += 1;
      setSlotComment(candidates[Math.floor(Math.random() * candidates.length)]);
      if (ticks >= 28) {
        window.clearInterval(interval);
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        setSlotComment(winner);
        setDrawCurrent(winner);
        setDrawnIds((value) => [...value, winner.id]);
        setSlotSpinning(false);
      }
    }, 72);
  }

  function choose(side) {
    if (!currentRound || selected) return;
    setSelected(side);
    const isCorrect = side === currentRound.answer;

    window.setTimeout(() => {
      setResult(isCorrect ? "correct" : "wrong");
      if (isCorrect) setScore((value) => value + 1);
    }, revealDelays[revealSpeed]);
  }

  function chooseReal(choiceId) {
    if (!currentRound || selected) return;
    setSelected(choiceId);
    const isCorrect = choiceId === currentRound.answer;

    window.setTimeout(() => {
      setResult(isCorrect ? "correct" : "wrong");
      if (isCorrect) setScore((value) => value + 1);
    }, revealDelays[revealSpeed]);
  }

  function nextRound() {
    if (result === "wrong" || roundIndex >= rounds.length - 1) {
      setPhase("gameover");
      return;
    }
    setRoundIndex((value) => value + 1);
    setSelected(null);
    setResult(null);
  }

  async function nextRealRound() {
    if (result === "wrong") {
      setPhase("gameover");
      return;
    }
    if (roundIndex >= rounds.length - 1) {
      await startRealCommentGame({ fresh: true, preserveScore: true });
      return;
    }
    setRoundIndex((value) => value + 1);
    setSelected(null);
    setResult(null);
  }

  function resetGame() {
    if (gameType === "real") {
      const unusedRounds = rounds.slice(roundIndex + 1);
      if (unusedRounds.length) {
        setRounds(unusedRounds);
        setRoundIndex(0);
        setScore(0);
        setSelected(null);
        setResult(null);
        setPhase("real");
        return;
      }

      startRealCommentGame({ fresh: true });
      return;
    }
    setRounds((value) => shuffleRounds(value));
    setRoundIndex(0);
    setScore(0);
    setSelected(null);
    setResult(null);
    setPhase(rounds.length ? "battle" : "idle");
  }

  function goHome() {
    setPhase("idle");
    setRounds([]);
    setUtilityComments([]);
    setUtilityMeta(null);
    setDrawnIds([]);
    setDrawCurrent(null);
    setSlotComment(null);
    setDrawFilters([]);
    setDrawFilterOpen(false);
    setExportFilters([]);
    setExportFilterOpen(false);
    setDownloadScopePrompt(null);
    setExportPage(1);
    setExportIncludeReplies(false);
    setRoundIndex(0);
    setScore(0);
    setSelected(null);
    setResult(null);
    setLeaveConfirmOpen(false);
  }

  function handleBrandClick() {
    if (phase === "battle" || phase === "real" || phase === "draw" || phase === "export" || phase === "gameover" || phase === "loading") {
      setLeaveConfirmOpen(true);
      return;
    }
    goHome();
  }

  const loadingContent = {
    battle: {
      title: t.loadingTitle,
      copy: t.loadingCopy,
      kicker: t.preparingBattle,
      label: t.loadingComments
    },
    real: {
      title: t.aiLoadingTitle,
      copy: t.aiLoadingCopy,
      kicker: t.aiPreparing,
      label: t.aiLoadingComments
    },
    draw: {
      title: t.drawLoadingTitle,
      copy: t.drawLoadingCopy,
      kicker: t.drawPreparing,
      label: t.drawLoadingComments
    },
    export: {
      title: t.exportLoadingTitle,
      copy: t.exportLoadingCopy,
      kicker: t.exportPreparing,
      label: t.exportLoadingComments
    }
  }[loadingMode] || {
    title: t.loadingTitle,
    copy: t.loadingCopy,
    kicker: t.preparingBattle,
    label: t.loadingComments
  };

  if (phase === "loading") {
    return (
      <main className="app-shell loading-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} />
        <LoadingScreen
          t={t}
          video={video}
          progress={loadingProgress}
          title={loadingContent.title}
          copy={loadingContent.copy}
          kicker={loadingContent.kicker}
          label={loadingContent.label}
        />
        {leaveConfirmOpen ? <LeaveConfirm t={t} onCancel={() => setLeaveConfirmOpen(false)} onConfirm={goHome} /> : null}
        {settingsOpen ? (
          <SettingsDialog
            t={t}
            language={language}
            setLanguage={setLanguage}
            maskAuthors={maskAuthors}
            setMaskAuthors={setMaskAuthors}
            revealSpeed={revealSpeed}
            setRevealSpeed={setRevealSpeed}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </main>
    );
  }

  if (phase === "draw") {
    return (
      <main className="app-shell tool-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} compact />
        <RandomDrawTool
          t={t}
          video={video}
          comments={utilityComments}
          drawnIds={drawnIds}
          current={drawCurrent}
          slotComment={slotComment}
          spinning={slotSpinning}
          filters={drawFilters}
          setFilters={setDrawFilters}
          filterOpen={drawFilterOpen}
          setFilterOpen={setDrawFilterOpen}
          onFiltersChanged={() => {
            setDrawnIds([]);
            setDrawCurrent(null);
            setSlotComment(null);
          }}
          onDraw={drawRandomComment}
          maskAuthors={maskAuthors}
        />
        {leaveConfirmOpen ? <LeaveConfirm t={t} onCancel={() => setLeaveConfirmOpen(false)} onConfirm={goHome} /> : null}
        {settingsOpen ? (
          <SettingsDialog
            t={t}
            language={language}
            setLanguage={setLanguage}
            maskAuthors={maskAuthors}
            setMaskAuthors={setMaskAuthors}
            revealSpeed={revealSpeed}
            setRevealSpeed={setRevealSpeed}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </main>
    );
  }

  if (phase === "export") {
    return (
      <main className="app-shell tool-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} compact />
        <CommentExportTool
          t={t}
          video={video}
          comments={utilityComments}
          filters={exportFilters}
          setFilters={setExportFilters}
          filterOpen={exportFilterOpen}
          setFilterOpen={setExportFilterOpen}
          page={exportPage}
          setPage={setExportPage}
          onFiltersChanged={() => setExportPage(1)}
          onDownloadCsv={() => requestCommentDownload("csv")}
          onDownloadExcel={() => requestCommentDownload("excel")}
        />
        {downloadScopePrompt ? (
          <DownloadScopeConfirm
            t={t}
            onCancel={() => setDownloadScopePrompt(null)}
            onFiltered={() => {
              downloadCommentFile(downloadScopePrompt, filteredExportComments);
              setDownloadScopePrompt(null);
            }}
            onAll={() => {
              downloadCommentFile(downloadScopePrompt, utilityComments);
              setDownloadScopePrompt(null);
            }}
          />
        ) : null}
        {leaveConfirmOpen ? <LeaveConfirm t={t} onCancel={() => setLeaveConfirmOpen(false)} onConfirm={goHome} /> : null}
        {settingsOpen ? (
          <SettingsDialog
            t={t}
            language={language}
            setLanguage={setLanguage}
            maskAuthors={maskAuthors}
            setMaskAuthors={setMaskAuthors}
            revealSpeed={revealSpeed}
            setRevealSpeed={setRevealSpeed}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </main>
    );
  }

  if ((phase === "battle" || phase === "real" || phase === "gameover") && currentRound) {
    return (
      <main className="app-shell game-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} compact />
        {phase === "real" || gameType === "real" ? (
          <RealCommentArena
            t={t}
            video={video}
            round={currentRound}
            roundIndex={roundIndex}
            score={score}
            selected={selected}
            result={result}
            maskAuthors={maskAuthors}
            onChoose={chooseReal}
            onNext={nextRealRound}
          />
        ) : (
          <BattleArena
            t={t}
            video={video}
            round={currentRound}
            roundIndex={roundIndex}
            total={rounds.length}
            score={score}
            selected={selected}
            result={result}
            maskAuthors={maskAuthors}
            onChoose={choose}
            onNext={nextRound}
          />
        )}
        {phase === "gameover" ? (
          <div className="modal-backdrop show">
            <div className="result-modal">
              <div className="result-badge">{t.gameOver}</div>
              <h2>
                {t.finalScore} {score}
              </h2>
              <button onClick={resetGame}>
                <RotateCcw size={18} />
                {t.playAgain}
              </button>
            </div>
          </div>
        ) : null}
        {leaveConfirmOpen ? <LeaveConfirm t={t} onCancel={() => setLeaveConfirmOpen(false)} onConfirm={goHome} /> : null}
        {settingsOpen ? (
          <SettingsDialog
            t={t}
            language={language}
            setLanguage={setLanguage}
            maskAuthors={maskAuthors}
            setMaskAuthors={setMaskAuthors}
            revealSpeed={revealSpeed}
            setRevealSpeed={setRevealSpeed}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="speed-lines" />
      <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} />

      <section className={`hero-grid ${showPreviewPanel ? "has-preview" : "centered"} ${previewEntering ? "entering" : ""}`}>
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={16} />
            {t.tagline}
          </div>
          <h1>{t.heroTitle}</h1>
          <p>{t.heroCopy}</p>

          <form className="link-form" onSubmit={analyzeVideo}>
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder={t.inputPlaceholder}
              spellCheck="false"
            />
            <button type="submit" disabled={loading}>
              {loading && phase !== "loading" ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
              {loading && phase !== "loading" ? t.analyzing : t.analyze}
            </button>
          </form>
          {error ? <div className="error-banner">{error}</div> : null}
        </div>

        <div className={`preview-panel ${showPreviewPanel ? "visible" : ""}`}>
          {video ? (
            <VideoSummary video={video} t={t} />
          ) : showPreviewPanel ? (
            <div className="empty-preview">
              <div className="preview-skeleton">
                <div className="skeleton-thumb" />
                <div className="skeleton-lines">
                  <span />
                  <strong />
                  <strong />
                </div>
              </div>
              <div className="empty-preview-copy">
                <span>{t.waitingVideo}</span>
                <p>{t.waitingHint}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {video ? (
        <section className="game-section">
          <div className="section-heading">
            <h2>{t.availableGames}</h2>
            {commentsMeta ? (
              <span className="cache-pill">
                {commentsMeta.cached ? t.cached : t.fresh} · {t.fetched} {number(commentsMeta.totalFetched)}
              </span>
            ) : null}
          </div>

          <div className="content-category">
            <h3>{t.participatoryContents}</h3>
            <div className="game-grid">
              <article className={`game-tile primary ${canBattle ? "" : "locked"}`}>
                <div>
                  <div className="tile-icon">
                    <Trophy size={22} />
                  </div>
                  <h3>{t.battleTitle}</h3>
                  <p>{canBattle ? t.battleDescription : t.minimumBlocked}</p>
                </div>
                <button onClick={startBattle} disabled={!canBattle || loading}>
                  {loading && phase === "loading" ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
                  {loading && phase === "loading" ? t.loadingComments : t.startBattle}
                </button>
              </article>

              <article className={`game-tile real ${canBattle ? "" : "locked"}`}>
                <div>
                  <div className="tile-icon muted">
                    <Eye size={22} />
                  </div>
                  <h3>{t.realCommentTitle}</h3>
                  <p>{canBattle ? t.realCommentDescription : t.minimumBlocked}</p>
                  <CandidatePicker t={t} value={candidateCount} onChange={setCandidateCount} />
                </div>
                <button onClick={() => startRealCommentGame()} disabled={!canBattle || loading}>
                  {loading && loadingMode === "real" ? <Loader2 className="spin" size={18} /> : <Eye size={18} />}
                  {loading && loadingMode === "real" ? t.aiLoadingComments : t.findAiComment}
                </button>
              </article>
            </div>
          </div>

          <div className="content-category">
            <h3>{t.utilityContents}</h3>
            <div className="game-grid utility-grid">
              <article className={`game-tile draw ${canUseUtility ? "" : "locked"}`}>
                <div>
                  <div className="tile-icon">
                    <Shuffle size={22} />
                  </div>
                  <h3>{t.randomDrawTitle}</h3>
                  <p>{canUseUtility ? t.randomDrawDescription : t.utilityBlocked}</p>
                </div>
                <button onClick={startDraw} disabled={!canUseUtility || loading}>
                  {loading && loadingMode === "draw" ? <Loader2 className="spin" size={18} /> : <Shuffle size={18} />}
                  {loading && loadingMode === "draw" ? t.drawLoadingComments : t.startDraw}
                </button>
              </article>

              <article className={`game-tile export ${canUseUtility ? "" : "locked"}`}>
                <div>
                  <div className="tile-icon muted">
                    <FileSpreadsheet size={22} />
                  </div>
                  <h3>{t.exportTitle}</h3>
                  <p>{canUseUtility ? t.exportDescription : t.utilityBlocked}</p>
                  <label className="inline-check">
                    <input
                      type="checkbox"
                      checked={exportIncludeReplies}
                      onChange={(event) => setExportIncludeReplies(event.target.checked)}
                      disabled={!canUseUtility || loading}
                    />
                    <span>
                      <strong>{t.includeReplies}</strong>
                      <small>{t.includeRepliesHelp}</small>
                    </span>
                  </label>
                </div>
                <button onClick={startExport} disabled={!canUseUtility || loading}>
                  {loading && loadingMode === "export" ? <Loader2 className="spin" size={18} /> : <Download size={18} />}
                  {loading && loadingMode === "export" ? t.exportLoadingComments : t.startExport}
                </button>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      {settingsOpen ? (
        <SettingsDialog
          t={t}
          language={language}
          setLanguage={setLanguage}
          maskAuthors={maskAuthors}
          setMaskAuthors={setMaskAuthors}
          revealSpeed={revealSpeed}
          setRevealSpeed={setRevealSpeed}
          onClose={() => setSettingsOpen(false)}
        />
      ) : null}
    </main>
  );
}

function Topbar({ t, onOpenSettings, onBrandClick, compact = false }) {
  return (
    <header className={`topbar ${compact ? "compact" : ""}`}>
      <button className="brand-mark" onClick={onBrandClick} type="button">
        <span className="brand-icon">
          <img src="/logo.png" alt="" />
        </span>
        <span>{t.brand}</span>
      </button>
      <button className="icon-button" onClick={onOpenSettings} aria-label={t.settings}>
        <Settings size={21} />
      </button>
    </header>
  );
}

function LeaveConfirm({ t, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop show">
      <div className="confirm-modal">
        <h2>{t.leaveGameTitle}</h2>
        <p>{t.leaveGameCopy}</p>
        <div className="confirm-actions">
          <button className="ghost-button" onClick={onCancel}>
            {t.stay}
          </button>
          <button onClick={onConfirm}>{t.leave}</button>
        </div>
      </div>
    </div>
  );
}

function DownloadScopeConfirm({ t, onCancel, onFiltered, onAll }) {
  return (
    <div className="modal-backdrop show">
      <div className="confirm-modal">
        <h2>{t.downloadScopeTitle}</h2>
        <p>{t.downloadScopeCopy}</p>
        <div className="confirm-actions">
          <button className="ghost-button" onClick={onCancel}>
            {t.close}
          </button>
          <button className="ghost-button" onClick={onAll}>
            {t.downloadAll}
          </button>
          <button onClick={onFiltered}>{t.downloadFiltered}</button>
        </div>
      </div>
    </div>
  );
}

function LoadingScreen({ t, video, progress, title, copy, kicker, label }) {
  return (
    <section className="loading-stage">
      <div className="loading-video">
        <img src={video.thumbnail} alt="" />
        <div>
          <span>{video.channelTitle}</span>
          <strong>{video.title}</strong>
        </div>
      </div>
      <div className="loading-core">
        <div className="loader-orbit">
          <Play size={34} fill="currentColor" />
        </div>
        <span className="loading-kicker">{kicker}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
        <div className="progress-head">
          <span>{label}</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="progress-bar" aria-label={label}>
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
  );
}

function CandidatePicker({ t, value, onChange }) {
  return (
    <div className="candidate-picker" onClick={(event) => event.stopPropagation()}>
      <span>{t.candidateCount}</span>
      <div>
        {[2, 3, 4, 5, 6, 8, 10].map((count) => (
          <button
            key={count}
            type="button"
            className={value === count ? "active" : ""}
            onClick={() => onChange(count)}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}

function VideoSummary({ video, t }) {
  return (
    <div className="video-card">
      <img src={video.thumbnail} alt="" />
      <div className="video-gradient" />
      <div className="video-content">
        <span>{video.channelTitle}</span>
        <h2>{video.title}</h2>
        <div className="stats-row">
          <Stat label={t.comments} value={compactNumber(video.commentCount)} />
          <Stat label={t.duration} value={video.durationLabel} />
          <Stat label={t.views} value={compactNumber(video.viewCount)} />
          <Stat label={t.likes} value={compactNumber(video.likeCount)} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function RandomDrawTool({
  t,
  video,
  comments,
  drawnIds,
  current,
  slotComment,
  spinning,
  filters,
  setFilters,
  filterOpen,
  setFilterOpen,
  onFiltersChanged,
  onDraw,
  maskAuthors
}) {
  const filteredComments = filterDrawComments(comments, filters);
  const remaining = Math.max(filteredComments.filter((comment) => !drawnIds.includes(comment.id)).length, 0);
  const display = slotComment;

  return (
    <section className="tool-arena draw-arena">
      <div className="battle-header">
        <div>
          <span className="round-chip">
            {t.matchedComments} {number(filteredComments.length)} · {t.pickedCount} {number(drawnIds.length)} · {t.remainingComments}{" "}
            {number(remaining)}
          </span>
          <h2>{t.randomDrawTitle}</h2>
        </div>
      </div>

      <div className="thumbnail-strip">
        <img src={video.thumbnail} alt="" />
        <div>
          <span>{video.channelTitle}</span>
          <strong>{video.title}</strong>
        </div>
      </div>

      <div className={`slot-machine ${spinning ? "spinning" : ""} ${current ? "picked" : ""}`}>
        <div className="slot-window">
          {display ? (
            <>
              <span>{maskAuthors ? display.maskedAuthor : display.author}</span>
              <p>{display.text}</p>
            </>
          ) : (
            <>
              <span>{t.randomDrawTitle}</span>
              <p>{remaining <= 0 ? t.noMoreComments : t.drawReady}</p>
            </>
          )}
        </div>
      </div>

      <div className="tool-actions">
        <button className="outline-button" type="button" onClick={() => setFilterOpen((value) => !value)}>
          <Filter size={18} />
          {t.drawFilterTitle}
        </button>
        <button onClick={onDraw} disabled={spinning || remaining <= 0}>
          {spinning ? <Loader2 className="spin" size={18} /> : <Shuffle size={18} />}
          {spinning ? t.drawing : current ? t.drawAgain : t.startDraw}
        </button>
        {current ? (
          <span>
            {t.tableLikes} {number(current.likeCount)} · {t.tableReplies} {number(current.replyCount)}
          </span>
        ) : null}
      </div>

      {filterOpen ? (
        <DrawFilterBuilder
          t={t}
          filters={filters}
          setFilters={setFilters}
          onFiltersChanged={onFiltersChanged}
          matchedCount={filteredComments.length}
        />
      ) : null}
    </section>
  );
}

function DrawFilterBuilder({ t, filters, setFilters, onFiltersChanged, matchedCount }) {
  const options = [
    ["contains", t.conditionContains],
    ["excludes", t.conditionExcludes],
    ["number", t.conditionNumber],
    ["english", t.conditionEnglish],
    ["korean", t.conditionKorean],
    ["url", t.conditionUrl],
    ["regex", t.conditionRegex]
  ];

  function updateFilters(nextFilters) {
    setFilters(nextFilters);
    onFiltersChanged();
  }

  return (
    <section className="draw-filter-panel">
      <div className="draw-filter-head">
        <div>
          <span>
            <Filter size={16} />
            {t.drawFilterTitle}
          </span>
          <p>{t.drawFilterHelp}</p>
        </div>
        <strong>{number(matchedCount)}</strong>
      </div>

      <div className="draw-filter-list">
        {filters.map((filter) => (
          <div className="draw-filter-row" key={filter.id}>
            <select
              value={filter.type}
              onChange={(event) =>
                updateFilters(
                  filters.map((item) =>
                    item.id === filter.id ? { ...item, type: event.target.value, value: textFilterTypes.has(event.target.value) ? item.value : "" } : item
                  )
                )
              }
            >
              {options.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {textFilterTypes.has(filter.type) ? (
              <input
                value={filter.value}
                onChange={(event) =>
                  updateFilters(filters.map((item) => (item.id === filter.id ? { ...item, value: event.target.value } : item)))
                }
                placeholder={t.conditionPlaceholder}
              />
            ) : (
              <div className="rule-chip">{options.find(([value]) => value === filter.type)?.[1]}</div>
            )}
            <button
              className="icon-button subtle"
              type="button"
              onClick={() => updateFilters(filters.filter((item) => item.id !== filter.id))}
              aria-label={t.close}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="draw-filter-actions">
        <button type="button" onClick={() => updateFilters([...filters, createDrawFilter()])}>
          <Plus size={16} />
          {t.addCondition}
        </button>
        {filters.length ? (
          <button type="button" className="ghost-button" onClick={() => updateFilters([])}>
            {t.clearConditions}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function CommentExportTool({
  t,
  video,
  comments,
  filters,
  setFilters,
  filterOpen,
  setFilterOpen,
  page,
  setPage,
  onFiltersChanged,
  onDownloadCsv,
  onDownloadExcel
}) {
  const pageSize = 25;
  const filteredComments = filterDrawComments(comments, filters);
  const totalPages = Math.max(Math.ceil(filteredComments.length / pageSize), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = filteredComments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="tool-arena export-arena">
      <div className="battle-header export-head">
        <div>
          <span className="round-chip">
            {t.fetched} {number(comments.length)} · {t.matchedComments} {number(filteredComments.length)} · {t.pageLabel} {currentPage}/
            {totalPages}
          </span>
          <h2>{t.exportTitle}</h2>
        </div>
        <div className="download-actions export-toolbar">
          <button className="outline-button" type="button" onClick={() => setFilterOpen((value) => !value)}>
            <Filter size={18} />
            {t.exportFilterTitle}
          </button>
          <button onClick={onDownloadExcel}>
            <FileSpreadsheet size={18} />
            {t.downloadExcel}
          </button>
          <button onClick={onDownloadCsv}>
            <Download size={18} />
            {t.downloadCsv}
          </button>
        </div>
      </div>

      <div className="thumbnail-strip">
        <img src={video.thumbnail} alt="" />
        <div>
          <span>{video.channelTitle}</span>
          <strong>{video.title}</strong>
        </div>
      </div>

      {filterOpen ? (
        <DrawFilterBuilder
          t={{ ...t, drawFilterTitle: t.exportFilterTitle, drawFilterHelp: t.exportFilterHelp }}
          filters={filters}
          setFilters={setFilters}
          onFiltersChanged={onFiltersChanged}
          matchedCount={filteredComments.length}
        />
      ) : null}

      <div className="comment-table-wrap">
        <table className="comment-table">
          <thead>
            <tr>
              <th>No</th>
              <th>{t.tableType}</th>
              <th>{t.tableAuthor}</th>
              <th>{t.tableComment}</th>
              <th>{t.tableParent}</th>
              <th>{t.tableLikes}</th>
              <th>{t.tableReplies}</th>
              <th>{t.tablePublished}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((comment, index) => (
              <tr key={comment.id || `${currentPage}-${index}`}>
                <td>{(currentPage - 1) * pageSize + index + 1}</td>
                <td>{comment.isReply ? t.replyComment : t.topLevelComment}</td>
                <td>
                  <span className="table-ellipsis">{comment.author}</span>
                </td>
                <td>
                  <div className="table-comment-scroll">{comment.text}</div>
                </td>
                <td>
                  <span className="table-ellipsis">{comment.isReply ? `${comment.parentAuthor} · ${comment.parentText}` : "-"}</span>
                </td>
                <td>{number(comment.likeCount)}</td>
                <td>{number(comment.replyCount)}</td>
                <td>
                  <span className="table-ellipsis">{comment.publishedAt ? new Date(comment.publishedAt).toLocaleString() : ""}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={currentPage <= 1}>
          {t.previousPage}
        </button>
        <span>
          {t.pageLabel} {currentPage} / {totalPages}
        </span>
        <button onClick={() => setPage((value) => Math.min(value + 1, totalPages))} disabled={currentPage >= totalPages}>
          {t.nextPageLabel}
        </button>
      </div>
    </section>
  );
}

function BattleArena({ t, video, round, roundIndex, total, score, selected, result, maskAuthors, onChoose, onNext }) {
  const revealed = Boolean(result);
  const winner = round.answer;
  const [activeTimestamp, setActiveTimestamp] = useState(null);

  return (
    <section className={`battle-arena ${revealed ? "revealed" : ""}`}>
      <TimestampViewer video={video} timestamp={activeTimestamp} onClose={() => setActiveTimestamp(null)} />
      <div className="battle-header">
        <div>
          <span className="round-chip">
            {t.round} {roundIndex + 1} · {t.correctCount} {score}
          </span>
          <h2>{t.battleTitle}</h2>
        </div>
      </div>

      <div className="thumbnail-strip">
        <img src={video.thumbnail} alt="" />
        <div>
          <span>{video.channelTitle}</span>
          <strong>{video.title}</strong>
        </div>
      </div>

      <div className="comment-duel">
        <CommentChoice
          side="left"
          comment={round.left}
          selected={selected}
          winner={winner}
          revealed={revealed}
          maskAuthors={maskAuthors}
          onChoose={onChoose}
          onOpenTimestamp={setActiveTimestamp}
        />
        <div className="versus" aria-hidden="true">
          <span>VS</span>
        </div>
        <CommentChoice
          side="right"
          comment={round.right}
          selected={selected}
          winner={winner}
          revealed={revealed}
          maskAuthors={maskAuthors}
          onChoose={onChoose}
          onOpenTimestamp={setActiveTimestamp}
        />
      </div>

      {revealed ? (
        <div className={`result-strip ${result}`}>
          <strong>{result === "correct" ? t.correct : t.wrong}</strong>
          <span>
            {t.winner}: {winner === "left" ? "A" : "B"}
          </span>
          <button onClick={onNext}>
            {result === "correct" ? t.nextRound : t.playAgain}
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RealCommentArena({ t, video, round, roundIndex, score, selected, result, maskAuthors, onChoose, onNext }) {
  const revealed = Boolean(result);
  const [activeTimestamp, setActiveTimestamp] = useState(null);

  return (
    <section className={`battle-arena real-arena ${revealed ? "revealed" : ""}`}>
      <TimestampViewer video={video} timestamp={activeTimestamp} onClose={() => setActiveTimestamp(null)} />
      <div className="battle-header">
        <div>
          <span className="round-chip">
            {t.round} {roundIndex + 1} · {t.correctCount} {score}
          </span>
          <h2>{t.realCommentTitle}</h2>
        </div>
      </div>

      <div className="thumbnail-strip">
        <img src={video.thumbnail} alt="" />
        <div>
          <span>{video.channelTitle}</span>
          <strong>{video.title}</strong>
        </div>
      </div>

      <div className={`real-comment-grid count-${round.choices.length}`}>
        {round.choices.map((comment) => (
          <RealCommentChoice
            key={comment.choiceId}
            comment={comment}
            selected={selected}
            answer={round.answer}
            revealed={revealed}
            maskAuthors={maskAuthors}
            t={t}
            onChoose={onChoose}
            onOpenTimestamp={setActiveTimestamp}
          />
        ))}
      </div>

      {revealed ? (
        <div className={`result-strip ${result}`}>
          <strong>{result === "correct" ? t.correct : t.wrong}</strong>
          <span>{result === "correct" ? t.aiReveal : t.aiReveal}</span>
          <button onClick={onNext}>
            {result === "correct" ? t.nextRound : t.playAgain}
            <ChevronRight size={18} />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function RealCommentChoice({ comment, selected, answer, revealed, maskAuthors, t, onChoose, onOpenTimestamp }) {
  const isSelected = selected === comment.choiceId;
  const isAnswer = answer === comment.choiceId;

  return (
    <div
      role="button"
      tabIndex={selected ? -1 : 0}
      className={`comment-choice real-choice ${isSelected ? "selected" : ""} ${revealed && isAnswer ? "winner" : ""} ${
        revealed && isSelected && !isAnswer ? "loser" : ""
      }`}
      onClick={() => onChoose(comment.choiceId)}
      onKeyDown={(event) => {
        if (selected) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onChoose(comment.choiceId);
        }
      }}
    >
      <CommentText text={comment.text} onOpenTimestamp={onOpenTimestamp} />
      <div className="comment-meta">
        <span>{maskAuthors ? comment.maskedAuthor : comment.author}</span>
        {revealed ? (
          <strong className={isAnswer ? "ai-tag" : "real-tag"}>
            {isAnswer ? t.aiComment : t.realReveal}
          </strong>
        ) : null}
      </div>
    </div>
  );
}

function TimestampViewer({ video, timestamp, onClose }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setClosing(false);
  }, [timestamp?.seconds]);

  if (!timestamp) return null;

  function closeWithAnimation() {
    setClosing(true);
    window.setTimeout(onClose, 220);
  }

  return (
    <div className={`timestamp-viewer ${closing ? "closing" : ""}`}>
      <div className="timestamp-player">
        <div className="timestamp-head">
          <div>
            <span>{timestamp.label}</span>
            <strong>{video.title}</strong>
          </div>
          <button className="icon-button subtle" onClick={closeWithAnimation} aria-label="Close video">
            <X size={18} />
          </button>
        </div>
        <iframe
          title={`${video.title} ${timestamp.label}`}
          src={`https://www.youtube.com/embed/${video.videoId}?start=${timestamp.seconds}&autoplay=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}

function CommentChoice({ side, comment, selected, winner, revealed, maskAuthors, onChoose, onOpenTimestamp }) {
  const isSelected = selected === side;
  const isWinner = winner === side;
  return (
    <div
      role="button"
      tabIndex={selected ? -1 : 0}
      className={`comment-choice ${isSelected ? "selected" : ""} ${revealed && isWinner ? "winner" : ""} ${
        revealed && isSelected && !isWinner ? "loser" : ""
      }`}
      onClick={() => onChoose(side)}
      onKeyDown={(event) => {
        if (selected) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onChoose(side);
        }
      }}
    >
      <CommentText text={comment.text} onOpenTimestamp={onOpenTimestamp} />
      <div className="comment-meta">
        <span>{maskAuthors ? comment.maskedAuthor : comment.author}</span>
        {revealed ? (
          <strong>
            <Check size={17} />
            {number(comment.likeCount)}
          </strong>
        ) : null}
      </div>
    </div>
  );
}

function CommentText({ text, onOpenTimestamp }) {
  return (
    <p>
      {splitTimestamps(text).map((part, index) => {
        if (part.type === "timestamp") {
          return (
            <button
              className="timestamp-link"
              key={`${part.value}-${index}`}
              onClick={(event) => {
                event.stopPropagation();
                onOpenTimestamp({ label: part.value, seconds: part.seconds });
              }}
            >
              {part.value}
            </button>
          );
        }
        return <span key={`${part.value}-${index}`}>{part.value}</span>;
      })}
    </p>
  );
}

function SettingsDialog({
  t,
  language,
  setLanguage,
  maskAuthors,
  setMaskAuthors,
  revealSpeed,
  setRevealSpeed,
  onClose
}) {
  return (
    <div className="modal-backdrop show">
      <dialog open className="settings-dialog">
        <div className="dialog-head">
          <h2>{t.settings}</h2>
          <button className="icon-button subtle" onClick={onClose} aria-label={t.close}>
            <X size={20} />
          </button>
        </div>

        <label className="setting-block">
          <span>
            <Globe2 size={18} />
            {t.language}
          </span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {Object.keys(dictionaries).map((code) => (
              <option key={code} value={code}>
                {languageNames[code]}
              </option>
            ))}
          </select>
        </label>

        <label className="toggle-row">
          <span>
            <strong>{t.maskAuthors}</strong>
            <small>{t.maskAuthorsHelp}</small>
          </span>
          <input type="checkbox" checked={maskAuthors} onChange={(event) => setMaskAuthors(event.target.checked)} />
        </label>

        <div className="setting-block vertical">
          <span>{t.revealSpeed}</span>
          <div className="segmented">
            {["fast", "normal", "dramatic"].map((speed) => (
              <button
                key={speed}
                className={revealSpeed === speed ? "active" : ""}
                onClick={() => setRevealSpeed(speed)}
              >
                {t[speed]}
              </button>
            ))}
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default App;
