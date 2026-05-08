import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Play,
  RotateCcw,
  Settings,
  Sparkles,
  Trophy,
  X
} from "lucide-react";
import logoUrl from "../logo.png";

const dictionaries = {
  ko: {
    brand: "Commentube",
    tagline: "유튜브 댓글창을 속도감 있는 미니게임으로.",
    heroTitle: "댓글 좋아요 수, 어디까지 맞힐 수 있을까?",
    heroCopy: "영상 링크를 넣으면 정보를 먼저 분석하고, 댓글 100개 이상 영상에서 댓글 배틀을 바로 생성합니다.",
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
    comingSoon: "추후 공개",
    startBattle: "댓글 읽고 시작",
    loadingComments: "댓글 후보 수집 중",
    loadingTitle: "댓글 배틀 준비 중",
    loadingCopy: "좋아요가 있는 댓글을 모으고, 비슷한 점수대의 대결 후보를 만들고 있어요.",
    preparingBattle: "라운드 구성",
    correctCount: "정답",
    battleTitle: "댓글 배틀",
    battleDescription: "둘 중 좋아요 수가 더 높은 댓글을 고르세요. 틀리면 종료됩니다.",
    realCommentTitle: "진짜 댓글 찾기",
    aiSoon: "AI 생성 댓글 품질을 다듬은 뒤 공개 예정",
    score: "연속 정답",
    round: "라운드",
    chooseHigher: "좋아요가 더 많다",
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
    tagline: "Turn YouTube comments into fast little games.",
    heroTitle: "How long can you guess the higher-liked comment?",
    heroCopy: "Paste a video link, preview the video stats, then generate Comment Battle for videos with 100+ comments.",
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
    comingSoon: "Coming soon",
    startBattle: "Load comments",
    loadingComments: "Collecting comment candidates",
    loadingTitle: "Preparing Comment Battle",
    loadingCopy: "Collecting liked comments and matching close battle candidates.",
    preparingBattle: "Building rounds",
    correctCount: "Correct",
    battleTitle: "Comment Battle",
    battleDescription: "Pick the comment with more likes. One miss ends the run.",
    realCommentTitle: "Find the Real Comment",
    aiSoon: "Coming after the AI fake-comment quality is tuned",
    score: "Streak",
    round: "Round",
    chooseHigher: "Has more likes",
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
    tagline: "YouTubeコメントをテンポの速いミニゲームに。",
    heroTitle: "高評価の多いコメントを何回当てられる？",
    heroCopy: "動画リンクを入れると情報を分析し、コメント100件以上の動画でコメントバトルを生成します。",
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
    comingSoon: "近日公開",
    startBattle: "コメントを読み込む",
    loadingComments: "コメント候補を収集中",
    loadingTitle: "コメントバトル準備中",
    loadingCopy: "高評価のあるコメントを集め、近いスコアの対戦候補を作っています。",
    preparingBattle: "ラウンド生成",
    correctCount: "正解",
    battleTitle: "コメントバトル",
    battleDescription: "高評価が多いコメントを選びます。外すと終了です。",
    realCommentTitle: "本物コメント探し",
    aiSoon: "AIコメント品質を調整後に公開予定",
    score: "連続正解",
    round: "ラウンド",
    chooseHigher: "高評価が多い",
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

function number(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function compactNumber(value) {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value || 0));
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

function initialLanguage() {
  const saved = localStorage.getItem("commentube-language");
  if (saved && dictionaries[saved]) return saved;
  const browser = navigator.language?.slice(0, 2);
  return dictionaries[browser] ? browser : "ko";
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
    setPhase("idle");
    setPreviewEntering(true);

    try {
      const payload = await requestJson(`/api/video?url=${encodeURIComponent(url.trim())}`);
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

  function choose(side) {
    if (!currentRound || selected) return;
    setSelected(side);
    const isCorrect = side === currentRound.answer;

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

  function resetGame() {
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
    setRoundIndex(0);
    setScore(0);
    setSelected(null);
    setResult(null);
    setLeaveConfirmOpen(false);
  }

  function handleBrandClick() {
    if (phase === "battle" || phase === "gameover" || phase === "loading") {
      setLeaveConfirmOpen(true);
      return;
    }
    goHome();
  }

  if (phase === "loading") {
    return (
      <main className="app-shell loading-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} />
        <LoadingScreen t={t} video={video} progress={loadingProgress} />
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

  if ((phase === "battle" || phase === "gameover") && currentRound) {
    return (
      <main className="app-shell game-shell">
        <div className="speed-lines" />
        <Topbar t={t} onOpenSettings={() => setSettingsOpen(true)} onBrandClick={handleBrandClick} compact />
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

            <article className="game-tile locked">
              <div>
                <div className="tile-icon muted">
                  <Eye size={22} />
                </div>
                <h3>{t.realCommentTitle}</h3>
                <p>{t.aiSoon}</p>
              </div>
              <span className="coming-soon">{t.comingSoon}</span>
            </article>
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
          <img src={logoUrl} alt="" />
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

function LoadingScreen({ t, video, progress }) {
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
        <span className="loading-kicker">{t.preparingBattle}</span>
        <h1>{t.loadingTitle}</h1>
        <p>{t.loadingCopy}</p>
        <div className="progress-head">
          <span>{t.loadingComments}</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="progress-bar" aria-label={t.loadingComments}>
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>
    </section>
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

function BattleArena({ t, video, round, roundIndex, total, score, selected, result, maskAuthors, onChoose, onNext }) {
  const revealed = Boolean(result);
  const winner = round.answer;

  return (
    <section className={`battle-arena ${revealed ? "revealed" : ""}`}>
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
          t={t}
          onChoose={onChoose}
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
          t={t}
          onChoose={onChoose}
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

function CommentChoice({ side, comment, selected, winner, revealed, maskAuthors, t, onChoose }) {
  const isSelected = selected === side;
  const isWinner = winner === side;
  return (
    <button
      className={`comment-choice ${isSelected ? "selected" : ""} ${revealed && isWinner ? "winner" : ""} ${
        revealed && isSelected && !isWinner ? "loser" : ""
      }`}
      onClick={() => onChoose(side)}
      disabled={Boolean(selected)}
    >
      <p>{comment.text}</p>
      <div className="comment-meta">
        <span>{maskAuthors ? comment.maskedAuthor : comment.author}</span>
        {revealed ? (
          <strong>
            <Check size={17} />
            {number(comment.likeCount)}
          </strong>
        ) : (
          <span className="hidden-likes">
            <EyeOff size={16} />
            {t.chooseHigher}
          </span>
        )}
      </div>
    </button>
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
