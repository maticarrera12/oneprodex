// Knockout Bracket — premium horizontal scroll visualization.

const { Flag, Card, Chip, T } = window;

function ScreenBracket({ go }) {
  const r16 = window.BRACKET_R16;
  const qf  = window.BRACKET_QF;
  const sf  = [
    { id: 'sf-1', a: '???', b: '???', sa: null, sb: null, done: false, kickoff: 'Tue' },
    { id: 'sf-2', a: '???', b: '???', sa: null, sb: null, done: false, kickoff: 'Wed' },
  ];
  const fin = [{ id: 'fin', a: '???', b: '???', sa: null, sb: null, done: false, kickoff: 'Jul 19' }];

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
          <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>Knockout</div>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4 }}>Round of 16 · live</div>
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          width: 38, height: 38, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" stroke={T.text2} strokeWidth="1.6" fill="none"/><path d="M8 5v3l2 1" stroke={T.text2} strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* TABS */}
      <div style={{ padding: '0 20px 8px', display: 'flex', gap: 8 }}>
        <Chip active>My picks</Chip>
        <Chip>Actual</Chip>
        <Chip>Compare</Chip>
      </div>

      {/* TROPHY ARC */}
      <div style={{
        margin: '12px 20px 18px', padding: '14px 16px',
        borderRadius: 18, background: T.cardHi, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -30, top: -30, width: 140, height: 140,
          borderRadius: '50%', background: T.lime, filter: 'blur(60px)', opacity: 0.12,
        }} />
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `linear-gradient(135deg, ${T.lime}, ${T.limeDeep})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M6 4h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V4Z" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M6 4H4v2a3 3 0 0 0 2 3M18 4h2v2a3 3 0 0 1-2 3" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M9 11v3l-1 4h8l-1-4v-3" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.lime, letterSpacing: 0.5, textTransform: 'uppercase' }}>Your champion pick</div>
          <div style={{ fontFamily: T.font, fontSize: 18, fontWeight: 700, color: T.text, marginTop: 3 }}>Argentina</div>
          <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.text2, marginTop: 2 }}>Worth +50 pts if they lift the trophy</div>
        </div>
        <Flag code="ARG" size={44} />
      </div>

      {/* ROUND TABS / SCROLLABLE */}
      <div style={{ padding: '0 0 0 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 14, paddingRight: 20, alignItems: 'stretch' }}>
          <Round title="Round of 16" matches={r16} compact wide />
          <Round title="Quarter-finals" matches={qf} />
          <Round title="Semi-finals" matches={sf} short />
          <Round title="Final" matches={fin} short final />
        </div>
      </div>

      {/* MY PATH */}
      <div style={{ padding: '24px 20px 0' }}>
        <div style={{
          fontFamily: T.font, fontSize: 13, fontWeight: 600,
          color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
          marginBottom: 10,
        }}>Your bracket score</div>
        <Card>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            <BracketStat label="R16" got="5/8" pts="+25" hot />
            <BracketStat label="QF" got="2/2" pts="+20" hot />
            <BracketStat label="SF" got="1/0" pts="—" />
            <BracketStat label="Final" got="0/0" pts="—" />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Round column ──────────────────────────────────────────────────
function Round({ title, matches, compact, short, wide, final }) {
  const w = wide ? 220 : final ? 220 : 200;
  return (
    <div style={{ flex: '0 0 auto', width: w, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        fontFamily: T.mono, fontSize: 10, color: T.text3,
        letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10,
        padding: '0 4px',
      }}>{title}</div>
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
        flex: 1, gap: short ? 36 : compact ? 12 : 28,
      }}>
        {matches.map(m => <BracketMatch key={m.id} m={m} final={final} />)}
      </div>
    </div>
  );
}

// ─── Bracket match card ────────────────────────────────────────────
function BracketMatch({ m, final }) {
  const aWon = m.done && (m.sa > m.sb || (m.pen && m.sap > m.sbp));
  const bWon = m.done && (m.sb > m.sa || (m.pen && m.sbp > m.sap));
  const empty = m.a === '???';
  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      background: final ? `linear-gradient(180deg, ${T.limeBg}, ${T.card})` : T.card,
      border: `1px solid ${final ? T.limeBg2 : T.border}`,
      boxShadow: final ? `0 0 0 1px ${T.limeBg2}, 0 12px 30px rgba(190,242,100,0.12)` : 'none',
    }}>
      {/* status pill */}
      <div style={{
        padding: '7px 12px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: T.mono, fontSize: 9.5, color: T.text3,
        letterSpacing: 0.5, textTransform: 'uppercase',
      }}>
        <span>{m.done ? 'FT' : (m.kickoff || 'TBD')}</span>
        {m.pen && <span style={{ color: T.amber }}>PEN</span>}
        {!m.done && !empty && <span style={{ color: T.lime }}>○ open</span>}
      </div>
      <BracketTeam code={m.a} score={m.sa} pen={m.sap} won={aWon} dimmed={bWon || empty} />
      <div style={{ height: 1, background: T.border }} />
      <BracketTeam code={m.b} score={m.sb} pen={m.sbp} won={bWon} dimmed={aWon || empty} />
    </div>
  );
}

function BracketTeam({ code, score, pen, won, dimmed }) {
  const empty = code === '???';
  return (
    <div style={{
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
      opacity: dimmed && !empty ? 0.45 : 1,
      background: won ? T.limeBg : 'transparent',
      transition: 'background .2s ease',
    }}>
      {empty ? (
        <div style={{ width: 22, height: 22, borderRadius: 11, border: `1.5px dashed ${T.border}` }} />
      ) : (
        <Flag code={code} size={22} />
      )}
      <span style={{
        flex: 1, fontFamily: T.font, fontSize: 13.5, fontWeight: 600,
        color: empty ? T.text3 : (won ? T.lime : T.text),
      }}>{empty ? 'TBD' : code}</span>
      {score !== null && score !== undefined ? (
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontFamily: T.mono, fontSize: 16, fontWeight: 600,
            color: won ? T.lime : T.text, letterSpacing: -0.3,
          }}>{score}</span>
          {pen != null && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.amber }}>({pen})</span>}
        </div>
      ) : (
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text4 }}>—</span>
      )}
    </div>
  );
}

function BracketStat({ label, got, pts, hot }) {
  return (
    <div style={{
      padding: '10px 4px', textAlign: 'center', borderRadius: 10,
      background: hot ? T.limeBg : 'rgba(255,255,255,0.025)',
      border: `1px solid ${hot ? T.limeBg2 : T.border}`,
    }}>
      <div style={{ fontFamily: T.mono, fontSize: 9.5, color: hot ? T.lime : T.text3, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 600, color: T.text, marginTop: 4, letterSpacing: -0.3 }}>{got}</div>
      <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: hot ? T.lime : T.text3, marginTop: 2 }}>{pts}</div>
    </div>
  );
}

window.ScreenBracket = ScreenBracket;
