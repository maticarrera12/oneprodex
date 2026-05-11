// User Profile — sports identity card with stats, achievements, history.

const { Flag, Avatar, Card, Chip, T } = window;

function ScreenProfile({ go }) {
  const you = window.LEADERBOARD.find(r => r.isYou);

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* HEADER + IDENTITY */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '14px 20px 22px',
        background: `radial-gradient(120% 90% at 50% 0%, rgba(190,242,100,0.18) 0%, transparent 60%), ${T.bg}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <button onClick={() => go('home')} style={{
            all: 'unset', cursor: 'pointer',
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3l-5 5 5 5" stroke={T.text} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Profile</div>
          <button style={{
            all: 'unset', cursor: 'pointer',
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="2" stroke={T.text2} strokeWidth="1.6"/>
              <path d="M8 1.5v2M8 12.5v2M14.5 8h-2M3.5 8h-2M12.5 3.5l-1.4 1.4M4.9 11.1l-1.4 1.4M12.5 12.5l-1.4-1.4M4.9 4.9L3.5 3.5" stroke={T.text2} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Identity card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name="You" color={you.color} size={84} ring />
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              padding: '3px 8px', borderRadius: 9,
              background: T.lime, color: '#0A0A0C',
              fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
              boxShadow: `0 4px 12px rgba(190,242,100,0.4)`,
            }}>LV 12</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.font, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: -0.3 }}>Alex Mendes</div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.text3, marginTop: 2 }}>@you · Joined Jun 1</div>
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 9px', borderRadius: 999,
              background: T.limeBg, border: `1px solid ${T.limeBg2}`,
              fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, color: T.lime, letterSpacing: 0.4,
            }}>
              <Flag code="ARG" size={14} ring={false} /> ARGENTINA · CHAMPION PICK
            </div>
          </div>
        </div>

        {/* Hero stats row */}
        <div style={{
          marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
        }}>
          <HeroStat label="Points" value={you.pts} delta="+47" />
          <HeroStat label="Rank" value={`#${you.rank}`} sub="of 12" />
          <HeroStat label="Accuracy" value={`${you.acc}%`} delta="+4" />
          <HeroStat label="Streak" value={you.streak} fire />
        </div>
      </div>

      {/* LEVEL PROGRESS */}
      <div style={{ padding: '4px 20px 0' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>Level 12 · Pundit</div>
              <div style={{ fontFamily: T.font, fontSize: 14, color: T.text, marginTop: 3 }}>53 pts to Level 13 · Tactician</div>
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 12, color: T.lime, fontWeight: 600 }}>247 / 300</div>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '82%',
              background: `linear-gradient(90deg, ${T.limeDeep}, ${T.lime})`,
              borderRadius: 4,
              boxShadow: `0 0 12px ${T.lime}66`,
            }} />
          </div>
        </Card>
      </div>

      {/* ACCURACY BREAKDOWN */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          fontFamily: T.font, fontSize: 13, fontWeight: 600,
          color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 10,
        }}>Form · last 7 matches</div>
        <Card>
          {/* spark bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 14 }}>
            {[5, 2, 0, 5, 2, 5, 5].map((p, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', height: `${(p / 5) * 100}%`,
                  borderRadius: '4px 4px 1px 1px',
                  background: p === 5 ? `linear-gradient(180deg, ${T.lime}, ${T.limeDeep})`
                    : p === 2 ? 'rgba(255,255,255,0.18)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: p === 5 ? `0 0 8px ${T.lime}55` : 'none',
                  minHeight: 4,
                }} />
                <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3 }}>{p}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <SmallStat n="3" label="Exact" tone={T.lime} />
            <SmallStat n="2" label="Result only" tone={T.amber} />
            <SmallStat n="2" label="Missed" tone={T.text3} />
          </div>
        </Card>
      </div>

      {/* ACHIEVEMENTS */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10,
        }}>
          <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600,
            color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
          }}>Achievements</div>
          <div style={{ fontFamily: T.mono, fontSize: 12, color: T.text3 }}>4 / 12</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {window.ACHIEVEMENTS.map(a => <Achievement key={a.id} a={a} />)}
        </div>
      </div>

      {/* HISTORY */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          fontFamily: T.font, fontSize: 13, fontWeight: 600,
          color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 10,
        }}>Recent predictions</div>
        <Card padded={false}>
          {window.HISTORY.map((h, i) => <HistoryRow key={i} h={h} last={i === window.HISTORY.length - 1} />)}
        </Card>
      </div>
    </div>
  );
}

function HeroStat({ label, value, delta, sub, fire }) {
  return (
    <div style={{
      padding: '12px 10px', borderRadius: 14,
      background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}`,
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 600, color: T.text, lineHeight: 1, letterSpacing: -0.3 }}>{value}</div>
        {fire && <span style={{ fontSize: 12 }}><svg width="11" height="13" viewBox="0 0 11 13"><path d="M5.5 0c.6 1.8 2.5 2.6 2.5 5.5a2.6 2.6 0 0 1-5 0c0-.8.4-1.3.7-1.8C2 5 1 6.5 1 8a4.5 4.5 0 0 0 9 0c0-3.5-2.5-5.5-4.5-8Z" fill={T.amber}/></svg></span>}
      </div>
      {delta && <div style={{ fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, color: T.lime, marginTop: 2 }}>{delta}</div>}
      {sub && <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function SmallStat({ n, label, tone }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 600, color: tone, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, marginTop: 4, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function Achievement({ a }) {
  const tones = {
    lime:   { bg: T.limeBg,                       border: T.limeBg2,            ic: T.lime },
    amber:  { bg: 'rgba(251,191,36,0.10)',        border: 'rgba(251,191,36,0.22)', ic: T.amber },
    violet: { bg: 'rgba(167,139,250,0.10)',       border: 'rgba(167,139,250,0.22)', ic: T.violet },
    mute:   { bg: 'rgba(255,255,255,0.025)',      border: T.border,             ic: T.text4 },
  };
  const tn = tones[a.tone] || tones.mute;
  return (
    <div style={{
      padding: '12px 10px', borderRadius: 14, textAlign: 'center',
      background: tn.bg, border: `1px solid ${tn.border}`,
      opacity: a.got ? 1 : 0.6,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, margin: '0 auto 8px',
        background: a.got ? `linear-gradient(135deg, ${tn.ic}, ${shade(tn.ic, -30)})` : 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: a.got ? `0 0 12px ${tn.ic}40` : 'none',
      }}>
        {a.got ? (
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M4 9l3.5 3.5L14 5" stroke="#0A0A0C" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <rect x="2" y="6" width="10" height="8" rx="1.5" stroke={T.text3} strokeWidth="1.5"/>
            <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke={T.text3} strokeWidth="1.5" fill="none"/>
          </svg>
        )}
      </div>
      <div style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.text }}>{a.name}</div>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.text3, marginTop: 2, letterSpacing: 0.3 }}>{a.sub}</div>
    </div>
  );
}

function shade(hex, pct) {
  const m = hex.replace('#','').match(/.{2}/g);
  if (!m) return hex;
  const [r,g,b] = m.map(x => parseInt(x,16));
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + c * (pct/100))));
  return '#' + [f(r),f(g),f(b)].map(x => x.toString(16).padStart(2,'0')).join('');
}

function HistoryRow({ h, last }) {
  const tone = h.kind === 'exact' ? T.lime : h.kind === 'result' ? T.amber : T.text3;
  return (
    <div style={{
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <div style={{
        width: 4, height: 28, borderRadius: 2, background: tone,
        opacity: h.kind === 'miss' ? 0.4 : 1,
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: T.mono, fontSize: 13.5, fontWeight: 600, color: T.text, letterSpacing: -0.2 }}>{h.match}</div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, marginTop: 2 }}>
          You · {h.mine} · {h.kind === 'exact' ? 'Exact score' : h.kind === 'result' ? 'Result only' : 'Missed'}
        </div>
      </div>
      <div style={{
        fontFamily: T.mono, fontSize: 14, fontWeight: 600,
        color: h.pts > 0 ? T.lime : T.text3, letterSpacing: -0.2,
      }}>{h.pts > 0 ? '+' : ''}{h.pts}</div>
    </div>
  );
}

window.ScreenProfile = ScreenProfile;
