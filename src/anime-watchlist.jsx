// anime-watchlist.jsx — Shinkai Edition
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { db } from "./firebase";
import { collection, onSnapshot, setDoc, doc, deleteDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_RATINGS = [1, 2, 3, 4, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
const LS_USER = "anime-wl-user-v2";
const LS_ONBOARDED = "anime-wl-onboarded-v2";
const LS_THEME_OVERRIDE = "anime-wl-theme-v2";

const DEFAULT_PEOPLE = [
  { name: "Shunji",  color: "#7dd3fc", ptw: [] },
  { name: "Jerry",   color: "#a5b4fc", ptw: [] },
  { name: "Kyle",    color: "#fcd34d", ptw: [] },
  { name: "Richard", color: "#c4b5fd", ptw: [] },
  { name: "Alan",    color: "#6ee7b7", ptw: [] },
];

const DEFAULT_ANIME = [
  { id:1,  title:"5 Centimeters Per Second", jp:"秒速5センチメートル", ratings:{Shunji:6,Kyle:7,Richard:4}, cover:"" },
  { id:2,  title:"86", jp:"エイティシックス", ratings:{Alan:10}, cover:"" },
  { id:3,  title:"A Silent Voice", jp:"聲の形", ratings:{Shunji:7.5,Richard:8,Kyle:5,Jerry:8}, cover:"" },
  { id:4,  title:"A Whisker Away", jp:"泣きたい私は猫をかぶる", ratings:{}, cover:"" },
  { id:5,  title:"Akame ga Kill", jp:"アカメが斬る！", ratings:{}, cover:"" },
  { id:6,  title:"Anohana: The Flower We Saw That Day", jp:"あの日見た花の名前を僕達はまだ知らない。", ratings:{Kyle:9,Richard:9.5}, cover:"" },
  { id:7,  title:"Anohana: The Movie", jp:"劇場版 あの日見た花の名前を僕達はまだ知らない。", ratings:{}, cover:"" },
  { id:8,  title:"Belle", jp:"竜とそばかすの姫", ratings:{Shunji:7,Jerry:6}, cover:"" },
  { id:9,  title:"Bubble", jp:"バブル", ratings:{Richard:6}, cover:"" },
  { id:10, title:"Castle in the Sky", jp:"天空の城ラピュタ", ratings:{Shunji:8}, cover:"" },
  { id:11, title:"Children Who Chase Lost Voices", jp:"星を追う子ども", ratings:{}, cover:"" },
  { id:12, title:"Clannad", jp:"クラナド", ratings:{}, cover:"" },
  { id:13, title:"Fireworks", jp:"打ち上げ花火、下から見るか？横から見るか？", ratings:{Kyle:3}, cover:"" },
  { id:14, title:"Grave of the Fireflies", jp:"火垂るの墓", ratings:{Shunji:8.5}, cover:"" },
  { id:15, title:"Hello World", jp:"ハロー・ワールド", ratings:{Shunji:6.5}, cover:"" },
  { id:16, title:"Her Blue Sky", jp:"空の青さを知る人よ", ratings:{}, cover:"" },
  { id:17, title:"Howl's Moving Castle", jp:"ハウルの動く城", ratings:{Kyle:7,Shunji:7.5}, cover:"" },
  { id:18, title:"I Want to Eat Your Pancreas", jp:"君の膵臓をたべたい", ratings:{Shunji:9,Jerry:9}, cover:"" },
  { id:19, title:"Josee, the Tiger, and the Fish", jp:"ジョゼと虎と魚たち", ratings:{Alan:9.5}, cover:"" },
  { id:20, title:"Just Because!", jp:"ジャストビコーズ！", ratings:{}, cover:"" },
  { id:21, title:"Look Back", jp:"ルックバック", ratings:{}, cover:"" },
  { id:22, title:"Maquia: When the Promised Flowers Bloom", jp:"さよならの朝に約束の花をかざろう", ratings:{Shunji:7}, cover:"" },
  { id:23, title:"Moriarty the Patriot", jp:"憂国のモリアーティ", ratings:{}, cover:"" },
  { id:24, title:"My Neighbor Totoro", jp:"となりのトトロ", ratings:{Shunji:9,Jerry:10}, cover:"" },
  { id:25, title:"Ponyo", jp:"崖の上のポニョ", ratings:{Jerry:10,Shunji:7}, cover:"" },
  { id:26, title:"Princess Lover", jp:"プリンセスラバー！", ratings:{}, cover:"" },
  { id:27, title:"ReLIFE", jp:"リライフ", ratings:{Alan:9.5}, cover:"" },
  { id:28, title:"Saekano", jp:"冴えない彼女の育てかた", ratings:{Alan:9.5}, cover:"" },
  { id:29, title:"Spirited Away", jp:"千と千尋の神隠し", ratings:{Shunji:9,Kyle:8,Richard:7}, cover:"" },
  { id:30, title:"Summer Ghost", jp:"サマーゴースト", ratings:{Shunji:7.5}, cover:"" },
  { id:31, title:"Suzume", jp:"すずめの戸締まり", ratings:{Shunji:7,Kyle:7,Jerry:8,Richard:7}, cover:"" },
  { id:32, title:"The Boy and the Heron", jp:"君たちはどう生きるか", ratings:{Jerry:5,Shunji:8.5}, cover:"" },
  { id:33, title:"The Garden of Words", jp:"言の葉の庭", ratings:{Shunji:6,Kyle:6,Richard:4}, cover:"" },
  { id:34, title:"The Lonely Castle in the Mirror", jp:"鏡の中の孤城", ratings:{Shunji:5.5}, cover:"" },
  { id:35, title:"The Place Promised in Our Earlier Days", jp:"雲のむこう、約束の場所", ratings:{}, cover:"" },
  { id:36, title:"To Every You I've Loved Before", jp:"ぼくが愛したすべての君へ", ratings:{}, cover:"" },
  { id:37, title:"To Me, the One Who Loved You", jp:"君を愛したひとりの僕へ", ratings:{}, cover:"" },
  { id:38, title:"Tunnel to Summer, Exit to Goodbyes", jp:"夏へのトンネル、さよならの出口", ratings:{Shunji:9,Alan:9.5}, cover:"" },
  { id:39, title:"Typhoon Noruda", jp:"台風のノルダ", ratings:{Shunji:5,Jerry:6}, cover:"" },
  { id:40, title:"Violet Evergarden", jp:"ヴァイオレット・エヴァーガーデン", ratings:{Alan:10}, cover:"" },
  { id:41, title:"Weathering With You", jp:"天気の子", ratings:{Kyle:9,Richard:8,Jerry:9,Shunji:9.5}, cover:"" },
  { id:42, title:"When Marnie Was There", jp:"思い出のマーニー", ratings:{Shunji:6.5}, cover:"" },
  { id:43, title:"Wolf Children", jp:"おおかみこどもの雨と雪", ratings:{}, cover:"" },
  { id:44, title:"Words Bubble Up Like Soda Pop", jp:"サイダーのように言葉が湧き上がる", ratings:{}, cover:"" },
  { id:45, title:"Your Lie in April", jp:"四月は君の嘘", ratings:{Kyle:9,Alan:9,Richard:8,Shunji:10}, cover:"" },
  { id:46, title:"Your Name", jp:"君の名は。", ratings:{Shunji:10,Jerry:10,Richard:9,Kyle:10}, cover:"" },
  { id:47, title:"Yuri on Ice", jp:"ユーリ!!! on ICE", ratings:{}, cover:"" },
];

// Shared easing token — the ONE curve for everything
const EASE = [0.4, 0, 0.2, 1];

// ============================================================================
// PASSCODE HASHING
// ============================================================================
const HASH_PREFIX = "pbkdf2$";
const HASH_ITERATIONS = 150000;

const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64ToBuf = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
};

async function hashPasscode(plain) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: HASH_ITERATIONS, hash: "SHA-256" },
    keyMaterial, 256
  );
  return `${HASH_PREFIX}${HASH_ITERATIONS}$${bufToB64(salt.buffer)}$${bufToB64(bits)}`;
}

async function verifyPasscode(plain, stored) {
  if (!stored) return false;
  if (!stored.startsWith(HASH_PREFIX)) return stored === plain;
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const iterations = parseInt(parts[1], 10);
  let salt, expected;
  try { salt = b64ToBuf(parts[2]); expected = parts[3]; } catch { return false; }
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256
  );
  return bufToB64(bits) === expected;
}

const isHashedPasscode = (stored) => !!stored && stored.startsWith(HASH_PREFIX);

// ============================================================================
// HELPERS
// ============================================================================

const getAutoTheme = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 17) return "day";
  if (h >= 17 && h < 19) return "goldenhour";
  return "night";
};

const getTimeIcon = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 11)  return { icon: "🌸", label: "Morning" };
  if (h >= 11 && h < 17) return { icon: "☀", label: "Afternoon" };
  if (h >= 17 && h < 19) return { icon: "🌅", label: "Golden Hour" };
  return { icon: "🌙", label: "Night" };
};

const getScoreColor = (s, isNight) => {
  if (s >= 9)   return isNight ? "#c9d7ff" : "#3b4a8a";
  if (s >= 7.5) return isNight ? "#c5ecd1" : "#347a5a";
  if (s >= 5.5) return isNight ? "#f9e3a0" : "#b07c2e";
  if (s >= 4)   return isNight ? "#f5c6b1" : "#b55a2e";
  return isNight ? "#f9b5b5" : "#b33c3c";
};

const getScoreLabel = (s) => {
  if (s >= 9)   return "Masterpiece";
  if (s >= 7.5) return "Great";
  if (s >= 5.5) return "Decent";
  if (s >= 4)   return "Mediocre";
  return "Avoid";
};

const getAvg = (r) => {
  const v = Object.values(r);
  if (!v.length) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
};

const timeAgo = (ts) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

// Color extraction: pick 1 dominant color from an image (soft/pastelized) for glow tint
const extractDominantColor = (imgUrl) => new Promise((resolve) => {
  if (!imgUrl) return resolve(null);
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      const size = 24;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      if (!n) return resolve(null);
      r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
      // Pastelize: mix toward white
      const mix = 0.5;
      r = Math.round(r + (255 - r) * mix);
      g = Math.round(g + (255 - g) * mix);
      b = Math.round(b + (255 - b) * mix);
      resolve(`rgba(${r},${g},${b},0.5)`);
    } catch { resolve(null); }
  };
  img.onerror = () => resolve(null);
  img.src = imgUrl;
});

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FallingPetals({ isNight }) {
  // Reduced from 10 to 6 — "you notice them after 10 seconds, not instantly"
  const petals = Array.from({ length: 6 }, (_, i) => i);
  return (
    <div className="petals-container" aria-hidden="true">
      {petals.map(i => (
        <div
          key={i}
          className="petal"
          style={{
            left: `${(i * 14.5 + 5) % 100}%`,
            animationDelay: `${(i * 3.7) % 20}s`,
            animationDuration: `${18 + (i % 3) * 4}s`,
            background: isNight
              ? "radial-gradient(circle at 30% 30%, rgba(196,189,232,0.55), rgba(164,158,201,0.35))"
              : "radial-gradient(circle at 30% 30%, rgba(245,208,216,0.7), rgba(232,180,192,0.5))",
            opacity: isNight ? 0.28 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

function Stars() {
  // Dimmer, subtler stars
  const stars = Array.from({ length: 28 }, (_, i) => ({
    left: (i * 19.1 + 5) % 100,
    top: (i * 15.3 + 8) % 100,
    size: 1 + (i % 2),
    delay: (i * 0.55) % 8,
    duration: 4 + (i % 3),
    opacity: 0.15 + (i % 4) * 0.06,
  }));
  return (
    <div className="stars-container" aria-hidden="true">
      {stars.map((s, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

function Comet() { return <div className="comet" aria-hidden="true" />; }

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const timeInfo = getTimeIcon();
  return (
    <div className="live-clock">
      <span className="clock-icon">{timeInfo.icon}</span>
      <div className="clock-text">
        <div className="clock-time">{time}</div>
        <div className="clock-label">{timeInfo.label}</div>
      </div>
    </div>
  );
}

function ThemeToggle({ value, onChange }) {
  return (
    <div className="theme-toggle">
      {[
        { v: "auto",  label: "Auto" },
        { v: "day",   label: "Day"  },
        { v: "night", label: "Night"},
      ].map(opt => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={`theme-toggle-btn ${value === opt.v ? "active" : ""}`}
        >{opt.label}</button>
      ))}
    </div>
  );
}

function WelcomeBanner({ onClose, onSignIn }) {
  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <h2 className="welcome-title">🌸 Welcome to Shunji's Anime Watchlist</h2>
        <p className="welcome-text">
          <strong>To rate anime and add titles, you must create a profile with a passcode.</strong> Click "Members" → "+ Create Profile" to get started. Already have a profile? Click "Sign In" in the top right.
        </p>
        <div className="welcome-tips">
          <div className="welcome-tip"><strong>Passcode status:</strong> This legacy client-side check is not trusted authentication.</div>
          <div className="welcome-tip"><strong>📌 Tip:</strong> Check the new <strong>Scenes</strong> tab for a cinematic ranking experience.</div>
        </div>
      </div>
      <div className="welcome-actions">
        <button onClick={onSignIn} className="btn btn-primary">Get Started</button>
        <button onClick={onClose} className="btn btn-ghost">Dismiss</button>
      </div>
    </div>
  );
}

// Poster card with hover-tracking glow + color extraction
function PosterCard({ a, rank, isFav, inMyPtw, isAdmin, isNight, pc, avg, raters, topThree, isMobile, onClick, onToggleFav, getMobileTitleSize }) {
  const cardRef = useRef(null);
  const [glowColor, setGlowColor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (a.cover) {
      extractDominantColor(a.cover).then(c => { if (!cancelled && c) setGlowColor(c); });
    }
    return () => { cancelled = true; };
  }, [a.cover]);

  const onMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty("--x", `${x}%`);
    cardRef.current.style.setProperty("--y", `${y}%`);
  };

  const glowStyle = glowColor ? { "--card-glow": glowColor } : {};

  return (
    <motion.div
      ref={cardRef}
      className="poster-card"
      onClick={onClick}
      onMouseMove={onMove}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{ ...glowStyle, ...(isMobile ? { borderRadius: 10, overflow: "hidden" } : {}) }}
    >
      {topThree.length > 0 && !isMobile && (
        <div className="hover-tooltip">
          <div className="tooltip-label">Top Scores</div>
          {topThree.map(([n, s]) => (
            <div key={n} className="tooltip-row">
              <span className="tooltip-dot" style={{ background: pc(n) }} />
              <span className="tooltip-name">{n}</span>
              <span className="tooltip-score" style={{ color: getScoreColor(s, isNight) }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      <div className="poster-cover" style={{ backgroundImage: a.cover ? `url(${a.cover})` : "none" }}>
        {!a.cover && <span className="poster-placeholder">🎬</span>}

        {rank && rank <= 10 && (
          <div className={`rank-badge ${rank <= 3 ? "top3" : ""}`}>#{rank}</div>
        )}

        <div className="poster-badges">
          {inMyPtw && <div className="ptw-badge">📌</div>}
          {isAdmin && (
            <button
              className={`fav-btn ${isFav ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); onToggleFav(a.id); }}
              title={isFav ? "Remove favorite" : "Mark as favorite"}
            >★</button>
          )}
        </div>

        <div className="poster-fade" />

        <div className="poster-info-strip">
          <div
            className="poster-title"
            style={isMobile ? {
              fontSize: getMobileTitleSize(a.title),
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.25,
              whiteSpace: "normal"
            } : {}}
          >{a.title}</div>
          {a.jp && !isMobile && <div className="poster-jp">{a.jp}</div>}
          <div className="poster-meta-row">
            {avg !== null ? (
              <span className="poster-score" style={{ color: getScoreColor(avg, isNight), ...(isMobile ? { fontSize: "10px" } : {}) }}>
                {avg.toFixed(1)}
              </span>
            ) : (
              <span className="poster-score none">—</span>
            )}
            <div className="poster-raters">
              {raters.slice(0, 5).map(([n]) => (
                <span key={n} className="rater-dot" style={{ background: pc(n) }} title={`${n}: ${a.ratings[n]}`} />
              ))}
              {raters.length > 5 && <span className="rater-more">+{raters.length - 5}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="poster-glow" />
    </motion.div>
  );
}

// Cinematic Scenes mode — scroll-driven zoom+dissolve (no page scroll)
function ScenesMode({ anime, pc, getScoreColor, onCardClick, isAdmin, sceneConfig, saveSceneConfig, onExit }) {
  const [editing, setEditing] = useState(false);           // grid editor (picks + order)
  const [bgDrafts, setBgDrafts] = useState({});            // local buffer for grid editor inputs
  const [idx, setIdx] = useState(0);                       // current scene index
  const [bgEditFor, setBgEditFor] = useState(null);        // anime id whose BG is being edited inline
  const [inlineDraft, setInlineDraft] = useState("");      // live preview url for inline editor
  const cooldownRef = useRef(false);

  const scenes = useMemo(() => {
    const ids = sceneConfig.animeIds || [];
    if (ids.length) return ids.map(id => anime.find(a => a.id === id)).filter(Boolean);
    return [...anime]
      .filter(a => Object.keys(a.ratings).length >= 2 && a.cover)
      .sort((a, b) => (getAvg(b.ratings) ?? 0) - (getAvg(a.ratings) ?? 0))
      .slice(0, sceneConfig.limit || 12);
  }, [anime, sceneConfig]);

  const bgFor = (a) => {
    if (!a) return "";
    if (bgEditFor === a.id && inlineDraft !== "") return inlineDraft;  // live preview while editing
    return sceneConfig.customBgs?.[a.id] || a.cover || "";
  };

  // clamp idx if scenes change
  useEffect(() => {
    if (idx >= scenes.length) setIdx(Math.max(0, scenes.length - 1));
  }, [scenes.length, idx]);

  const pickedIds = sceneConfig.animeIds || [];
  const toggleAnime = (id) => {
    const next = pickedIds.includes(id) ? pickedIds.filter(x => x !== id) : [...pickedIds, id];
    saveSceneConfig({ ...sceneConfig, animeIds: next });
  };
  const moveScene = (id, dir) => {
    const cur = [...pickedIds];
    const i = cur.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.length) return;
    [cur[i], cur[j]] = [cur[j], cur[i]];
    saveSceneConfig({ ...sceneConfig, animeIds: cur });
  };
  const setCustomBg = (id, url) => {
    const cleaned = (url || "").trim();
    const next = { ...(sceneConfig.customBgs || {}) };
    if (cleaned) next[id] = cleaned; else delete next[id];
    saveSceneConfig({ ...sceneConfig, customBgs: next });
  };

  // inline image editor helpers
  const openInlineEditor = (e, aId) => {
    e.stopPropagation();
    setBgEditFor(aId);
    setInlineDraft(sceneConfig.customBgs?.[aId] || "");
  };
  const closeInlineEditor = () => { setBgEditFor(null); setInlineDraft(""); };
  const saveInlineEditor = () => {
    if (bgEditFor != null) setCustomBg(bgEditFor, inlineDraft);
    closeInlineEditor();
  };
  const clearInlineEditor = () => {
    if (bgEditFor != null) setCustomBg(bgEditFor, "");
    closeInlineEditor();
  };

  // Scroll / key / touch navigation → advance idx with cooldown
  useEffect(() => {
    if (editing || bgEditFor != null) return;           // don't hijack input while editing
    if (scenes.length === 0) return;
    const advance = (d) => {
      if (cooldownRef.current) return;
      const next = idx + d;
      if (next < 0 || next >= scenes.length) return;
      cooldownRef.current = true;
      setIdx(next);
      setTimeout(() => { cooldownRef.current = false; }, 900);
    };
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 15) return;
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowDown","PageDown"," ","ArrowRight"].includes(e.key)) { e.preventDefault(); advance(1); }
      if (["ArrowUp","PageUp","ArrowLeft"].includes(e.key))         { e.preventDefault(); advance(-1); }
    };
    let tY = 0;
    const tS = (e) => { tY = e.touches[0].clientY; };
    const tE = (e) => { const dy = tY - e.changedTouches[0].clientY; if (Math.abs(dy) > 50) advance(dy > 0 ? 1 : -1); };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", tS, { passive: true });
    window.addEventListener("touchend", tE);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", tS);
      window.removeEventListener("touchend", tE);
    };
  }, [idx, scenes.length, editing, bgEditFor]);

  const editorAnime = useMemo(() => {
    const all = anime.filter(a => a);
    const pickedInOrder = pickedIds.map(id => all.find(a => a.id === id)).filter(Boolean);
    const rest = all.filter(a => !pickedIds.includes(a.id));
    return [...pickedInOrder, ...rest];
  }, [anime, pickedIds]);

  const current = scenes[idx];

  return (
    <div className="scenes-fullscreen">
      {/* Top control bar */}
      <div className="scenes-admin-bar">
        <button className="btn-scene-ctrl" onClick={onExit} title="Exit scenes">✕ Exit</button>
        {isAdmin && !editing && current && (
          <button className="btn-scene-ctrl" onClick={(e) => openInlineEditor(e, current.id)} title="Change background">
            🖼 Set Image
          </button>
        )}
        {isAdmin && (
          <button className="btn-scene-ctrl" onClick={() => setEditing(v => !v)}>
            {editing ? "✓ Done" : "✎ Edit Reel"}
          </button>
        )}
        {isAdmin && editing && pickedIds.length > 0 && (
          <button className="btn-scene-ctrl danger" onClick={() => saveSceneConfig({ ...sceneConfig, animeIds: [] })}>
            Reset to Auto
          </button>
        )}
        {scenes.length > 0 && !editing && (
          <span className="scene-count-pill">{String(idx + 1).padStart(2,"0")} / {String(scenes.length).padStart(2,"0")}</span>
        )}
      </div>

      {editing && isAdmin ? (
        <div className="scenes-editor">
          <div className="scenes-editor-header">
            <h2>Scene Editor</h2>
            <p>Pick anime, reorder with ↑↓, and paste a high-quality image URL per scene. Blank = falls back to the anime cover.</p>
          </div>
          <div className="scene-editor-grid">
            {editorAnime.map(a => {
              const picked = pickedIds.includes(a.id);
              const orderIdx = pickedIds.indexOf(a.id);
              const curBg = sceneConfig.customBgs?.[a.id] || "";
              const previewBg = (bgDrafts[a.id] ?? curBg) || a.cover || "";
              return (
                <div key={a.id} className={`scene-editor-card ${picked ? "picked" : ""}`}>
                  <div className="scene-editor-thumb" style={previewBg ? { backgroundImage: `url(${previewBg})` } : {}}>
                    {picked && <span className="scene-editor-rank">#{orderIdx + 1}</span>}
                    {!previewBg && <div className="scene-editor-empty">no image</div>}
                  </div>
                  <div className="scene-editor-body">
                    <div className="scene-editor-title">{a.title}</div>
                    {a.jp && <div className="scene-editor-jp">{a.jp}</div>}
                    <div className="scene-editor-row">
                      <button className={`btn-scene-mini ${picked ? "on" : ""}`} onClick={() => toggleAnime(a.id)}>
                        {picked ? "✓ Added" : "+ Add"}
                      </button>
                      {picked && (
                        <>
                          <button className="btn-scene-mini" onClick={() => moveScene(a.id, -1)} disabled={orderIdx === 0}>↑</button>
                          <button className="btn-scene-mini" onClick={() => moveScene(a.id, +1)} disabled={orderIdx === pickedIds.length - 1}>↓</button>
                        </>
                      )}
                    </div>
                    <label className="scene-editor-label">Custom BG (URL)</label>
                    <input
                      type="text"
                      className="scene-editor-input"
                      placeholder="https://…  (blank = use cover)"
                      value={bgDrafts[a.id] ?? curBg}
                      onChange={e => setBgDrafts(prev => ({ ...prev, [a.id]: e.target.value }))}
                      onBlur={e => setCustomBg(a.id, e.target.value)}
                    />
                    {curBg && (
                      <button className="btn-scene-mini small" onClick={() => { setBgDrafts(p => ({ ...p, [a.id]: "" })); setCustomBg(a.id, ""); }}>
                        Reset BG
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : scenes.length === 0 ? (
        <div className="scenes-empty">
          <div className="scenes-eyebrow">Scenes · 情景</div>
          <p>No scenes yet. {isAdmin ? "Click ✎ Edit Reel to build your cinematic list." : "Ask the admin to curate some."}</p>
        </div>
      ) : (
        <>
          {/* Single-scene viewport with zoom+dissolve swap */}
          <div className="scene-viewport">
            <AnimatePresence initial={false}>
              <motion.section
                key={current.id}
                className="scene-fs"
                style={bgFor(current) ? { backgroundImage: `url(${bgFor(current)})` } : {}}
                onClick={() => onCardClick(current)}
                initial={{ opacity: 0, scale: 1.25, filter: "blur(16px)" }}
                animate={{ opacity: 1, scale: 1,    filter: "blur(0px)" }}
                exit={{    opacity: 0, scale: 1.5,  filter: "blur(22px)" }}
                transition={{ duration: 0.9, ease: EASE }}
              >
                <div className="scene-overlay" />
                <motion.div
                  className="scene-content"
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0,  filter: "blur(0px)" }}
                  exit={{    opacity: 0, y: -20, filter: "blur(8px)" }}
                  transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}
                >
                  <div className="scene-rank">#{idx + 1} · {String(idx + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</div>
                  <h1 className="scene-title">{current.title}</h1>
                  {current.jp && <div className="scene-jp">{current.jp}</div>}
                  <div className="scene-meta">
                    {(() => { const avg = getAvg(current.ratings); return avg !== null && (
                      <span className="scene-score" style={{ color: getScoreColor(avg, true) }}>
                        {avg.toFixed(1)} · {getScoreLabel(avg)}
                      </span>
                    );})()}
                    <div className="scene-raters">
                      {Object.entries(current.ratings).map(([n, s]) => (
                        <span key={n} className="scene-rater" style={{ borderColor: pc(n) }}>
                          <span className="scene-rater-dot" style={{ background: pc(n) }} />
                          {n} · {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="scene-cta">click for details · scroll to dissolve</div>
                </motion.div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* Pagination dots (right side) */}
          <div className="scene-dots">
            {scenes.map((s, i) => (
              <button
                key={s.id}
                className={`scene-dot ${i === idx ? "on" : ""}`}
                onClick={() => { if (!cooldownRef.current) { cooldownRef.current = true; setIdx(i); setTimeout(()=>{cooldownRef.current=false;}, 900); } }}
                title={s.title}
                aria-label={s.title}
              />
            ))}
          </div>

          {/* Left/Right arrow affordance */}
          {idx > 0 && (
            <button className="scene-nav scene-nav-prev" onClick={() => { if (!cooldownRef.current) { cooldownRef.current = true; setIdx(idx - 1); setTimeout(()=>{cooldownRef.current=false;}, 900); } }} aria-label="Previous">↑</button>
          )}
          {idx < scenes.length - 1 && (
            <button className="scene-nav scene-nav-next" onClick={() => { if (!cooldownRef.current) { cooldownRef.current = true; setIdx(idx + 1); setTimeout(()=>{cooldownRef.current=false;}, 900); } }} aria-label="Next">↓</button>
          )}

          {/* Inline image editor (admin, current scene) */}
          <AnimatePresence>
            {bgEditFor != null && (
              <motion.div
                className="inline-bg-editor"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.22, ease: EASE }}
              >
                <div className="inline-bg-row">
                  <div className="inline-bg-thumb" style={inlineDraft ? { backgroundImage: `url(${inlineDraft})` } : (current?.cover ? { backgroundImage: `url(${current.cover})` } : {})} />
                  <div className="inline-bg-fields">
                    <div className="inline-bg-title">Scene #{idx + 1} · {current?.title}</div>
                    <input
                      type="text"
                      autoFocus
                      className="scene-editor-input"
                      placeholder="Paste image URL (4K wallpaper, screencap, etc.)"
                      value={inlineDraft}
                      onChange={e => setInlineDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveInlineEditor(); if (e.key === "Escape") closeInlineEditor(); }}
                    />
                    <div className="inline-bg-hint">Live preview as you type. Hit Enter to save.</div>
                  </div>
                </div>
                <div className="inline-bg-actions">
                  {sceneConfig.customBgs?.[bgEditFor] && (
                    <button className="btn-scene-mini" onClick={clearInlineEditor}>Reset to Cover</button>
                  )}
                  <button className="btn-scene-mini" onClick={closeInlineEditor}>Cancel</button>
                  <button className="btn-scene-mini on" onClick={saveInlineEditor}>Save</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

const mLabel = { display:"block", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:6, marginTop:14, fontFamily:"'Zen Kaku Gothic New',sans-serif" };
const mActions = { display:"flex", justifyContent:"flex-end", gap:8, marginTop:24, flexWrap:"wrap" };

const getMobileTitleSize = (title) => {
  const len = title.length;
  if (len <= 8)  return "11px";
  if (len <= 14) return "9px";
  if (len <= 22) return "8px";
  if (len <= 32) return "7px";
  return "6px";
};

// Standard page transition wrapper
const pageVariants = {
  initial: { opacity: 0, filter: "blur(4px)" },
  animate: { opacity: 1, filter: "blur(0px)" },
  exit:    { opacity: 0, filter: "blur(4px)" },
};
const pageTransition = { duration: 0.25, ease: EASE };

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnimeWatchList() {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isMobile = windowWidth <= 600;

  // DATA
  const [anime, setAnime] = useState(DEFAULT_ANIME);
  const [people, setPeople] = useState(DEFAULT_PEOPLE);
  const [osts, setOsts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [tab, setTab] = useState("people");
  const [search, setSearch] = useState("");
  const [personalFilter, setPersonalFilter] = useState(null);
  const [detailAnime, setDetailAnime] = useState(null);
  const [sceneConfig, setSceneConfig] = useState({ animeIds: [], customBgs: {}, limit: 12 });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const [randomPick, setRandomPick] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [expandedMember, setExpandedMember] = useState(null);
  const searchRef = useRef(null);

  // THEME
  const [themeOverride, setThemeOverride] = useState(() => {
    try { return localStorage.getItem(LS_THEME_OVERRIDE) || "auto"; }
    catch { return "auto"; }
  });
  const [autoTheme, setAutoTheme] = useState(getAutoTheme());
  useEffect(() => {
    const t = setInterval(() => setAutoTheme(getAutoTheme()), 60000);
    return () => clearInterval(t);
  }, []);
  const activeTheme = themeOverride === "auto" ? autoTheme : themeOverride;
  const isNight = activeTheme === "night";
  const setTheme = (v) => {
    setThemeOverride(v);
    try { localStorage.setItem(LS_THEME_OVERRIDE, v); } catch {}
  };

  // AUTH
  const isAdmin = false;
  const [currentUser, setCurrentUser] = useState(() => {
    try { return localStorage.getItem(LS_USER) || null; }
    catch { return null; }
  });
  const [passInput, setPassInput] = useState("");
  const [passError, setPassError] = useState(false);
  const [loginTarget, setLoginTarget] = useState(null);

  const [passcodeFor, setPasscodeFor] = useState(null);
  const [passcodeMode, setPasscodeMode] = useState("reset");
  const [newPass1, setNewPass1] = useState("");
  const [newPass2, setNewPass2] = useState("");

  // ONBOARDING
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem(LS_ONBOARDED); }
    catch { return true; }
  });

  // FORMS
  const [newTitle, setNewTitle] = useState("");
  const [newJp, setNewJp] = useState("");
  const [newCover, setNewCover] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonColor, setNewPersonColor] = useState("#7dd3fc");
  const [newPersonPass, setNewPersonPass] = useState("");
  const [newPersonPass2, setNewPersonPass2] = useState("");
  const [claimPass, setClaimPass] = useState("");
  const [claimPass2, setClaimPass2] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitleVal, setEditTitleVal] = useState("");
  const [editJpVal, setEditJpVal] = useState("");
  const [editCoverVal, setEditCoverVal] = useState("");
  const [ratingScore, setRatingScore] = useState(null);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [coverUrl, setCoverUrl] = useState("");
  const [coverAnimeId, setCoverAnimeId] = useState(null);
  const [newOstAnime, setNewOstAnime] = useState("");
  const [newOstScore, setNewOstScore] = useState("");
  const [newOstTrack, setNewOstTrack] = useState("");
  const [newOstCover, setNewOstCover] = useState("");
  const [wipeTarget, setWipeTarget] = useState(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem(LS_ONBOARDED, "1"); } catch {}
  };

  // FIRESTORE
  useEffect(() => {
    const unsubAnime = onSnapshot(collection(db, "anime"), (snap) => {
      if (snap.empty) {
        DEFAULT_ANIME.forEach(item => setDoc(doc(db, "anime", String(item.id)), item));
        setAnime(DEFAULT_ANIME);
      } else {
        const list = snap.docs.map(d => d.data());
        list.sort((a, b) => a.id - b.id);
        setAnime(list);
      }
      setLoading(false);
    }, (err) => { console.error(err); setAnime(DEFAULT_ANIME); setLoading(false); });

    const unsubPeople = onSnapshot(collection(db, "people"), (snap) => {
      if (snap.empty) {
        DEFAULT_PEOPLE.forEach(p => setDoc(doc(db, "people", p.name), p));
        setPeople(DEFAULT_PEOPLE);
      } else {
        setPeople(snap.docs.map(d => ({ ptw: [], ...d.data() })));
      }
    }, (err) => console.error(err));

    const unsubOsts = onSnapshot(collection(db, "osts"), (snap) => {
      setOsts(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubFavs = onSnapshot(collection(db, "favorites"), (snap) => {
      setFavorites(snap.docs.map(d => Number(d.data().id)));
    }, (err) => console.error(err));

    const unsubScenes = onSnapshot(doc(db, "sceneConfig", "main"), (snap) => {
      if (snap.exists()) setSceneConfig({ animeIds: [], customBgs: {}, limit: 12, ...snap.data() });
    }, (err) => console.error(err));

    return () => { unsubAnime(); unsubPeople(); unsubOsts(); unsubFavs(); unsubScenes(); };
  }, []);

  // KEYBOARD
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (e.key === "/" && !typing) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "Escape") {
        if (modal) setModal(null);
        else if (detailAnime) setDetailAnime(null);
        else if (tab === "scenes") setTab("all");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, detailAnime, tab]);

  // CRUD
  const upAnime = async (obj) => {
    setAnime(prev => prev.some(x => x.id === obj.id) ? prev.map(x => x.id === obj.id ? obj : x) : [...prev, obj]);
    setSaveStatus("saving");
    try { await setDoc(doc(db, "anime", String(obj.id)), obj); setSaveStatus("saved"); setTimeout(() => setSaveStatus(""), 1500); }
    catch (e) { console.error(e); setSaveStatus("error"); }
  };
  const delAnime = async (id) => {
    setAnime(prev => prev.filter(x => x.id !== id));
    setSaveStatus("saving");
    try { await deleteDoc(doc(db, "anime", String(id))); setSaveStatus("saved"); setTimeout(() => setSaveStatus(""), 1500); }
    catch (e) { console.error(e); setSaveStatus("error"); }
  };
  const upPeople = async (obj) => {
    setPeople(prev => prev.some(x => x.name === obj.name) ? prev.map(x => x.name === obj.name ? obj : x) : [...prev, obj]);
    setSaveStatus("saving");
    try { await setDoc(doc(db, "people", obj.name), obj); setSaveStatus("saved"); setTimeout(() => setSaveStatus(""), 1500); }
    catch (e) { console.error(e); setSaveStatus("error"); }
  };
  const delPerson = async (name) => {
    setPeople(prev => prev.filter(x => x.name !== name));
    setSaveStatus("saving");
    try { await deleteDoc(doc(db, "people", name)); setSaveStatus("saved"); setTimeout(() => setSaveStatus(""), 1500); }
    catch (e) { console.error(e); setSaveStatus("error"); }
  };
  const upOst = async (item) => {
    try {
      const id = item.id || `ost_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
      await setDoc(doc(db, "osts", id), { ...item, id });
    } catch (e) { console.error(e); showToast("Save failed", "error"); }
  };
  const delOst = async (id) => {
    try { await deleteDoc(doc(db, "osts", id)); }
    catch (e) { console.error(e); showToast("Delete failed", "error"); }
  };

  const saveSceneConfig = async (cfg) => {
    setSceneConfig(cfg);
    try { await setDoc(doc(db, "sceneConfig", "main"), cfg); }
    catch (e) { console.error(e); showToast("Scene save failed", "error"); }
  };

  const toggleFavorite = async (id) => {
    const isFav = favorites.includes(id);
    try {
      if (isFav) { await deleteDoc(doc(db, "favorites", String(id))); showToast("Removed from favorites"); }
      else { await setDoc(doc(db, "favorites", String(id)), { id }); showToast("Added to Shunji's Favorites"); }
    } catch (e) { console.error(e); showToast("Save failed", "error"); }
  };

  const togglePtw = async (animeId) => {
    if (!currentUser) { showToast("Sign in to use your Plan to Watch", "error"); return; }
    const person = people.find(p => p.name === currentUser);
    if (!person) return;
    const ptw = person.ptw || [];
    const exists = ptw.includes(animeId);
    const updated = { ...person, ptw: exists ? ptw.filter(id => id !== animeId) : [...ptw, animeId] };
    await upPeople(updated);
    showToast(exists ? "Removed from your Plan to Watch" : "Added to your Plan to Watch");
  };

  const wipeUserRatings = async (userName) => {
    const toUpdate = anime
      .filter(a => a.ratings[userName] !== undefined)
      .map(a => { const r = { ...a.ratings }; delete r[userName]; return { ...a, ratings: r }; });
    if (toUpdate.length === 0) { showToast(`No ratings to wipe for ${userName}`); return; }
    setAnime(prev => prev.map(a => toUpdate.find(u => u.id === a.id) || a));
    setSaveStatus("saving");
    try {
      await Promise.all(toUpdate.map(item => setDoc(doc(db, "anime", String(item.id)), item)));
      setSaveStatus("saved"); setTimeout(() => setSaveStatus(""), 1500);
    } catch (e) { console.error(e); setSaveStatus("error"); }
    showToast(`Wiped all ratings by ${userName}`);
  };

  // AUTH
  const trySignIn = async () => {
    if (!loginTarget || authBusy) return;
    const person = people.find(p => p.name === loginTarget);
    if (!person) return;
    if (!person.passcode) { setModal("claimProfile"); return; }
    setAuthBusy(true);
    try {
      const ok = await verifyPasscode(passInput, person.passcode);
      if (!ok) { setPassError(true); setAuthBusy(false); return; }
      if (!isHashedPasscode(person.passcode)) {
        try { const hashed = await hashPasscode(passInput); await upPeople({ ...person, passcode: hashed }); }
        catch (e) { console.error("Migration failed:", e); }
      }
      setCurrentUser(loginTarget);
      try { localStorage.setItem(LS_USER, loginTarget); } catch {}
      setModal(null); setPassInput(""); setPassError(false); setLoginTarget(null);
      showToast(`Signed in as ${loginTarget}`);
    } catch (e) { console.error(e); showToast("Sign-in failed", "error"); }
    finally { setAuthBusy(false); }
  };

  const claimProfile = async () => {
    if (!loginTarget || authBusy) return;
    if (!claimPass || claimPass.length < 3) { showToast("Passcode must be at least 3 characters", "error"); return; }
    if (claimPass !== claimPass2) { showToast("Passcodes don't match", "error"); return; }
    setAuthBusy(true);
    try {
      const hashed = await hashPasscode(claimPass);
      const target = people.find(p => p.name === loginTarget);
      await upPeople({ ...target, passcode: hashed, ptw: target?.ptw || [] });
      setCurrentUser(loginTarget);
      try { localStorage.setItem(LS_USER, loginTarget); } catch {}
      showToast(`Profile claimed — welcome, ${loginTarget}!`);
      setClaimPass(""); setClaimPass2(""); setLoginTarget(null); setModal(null);
    } catch (e) { console.error(e); showToast("Claim failed", "error"); }
    finally { setAuthBusy(false); }
  };

  const signOut = () => {
    setCurrentUser(null);
    try { localStorage.removeItem(LS_USER); } catch {}
    showToast("Signed out");
  };

  const createProfile = async () => {
    const name = newPersonName.trim();
    if (!name || authBusy) return;
    if (people.find(p => p.name.toLowerCase() === name.toLowerCase())) { showToast("That name is already taken", "error"); return; }
    if (!newPersonPass || newPersonPass.length < 3) { showToast("Passcode must be at least 3 characters", "error"); return; }
    if (newPersonPass !== newPersonPass2) { showToast("Passcodes don't match", "error"); return; }
    setAuthBusy(true);
    try {
      const hashed = await hashPasscode(newPersonPass);
      await upPeople({ name, color: newPersonColor, passcode: hashed, ptw: [] });
      setCurrentUser(name);
      try { localStorage.setItem(LS_USER, name); } catch {}
      showToast(`Profile created — welcome ${name}!`);
      setNewPersonName(""); setNewPersonPass(""); setNewPersonPass2(""); setNewPersonColor("#7dd3fc");
      setModal(null);
    } catch (e) { console.error(e); showToast("Create failed", "error"); }
    finally { setAuthBusy(false); }
  };

  const savePasscode = async () => {
    if (!passcodeFor || authBusy) return;
    if (!newPass1 || newPass1.length < 3) { showToast("Passcode must be at least 3 characters", "error"); return; }
    if (newPass1 !== newPass2) { showToast("Passcodes don't match", "error"); return; }
    setAuthBusy(true);
    try {
      const hashed = await hashPasscode(newPass1);
      await upPeople({ ...people.find(p => p.name === passcodeFor), passcode: hashed });
      showToast(passcodeMode === "reset" ? `Passcode reset for ${passcodeFor}` : "Passcode changed");
      setNewPass1(""); setNewPass2(""); setPasscodeFor(null); setModal(null);
    } catch (e) { console.error(e); showToast("Save failed", "error"); }
    finally { setAuthBusy(false); }
  };

  const pc = (name) => people.find(p => p.name === name)?.color || "#94a3b8";
  const canEdit = isAdmin || !!currentUser;

  const myPtw = useMemo(() => {
    if (!currentUser) return [];
    return people.find(p => p.name === currentUser)?.ptw || [];
  }, [currentUser, people]);

  const recentlyAdded = useMemo(() => {
    return anime.filter(a => a.addedAt).sort((a, b) => b.addedAt - a.addedAt).slice(0, 8);
  }, [anime]);

  const filtered = anime
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.jp && a.jp.includes(search)))
    .filter(a => {
      if (tab === "rankings")  return Object.keys(a.ratings).length >= 2;
      if (tab === "unwatched") return Object.keys(a.ratings).length === 0;
      if (tab === "favorites") return favorites.includes(a.id);
      return true;
    })
    .filter(a => {
      if (!currentUser) return true;
      if (personalFilter === "myRatings") return a.ratings[currentUser] !== undefined;
      if (personalFilter === "myPtw")     return myPtw.includes(a.id);
      return true;
    })
    .sort((a, b) => {
      if (tab === "rankings") {
        const aa = getAvg(a.ratings), bb = getAvg(b.ratings);
        if (aa === null && bb === null) return 0;
        if (aa === null) return 1;
        if (bb === null) return -1;
        return bb - aa;
      }
      return a.title.localeCompare(b.title);
    });

  const totalRated = anime.filter(a => Object.keys(a.ratings).length > 0).length;
  const totalUnwatched = anime.filter(a => Object.keys(a.ratings).length === 0).length;
  const rankCount = anime.filter(a => Object.keys(a.ratings).length >= 2).length;

  const rollRandom = () => {
    const pool = anime.filter(a => Object.keys(a.ratings).length === 0);
    if (pool.length === 0) { showToast("Plan to Watch is empty", "error"); return; }
    setRandomPick(pool[Math.floor(Math.random() * pool.length)]);
    setModal("randomResult");
  };

  const wipeCount = wipeTarget ? anime.filter(a => a.ratings[wipeTarget] !== undefined).length : 0;

  if (loading) {
    return (
      <div className={`app-root theme-${activeTheme}`}>
        <style>{themeCSS}</style>
        <div className="loading-screen">
          <div className="spinner" />
          <p style={{ marginTop: 16, fontSize: 13, fontWeight: 600, fontFamily: "'Klee One',serif" }}>読み込み中…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-root theme-${activeTheme}`}>
      <style>{themeCSS}</style>

      <div className="watercolor-field" />
      <div className="watercolor-field-2" />
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="light-bloom" />
      <FallingPetals isNight={isNight} />
      {isNight && <Comet />}
      {isNight && <Stars />}

      <div className="content-wrap" style={isMobile ? { padding: "12px 8px 0" } : {}}>

        <header className="app-header">
          <div className="header-left">
            <div className="app-title-jp">アニメ・ウォッチリスト</div>
            <h1 className="app-title">Shunji's Anime Watchlist</h1>
            <p className="app-subtitle">
              {anime.length} titles · {totalRated} rated · {totalUnwatched} planned
            </p>
          </div>

          <div className="header-right">
            <div className="clock-stack">
              <LiveClock />
              <ThemeToggle value={themeOverride} onChange={setTheme} />
            </div>

            {saveStatus === "saving" && <span className="save-indicator">saving…</span>}
            {saveStatus === "saved"  && <span className="save-indicator saved">✓ saved</span>}

            {currentUser ? (
              <button onClick={signOut} className="btn btn-outline user-btn" style={{ borderColor: pc(currentUser) }}>
                <span className="user-dot" style={{ background: pc(currentUser) }} />
                {currentUser}
              </button>
            ) : (
              <button onClick={() => { setLoginTarget(null); setPassInput(""); setModal("signin"); }} className="btn btn-outline">
                Sign In
              </button>
            )}

            <button type="button" className="btn btn-outline" disabled title="Admin access requires trusted authentication">
              Admin disabled
            </button>
          </div>
        </header>

        {showOnboarding && (
          <WelcomeBanner onClose={dismissOnboarding} onSignIn={() => { dismissOnboarding(); setTab("people"); setModal("createProfile"); }} />
        )}

        {!currentUser && !isAdmin && (
          <div className="instruction-bar">
            <span className="instruction-icon">ℹ</span>
            <span><strong>To rate anime or add titles:</strong> create a profile in Members (passcode required) or sign in. Press <kbd>/</kbd> to search, <kbd>Esc</kbd> to close.</span>
          </div>
        )}

        <div className="score-scale">
          {[
            { range: "1–3.5",   label: "Avoid",       color: getScoreColor(2,   isNight) },
            { range: "4–5",     label: "Mediocre",    color: getScoreColor(4.5, isNight) },
            { range: "5.5–7",   label: "Decent",      color: getScoreColor(6,   isNight) },
            { range: "7.5–8.5", label: "Great",       color: getScoreColor(8,   isNight) },
            { range: "9–10",    label: "Masterpiece", color: getScoreColor(9.5, isNight) },
          ].map(s => (
            <div key={s.label} className="scale-item">
              <span className="scale-dot" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}aa` }} />
              <span className="scale-range">{s.range}</span>
              <span className="scale-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="tabs-row">
          {[
            { key: "all",       label: "All",            jp: "全て",      ct: anime.length },
            { key: "rankings",  label: "Rankings",       jp: "順位",      ct: rankCount },
            { key: "scenes",    label: "Scenes",         jp: "情景",      ct: "cinematic", special: true },
            { key: "unwatched", label: "Plan to Watch",  jp: "予定",      ct: totalUnwatched },
            { key: "ost",       label: "OST",            jp: "音楽",      ct: osts.length },
            { key: "favorites", label: "Favorites",      jp: "お気に入り", ct: favorites.length },
            { key: "people",    label: "Members",        jp: "メンバー",   ct: people.length },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${tab === t.key ? "active" : ""} ${t.special ? "tab-special" : ""}`}
              onClick={() => { setTab(t.key); setSearch(""); setDetailAnime(null); setPersonalFilter(null); }}
            >
              <span className="tab-jp">{t.jp}</span>
              <span className="tab-label">{t.label}</span>
              <span className="tab-count">({t.ct})</span>
            </button>
          ))}
        </div>

        {/* ── SCENES: FULLSCREEN OVERLAY (outside page transition system) ── */}
        {tab === "scenes" && (
          <ScenesMode
            anime={anime}
            pc={pc}
            getScoreColor={getScoreColor}
            onCardClick={setDetailAnime}
            isAdmin={isAdmin}
            sceneConfig={sceneConfig}
            saveSceneConfig={saveSceneConfig}
            onExit={() => setTab("all")}
          />
        )}

        {/* ── ANIMATED PAGE TRANSITIONS (all non-scenes tabs) ── */}
        <AnimatePresence mode="wait">
          {tab !== "scenes" && (
          <motion.div
            key={tab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >

            {tab === "all" && (
              <div className="info-bar">
                <span className="info-icon">💡</span>
                <span>
                  <strong>Can't find an anime?</strong> {currentUser || isAdmin
                    ? <>Click <strong>"+ Add Anime"</strong> below to contribute it.</>
                    : <>Sign in or create a profile, then click <strong>"+ Add Anime"</strong>.</>}
                </span>
              </div>
            )}

            {tab === "all" && recentlyAdded.length > 0 && (
              <div className="recently-added">
                <div className="ra-header">🆕 Recently Added</div>
                <div className="ra-list">
                  {recentlyAdded.map(a => (
                    <div key={a.id} className="ra-card" onClick={() => setDetailAnime(a)}>
                      <div className="ra-cover" style={{ backgroundImage: a.cover ? `url(${a.cover})` : "none" }}>
                        {!a.cover && <span>🎬</span>}
                      </div>
                      <div className="ra-info">
                        <div className="ra-title">{a.title}</div>
                        <div className="ra-meta">
                          added by <strong style={{ color: pc(a.addedBy) }}>{a.addedBy || "Admin"}</strong>
                          {" · "}{timeAgo(a.addedAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentUser && (tab === "all" || tab === "rankings") && (
              <div className="filter-chips">
                <span className="chips-label">Quick filters:</span>
                <button className={`chip ${personalFilter === "myRatings" ? "active" : ""}`}
                  onClick={() => setPersonalFilter(personalFilter === "myRatings" ? null : "myRatings")}>⭐ My Ratings</button>
                <button className={`chip ${personalFilter === "myPtw" ? "active" : ""}`}
                  onClick={() => setPersonalFilter(personalFilter === "myPtw" ? null : "myPtw")}>📌 My Plan to Watch</button>
                {personalFilter && <button className="chip clear" onClick={() => setPersonalFilter(null)}>Clear</button>}
              </div>
            )}

            {tab !== "people" && tab !== "ost" && tab !== "scenes" && (
              <div className="toolbar">
                <div className="search-wrap">
                  <span className="search-icon">⌕</span>
                  <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search anime…  (press /)" className="search-input" />
                  {search && <button onClick={() => setSearch("")} className="search-clear">✕</button>}
                </div>
                <button onClick={rollRandom} className="btn btn-outline">🎲 Randomizer</button>
                {canEdit && <button onClick={() => setModal("addAnime")} className="btn btn-primary">+ Add Anime</button>}
              </div>
            )}

            {/* MEMBERS TAB */}
            {tab === "people" && (
              <div className="people-section">
                <div className="people-header">
                  <h2>Members · メンバー</h2>
                  <button onClick={() => setModal("createProfile")} className="btn btn-primary">+ Create Profile</button>
                </div>

                {!currentUser && !isAdmin && (
                  <div className="cta-card">
                    <h3>👋 New here?</h3>
                    <p><strong>You must create a profile with a passcode to rate anime, add titles, or contribute OSTs.</strong></p>
                    <p className="cta-sub">Click <strong>"+ Create Profile"</strong> to get started. Browsing is free for everyone.</p>
                  </div>
                )}

                <div className="people-grid">
                  {people.map(p => {
                    const rated = anime.filter(a => a.ratings[p.name] !== undefined);
                    const scores = rated.map(a => a.ratings[p.name]);
                    const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "—";
                    const isMe = currentUser === p.name;
                    const personPtw = p.ptw || [];
                    const ptwAnime = personPtw.map(id => anime.find(a => a.id === id)).filter(Boolean);
                    const hasPasscode = !!p.passcode;
                    const hashed = isHashedPasscode(p.passcode);
                    return (
                      <div key={p.name} className="person-card" style={{ borderLeftColor: p.color }}>
                        <div className="person-header"
                          onClick={() => setExpandedMember(expandedMember === p.name ? null : p.name)}
                          style={{ cursor: "pointer", userSelect: "none" }}>
                          <div className="person-avatar" style={{ background: p.color, boxShadow: `0 4px 20px ${p.color}66` }}>
                            {p.name[0]}
                          </div>
                          <div>
                            <div className="person-name">
                              {p.name}
                              {isMe && <span className="me-tag">YOU</span>}
                              <span className="lock-tag" title={
                                !hasPasscode ? "Unclaimed" :
                                hashed ? "Legacy passcode hash stored" :
                                "Plaintext — upgrades on next login"
                              }>
                                {!hasPasscode ? "🔓" : hashed ? "🔐" : "🔒"}
                              </span>
                            </div>
                            <div className="person-stats">
                              {rated.length} rated · avg {avg}
                              <span className="expand-chevron">{expandedMember === p.name ? "▲" : "▼"}</span>
                            </div>
                          </div>
                        </div>

                        {ptwAnime.length > 0 && (
                          <div className="ptw-gallery">
                            <div className="ptw-label">Watching Next ({ptwAnime.length})</div>
                            <div className="ptw-covers">
                              {ptwAnime.slice(0, 8).map(a => (
                                <div key={a.id} className="ptw-cover" onClick={() => setDetailAnime(a)} title={a.title}
                                  style={{ backgroundImage: a.cover ? `url(${a.cover})` : "none" }}>
                                  {!a.cover && <span>🎬</span>}
                                </div>
                              ))}
                              {ptwAnime.length > 8 && <div className="ptw-cover ptw-more">+{ptwAnime.length - 8}</div>}
                            </div>
                          </div>
                        )}

                        <div className="person-actions">
                          {(isAdmin || isMe) && (
                            <label className="color-picker">
                              Color
                              <input type="color" value={p.color} onChange={e => upPeople({ ...p, color: e.target.value })} />
                            </label>
                          )}
                          {isMe && (
                            <button onClick={() => { setPasscodeFor(p.name); setPasscodeMode("change"); setNewPass1(""); setNewPass2(""); setModal("setPasscode"); }}
                              className="btn btn-mini">Change Passcode</button>
                          )}
                          {isAdmin && (
                            <>
                              <button onClick={() => { setPasscodeFor(p.name); setPasscodeMode("reset"); setNewPass1(""); setNewPass2(""); setModal("setPasscode"); }}
                                className="btn btn-mini">Reset Passcode</button>
                              <button onClick={() => { setWipeTarget(p.name); setModal("confirmWipe"); }}
                                className="btn btn-mini btn-warn">Wipe Ratings</button>
                              <button onClick={() => { delPerson(p.name); if (currentUser === p.name) signOut(); showToast(`Removed ${p.name}`); }}
                                className="btn btn-mini btn-danger">Remove</button>
                            </>
                          )}
                        </div>

                        {expandedMember === p.name && (
                          <div className="member-expand">
                            <div className="member-expand-label">
                              {rated.length === 0 ? "No ratings yet" : `${rated.length} Rated — sorted by score`}
                            </div>
                            {[...rated].sort((a, b) => b.ratings[p.name] - a.ratings[p.name]).map(a => (
                              <div key={a.id} className="member-rated-row" onClick={() => setDetailAnime(a)}>
                                <div className="member-rated-cover" style={{ backgroundImage: a.cover ? `url(${a.cover})` : "none" }}>
                                  {!a.cover && "🎬"}
                                </div>
                                <div className="member-rated-title">{a.title}</div>
                                <div className="member-rated-score" style={{ color: getScoreColor(a.ratings[p.name], isNight) }}>
                                  {a.ratings[p.name]}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* OST TAB */}
            {tab === "ost" && (
              <div className="ost-section">
                <div className="people-header">
                  <h2>OST · 音楽</h2>
                  {canEdit && <button onClick={() => setModal("addOst")} className="btn btn-primary">+ Add OST</button>}
                </div>
                {osts.length === 0 ? (
                  <div className="empty-state">
                    <p>No OSTs yet. {canEdit ? "Click \"+ Add OST\" to add the first one." : "Sign in to add one."}</p>
                  </div>
                ) : (
                  <div className="ost-grid">
                    {[...osts].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).map(o => (
                      <div key={o.docId} className="ost-card">
                        {o.cover ? (
                          <img src={o.cover} alt="" className="ost-cover" loading="lazy" onError={e => { e.target.style.display = "none"; }} />
                        ) : (
                          <div className="ost-cover ost-cover-empty">🎵</div>
                        )}
                        <div className="ost-info">
                          <div className="ost-anime">{o.anime}</div>
                          {o.track && <div className="ost-track">♪ {o.track}</div>}
                          <div className="ost-meta">
                            <span className="ost-score" style={{ color: getScoreColor(Number(o.score), isNight) }}>{o.score}</span>
                            {o.addedBy && <span className="ost-by">added by {o.addedBy}</span>}
                          </div>
                        </div>
                        {isAdmin && <button onClick={() => delOst(o.docId)} className="ost-delete">✕</button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POSTER GRID */}
            {tab !== "people" && tab !== "ost" && tab !== "scenes" && (
              <div className="poster-grid-wrap">
                {filtered.length === 0 && (
                  <div className="empty-state">
                    <p>
                      {personalFilter === "myPtw" ? "Your Plan to Watch is empty. Click 📌 on any anime to add it." :
                       personalFilter === "myRatings" ? "You haven't rated any anime yet." :
                       tab === "unwatched" ? "Plan to Watch is empty!" :
                       tab === "rankings"  ? "Need 2+ ratings for rankings." :
                       tab === "favorites" ? "No favorites yet." :
                       "No anime found."}
                    </p>
                  </div>
                )}

                <div className="poster-grid" style={isMobile ? { gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" } : {}}>
                  {filtered.map((a, idx) => {
                    const avg = getAvg(a.ratings);
                    const raters = Object.entries(a.ratings);
                    const rank = tab === "rankings" ? idx + 1 : null;
                    const isFav = favorites.includes(a.id);
                    const inMyPtw = currentUser && myPtw.includes(a.id);
                    const topThree = [...raters].sort((a, b) => b[1] - a[1]).slice(0, 3);
                    return (
                      <PosterCard
                        key={a.id}
                        a={a}
                        rank={rank}
                        isFav={isFav}
                        inMyPtw={inMyPtw}
                        isAdmin={isAdmin}
                        isNight={isNight}
                        pc={pc}
                        avg={avg}
                        raters={raters}
                        topThree={topThree}
                        isMobile={isMobile}
                        onClick={() => setDetailAnime(a)}
                        onToggleFav={toggleFavorite}
                        getMobileTitleSize={getMobileTitleSize}
                      />
                    );
                  })}
                </div>
              </div>
            )}

          </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailAnime && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setDetailAnime(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            <motion.div
              className="detail-box"
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
            >
              <button className="detail-close" onClick={() => setDetailAnime(null)}>✕</button>
              <div className="detail-grid">
                <div className="detail-cover-wrap">
                  {detailAnime.cover ? (
                    <img src={detailAnime.cover} alt="" className="detail-cover" loading="lazy" />
                  ) : (
                    <div className="detail-cover detail-cover-empty">🎬</div>
                  )}
                </div>
                <div className="detail-info">
                  <h2 className="detail-title">{detailAnime.title}</h2>
                  {detailAnime.jp && <p className="detail-jp">{detailAnime.jp}</p>}

                  {(() => {
                    const avg = getAvg(detailAnime.ratings);
                    return avg !== null ? (
                      <div className="detail-score-block">
                        <span className="detail-score" style={{ color: getScoreColor(avg, isNight) }}>
                          {avg.toFixed(1)}
                        </span>
                        <span className="detail-score-label" style={{ color: getScoreColor(avg, isNight), borderColor: getScoreColor(avg, isNight) }}>
                          {getScoreLabel(avg)}
                        </span>
                      </div>
                    ) : (
                      <div className="detail-score-block"><span className="detail-score none">— Unrated —</span></div>
                    );
                  })()}

                  {Object.keys(detailAnime.ratings).length > 0 && (
                    <div className="detail-ratings">
                      <div className="section-label">Member Ratings</div>
                      {Object.entries(detailAnime.ratings).map(([n, s]) => (
                        <div key={n} className="rating-row">
                          <span className="rating-dot" style={{ background: pc(n) }} />
                          <span className="rating-name">{n}</span>
                          <span className="rating-score" style={{ color: getScoreColor(s, isNight) }}>{s}</span>
                          {(isAdmin || currentUser === n) && (
                            <button onClick={() => {
                              const newRatings = { ...detailAnime.ratings };
                              delete newRatings[n];
                              const updated = { ...detailAnime, ratings: newRatings };
                              upAnime(updated); setDetailAnime(updated);
                              showToast(`Removed ${n}'s rating`);
                            }} className="rating-remove">✕</button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="detail-actions">
                    {(currentUser || isAdmin) && (
                      <button onClick={() => {
                        if (!currentUser && !isAdmin) { showToast("Sign in to rate", "error"); return; }
                        setRatingTarget(detailAnime);
                        setRatingScore(detailAnime.ratings[currentUser] ?? null);
                        setModal("rate");
                      }} className="btn btn-primary">⭐ Rate</button>
                    )}
                    {currentUser && (
                      <button onClick={() => togglePtw(detailAnime.id)} className="btn btn-outline">
                        {myPtw.includes(detailAnime.id) ? "📌 Remove from My PTW" : "📌 Add to My PTW"}
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button onClick={() => {
                          setEditingId(detailAnime.id); setEditTitleVal(detailAnime.title);
                          setEditJpVal(detailAnime.jp || ""); setEditCoverVal(detailAnime.cover || "");
                          setModal("editAnime");
                        }} className="btn btn-outline">✎ Edit</button>
                        <button onClick={() => {
                          setCoverAnimeId(detailAnime.id); setCoverUrl(detailAnime.cover || ""); setModal("cover");
                        }} className="btn btn-outline">🖼 Cover</button>
                        <button onClick={() => {
                          delAnime(detailAnime.id); setDetailAnime(null);
                          showToast(`Deleted "${detailAnime.title}"`);
                        }} className="btn btn-outline btn-danger">🗑 Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALS */}
      {modal && (
        <div className="modal-backdrop modal-static" onClick={() => { setModal(null); setPassError(false); setPassInput(""); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            {modal === "signin" && (<>
              <h3 className="modal-title">Sign In</h3>
              <p className="modal-subtitle">Pick your profile and enter your passcode. Unclaimed profiles let you set one.</p>
              <div className="login-grid">
                {people.map(p => (
                  <button key={p.name}
                    onClick={() => { setLoginTarget(p.name); setPassInput(""); setPassError(false); }}
                    className={`login-person ${loginTarget === p.name ? "selected" : ""}`}
                    style={{ borderColor: loginTarget === p.name ? p.color : undefined }}>
                    <div className="login-avatar" style={{ background: p.color }}>{p.name[0]}</div>
                    <span>{p.name}</span>
                    {!p.passcode && <span className="unclaimed-tag">UNCLAIMED</span>}
                  </button>
                ))}
              </div>
              {loginTarget && people.find(p => p.name === loginTarget)?.passcode && (
                <>
                  <label style={mLabel}>Passcode for {loginTarget}</label>
                  <input type="password" value={passInput}
                    onChange={e => { setPassInput(e.target.value); setPassError(false); }}
                    onKeyDown={e => e.key === "Enter" && trySignIn()}
                    className={`txt-input ${passError ? "input-error" : ""}`}
                    placeholder="Enter passcode" autoFocus disabled={authBusy} />
                  {passError && <p className="err-msg">Wrong passcode.</p>}
                </>
              )}
              {loginTarget && !people.find(p => p.name === loginTarget)?.passcode && (
                <p className="modal-subtitle" style={{ marginTop: 12 }}>
                  🔓 This profile is unclaimed. Click Sign In to claim it.
                </p>
              )}
              <div style={mActions}>
                <button onClick={() => { setModal(null); setLoginTarget(null); setPassInput(""); }} className="btn btn-outline">Cancel</button>
                <button onClick={() => { setModal("createProfile"); setLoginTarget(null); }} className="btn btn-outline">Create New</button>
                <button disabled={!loginTarget || authBusy} onClick={trySignIn} className="btn btn-primary">
                  {authBusy ? "Checking…" : "Sign In"}
                </button>
              </div>
            </>)}

            {modal === "claimProfile" && loginTarget && (<>
              <h3 className="modal-title">Claim Profile: {loginTarget}</h3>
              <p className="modal-subtitle">Set a passcode for the legacy profile flow. This is not trusted authentication.</p>
              <label style={mLabel}>New Passcode (min 3 chars)</label>
              <input type="password" value={claimPass} onChange={e => setClaimPass(e.target.value)}
                className="txt-input" placeholder="Choose a passcode" autoFocus disabled={authBusy} />
              <label style={mLabel}>Confirm Passcode</label>
              <input type="password" value={claimPass2} onChange={e => setClaimPass2(e.target.value)}
                className="txt-input" placeholder="Type it again"
                onKeyDown={e => e.key === "Enter" && claimProfile()} disabled={authBusy} />
              <p className="security-note">The browser hashes this passcode with PBKDF2 before storage. Do not reuse a password from another service.</p>
              <div style={mActions}>
                <button onClick={() => { setModal("signin"); setClaimPass(""); setClaimPass2(""); }} className="btn btn-outline">Back</button>
                <button disabled={!claimPass || !claimPass2 || authBusy} onClick={claimProfile} className="btn btn-primary">
                  {authBusy ? "Hashing…" : "Claim Profile"}
                </button>
              </div>
            </>)}

            {modal === "createProfile" && (<>
              <h3 className="modal-title">Create Your Profile</h3>
              <p className="modal-subtitle">Pick a name and passcode. The passcode is required to rate or modify.</p>
              <label style={mLabel}>Display Name *</label>
              <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)}
                className="txt-input" placeholder="e.g. Yui" autoFocus disabled={authBusy} />
              <label style={mLabel}>Pick a Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: newPersonColor, border: "2px solid currentColor",
                  boxShadow: `0 4px 16px ${newPersonColor}66`,
                }} />
                <input type="color" value={newPersonColor} onChange={e => setNewPersonColor(e.target.value)}
                  style={{ border: "none", background: "none", cursor: "pointer", width: 60, height: 36 }} />
              </div>
              <label style={mLabel}>Passcode * (min 3 chars)</label>
              <input type="password" value={newPersonPass} onChange={e => setNewPersonPass(e.target.value)}
                className="txt-input" placeholder="Choose a passcode" disabled={authBusy} />
              <label style={mLabel}>Confirm Passcode *</label>
              <input type="password" value={newPersonPass2} onChange={e => setNewPersonPass2(e.target.value)}
                className="txt-input" placeholder="Type it again"
                onKeyDown={e => e.key === "Enter" && createProfile()} disabled={authBusy} />
              <p className="security-note">This client-side passcode flow does not enforce database authorization.</p>
              <div style={mActions}>
                <button onClick={() => { setModal(null); setNewPersonName(""); setNewPersonPass(""); setNewPersonPass2(""); }} className="btn btn-outline">Cancel</button>
                <button disabled={!newPersonName.trim() || !newPersonPass || !newPersonPass2 || authBusy} onClick={createProfile} className="btn btn-primary">
                  {authBusy ? "Hashing…" : "Create Profile"}
                </button>
              </div>
            </>)}

            {modal === "setPasscode" && passcodeFor && (<>
              <h3 className="modal-title">{passcodeMode === "reset" ? `Reset Passcode: ${passcodeFor}` : "Change Your Passcode"}</h3>
              <p className="modal-subtitle">
                {passcodeMode === "reset"
                  ? <>Set a new passcode for <strong>{passcodeFor}</strong>. Tell them privately.</>
                  : <>Choose a new passcode. This will replace your current one.</>}
              </p>
              <label style={mLabel}>New Passcode (min 3 chars)</label>
              <input type="password" value={newPass1} onChange={e => setNewPass1(e.target.value)}
                className="txt-input" placeholder="New passcode" autoFocus disabled={authBusy} />
              <label style={mLabel}>Confirm New Passcode</label>
              <input type="password" value={newPass2} onChange={e => setNewPass2(e.target.value)}
                className="txt-input" placeholder="Type it again"
                onKeyDown={e => e.key === "Enter" && savePasscode()} disabled={authBusy} />
              <p className="security-note">Hashed in the browser before storage. This is not trusted authorization.</p>
              <div style={mActions}>
                <button onClick={() => { setModal(null); setPasscodeFor(null); setNewPass1(""); setNewPass2(""); }} className="btn btn-outline">Cancel</button>
                <button disabled={!newPass1 || !newPass2 || authBusy} onClick={savePasscode} className="btn btn-primary">
                  {authBusy ? "Saving…" : passcodeMode === "reset" ? "Reset" : "Change"}
                </button>
              </div>
            </>)}

            {modal === "addAnime" && (<>
              <h3 className="modal-title">Add New Anime</h3>
              <p className="modal-subtitle">📌 Tip: search for cover art using the Japanese title for best results.</p>
              <label style={mLabel}>Title (English) *</label>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="txt-input" placeholder="e.g. Your Name" autoFocus />
              <label style={mLabel}>Title (Japanese)</label>
              <input value={newJp} onChange={e => setNewJp(e.target.value)} className="txt-input" placeholder="e.g. 君の名は。" />
              <label style={mLabel}>Cover Art URL</label>
              <input value={newCover} onChange={e => setNewCover(e.target.value)} className="txt-input" placeholder="https://..." />
              {newCover && (
                <div className="cover-preview">
                  <img src={newCover} alt="preview" loading="lazy" onError={e => { e.target.style.display = "none"; }} />
                </div>
              )}
              <div style={mActions}>
                <button onClick={() => { setModal(null); setNewTitle(""); setNewJp(""); setNewCover(""); }} className="btn btn-outline">Cancel</button>
                <button disabled={!newTitle.trim()} onClick={() => {
                  if (!newTitle.trim()) return;
                  const mx = Math.max(...anime.map(x => x.id), 0);
                  const titleTrim = newTitle.trim();
                  const newItem = {
                    id: mx + 1, title: titleTrim, jp: newJp.trim(), cover: newCover.trim(),
                    ratings: {}, addedAt: Date.now(), addedBy: currentUser || "Admin",
                  };
                  upAnime(newItem);
                  showToast(`Added "${titleTrim}"`);
                  setNewTitle(""); setNewJp(""); setNewCover(""); setModal(null);
                }} className="btn btn-primary">Add Anime</button>
              </div>
            </>)}

            {modal === "rate" && ratingTarget && (<>
              <h3 className="modal-title">Rate Anime</h3>
              <div className="rate-target-card">
                <p className="rate-title">{ratingTarget.title}</p>
                {ratingTarget.jp && <p className="rate-jp">{ratingTarget.jp}</p>}
                <p className="rate-as">Rating as: <span style={{ color: pc(currentUser) }}>{currentUser || "Admin"}</span></p>
              </div>
              <label style={mLabel}>Score</label>
              <div className="score-grid">
                {VALID_RATINGS.map(r => {
                  const isSel = ratingScore === r;
                  const sc = getScoreColor(r, isNight);
                  return (
                    <button key={r} onClick={() => setRatingScore(r)}
                      className={`score-btn ${isSel ? "selected" : ""}`}
                      style={{ borderColor: isSel ? sc : undefined, color: isSel ? sc : undefined, background: isSel ? `${sc}22` : undefined }}>
                      {r}
                    </button>
                  );
                })}
              </div>
              <div style={mActions}>
                <button onClick={() => { setModal(null); setRatingTarget(null); }} className="btn btn-outline">Cancel</button>
                <button disabled={ratingScore === null || (!currentUser && !isAdmin)} onClick={() => {
                  if (ratingScore === null) return;
                  if (!currentUser) { showToast("Admin must sign in to a profile to rate", "error"); return; }
                  const updated = { ...ratingTarget, ratings: { ...ratingTarget.ratings, [currentUser]: ratingScore } };
                  upAnime(updated);
                  showToast(`${currentUser} rated ${ratingScore}`);
                  if (detailAnime?.id === ratingTarget.id) setDetailAnime(updated);
                  setModal(null); setRatingTarget(null);
                }} className="btn btn-primary">Submit</button>
              </div>
            </>)}

            {modal === "editAnime" && (<>
              <h3 className="modal-title">Edit Anime</h3>
              <label style={mLabel}>English Title</label>
              <input value={editTitleVal} onChange={e => setEditTitleVal(e.target.value)} className="txt-input" autoFocus />
              <label style={mLabel}>Japanese Title</label>
              <input value={editJpVal} onChange={e => setEditJpVal(e.target.value)} className="txt-input" />
              <label style={mLabel}>Cover URL</label>
              <input value={editCoverVal} onChange={e => setEditCoverVal(e.target.value)} className="txt-input" />
              <div style={mActions}>
                <button onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
                <button onClick={() => {
                  const orig = anime.find(a => a.id === editingId);
                  if (!orig) return;
                  const updated = { ...orig, title: editTitleVal.trim(), jp: editJpVal.trim(), cover: editCoverVal.trim() };
                  upAnime(updated);
                  if (detailAnime?.id === editingId) setDetailAnime(updated);
                  setModal(null); showToast("Saved");
                }} className="btn btn-primary">Save</button>
              </div>
            </>)}

            {modal === "cover" && (<>
              <h3 className="modal-title">Cover Art URL</h3>
              <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} className="txt-input" placeholder="https://..." autoFocus />
              {coverUrl && (
                <div className="cover-preview">
                  <img src={coverUrl} alt="preview" loading="lazy" onError={e => { e.target.style.display = "none"; }} />
                </div>
              )}
              <div style={mActions}>
                <button onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
                <button onClick={() => {
                  const orig = anime.find(a => a.id === coverAnimeId);
                  if (!orig) return;
                  const updated = { ...orig, cover: coverUrl.trim() };
                  upAnime(updated);
                  if (detailAnime?.id === coverAnimeId) setDetailAnime(updated);
                  setModal(null); showToast("Cover updated");
                }} className="btn btn-primary">Save Cover</button>
              </div>
            </>)}

            {modal === "addOst" && (<>
              <h3 className="modal-title">Add OST</h3>
              <label style={mLabel}>Anime Title *</label>
              <input value={newOstAnime} onChange={e => setNewOstAnime(e.target.value)} className="txt-input" placeholder="e.g. Your Lie in April" autoFocus />
              <label style={mLabel}>Score (1–10) *</label>
              <input type="number" min="1" max="10" step="0.5" value={newOstScore} onChange={e => setNewOstScore(e.target.value)} className="txt-input" placeholder="9" />
              <label style={mLabel}>Favorite Track</label>
              <input value={newOstTrack} onChange={e => setNewOstTrack(e.target.value)} className="txt-input" placeholder="e.g. Watashi no Uso" />
              <label style={mLabel}>Album Cover URL</label>
              <input value={newOstCover} onChange={e => setNewOstCover(e.target.value)} className="txt-input" placeholder="https://..." />
              {newOstCover && (
                <div className="cover-preview">
                  <img src={newOstCover} alt="preview" loading="lazy" onError={e => { e.target.style.display = "none"; }} />
                </div>
              )}
              <div style={mActions}>
                <button onClick={() => { setModal(null); setNewOstAnime(""); setNewOstScore(""); setNewOstTrack(""); setNewOstCover(""); }} className="btn btn-outline">Cancel</button>
                <button disabled={!newOstAnime.trim() || !newOstScore} onClick={() => {
                  const title = newOstAnime.trim();
                  upOst({ anime: title, score: Number(newOstScore), track: newOstTrack.trim(), cover: newOstCover.trim(), addedBy: currentUser || "Admin" });
                  showToast(`Added OST for "${title}"`);
                  setNewOstAnime(""); setNewOstScore(""); setNewOstTrack(""); setNewOstCover(""); setModal(null);
                }} className="btn btn-primary">Add OST</button>
              </div>
            </>)}

            {modal === "confirmWipe" && wipeTarget && (<>
              <h3 className="modal-title">Wipe All Ratings by {wipeTarget}?</h3>
              <div className="wipe-count-banner">
                <span className="wipe-count">{wipeCount}</span>
                <span className="wipe-count-label">rating{wipeCount === 1 ? "" : "s"} will be deleted</span>
              </div>
              <p className="modal-subtitle">
                This permanently removes every rating <strong>{wipeTarget}</strong> has submitted. <strong>Cannot be undone.</strong>
              </p>
              <div style={mActions}>
                <button onClick={() => { setModal(null); setWipeTarget(null); }} className="btn btn-outline">Cancel</button>
                <button disabled={wipeCount === 0} onClick={() => {
                  wipeUserRatings(wipeTarget); setModal(null); setWipeTarget(null);
                }} className="btn btn-primary btn-danger">{wipeCount === 0 ? "Nothing to wipe" : `Yes, Wipe ${wipeCount}`}</button>
              </div>
            </>)}

            {modal === "randomResult" && randomPick && (<>
              <h3 className="modal-title">🎲 Your Pick</h3>
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                {randomPick.cover && (
                  <img src={randomPick.cover} alt="" loading="lazy"
                    style={{ width: 140, height: 200, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
                )}
                <h2 className="rate-title" style={{ fontSize: 22 }}>{randomPick.title}</h2>
                {randomPick.jp && <p className="rate-jp">{randomPick.jp}</p>}
              </div>
              <div style={mActions}>
                <button onClick={rollRandom} className="btn btn-outline">🎲 Reroll</button>
                <button onClick={() => { setModal(null); setRandomPick(null); }} className="btn btn-primary">Done</button>
              </div>
            </>)}

          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

// ============================================================================
// CSS — Shinkai Edition
// ============================================================================

const themeCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&family=Zen+Kaku+Gothic+New:wght@300;400;500;700;900&family=Shippori+Mincho:wght@400;500;600;700;800&family=Noto+Serif+JP:wght@200;300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body, html {
    font-family: 'Zen Kaku Gothic New', system-ui, -apple-system, sans-serif;
    min-height: 100vh;
    width: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Animated watercolor field (primary) ── */
  .watercolor-field {
    position: fixed; inset: -10%;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 20% 30%, rgba(245, 200, 200, 0.28) 0%, transparent 45%),
      radial-gradient(circle at 80% 70%, rgba(200, 220, 240, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(220, 200, 240, 0.22) 0%, transparent 45%),
      radial-gradient(circle at 70% 20%, rgba(200, 240, 220, 0.22) 0%, transparent 50%);
    animation: watercolorFlow 60s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
    filter: blur(50px);
  }
  /* Second layered watercolor field (slower, offset) */
  .watercolor-field-2 {
    position: fixed; inset: -10%;
    z-index: 0; pointer-events: none;
    background:
      radial-gradient(circle at 60% 40%, rgba(255, 210, 220, 0.2) 0%, transparent 50%),
      radial-gradient(circle at 30% 70%, rgba(180, 210, 255, 0.22) 0%, transparent 55%);
    animation: watercolorFlow 90s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate-reverse;
    filter: blur(70px);
  }

  .theme-goldenhour .watercolor-field {
    background:
      radial-gradient(circle at 20% 30%, rgba(251, 191, 36, 0.22) 0%, transparent 45%),
      radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.22) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(249, 168, 212, 0.18) 0%, transparent 45%),
      radial-gradient(circle at 70% 20%, rgba(252, 211, 77, 0.22) 0%, transparent 50%);
  }
  .theme-night .watercolor-field {
    background:
      radial-gradient(circle at 20% 30%, rgba(100, 80, 180, 0.28) 0%, transparent 45%),
      radial-gradient(circle at 80% 70%, rgba(45, 43, 86, 0.35) 0%, transparent 50%),
      radial-gradient(circle at 40% 80%, rgba(135, 185, 214, 0.22) 0%, transparent 45%),
      radial-gradient(circle at 70% 20%, rgba(30, 28, 60, 0.35) 0%, transparent 50%);
    filter: blur(60px);
  }
  .theme-night .watercolor-field-2 {
    background:
      radial-gradient(circle at 60% 40%, rgba(150, 130, 220, 0.2) 0%, transparent 55%),
      radial-gradient(circle at 30% 70%, rgba(100, 140, 210, 0.22) 0%, transparent 60%);
  }

  @keyframes watercolorFlow {
    0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 0.85; }
    50% { transform: scale(1.08) translate(-1.5%, 2%) rotate(1deg); opacity: 1; }
    100% { transform: scale(1.02) translate(1.5%, -1.5%) rotate(-1deg); opacity: 0.92; }
  }

  /* ── Light bloom (Shinkai signature) ── */
  .light-bloom {
    position: fixed;
    top: -20%; left: 50%;
    transform: translateX(-50%);
    width: 140vw; height: 60vh;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(ellipse at center top, rgba(255, 230, 200, 0.35) 0%, rgba(255, 210, 220, 0.15) 30%, transparent 70%);
    filter: blur(40px);
    animation: bloomPulse 12s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  }
  .theme-night .light-bloom {
    background: radial-gradient(ellipse at center top, rgba(180, 200, 255, 0.2) 0%, rgba(150, 170, 230, 0.1) 30%, transparent 70%);
  }
  .theme-goldenhour .light-bloom {
    background: radial-gradient(ellipse at center top, rgba(255, 180, 100, 0.4) 0%, rgba(255, 130, 150, 0.2) 30%, transparent 70%);
  }
  @keyframes bloomPulse {
    0% { opacity: 0.7; transform: translateX(-50%) scale(1); }
    100% { opacity: 1; transform: translateX(-50%) scale(1.05); }
  }

  /* ── DAY: Sakura Breeze ── */
  .theme-day {
    background:
      radial-gradient(ellipse at top right, rgba(216, 140, 154, 0.14) 0%, transparent 50%),
      radial-gradient(ellipse at bottom left, rgba(127, 169, 176, 0.17) 0%, transparent 50%),
      linear-gradient(165deg, #fdf4ed 0%, #f6e8f0 40%, #e0ecea 75%, #dfe8f0 100%);
    background-attachment: fixed;
    color: #2c2c2c;
    --text: #2c2c2c;
    --text-soft: #5a5a5a;
    --text-mute: #8a8a8a;
    --bg-card: rgba(255, 250, 245, 0.72);
    --bg-card-hover: rgba(255, 255, 255, 0.85);
    --border: rgba(180, 150, 140, 0.22);
    --border-strong: rgba(180, 130, 120, 0.5);
    --accent: #c47a85;
    --accent-soft: rgba(196, 122, 133, 0.14);
    --accent2: #8fb8bf;
    --glow-color: rgba(196, 122, 133, 0.22);
  }

  /* ── GOLDEN HOUR ── */
  .theme-goldenhour {
    background:
      radial-gradient(ellipse at top right, rgba(251, 191, 36, 0.28) 0%, transparent 45%),
      radial-gradient(ellipse at bottom left, rgba(244, 114, 182, 0.2) 0%, transparent 50%),
      linear-gradient(155deg, #fdf0d5 0%, #fce4c0 35%, #f9d0c4 70%, #f0c8d8 100%);
    background-attachment: fixed;
    color: #3d2000;
    --text: #3d2000;
    --text-soft: #7c4010;
    --text-mute: #a05820;
    --bg-card: rgba(255, 248, 230, 0.8);
    --bg-card-hover: rgba(255, 252, 240, 0.92);
    --border: rgba(220, 160, 80, 0.3);
    --border-strong: rgba(200, 120, 60, 0.55);
    --accent: #d4704a;
    --accent-soft: rgba(212, 112, 74, 0.16);
    --accent2: #e09256;
    --glow-color: rgba(212, 112, 74, 0.22);
  }

  /* ── NIGHT: Hoshizora ── */
  .theme-night {
    background:
      radial-gradient(ellipse at 20% 15%, rgba(100, 80, 180, 0.3) 0%, transparent 45%),
      radial-gradient(ellipse at 80% 20%, rgba(135, 185, 214, 0.18) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 80%, rgba(45, 43, 86, 0.5) 0%, transparent 50%),
      linear-gradient(175deg, #0a0d1a 0%, #13162a 40%, #1c1a38 70%, #0a0d1a 100%);
    background-attachment: fixed;
    color: #f0ece6;
    --text: #f0ece6;
    --text-soft: #b8b5c9;
    --text-mute: #7a7890;
    --bg-card: rgba(20, 22, 42, 0.72);
    --bg-card-hover: rgba(30, 32, 56, 0.88);
    --border: rgba(160, 150, 200, 0.2);
    --border-strong: rgba(164, 158, 201, 0.45);
    --accent: #b6aee0;
    --accent-soft: rgba(182, 174, 224, 0.18);
    --accent2: #87b9d6;
    --glow-color: rgba(182, 174, 224, 0.28);
  }

  .app-root {
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 80px;
    color: var(--text);
    transition: background 2.5s cubic-bezier(0.4, 0, 0.2, 1), color 2.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .app-root::after {
    content: ''; position: fixed; inset: 0;
    background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.08) 100%);
    pointer-events: none; z-index: 1;
  }
  .theme-night .app-root::after { background: radial-gradient(ellipse at 50% 40%, transparent 45%, rgba(0,0,0,0.25) 100%); }

  /* ── BG BLOBS ── */
  .bg-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(120px);
    z-index: 0;
    pointer-events: none;
    transition: background 2.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 2.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .theme-day .blob-1 {
    top: -10%; left: -5%; width: 45vw; height: 45vw;
    background: radial-gradient(circle, #f5c6d0 0%, #d4ecd8 100%);
    opacity: 0.28;
    animation: blobDrift 35s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  }
  .theme-day .blob-2 {
    bottom: -10%; right: -5%; width: 55vw; height: 55vw;
    background: radial-gradient(circle, #b8d9e0 0%, #e8d0dc 100%);
    opacity: 0.25;
    animation: blobDrift 45s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate-reverse;
  }
  .theme-goldenhour .blob-1 { top: -10%; left: -5%; width: 45vw; height: 45vw; background: #fbbf24; opacity: 0.22; animation: blobDrift 35s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate; }
  .theme-goldenhour .blob-2 { bottom: -10%; right: -5%; width: 55vw; height: 55vw; background: radial-gradient(circle, #f9a8d4 0%, #fcd34d 100%); opacity: 0.22; animation: blobDrift 45s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate-reverse; }
  .theme-night .blob-1 {
    top: -10%; left: -5%; width: 60vw; height: 60vw;
    background: radial-gradient(circle, #5b4f8a 0%, #8b7db5 100%);
    opacity: 0.15;
    animation: blobDrift 40s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
  }
  .theme-night .blob-2 {
    bottom: -15%; right: -5%; width: 70vw; height: 70vw;
    background: radial-gradient(circle, #1e2a4a 0%, #2d3560 100%);
    opacity: 0.22;
    animation: blobDrift 50s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate-reverse;
  }

  @keyframes blobDrift {
    0% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, 14px) scale(1.05); }
    100% { transform: translate(-12px, 20px) scale(0.98); }
  }

  /* ── PETALS (reduced, softer) ── */
  .petals-container { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .petal {
    position: absolute;
    top: -20px;
    width: 12px; height: 12px;
    border-radius: 80% 0 80% 0;
    animation: petalFall linear infinite;
    filter: blur(0.4px);
  }
  @keyframes petalFall {
    0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
    15% { opacity: 0.4; }
    50% { transform: translateY(50vh) translateX(40px) rotate(180deg); }
    85% { opacity: 0.3; }
    100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); opacity: 0; }
  }

  /* ── STARS (dimmer) ── */
  .stars-container { position: fixed; inset: 0; pointer-events: none; z-index: 1; overflow: hidden; }
  .star {
    position: absolute;
    border-radius: 50%;
    background: #ffffff;
    animation: starTwinkle ease-in-out infinite;
    box-shadow: 0 0 3px rgba(255,255,255,0.5);
  }
  @keyframes starTwinkle {
    0%, 100% { opacity: 0.08; transform: scale(0.8); }
    50% { opacity: 0.5; transform: scale(1.15); }
  }

  /* ── COMET (rare, slow) ── */
  .comet {
    position: fixed;
    top: 0; left: 0;
    width: 220px; height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(147, 197, 253, 0.08) 30%, rgba(186, 230, 253, 0.5) 70%, #ffffff 100%);
    box-shadow: 0 0 8px 1px rgba(147, 197, 253, 0.6), 0 0 20px 3px rgba(147, 197, 253, 0.25);
    border-radius: 50%;
    z-index: 1;
    pointer-events: none;
    transform: rotate(-25deg);
    animation: cometFly 70s linear infinite;
    opacity: 0;
  }
  @keyframes cometFly {
    0% { transform: translate(-25vw, 90vh) rotate(-25deg); opacity: 0; }
    2% { opacity: 0; }
    4% { opacity: 0.55; }
    9% { transform: translate(130vw, -25vh) rotate(-25deg); opacity: 0.45; }
    11% { opacity: 0; }
    100% { transform: translate(130vw, -25vh) rotate(-25deg); opacity: 0; }
  }

  .content-wrap {
    max-width: 1400px;
    margin: 0 auto;
    padding: 36px 24px 0;
    position: relative;
    z-index: 2;
  }

  /* ── HEADER ── */
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 26px;
  }
  .app-title-jp {
    font-family: 'Noto Serif JP', serif;
    font-size: 11px;
    font-weight: 300;
    color: var(--text-mute);
    letter-spacing: 6px;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .app-title {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 34px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.3px;
    line-height: 1.1;
    text-shadow: 0 2px 24px var(--glow-color);
  }
  .app-subtitle {
    color: var(--text-mute);
    font-size: 11px;
    margin-top: 8px;
    font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.8px;
  }
  .header-right {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
  }

  .clock-stack { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .live-clock {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 14px;
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 14px;
    transition: box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .live-clock:hover { border-color: var(--accent); box-shadow: 0 0 28px var(--accent-soft); }
  .clock-icon { font-size: 22px; }
  .clock-time { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: var(--text); line-height: 1; }
  .clock-label { font-size: 9px; font-weight: 600; color: var(--text-mute); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 3px; }

  .theme-toggle {
    display: flex; gap: 2px;
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 12px;
    padding: 2px;
    transition: border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .theme-toggle:hover { border-color: var(--accent); box-shadow: 0 0 28px var(--accent-soft); }
  .theme-toggle-btn {
    background: transparent; border: none;
    padding: 5px 10px; cursor: pointer;
    font-size: 11px; font-weight: 600;
    color: var(--text-mute); border-radius: 8px;
    font-family: 'Zen Kaku Gothic New', sans-serif;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .theme-toggle-btn.active { background: var(--accent); color: #fff; }
  .theme-night .theme-toggle-btn.active { color: #0a0d1a; }

  /* ── BUTTONS ── */
  .btn {
    border-radius: 14px;
    font-weight: 600;
    font-size: 13px;
    padding: 10px 18px;
    cursor: pointer;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.35s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.45s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--border);
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    color: var(--text);
    white-space: nowrap;
    font-family: 'Zen Kaku Gothic New', sans-serif;
  }
  .btn:hover:not(:disabled) {
    transform: translateY(-1.5px);
    border-color: var(--accent);
    box-shadow: 0 0 24px var(--accent-soft), 0 6px 16px rgba(0,0,0,0.08);
  }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .theme-night .btn-primary { color: #0a0d1a; }
  .btn-primary:hover:not(:disabled) { box-shadow: 0 0 32px var(--accent), 0 6px 18px rgba(0,0,0,0.14); }
  .btn-outline { background: var(--bg-card); color: var(--text); }
  .btn-ghost { background: transparent; border: 1px solid transparent; color: var(--text-mute); }
  .btn-danger { border-color: #dc2626; color: #dc2626; }
  .btn-danger:hover:not(:disabled) { border-color: #dc2626; box-shadow: 0 0 22px rgba(220, 38, 38, 0.55); }
  .theme-night .btn-danger { border-color: #fca5a5; color: #fca5a5; }
  .theme-night .btn-danger:hover:not(:disabled) { box-shadow: 0 0 22px rgba(252, 165, 165, 0.45); }
  .btn-warn { border-color: #d97706; color: #d97706; }
  .btn-warn:hover:not(:disabled) { box-shadow: 0 0 22px rgba(217, 119, 6, 0.45); }
  .theme-night .btn-warn { border-color: #fbbf24; color: #fbbf24; }
  .btn-mini { padding: 6px 10px; font-size: 11px; }
  .btn-admin-active { border-color: #dc2626; color: #dc2626; }
  .theme-night .btn-admin-active { border-color: #fca5a5; color: #fca5a5; }
  .user-btn { display: flex; align-items: center; gap: 8px; padding-left: 12px; }
  .user-dot { width: 10px; height: 10px; border-radius: 50%; }

  .save-indicator { font-size: 11px; color: var(--text-mute); font-weight: 600; align-self: center; font-family: 'JetBrains Mono', monospace; }
  .save-indicator.saved { color: #10b981; }

  /* ── WELCOME / INSTRUCTION ── */
  .welcome-banner {
    display: flex; flex-wrap: wrap; gap: 16px; align-items: center;
    padding: 22px 26px; margin-bottom: 22px;
    background: var(--bg-card);
    backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 18px;
  }
  .welcome-content { flex: 1; min-width: 280px; }
  .welcome-title { font-family: 'Klee One', serif; font-size: 22px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .welcome-text { color: var(--text-soft); font-size: 14px; font-weight: 400; line-height: 1.55; }
  .welcome-tips { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
  .welcome-tip {
    font-size: 12px; color: var(--text-soft); font-weight: 500;
    background: var(--accent-soft); padding: 8px 12px; border-radius: 10px;
    border: 1px solid var(--border);
  }
  .welcome-actions { display: flex; gap: 8px; }

  .instruction-bar {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 18px;
    background: var(--accent-soft);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border-strong);
    border-radius: 14px;
    margin-bottom: 18px;
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
  }
  .instruction-icon { font-size: 16px; flex-shrink: 0; }
  .instruction-bar kbd {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 1px 6px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    color: var(--text);
  }

  .info-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px;
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px dashed var(--border);
    border-radius: 14px;
    margin-bottom: 16px;
    color: var(--text-soft);
    font-size: 13px;
    font-weight: 500;
  }
  .info-icon { font-size: 16px; flex-shrink: 0; }

  /* ── SCORE SCALE ── */
  .score-scale {
    display: flex; flex-wrap: wrap; gap: 12px;
    padding: 12px 16px;
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border);
    border-radius: 14px;
    margin-bottom: 20px;
  }
  .scale-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-family: 'Zen Kaku Gothic New', sans-serif; }
  .scale-dot { width: 8px; height: 8px; border-radius: 50%; }
  .scale-range { font-weight: 600; color: var(--text); font-family: 'JetBrains Mono', monospace; }
  .scale-label { color: var(--text-mute); font-weight: 500; }

  /* ── TABS ── */
  .tabs-row {
    display: flex; gap: 4px; flex-wrap: wrap;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 4px;
  }
  .tab-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px;
    padding: 10px 14px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 12px 12px 0 0;
    cursor: pointer;
    font-family: 'Zen Kaku Gothic New', sans-serif;
    color: var(--tab-idle, var(--text-mute));
    transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  .tab-btn:hover { color: var(--text); background: var(--accent-soft); }
  .theme-night .tab-btn { --tab-idle: #cdc8e2; }
  .theme-night .tab-count { color: #9a95b4; }
  .theme-night .tab-jp { color: #b0aacb; opacity: 0.9; }
  .tab-btn.active {
    color: var(--text);
    background: var(--bg-card);
    border-color: var(--border);
    border-bottom-color: transparent;
    box-shadow: 0 -4px 20px var(--accent-soft);
  }
  .tab-btn.active::after {
    content: ''; position: absolute; bottom: -5px; left: 10%; right: 10%;
    height: 2px; background: var(--accent);
    border-radius: 2px;
    box-shadow: 0 0 10px var(--accent);
  }
  .tab-jp { font-family: 'Noto Serif JP', serif; font-size: 9px; font-weight: 400; letter-spacing: 2px; opacity: 0.75; }
  .tab-label { font-size: 13px; font-weight: 600; }
  .tab-count { font-size: 10px; font-weight: 500; color: var(--text-mute); font-family: 'JetBrains Mono', monospace; }

  .tab-special .tab-label {
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    font-weight: 700;
  }
  .tab-special.active .tab-label {
    background: none; color: var(--text);
  }

  /* ── RECENTLY ADDED ── */
  .recently-added {
    padding: 14px 18px;
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border);
    border-radius: 16px;
    margin-bottom: 16px;
  }
  .ra-header {
    font-family: 'Zen Kaku Gothic New', sans-serif;
    font-size: 11px; color: var(--text-mute); font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;
  }
  .ra-list { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
  .ra-card {
    display: flex; gap: 10px; padding: 8px 10px;
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; cursor: pointer; flex-shrink: 0; min-width: 240px;
    transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ra-card:hover { border-color: var(--accent); box-shadow: 0 0 18px var(--accent-soft); }
  .ra-cover {
    width: 44px; height: 62px; border-radius: 6px;
    background-size: cover; background-position: center;
    background-color: var(--bg-card); border: 1px solid var(--border);
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 16px; opacity: 0.6;
  }
  .ra-cover[style*="url"] { opacity: 1; }
  .ra-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .ra-title {
    font-family: 'Klee One', serif;
    font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.3;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ra-meta { font-size: 11px; color: var(--text-mute); margin-top: 3px; font-weight: 500; }

  /* ── CTA ── */
  .cta-card {
    padding: 22px 26px;
    background: var(--accent-soft);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border-strong);
    border-radius: 16px;
    margin-bottom: 20px;
  }
  .cta-card h3 { font-family: 'Klee One', serif; font-size: 19px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
  .cta-card p { color: var(--text-soft); font-size: 13px; line-height: 1.55; margin-bottom: 6px; }
  .cta-sub { font-size: 12px; color: var(--text-mute); }

  /* ── FILTER CHIPS ── */
  .filter-chips {
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    margin-bottom: 14px;
  }
  .chips-label {
    font-size: 10px; color: var(--text-mute); font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px; margin-right: 4px;
  }
  .chip {
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid var(--border);
    padding: 7px 14px; border-radius: 20px;
    font-size: 12px; font-weight: 600; color: var(--text-soft);
    cursor: pointer;
    transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Zen Kaku Gothic New', sans-serif;
  }
  .chip:hover { color: var(--text); border-color: var(--accent); box-shadow: 0 0 16px var(--accent-soft); }
  .chip.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 0 22px var(--accent-soft); }
  .theme-night .chip.active { color: #0a0d1a; }
  .chip.clear { color: var(--text-mute); font-size: 11px; border-style: dashed; }

  /* ── TOOLBAR ── */
  .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 22px; flex-wrap: wrap; }
  .search-wrap { flex: 1; position: relative; max-width: 400px; min-width: 200px; }
  .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-mute); pointer-events: none; }
  .search-input {
    width: 100%;
    padding: 11px 14px 11px 36px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    color: var(--text);
    font-size: 14px; border-radius: 14px;
    outline: none; font-weight: 500;
    font-family: 'Zen Kaku Gothic New', sans-serif;
    transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .search-input:focus { border-color: var(--accent); box-shadow: 0 0 24px var(--accent-soft); }
  .search-clear {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; color: var(--text-mute);
    cursor: pointer; font-size: 14px; font-weight: 600;
  }

  .txt-input {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    color: var(--text);
    font-size: 14px; border-radius: 12px;
    outline: none; font-weight: 500;
    font-family: 'Zen Kaku Gothic New', sans-serif;
    transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .txt-input:focus { border-color: var(--accent); box-shadow: 0 0 22px var(--accent-soft); }
  .txt-input:disabled { opacity: 0.5; cursor: not-allowed; }
  .input-error { border-color: #dc2626; box-shadow: 0 0 16px rgba(220, 38, 38, 0.35); }
  .err-msg { color: #dc2626; font-size: 12px; margin-top: 6px; font-weight: 600; }
  .theme-night .err-msg { color: #fca5a5; }

  /* ── POSTER GRID ── */
  .poster-grid-wrap { margin-top: 4px; }
  .poster-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .poster-card {
    --card-glow: var(--glow-color);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 6px 24px rgba(0,0,0,0.08);
    position: relative;
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    animation: cardFloat 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .theme-night .poster-card {
    border-color: rgba(164, 158, 201, 0.22);
    box-shadow: 0 6px 28px rgba(0,0,0,0.3);
  }
  @keyframes cardFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2.5px); }
  }
  .poster-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 14px 36px rgba(0,0,0,0.12);
    border-color: rgba(255,255,255,0.55);
    animation-play-state: paused;
  }
  .theme-night .poster-card:hover {
    border-color: var(--accent);
    box-shadow: 0 0 32px var(--accent-soft), 0 14px 36px rgba(0,0,0,0.4);
  }

  /* Hover glow — radial from cursor, blurred, tinted by extracted color */
  .poster-glow {
    position: absolute;
    inset: -4px;
    border-radius: 18px;
    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), var(--card-glow) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    z-index: 0;
    filter: blur(40px);
  }
  .poster-card:hover .poster-glow { opacity: 1; }

  .poster-cover {
    position: relative;
    aspect-ratio: 2 / 3;
    background-size: cover;
    background-position: center;
    background-color: var(--bg-card);
    display: flex; align-items: flex-end;
  }
  .poster-placeholder {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 60px; opacity: 0.25;
  }
  /* Soft gradient fade — the "fog" at the bottom */
  .poster-fade {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 42%;
    background: linear-gradient(to top, rgba(10,12,25,0.72) 0%, rgba(10,12,25,0.3) 50%, transparent 100%);
    pointer-events: none;
    z-index: 1;
  }
  /* Frosted info strip — "fog over the image, not a hard panel" */
  .poster-info-strip {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 12px 12px 11px;
    background: rgba(15, 18, 35, 0.25);
    backdrop-filter: blur(18px) saturate(1.2);
    -webkit-backdrop-filter: blur(18px) saturate(1.2);
    border-top: 1px solid rgba(255,255,255,0.12);
    color: #fff;
    z-index: 2;
    transition: background 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .poster-card:hover .poster-info-strip {
    background: rgba(15, 18, 35, 0.35);
  }
  .poster-title {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    line-height: 1.35;
    text-shadow: 0 1px 8px rgba(0,0,0,0.8);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .poster-jp {
    font-family: 'Noto Serif JP', serif;
    font-weight: 300;
    font-size: 10px;
    color: #e2e8f0;
    opacity: 0.75;
    margin-top: 3px;
    text-shadow: 0 1px 4px rgba(0,0,0,0.7);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    letter-spacing: 1px;
  }
  .poster-meta-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 7px;
  }
  .poster-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
    text-shadow: 0 2px 12px rgba(0,0,0,0.85);
    filter: drop-shadow(0 0 6px currentColor);
  }
  .poster-score.none { color: #cbd5e1; filter: none; }
  .poster-raters { display: flex; gap: 3px; }
  .rater-dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.85); }
  .rater-more { font-size: 9px; color: #e2e8f0; font-weight: 600; margin-left: 4px; font-family: 'JetBrains Mono', monospace; }

  .rank-badge {
    position: absolute;
    top: 10px; left: 10px;
    background: rgba(15, 18, 35, 0.45);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.25);
    color: #fff;
    padding: 4px 11px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    z-index: 3;
  }
  .rank-badge.top3 {
    background: linear-gradient(135deg, #fcd34d, #f59e0b);
    color: #422006;
    border-color: #fbbf24;
    box-shadow: 0 0 24px rgba(251, 191, 36, 0.55);
  }

  .poster-badges {
    position: absolute;
    top: 10px; right: 10px;
    display: flex; flex-direction: column; gap: 6px;
    z-index: 3;
  }
  .ptw-badge {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: rgba(15, 18, 35, 0.5);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid #87b9d6;
    color: #87b9d6;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    box-shadow: 0 0 14px rgba(135, 185, 214, 0.45);
  }
  .fav-btn {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: rgba(15, 18, 35, 0.5);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.3);
    color: #cbd5e1;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fav-btn:hover { border-color: #fcd34d; color: #fcd34d; }
  .fav-btn.active { background: #fcd34d; color: #422006; border-color: #fbbf24; box-shadow: 0 0 18px rgba(251, 191, 36, 0.55); }

  /* Tooltip on hover */
  .hover-tooltip {
    position: absolute;
    top: 10px; left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: rgba(15, 18, 35, 0.85);
    backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 10px;
    padding: 8px 10px;
    z-index: 5;
    opacity: 0; pointer-events: none;
    transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 120px;
  }
  .poster-card:hover .hover-tooltip { opacity: 1; }
  .tooltip-label {
    font-size: 9px; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1px;
    font-weight: 600; margin-bottom: 4px;
    font-family: 'Zen Kaku Gothic New', sans-serif;
  }
  .tooltip-row { display: flex; align-items: center; gap: 6px; font-size: 11px; margin: 2px 0; }
  .tooltip-dot { width: 8px; height: 8px; border-radius: 50%; }
  .tooltip-name { color: #e2e8f0; flex: 1; font-weight: 500; }
  .tooltip-score { font-family: 'JetBrains Mono', monospace; font-weight: 600; }

  /* ── SCENES MODE (fullscreen, scroll-driven dissolve) ── */
  .scenes-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: #05070d;
    overflow: hidden;
    font-family: 'Zen Kaku Gothic New', sans-serif;
  }
  .scenes-admin-bar {
    position: fixed; top: 14px; right: 14px; z-index: 65;
    display: flex; gap: 8px; align-items: center;
  }
  .btn-scene-ctrl {
    background: rgba(15,18,35,0.55); color: #fff;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border: 1px solid rgba(255,255,255,0.22);
    padding: 8px 14px;
    border-radius: 100px;
    font-family: 'Klee One', serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    letter-spacing: 0.5px;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-scene-ctrl:hover { background: rgba(30,35,60,0.75); border-color: rgba(255,255,255,0.4); }
  .btn-scene-ctrl.danger { border-color: rgba(252,165,165,0.5); color: #fca5a5; }
  .scene-count-pill {
    padding: 6px 12px;
    background: rgba(255,255,255,0.08);
    border-radius: 100px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: rgba(255,255,255,0.75);
    letter-spacing: 0.5px;
  }

  /* Editor surface (picker / order / bulk bg) */
  .scenes-editor {
    position: absolute; inset: 0;
    overflow-y: auto;
    padding: 80px 40px 60px;
    background:
      radial-gradient(ellipse at 20% 10%, rgba(100,80,180,0.22) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(135,185,214,0.15) 0%, transparent 50%),
      linear-gradient(180deg, #0a0d1a 0%, #13162a 60%, #0a0d1a 100%);
    color: #f0ece6;
  }
  .scenes-editor-header { max-width: 900px; margin: 0 auto 28px; }
  .scenes-editor-header h2 {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 34px; font-weight: 600;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #b6aee0, #87b9d6);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .scenes-editor-header p {
    color: #b8b5c9; font-size: 14px; line-height: 1.6;
    max-width: 680px;
    font-family: 'Klee One', serif;
  }
  .scene-editor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 16px;
    max-width: 1400px;
    margin: 0 auto;
  }
  .scene-editor-card {
    background: rgba(20,22,42,0.65);
    border: 1px solid rgba(160,150,200,0.18);
    border-radius: 14px;
    overflow: hidden;
    display: flex; flex-direction: column;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .scene-editor-card.picked {
    border-color: rgba(182,174,224,0.7);
    box-shadow: 0 0 28px rgba(182,174,224,0.22), 0 4px 16px rgba(0,0,0,0.4);
  }
  .scene-editor-thumb {
    position: relative;
    aspect-ratio: 16 / 10;
    background-size: cover; background-position: center;
    background-color: #1c1f36;
  }
  .scene-editor-rank {
    position: absolute; top: 8px; left: 8px;
    padding: 3px 10px;
    background: rgba(182,174,224,0.9); color: #0a0d1a;
    border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700;
  }
  .scene-editor-empty {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: #6a6887;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 2px;
  }
  .scene-editor-body { padding: 12px 14px 14px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .scene-editor-title { font-family: 'Klee One', serif; font-size: 14px; font-weight: 600; color: #f0ece6; line-height: 1.3; }
  .scene-editor-jp { font-family: 'Noto Serif JP', serif; font-size: 11px; color: #8e8ba8; letter-spacing: 1px; margin-top: -4px; }
  .scene-editor-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .btn-scene-mini {
    padding: 5px 10px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    color: #f0ece6;
    border-radius: 8px;
    font-family: 'Klee One', serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-scene-mini:hover:not(:disabled) { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }
  .btn-scene-mini:disabled { opacity: 0.35; cursor: not-allowed; }
  .btn-scene-mini.on { background: rgba(182,174,224,0.25); border-color: rgba(182,174,224,0.7); color: #e8e4ff; }
  .btn-scene-mini.small { font-size: 11px; padding: 3px 8px; align-self: flex-start; }
  .scene-editor-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #8e8ba8; margin-top: 4px; font-family: 'JetBrains Mono', monospace; }
  .scene-editor-input {
    width: 100%;
    padding: 7px 10px;
    background: rgba(10,12,25,0.6);
    border: 1px solid rgba(160,150,200,0.25);
    border-radius: 8px;
    color: #f0ece6;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
    transition: border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .scene-editor-input:focus { border-color: rgba(182,174,224,0.8); }
  .scene-editor-input::placeholder { color: #5a587a; }

  /* Empty state */
  .scenes-empty {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: #b8b5c9; text-align: center;
    padding: 40px;
  }
  .scenes-empty .scenes-eyebrow {
    font-family: 'Noto Serif JP', serif;
    font-size: 11px; font-weight: 300;
    color: #7a7890;
    letter-spacing: 8px; text-transform: uppercase;
    margin-bottom: 18px;
  }
  .scenes-empty p { font-family: 'Klee One', serif; font-size: 16px; max-width: 460px; line-height: 1.7; }

  /* Single-scene viewport (no page scroll) */
  .scene-viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .scene-fs {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    background-color: #05070d;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 8%;
    cursor: pointer;
    overflow: hidden;
    will-change: transform, opacity, filter;
    transform-origin: center center;
  }
  .scene-overlay {
    position: absolute; inset: 0;
    background:
      linear-gradient(180deg, rgba(5,7,13,0.35) 0%, rgba(5,7,13,0.15) 40%, rgba(5,7,13,0.85) 100%),
      linear-gradient(90deg, rgba(5,7,13,0.6) 0%, rgba(5,7,13,0.1) 55%, transparent 80%);
    z-index: 1;
    pointer-events: none;
  }
  .scene-content {
    position: relative; z-index: 3;
    max-width: 780px; color: #fff;
    transform-origin: center center;
    will-change: transform, opacity, filter;
  }
  .scene-rank {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.6);
    letter-spacing: 4px;
    margin-bottom: 18px;
  }
  .scene-title {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: clamp(40px, 6.8vw, 86px);
    font-weight: 600;
    line-height: 1.04;
    margin-bottom: 16px;
    color: #fff;
    text-shadow: 0 4px 32px rgba(0,0,0,0.75), 0 0 60px rgba(255,240,220,0.2);
    letter-spacing: 0.3px;
  }
  .scene-jp {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(16px, 2vw, 24px);
    font-weight: 300;
    color: rgba(255,255,255,0.82);
    margin-bottom: 28px;
    letter-spacing: 2px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.75);
  }
  .scene-meta { display: flex; flex-wrap: wrap; gap: 18px; align-items: center; margin-bottom: 24px; }
  .scene-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 24px; font-weight: 600;
    text-shadow: 0 0 20px currentColor, 0 2px 10px rgba(0,0,0,0.7);
    filter: drop-shadow(0 0 10px currentColor);
  }
  .scene-raters { display: flex; flex-wrap: wrap; gap: 6px; }
  .scene-rater {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 11px;
    background: rgba(15,18,35,0.5);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 100px;
    font-size: 11px; font-weight: 500; color: #fff;
    font-family: 'JetBrains Mono', monospace;
  }
  .scene-rater-dot { width: 7px; height: 7px; border-radius: 50%; }
  .scene-cta {
    font-family: 'Klee One', serif;
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    font-style: italic;
    letter-spacing: 1px;
  }

  /* Pagination dots (right edge) */
  .scene-dots {
    position: fixed; right: 22px; top: 50%;
    transform: translateY(-50%);
    z-index: 62;
    display: flex; flex-direction: column; gap: 10px;
  }
  .scene-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,0.3);
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0;
  }
  .scene-dot:hover { background: rgba(255,255,255,0.6); transform: scale(1.3); }
  .scene-dot.on {
    background: #fff;
    box-shadow: 0 0 14px rgba(255,255,255,0.6);
    transform: scale(1.4);
  }

  /* Arrow nav (top/bottom center) */
  .scene-nav {
    position: fixed; left: 50%;
    transform: translateX(-50%);
    z-index: 62;
    background: rgba(15,18,35,0.45);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    width: 44px; height: 44px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'JetBrains Mono', monospace;
  }
  .scene-nav:hover { background: rgba(30,35,60,0.75); border-color: rgba(255,255,255,0.4); transform: translateX(-50%) scale(1.08); }
  .scene-nav-prev { top: 78px; }
  .scene-nav-next { bottom: 78px; animation: navPulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
  @keyframes navPulse {
    0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.7; }
    50%      { transform: translateX(-50%) translateY(6px); opacity: 1; }
  }

  /* Inline background editor (floating bottom panel, admin) */
  .inline-bg-editor {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 70;
    width: min(640px, 92vw);
    background: rgba(15,18,35,0.85);
    backdrop-filter: blur(22px) saturate(1.2); -webkit-backdrop-filter: blur(22px) saturate(1.2);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 18px;
    padding: 14px 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    display: flex; flex-direction: column; gap: 12px;
  }
  .inline-bg-row { display: flex; gap: 14px; align-items: center; }
  .inline-bg-thumb {
    width: 88px; height: 56px;
    border-radius: 8px;
    background-size: cover; background-position: center;
    background-color: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.2);
    flex-shrink: 0;
  }
  .inline-bg-fields { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .inline-bg-title {
    font-family: 'Klee One', serif;
    font-size: 13px; font-weight: 600;
    color: #f0ece6;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .inline-bg-hint {
    font-size: 10px; color: #8e8ba8;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.5px;
  }
  .inline-bg-actions { display: flex; gap: 6px; justify-content: flex-end; }

  @media (max-width: 600px) {
    .scene-fs { padding: 0 28px; }
    .scenes-editor { padding: 70px 18px 40px; }
    .scene-editor-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .scenes-editor-header h2 { font-size: 26px; }
    .scenes-admin-bar { top: 10px; right: 10px; gap: 6px; flex-wrap: wrap; max-width: calc(100vw - 20px); justify-content: flex-end; }
    .btn-scene-ctrl { padding: 6px 11px; font-size: 12px; }
    .scene-dots { right: 12px; gap: 8px; }
    .scene-nav { width: 38px; height: 38px; font-size: 16px; }
    .scene-nav-prev { top: 64px; }
    .scene-nav-next { bottom: 64px; }
    .inline-bg-editor { left: 8px; right: 8px; bottom: 14px; transform: none; width: auto; }
    .inline-bg-thumb { width: 64px; height: 40px; }
  }

  /* ── PEOPLE ── */
  .people-section, .ost-section { margin-top: 4px; }
  .people-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 20px; flex-wrap: wrap; gap: 10px;
  }
  .people-header h2 {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 24px; font-weight: 600; color: var(--text);
    letter-spacing: 0.3px;
  }
  .people-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }
  .person-card {
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-left: 3px solid;
    border-radius: 16px;
    padding: 18px 20px;
    transition: border-color 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .person-card:hover { box-shadow: 0 0 26px var(--accent-soft); transform: translateY(-1px); }
  .person-header { display: flex; gap: 14px; align-items: center; margin-bottom: 10px; }
  .person-avatar {
    width: 48px; height: 48px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Klee One', serif; font-weight: 600;
    font-size: 20px; color: #0a0d1a;
  }
  .person-name {
    font-family: 'Klee One', serif;
    font-size: 17px; font-weight: 600; color: var(--text);
    display: flex; align-items: center; gap: 8px;
  }
  .me-tag {
    background: var(--accent);
    color: #fff;
    font-size: 9px; font-weight: 700; padding: 2px 6px;
    border-radius: 4px; letter-spacing: 1px;
    font-family: 'JetBrains Mono', monospace;
  }
  .theme-night .me-tag { color: #0a0d1a; }
  .lock-tag { font-size: 13px; opacity: 0.7; }
  .person-stats {
    font-size: 12px; color: var(--text-mute); margin-top: 3px; font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
    display: flex; align-items: center; gap: 8px;
  }
  .expand-chevron { font-size: 10px; color: var(--text-mute); }

  .ptw-gallery { margin: 10px 0; }
  .ptw-label {
    font-size: 10px; color: var(--text-mute); font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;
  }
  .ptw-covers { display: flex; gap: 6px; flex-wrap: wrap; }
  .ptw-cover {
    width: 40px; height: 56px; border-radius: 6px;
    background-size: cover; background-position: center;
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; opacity: 0.8;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ptw-cover:hover { transform: translateY(-2px); box-shadow: 0 4px 14px var(--accent-soft); opacity: 1; }
  .ptw-cover.ptw-more {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 600; color: var(--text-mute);
    background: var(--bg-card);
  }

  .person-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 10px; }
  .color-picker {
    display: flex; align-items: center; gap: 6px;
    font-size: 11px; color: var(--text-mute); font-weight: 600;
  }
  .color-picker input[type="color"] { width: 28px; height: 24px; border: none; background: none; cursor: pointer; }

  .member-expand {
    margin-top: 12px;
    border-top: 1px dashed var(--border);
    padding-top: 12px;
  }
  .member-expand-label {
    font-size: 10px; color: var(--text-mute); font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 8px;
  }
  .member-rated-row {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .member-rated-row:hover { background: var(--accent-soft); }
  .member-rated-cover {
    width: 28px; height: 40px; border-radius: 4px;
    background-size: cover; background-position: center;
    background-color: var(--bg-card);
    border: 1px solid var(--border);
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; opacity: 0.6;
  }
  .member-rated-title {
    flex: 1; font-size: 12px; color: var(--text); font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-family: 'Klee One', serif;
  }
  .member-rated-score { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; }

  /* ── OST ── */
  .ost-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .ost-card {
    position: relative;
    display: flex; gap: 12px;
    padding: 12px;
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: 14px;
    transition: border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ost-card:hover { border-color: var(--accent); box-shadow: 0 0 20px var(--accent-soft); transform: translateY(-2px); }
  .ost-cover {
    width: 72px; height: 72px;
    border-radius: 10px;
    object-fit: cover;
    background-color: var(--bg-card);
    border: 1px solid var(--border);
  }
  .ost-cover-empty { display: flex; align-items: center; justify-content: center; font-size: 28px; opacity: 0.5; }
  .ost-info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .ost-anime {
    font-family: 'Klee One', serif;
    font-size: 14px; font-weight: 600; color: var(--text);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ost-track { font-size: 11px; color: var(--text-soft); margin-top: 2px; font-weight: 500; font-family: 'Noto Serif JP', serif; }
  .ost-meta { display: flex; align-items: baseline; gap: 10px; margin-top: 6px; }
  .ost-score { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 600; filter: drop-shadow(0 0 4px currentColor); }
  .ost-by { font-size: 10px; color: var(--text-mute); font-weight: 500; }
  .ost-delete {
    position: absolute; top: 6px; right: 6px;
    background: none; border: none;
    color: var(--text-mute); cursor: pointer;
    font-size: 14px; padding: 4px 8px;
    border-radius: 6px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ost-delete:hover { color: #dc2626; background: rgba(220, 38, 38, 0.1); }

  /* ── EMPTY STATE ── */
  .empty-state {
    padding: 60px 24px;
    text-align: center;
    color: var(--text-mute);
    font-size: 14px;
    font-family: 'Klee One', serif;
    font-weight: 500;
  }

  /* ── DETAIL MODAL ── */
  .detail-box {
    background: var(--bg-card-hover);
    backdrop-filter: blur(32px) saturate(1.3);
    -webkit-backdrop-filter: blur(32px) saturate(1.3);
    border: 1px solid var(--border-strong);
    border-radius: 22px;
    max-width: 680px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    color: var(--text);
    box-shadow: 0 30px 80px rgba(0,0,0,0.35), 0 0 60px var(--accent-soft);
    padding: 26px;
    position: relative;
  }
  .detail-close {
    position: absolute; top: 14px; right: 14px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    width: 34px; height: 34px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .detail-close:hover { border-color: var(--accent); transform: rotate(90deg); }
  .detail-grid {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 22px;
  }
  @media (max-width: 560px) { .detail-grid { grid-template-columns: 1fr; } }
  .detail-cover-wrap { width: 100%; }
  .detail-cover {
    width: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
    border-radius: 14px;
    border: 1px solid var(--border);
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  }
  .detail-cover-empty {
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-card);
    font-size: 60px; opacity: 0.3;
  }
  .detail-title {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 26px; font-weight: 600;
    color: var(--text);
    line-height: 1.15;
    margin-bottom: 6px;
  }
  .detail-jp {
    font-family: 'Noto Serif JP', serif;
    font-size: 13px; font-weight: 300;
    color: var(--text-mute);
    letter-spacing: 1.5px;
    margin-bottom: 16px;
  }
  .detail-score-block { display: flex; align-items: baseline; gap: 12px; margin-bottom: 18px; }
  .detail-score {
    font-family: 'JetBrains Mono', monospace;
    font-size: 42px; font-weight: 600;
    line-height: 1;
    filter: drop-shadow(0 0 14px currentColor);
  }
  .detail-score.none { font-size: 16px; color: var(--text-mute); filter: none; font-family: 'Klee One', serif; }
  .detail-score-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.8px;
    padding: 4px 10px; border: 1px solid; border-radius: 100px;
    font-family: 'Zen Kaku Gothic New', sans-serif;
  }
  .section-label {
    font-size: 10px; color: var(--text-mute); font-weight: 600;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;
  }
  .detail-ratings { margin-bottom: 18px; }
  .rating-row {
    display: flex; align-items: center; gap: 10px;
    padding: 7px 10px; border-radius: 8px;
    transition: background 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .rating-row:hover { background: var(--accent-soft); }
  .rating-dot { width: 10px; height: 10px; border-radius: 50%; }
  .rating-name { flex: 1; font-size: 13px; color: var(--text); font-weight: 500; font-family: 'Klee One', serif; }
  .rating-score { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; }
  .rating-remove {
    background: none; border: none;
    color: var(--text-mute); cursor: pointer;
    font-size: 12px; padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .rating-remove:hover { color: #dc2626; background: rgba(220, 38, 38, 0.1); }
  .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--border); }

  /* ── MODALS ── */
  .modal-backdrop {
    position: fixed; inset: 0;
    background: rgba(10, 12, 25, 0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }
  .modal-backdrop.modal-static {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .modal-box {
    background: var(--bg-card-hover);
    backdrop-filter: blur(32px) saturate(1.3);
    -webkit-backdrop-filter: blur(32px) saturate(1.3);
    border: 1px solid var(--border-strong);
    border-radius: 20px;
    padding: 28px;
    max-width: 500px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    color: var(--text);
    box-shadow: 0 28px 70px rgba(0,0,0,0.32), 0 0 50px var(--accent-soft);
  }
  .modal-title {
    font-family: 'Klee One', 'Shippori Mincho', serif;
    font-size: 22px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
    letter-spacing: 0.2px;
  }
  .modal-subtitle { font-size: 13px; color: var(--text-soft); font-weight: 500; margin-bottom: 16px; line-height: 1.5; }
  .security-note { color: var(--text-mute); font-size: 11px; margin-top: 10px; font-weight: 500; line-height: 1.5; font-family: 'JetBrains Mono', monospace; }

  .login-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }
  .login-person {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    padding: 12px 8px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    cursor: pointer;
    font-size: 12px; font-weight: 600;
    color: var(--text);
    font-family: 'Klee One', serif;
    transition: border-color 0.35s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }
  .login-person:hover { border-color: var(--border-strong); box-shadow: 0 0 14px var(--accent-soft); }
  .login-person.selected { background: var(--accent-soft); }
  .login-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #0a0d1a;
    font-weight: 600; font-size: 16px;
    font-family: 'Klee One', serif;
  }
  .unclaimed-tag {
    font-size: 8px;
    background: #f59e0b; color: #fff;
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 700; letter-spacing: 0.5px;
  }

  .score-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
  .score-btn {
    padding: 11px 4px;
    border: 1px solid var(--border);
    background: var(--bg-card);
    color: var(--text-soft);
    cursor: pointer;
    font-size: 14px; font-weight: 600;
    text-align: center;
    border-radius: 10px;
    font-family: 'JetBrains Mono', monospace;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .score-btn:hover { transform: translateY(-1px); }

  .rate-target-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    padding: 14px 16px;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .rate-title { color: var(--text); font-size: 16px; font-weight: 600; font-family: 'Klee One', serif; }
  .rate-jp {
    font-family: 'Noto Serif JP', serif;
    color: var(--text-mute);
    font-size: 13px; font-weight: 300;
    opacity: 0.85;
    margin-top: 4px;
    letter-spacing: 1px;
  }
  .rate-as { color: var(--text-mute); font-size: 12px; margin-top: 8px; font-weight: 600; }

  .cover-preview {
    margin-top: 12px;
    width: 100px; height: 140px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .cover-preview img { width: 100%; height: 100%; object-fit: cover; }

  .wipe-count-banner {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 16px 20px;
    background: rgba(220, 38, 38, 0.12);
    border: 1px solid #dc2626;
    border-radius: 12px;
    margin-bottom: 16px;
  }
  .wipe-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 42px; font-weight: 600;
    color: #dc2626;
    line-height: 1; letter-spacing: -1px;
  }
  .theme-night .wipe-count { color: #fca5a5; }
  .wipe-count-label { font-size: 14px; color: var(--text); font-weight: 600; }

  .toast {
    position: fixed; bottom: 30px; left: 50%;
    transform: translateX(-50%);
    padding: 12px 26px; border-radius: 100px;
    color: #fff; font-size: 14px; font-weight: 600;
    z-index: 2000;
    background: var(--accent);
    border: 1px solid var(--accent);
    white-space: nowrap;
    box-shadow: 0 12px 34px rgba(0,0,0,0.22), 0 0 28px var(--accent);
    animation: toastIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: 'Klee One', serif;
  }
  .theme-night .toast { color: #0a0d1a; }
  .toast.error { background: #dc2626; border-color: #dc2626; color: #fff; box-shadow: 0 12px 34px rgba(0,0,0,0.22), 0 0 28px rgba(220, 38, 38, 0.55); }
  @keyframes toastIn {
    from { transform: translateY(24px) translateX(-50%); opacity: 0; }
    to { transform: translateY(0) translateX(-50%); opacity: 1; }
  }

  .loading-screen {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    min-height: 100vh;
    position: relative; z-index: 2;
  }
  .spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }

  /* Mobile */
  @media (max-width: 600px) {
    .content-wrap { padding: 12px 8px 0; }
    .app-title { font-size: 24px; }
    .poster-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px; }
    .poster-card { border-radius: 10px ; }
    .poster-info-strip { padding: 8px 7px 7px; }
    .poster-title { font-size: 9px !important; -webkit-line-clamp: 2 !important; line-height: 1.2; }
    .poster-jp { display: none !important; }
    .poster-score { font-size: 13px !important; }
    .poster-meta-row { margin-top: 3px; }
    .poster-placeholder { font-size: 28px; }
    .poster-raters { display: none !important; }
    .fav-btn { width: 26px; height: 26px; font-size: 12px; }
    .ptw-badge { width: 24px; height: 24px; font-size: 10px; }
    .rank-badge { font-size: 9px; padding: 3px 6px; top: 5px; left: 5px; }
    .poster-badges { gap: 4px; top: 5px; right: 5px; }
    .tab-jp { display: none; }
    .tabs-row { gap: 2px; }
    .tab-btn { padding: 7px 10px; }
    .tab-label { font-size: 12px; }
    .hover-tooltip { display: none !important; }
  }
`;
