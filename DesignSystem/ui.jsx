// Shared UI primitives for World Cup prediction app
// Tokens: deep zinc surfaces, lime accent, mono numerals.

const T = {
  bg:        '#08080A',
  bg2:       '#0E0E11',
  card:      '#131317',
  cardHi:    '#1A1A20',
  border:    'rgba(255,255,255,0.06)',
  borderHi:  'rgba(255,255,255,0.10)',
  text:      '#F5F5F7',
  text2:     'rgba(245,245,247,0.62)',
  text3:     'rgba(245,245,247,0.38)',
  text4:     'rgba(245,245,247,0.22)',
  lime:      '#BEF264',  // shadcn lime-300/400
  limeHi:    '#D9F99D',
  limeMid:   '#A3E635',
  limeDeep:  '#65A30D',
  limeBg:    'rgba(190,242,100,0.10)',
  limeBg2:   'rgba(190,242,100,0.18)',
  red:       '#F87171',
  amber:     '#FBBF24',
  blue:      '#60A5FA',
  violet:    '#A78BFA',
  pink:      '#F472B6',
  font:      '"Geist", -apple-system, system-ui, sans-serif',
  mono:      '"Geist Mono", ui-monospace, "SF Mono", monospace',
};
window.T = T;

// ─── Flag — abstract circular pill rendered from team colors ───────────
function Flag({ code, size = 36, ring = true }) {
  const t = window.TEAMS[code];
  if (!t) {
    return <div style={{ width: size, height: size, borderRadius: size/2, background: '#222' }} />;
  }
  // Render as 3-stripe vertical OR horizontal — varies per team for variety
  const horiz = ['ARG','GER','NED','HUN','RUS','MEX','ITA','CRO','POR','BRA','BEL','MAR','POL','DEN','SUI'].includes(code);
  const stripes = horiz
    ? `linear-gradient(180deg, ${t.c1} 0%, ${t.c1} 33%, ${t.c2} 33%, ${t.c2} 66%, ${t.c3} 66%, ${t.c3} 100%)`
    : `linear-gradient(90deg,  ${t.c1} 0%, ${t.c1} 33%, ${t.c2} 33%, ${t.c2} 66%, ${t.c3} 66%, ${t.c3} 100%)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: stripes, position: 'relative',
      boxShadow: ring ? `inset 0 0 0 1px rgba(255,255,255,0.12), 0 1px 2px rgba(0,0,0,0.4)` : 'none',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: size/2,
        background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.18), transparent 55%)',
      }} />
    </div>
  );
}

// ─── Live pulse dot ─────────────────────────────────────────────────
function LiveDot({ size = 6, color = T.lime }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, animation: 'pulseRing 1.6s ease-out infinite',
      }} />
      <span style={{
        position: 'relative', width: size, height: size, borderRadius: '50%',
        background: color, boxShadow: `0 0 8px ${color}`,
      }} />
    </span>
  );
}

// ─── Live badge ────────────────────────────────────────────────────
function LiveBadge({ minute }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px 3px 7px', borderRadius: 999,
      background: T.limeBg, border: `1px solid ${T.limeBg2}`,
      fontFamily: T.mono, fontSize: 10.5, fontWeight: 600,
      color: T.lime, letterSpacing: 0.4,
    }}>
      <LiveDot size={5} />
      <span>LIVE · {minute}'</span>
    </div>
  );
}

// ─── Avatar — initial chip ─────────────────────────────────────────
function Avatar({ name, color, size = 36, ring = false }) {
  const init = name === 'You' ? 'Y' : (name?.[0] ?? '?').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: size/2,
      background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -25)} 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.font, fontWeight: 600, fontSize: size * 0.4,
      color: '#0A0A0C', flexShrink: 0,
      boxShadow: ring
        ? `0 0 0 2px ${T.bg}, 0 0 0 3.5px ${T.lime}, 0 6px 16px rgba(190,242,100,0.25)`
        : `inset 0 0 0 1px rgba(255,255,255,0.08)`,
    }}>{init}</div>
  );
}

// helper: simple hex shade
function shade(hex, pct) {
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(x => parseInt(x,16));
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + c * (pct/100))));
  return '#' + [f(r),f(g),f(b)].map(x => x.toString(16).padStart(2,'0')).join('');
}

// ─── Card ──────────────────────────────────────────────────────────
function Card({ children, style, onClick, padded = true, hi = false }) {
  return (
    <div onClick={onClick} style={{
      background: hi ? T.cardHi : T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      padding: padded ? 16 : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}>{children}</div>
  );
}

// ─── Section heading ───────────────────────────────────────────────
function SectionHead({ title, action, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '0 20px', marginBottom: 12,
    }}>
      <div style={{
        fontFamily: T.font, fontSize: 13, fontWeight: 600,
        color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{
          all: 'unset', cursor: 'pointer',
          fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.lime,
        }}>{action}</button>
      )}
    </div>
  );
}

// ─── Lime button ───────────────────────────────────────────────────
function LimeButton({ children, onClick, size = 'md', ghost = false, full = false, glow = false }) {
  const sizes = {
    sm: { h: 34, fs: 13, px: 14, r: 10 },
    md: { h: 44, fs: 15, px: 18, r: 12 },
    lg: { h: 52, fs: 16, px: 22, r: 14 },
  };
  const s = sizes[size];
  return (
    <button onClick={onClick} style={{
      all: 'unset', boxSizing: 'border-box',
      height: s.h, padding: `0 ${s.px}px`, borderRadius: s.r,
      width: full ? '100%' : 'auto',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontFamily: T.font, fontSize: s.fs, fontWeight: 600,
      cursor: 'pointer', userSelect: 'none',
      background: ghost ? 'rgba(255,255,255,0.05)' : T.lime,
      color: ghost ? T.text : '#0A0A0C',
      border: ghost ? `1px solid ${T.borderHi}` : 'none',
      boxShadow: glow && !ghost
        ? `0 0 0 1px rgba(190,242,100,0.5), 0 8px 24px rgba(190,242,100,0.25), inset 0 1px 0 rgba(255,255,255,0.3)`
        : ghost ? 'none' : `inset 0 1px 0 rgba(255,255,255,0.25)`,
      transition: 'transform .12s ease, background .15s ease',
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >{children}</button>
  );
}

// ─── Chip / Tab ────────────────────────────────────────────────────
function Chip({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer',
      padding: '7px 12px', borderRadius: 999,
      fontFamily: T.font, fontSize: 13, fontWeight: 500,
      color: active ? '#0A0A0C' : T.text2,
      background: active ? T.lime : 'rgba(255,255,255,0.04)',
      border: `1px solid ${active ? 'transparent' : T.border}`,
      whiteSpace: 'nowrap',
      transition: 'all .15s ease',
    }}>{children}</button>
  );
}

// ─── Bottom-nav icon glyphs ────────────────────────────────────────
const NavIcons = {
  home:  (c) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 9.5L11 3l8 6.5V18a1.5 1.5 0 0 1-1.5 1.5H14V14h-6v5.5H4.5A1.5 1.5 0 0 1 3 18V9.5Z" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/></svg>,
  matches: (c) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="7.5" stroke={c} strokeWidth="1.6"/><path d="M11 6.5l2.5 1.8-1 3h-3l-1-3L11 6.5Z" stroke={c} strokeWidth="1.4" strokeLinejoin="round"/></svg>,
  group: (c) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="8" cy="9" r="3" stroke={c} strokeWidth="1.6"/><circle cx="15" cy="9" r="2.4" stroke={c} strokeWidth="1.6"/><path d="M3 18.5c0-2.5 2.2-4 5-4s5 1.5 5 4M13 18.5c0-1.8 1.5-3 3.5-3s3.5 1.2 3.5 3" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
  bracket: (c) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 5h4l2 3v6l-2 3H3M19 5h-4l-2 3v6l2 3h4M9 11h4" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  profile: (c) => <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke={c} strokeWidth="1.6"/><path d="M4 19c0-3.5 3-6 7-6s7 2.5 7 6" stroke={c} strokeWidth="1.6" strokeLinecap="round"/></svg>,
};

// ─── Trend arrow ───────────────────────────────────────────────────
function Trend({ delta }) {
  if (!delta) {
    return <span style={{ width: 12, height: 12, display: 'inline-block', borderRadius: 1, background: T.text4, marginLeft: 0, alignSelf: 'center' }}>
      <span style={{ display: 'block', width: 10, height: 1.5, background: T.text3, margin: '5px 1px' }}/></span>;
  }
  const up = delta > 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontFamily: T.mono, fontSize: 11, fontWeight: 600,
      color: up ? T.lime : T.red,
    }}>
      <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: up ? 'none' : 'rotate(180deg)' }}>
        <path d="M4.5 1L8 6H1L4.5 1Z" fill="currentColor"/>
      </svg>
      {Math.abs(delta)}
    </span>
  );
}

Object.assign(window, { T, Flag, LiveDot, LiveBadge, Avatar, Card, SectionHead, LimeButton, Chip, NavIcons, Trend, shade });
