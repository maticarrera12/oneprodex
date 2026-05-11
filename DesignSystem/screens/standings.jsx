// Group Stage Standings — live updating table with qualification indicators.

const { Flag, LiveDot, Card, Chip, T } = window;

function ScreenStandings({ go }) {
  const [groupKey, setGroupKey] = React.useState('C');
  const groups = ['A','B','C','D','E','F','G','H'];
  const g = window.GROUP_C; // single group mocked; rendered for any selection

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
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Group Stage</div>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4 }}>Matchday 2 · 14 / 24 played</div>
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 5h10M3 8h10M3 11h6" stroke={T.text2} strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* GROUP SELECTOR */}
      <div style={{
        padding: '0 20px 16px', display: 'flex', gap: 8, overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {groups.map(k => (
          <button key={k} onClick={() => setGroupKey(k)} style={{
            all: 'unset', cursor: 'pointer',
            minWidth: 50, padding: '10px 0', borderRadius: 12,
            background: groupKey === k ? T.cardHi : 'transparent',
            border: `1px solid ${groupKey === k ? T.borderHi : 'transparent'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>Group</div>
            <div style={{
              fontFamily: T.font, fontSize: 18, fontWeight: 700,
              color: groupKey === k ? T.lime : T.text, marginTop: 2,
            }}>{k}</div>
          </button>
        ))}
      </div>

      {/* QUALIFICATION KEY */}
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: 14 }}>
        <KeyDot color={T.lime} label="Round of 16" />
        <KeyDot color={T.amber} label="Playoff" />
        <KeyDot color={T.text4} label="Eliminated" />
      </div>

      {/* TABLE */}
      <div style={{ padding: '0 20px' }}>
        <Card padded={false}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '24px 1fr repeat(6, 26px) 38px',
            gap: 6, padding: '12px 14px',
            fontFamily: T.mono, fontSize: 10, color: T.text3,
            letterSpacing: 0.5, textTransform: 'uppercase',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <div></div><div>Team</div>
            <div style={{ textAlign: 'center' }}>P</div>
            <div style={{ textAlign: 'center' }}>W</div>
            <div style={{ textAlign: 'center' }}>D</div>
            <div style={{ textAlign: 'center' }}>L</div>
            <div style={{ textAlign: 'center' }}>GD</div>
            <div style={{ textAlign: 'center', fontWeight: 600, color: T.text2 }}>Pts</div>
            <div style={{ textAlign: 'right' }}>Form</div>
          </div>
          {/* Rows */}
          {g.rows.map((r, i) => <StandingRow key={r.team} r={r} idx={i} />)}
        </Card>

        {/* Group fixtures */}
        <div style={{ marginTop: 22, marginBottom: 6,
          fontFamily: T.font, fontSize: 13, fontWeight: 600,
          color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
        }}>Group {groupKey} fixtures</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <FixtureRow home="ARG" away="AUS" hs={2} as={0} status="FT" />
          <FixtureRow home="MEX" away="CRO" hs={1} as={2} status="FT" />
          <FixtureRow home="ARG" away="MEX" hs={2} as={1} status="LIVE" minute={73} />
          <FixtureRow home="AUS" away="CRO" hs={null} as={null} status="UPCOMING" when="Tomorrow · 21:00" />
        </div>

        {/* Your group ranking — predictions */}
        <div style={{ marginTop: 22, padding: 14, borderRadius: 18,
          background: `linear-gradient(180deg, ${T.limeBg} 0%, transparent 100%)`,
          border: `1px solid ${T.limeBg2}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.lime, letterSpacing: 0.5, textTransform: 'uppercase' }}>You vs reality</div>
              <div style={{ fontFamily: T.font, fontSize: 17, fontWeight: 600, color: T.text, marginTop: 4 }}>3 of 4 group calls correct</div>
              <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.text2, marginTop: 4 }}>You picked CRO over MEX. +12 pts.</div>
            </div>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: `conic-gradient(${T.lime} 0% 75%, rgba(255,255,255,0.06) 75% 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 25, background: T.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: T.mono, fontSize: 16, fontWeight: 600, color: T.lime,
              }}>75%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandingRow({ r, idx }) {
  const tone = r.q === 'qual' ? T.lime : r.q === 'play' ? T.amber : T.text4;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 1fr repeat(6, 26px) 38px',
      gap: 6, padding: '12px 14px', alignItems: 'center',
      borderBottom: idx === 3 ? 'none' : `1px solid ${T.border}`,
      position: 'relative',
    }}>
      {/* qualification stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 6, bottom: 6, width: 3,
        borderRadius: '0 2px 2px 0', background: tone,
        opacity: r.q === 'out' ? 0.4 : 1,
      }} />
      <div style={{ fontFamily: T.mono, fontSize: 12, color: T.text3, paddingLeft: 4 }}>{idx + 1}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flag code={r.team} size={22} />
        <span style={{ fontFamily: T.font, fontSize: 13.5, fontWeight: 600, color: T.text }}>{r.team}</span>
      </div>
      <Cell>{r.P}</Cell><Cell>{r.W}</Cell><Cell>{r.D}</Cell><Cell>{r.L}</Cell>
      <Cell tone={r.GD > 0 ? T.lime : r.GD < 0 ? T.red : T.text}>{r.GD > 0 ? '+' : ''}{r.GD}</Cell>
      <div style={{
        textAlign: 'center', fontFamily: T.mono, fontSize: 14, fontWeight: 700,
        color: T.text,
      }}>{r.pts}</div>
      <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end' }}>
        {r.form.map((f, i) => (
          <span key={i} style={{
            width: 14, height: 14, borderRadius: 4,
            background: f === 'W' ? T.lime : f === 'D' ? T.text3 : T.red,
            opacity: f === 'D' ? 0.6 : 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.mono, fontSize: 8, fontWeight: 700,
            color: '#0A0A0C',
          }}>{f}</span>
        ))}
      </div>
    </div>
  );
}

function Cell({ children, tone }) {
  return (
    <div style={{
      textAlign: 'center', fontFamily: T.mono, fontSize: 13, fontWeight: 500,
      color: tone || T.text2,
    }}>{children}</div>
  );
}

function FixtureRow({ home, away, hs, as, status, minute, when }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 14,
      background: T.card, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 50, fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.4 }}>
        {status === 'LIVE' && <span style={{ color: T.lime, display: 'inline-flex', alignItems: 'center', gap: 4 }}><LiveDot size={4}/>{minute}'</span>}
        {status === 'FT' && 'FT'}
        {status === 'UPCOMING' && when}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Flag code={home} size={22} />
        <span style={{ fontFamily: T.font, fontSize: 13.5, fontWeight: 600, color: T.text, flex: 1 }}>{home}</span>
        <div style={{
          fontFamily: T.mono, fontSize: 14, fontWeight: 600,
          color: status === 'UPCOMING' ? T.text3 : T.text,
          minWidth: 56, textAlign: 'center', letterSpacing: -0.2, whiteSpace: 'nowrap',
        }}>{status === 'UPCOMING' ? 'vs' : `${hs} – ${as}`}</div>
        <span style={{ fontFamily: T.font, fontSize: 13.5, fontWeight: 600, color: T.text, flex: 1, textAlign: 'right' }}>{away}</span>
        <Flag code={away} size={22} />
      </div>
    </div>
  );
}

function KeyDot({ color, label }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, boxShadow: color === T.lime ? `0 0 6px ${T.lime}88` : 'none' }} />
      <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

window.ScreenStandings = ScreenStandings;
