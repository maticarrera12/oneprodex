// Group Leaderboard — realtime ranking with movement.

const { Flag, LiveDot, Avatar, Card, SectionHead, Chip, Trend, T } = window;

function ScreenLeaderboard({ go }) {
  const [tab, setTab] = React.useState('week');
  const [pulse, setPulse] = React.useState(null);
  const data = window.LEADERBOARD;
  const you = data.find(r => r.isYou);

  // Simulate a live rank-change pulse every 6s on a random non-you row
  React.useEffect(() => {
    const t = setInterval(() => {
      const candidates = data.filter(r => !r.isYou && r.delta);
      const r = candidates[Math.floor(Math.random() * candidates.length)];
      if (r) {
        setPulse(r.handle);
        setTimeout(() => setPulse(null), 1800);
      }
    }, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* HEADER */}
      <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => go('home')} style={{
          all: 'unset', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3l-5 5 5 5" stroke={T.text} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Les Cracks</div>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4 }}>12 friends · live</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke={T.text2} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* HERO PODIUM */}
      <div style={{
        margin: '8px 20px 18px', position: 'relative',
        padding: '20px 16px 18px', borderRadius: 22,
        background: `radial-gradient(120% 100% at 50% 0%, rgba(190,242,100,0.12), transparent 60%), ${T.cardHi}`,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: 10.5, color: T.lime, letterSpacing: 0.6,
          textTransform: 'uppercase', textAlign: 'center', display: 'inline-flex',
          gap: 6, alignItems: 'center', justifyContent: 'center', width: '100%',
        }}>
          <LiveDot size={5} /> Updating live
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr',
          alignItems: 'end', gap: 10, marginTop: 14,
        }}>
          <Podium r={data[1]} pos={2} h={84} />
          <Podium r={data[0]} pos={1} h={108} />
          <Podium r={data[2]} pos={3} h={70} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 8 }}>
        <Chip active={tab==='week'} onClick={()=>setTab('week')}>This week</Chip>
        <Chip active={tab==='all'} onClick={()=>setTab('all')}>Tournament</Chip>
        <Chip active={tab==='groups'} onClick={()=>setTab('groups')}>Group stage</Chip>
        <Chip active={tab==='ko'} onClick={()=>setTab('ko')}>Knockout</Chip>
      </div>

      {/* RANK LIST */}
      <div style={{ padding: '0 20px' }}>
        <Card padded={false}>
          <div>
            {data.map((r, i) => (
              <RankRow key={r.handle} r={r} pulse={pulse === r.handle} isLast={i === data.length - 1} />
            ))}
          </div>
        </Card>
      </div>

      {/* YOUR RANK PINNED FOOTER */}
      <div style={{
        position: 'sticky', bottom: 92, marginTop: 16, padding: '0 20px',
        zIndex: 5, pointerEvents: 'none',
      }}>
        <div style={{
          padding: '12px 14px', borderRadius: 16,
          background: 'rgba(20,20,24,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: `1px solid ${T.borderHi}`,
          boxShadow: `0 12px 32px rgba(0,0,0,0.5)`,
          display: 'flex', alignItems: 'center', gap: 12,
          pointerEvents: 'auto',
        }}>
          <div style={{
            fontFamily: T.mono, fontSize: 11, color: T.text3,
            letterSpacing: 0.4, width: 22,
          }}>#{you.rank}</div>
          <Avatar name="You" color={you.color} size={32} ring />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.text }}>You</div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3 }}>{you.acc}% acc · 🔥{you.streak}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.mono, fontSize: 17, fontWeight: 600, color: T.lime, lineHeight: 1 }}>{you.pts}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, marginTop: 2 }}>pts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Podium block ──────────────────────────────────────────────────
function Podium({ r, pos, h }) {
  const colors = { 1: T.lime, 2: '#E5E7EB', 3: '#D69E2E' };
  const isFirst = pos === 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <Avatar name={r.name} color={r.color} size={isFirst ? 56 : 44} ring={isFirst} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: T.font, fontSize: isFirst ? 14 : 12.5, fontWeight: 600, color: T.text }}>{r.name}</div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, marginTop: 1 }}>{r.pts} pts</div>
      </div>
      <div style={{
        width: '100%', height: h, borderRadius: '12px 12px 4px 4px',
        background: isFirst
          ? `linear-gradient(180deg, ${T.limeBg2}, rgba(190,242,100,0.04))`
          : `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))`,
        border: `1px solid ${isFirst ? T.limeBg2 : T.border}`,
        display: 'flex', justifyContent: 'center', paddingTop: 12,
        position: 'relative',
      }}>
        <div style={{
          fontFamily: T.mono, fontSize: isFirst ? 36 : 26, fontWeight: 700,
          color: isFirst ? T.lime : T.text2, lineHeight: 1, letterSpacing: -1,
        }}>{pos}</div>
        {isFirst && (
          <div style={{
            position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
            padding: '3px 8px', borderRadius: 6,
            background: T.lime, color: '#0A0A0C',
            fontFamily: T.mono, fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
          }}>LEADER</div>
        )}
      </div>
    </div>
  );
}

// ─── Rank row ──────────────────────────────────────────────────────
function RankRow({ r, pulse, isLast }) {
  return (
    <div style={{
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
      background: r.isYou ? T.limeBg : 'transparent',
      position: 'relative',
      transition: 'background .4s ease',
    }}>
      {pulse && (
        <div style={{
          position: 'absolute', inset: 0, background: T.limeBg,
          animation: 'flashRow 1.6s ease-out',
        }} />
      )}
      <div style={{
        fontFamily: T.mono, fontSize: 13, fontWeight: 600,
        color: r.rank <= 3 ? T.lime : T.text3,
        width: 22, textAlign: 'center', position: 'relative',
      }}>{r.rank}</div>
      <Avatar name={r.name} color={r.color} size={36} ring={r.isYou} />
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: T.font, fontSize: 14.5, fontWeight: 600, color: T.text }}>{r.name}</span>
          {r.streak >= 3 && <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 2,
            fontFamily: T.mono, fontSize: 10.5, fontWeight: 600, color: T.amber,
          }}>
            <svg width="9" height="11" viewBox="0 0 9 11"><path d="M4.5 0c.5 1.5 2 2.2 2 4.5a2.2 2.2 0 0 1-4.5 0c0-.7.4-1.1.7-1.5C1.4 3.8.5 5.2.5 6.7a4 4 0 0 0 8 0C8.5 3.7 6.5 2 4.5 0Z" fill={T.amber}/></svg>
            {r.streak}
          </span>}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, marginTop: 1 }}>
          {r.acc}% acc · {r.handle}
        </div>
      </div>
      <Trend delta={r.delta} />
      <div style={{ minWidth: 44, textAlign: 'right' }}>
        <div style={{
          fontFamily: T.mono, fontSize: 16, fontWeight: 600,
          color: r.rank === 1 ? T.lime : T.text, lineHeight: 1,
          letterSpacing: -0.3,
        }}>{r.pts}</div>
        <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.text3, marginTop: 2, letterSpacing: 0.4 }}>PTS</div>
      </div>
    </div>
  );
}

window.ScreenLeaderboard = ScreenLeaderboard;
