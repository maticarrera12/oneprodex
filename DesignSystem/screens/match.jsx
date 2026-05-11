// Match Prediction Screen — pick a score with premium tactile dial.

const { Flag, LiveDot, LiveBadge, Avatar, Card, LimeButton, Chip, T } = window;

function ScreenMatch({ matchId, go }) {
  const m = window.MATCHES.find(x => x.id === matchId) || window.MATCHES[3]; // ENG-NED default
  const home = window.TEAMS[m.home];
  const away = window.TEAMS[m.away];

  const [hs, setHs] = React.useState(m.pred?.hs ?? 1);
  const [as, setAs] = React.useState(m.pred?.as ?? 0);
  const [scorerHome, setScorerHome] = React.useState('Bellingham');
  const [confidence, setConfidence] = React.useState(70);
  const [submitted, setSubmitted] = React.useState(!!m.pred?.locked);

  const isLive = m.status === 'LIVE';
  const isFT = m.status === 'FT';
  const isUpcoming = m.status === 'UPCOMING';

  // Group prediction distribution
  const dist = [
    { label: 'Home win', pct: 42, fav: hs > as },
    { label: 'Draw',     pct: 28, fav: hs === as },
    { label: 'Away win', pct: 30, fav: as > hs },
  ];

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* HEADER w/ team gradient */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '12px 20px 22px',
        background: `linear-gradient(180deg, ${home.c1}33 0%, transparent 60%), linear-gradient(180deg, transparent 40%, ${away.c1}33 100%), ${T.bg}`,
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button onClick={() => go('home')} style={{
            all: 'unset', cursor: 'pointer',
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(12px)',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3l-5 5 5 5" stroke={T.text} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.6, textTransform: 'uppercase' }}>{m.stage}</div>
            <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.text2, marginTop: 2 }}>{m.venue}</div>
          </div>
          <button style={{
            all: 'unset', cursor: 'pointer',
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 6l5-3 5 3v6l-5 3-5-3V6Z" stroke={T.text} strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Match status pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          {isLive && <LiveBadge minute={m.minute} />}
          {isUpcoming && (
            <div style={{
              padding: '5px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
              fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.text, letterSpacing: 0.4,
            }}>{m.kickoff.toUpperCase()}</div>
          )}
          {isFT && (
            <div style={{
              padding: '5px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`,
              fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.text2, letterSpacing: 0.4,
            }}>FULL TIME</div>
          )}
        </div>

        {/* Big team confrontation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Flag code={m.home} size={62} />
            <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>{home.name}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4 }}>FIFA · 1</div>
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.text3,
            letterSpacing: 1, padding: '0 6px',
          }}>VS</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Flag code={m.away} size={62} />
            <div style={{ fontFamily: T.font, fontSize: 16, fontWeight: 600, color: T.text }}>{away.name}</div>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.4 }}>FIFA · 6</div>
          </div>
        </div>

        {/* Live score (if live) */}
        {(isLive || isFT) && (
          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center', gap: 22 }}>
            <Score n={m.hs} hot />
            <div style={{ fontFamily: T.mono, fontSize: 38, color: T.text4, lineHeight: 1, alignSelf: 'center' }}>·</div>
            <Score n={m.as} hot />
          </div>
        )}
      </div>

      {/* TABS */}
      <div style={{ padding: '4px 20px 16px', display: 'flex', gap: 8 }}>
        <Chip active>Predict</Chip>
        <Chip>Lineups</Chip>
        <Chip>H2H</Chip>
        <Chip>Group</Chip>
      </div>

      {/* SCORE PICKER CARD */}
      <div style={{ padding: '0 20px' }}>
        <Card padded={false}>
          <div style={{ padding: '16px 16px 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                Your prediction
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                fontFamily: T.mono, fontSize: 11, color: submitted ? T.lime : T.amber, letterSpacing: 0.4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: submitted ? T.lime : T.amber }} />
                {submitted ? 'LOCKED' : 'OPEN · 4h 12m'}
              </div>
            </div>
          </div>

          {/* Score steppers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center', gap: 8, padding: '8px 16px 18px',
          }}>
            <Stepper code={m.home} value={hs} setValue={setHs} disabled={submitted} />
            <div style={{
              fontFamily: T.mono, fontSize: 28, fontWeight: 600, color: T.text3, padding: '0 4px',
            }}>·</div>
            <Stepper code={m.away} value={as} setValue={setAs} disabled={submitted} />
          </div>

          {/* Quick chips */}
          <div style={{ padding: '0 12px 14px', display: 'flex', gap: 6, overflowX: 'auto' }}>
            {[
              [1,0],[2,1],[2,0],[1,1],[0,0],[0,1],[1,2],[3,1],
            ].map(([a,b]) => {
              const sel = hs===a && as===b;
              return (
                <button key={`${a}-${b}`} onClick={() => { if(!submitted){ setHs(a); setAs(b); }}} style={{
                  all: 'unset', cursor: submitted ? 'default' : 'pointer',
                  padding: '7px 11px', borderRadius: 9,
                  fontFamily: T.mono, fontSize: 12.5, fontWeight: 600,
                  background: sel ? T.limeBg : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sel ? T.limeBg2 : T.border}`,
                  color: sel ? T.lime : T.text2, whiteSpace: 'nowrap',
                }}>{a}–{b}</button>
              );
            })}
          </div>

          {/* Confidence slider */}
          <div style={{
            padding: '14px 16px', borderTop: `1px solid ${T.border}`,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2 }}>Confidence boost</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.lime }}>×{(1 + confidence/100).toFixed(1)}</div>
            </div>
            <ConfSlider value={confidence} setValue={setConfidence} disabled={submitted} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.4 }}>
              <span>SAFE</span><span>RISK ALL</span>
            </div>
          </div>

          {/* First scorer (compact) */}
          <div style={{
            padding: '14px 16px', borderTop: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, letterSpacing: 0.6, textTransform: 'uppercase' }}>First scorer · +3 pts</div>
              <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.text, marginTop: 2 }}>{scorerHome}</div>
            </div>
            <button style={{
              all: 'unset', cursor: 'pointer',
              padding: '7px 11px', borderRadius: 9,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              fontFamily: T.font, fontSize: 12.5, fontWeight: 500, color: T.text2,
            }}>Change</button>
          </div>
        </Card>

        {/* Submit / locked button */}
        <div style={{ marginTop: 14 }}>
          {!submitted ? (
            <LimeButton size="lg" full glow onClick={() => setSubmitted(true)}>
              Lock prediction · {hs}–{as}
            </LimeButton>
          ) : (
            <div style={{
              height: 52, borderRadius: 14,
              background: T.limeBg, border: `1px solid ${T.limeBg2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.lime,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M3 8.5L7 12l6-7" stroke={T.lime} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Locked · {hs}–{as} · ×{(1 + confidence/100).toFixed(1)}
            </div>
          )}
        </div>

        {/* Group consensus */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: T.font, fontSize: 13, fontWeight: 600,
            color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5,
            marginBottom: 10,
          }}>Les Cracks · 8 of 12 picked</div>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {dist.map(d => (
                <div key={d.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontFamily: T.font, fontSize: 13, color: d.fav ? T.lime : T.text2, fontWeight: d.fav ? 600 : 500 }}>{d.label}</div>
                    <div style={{ fontFamily: T.mono, fontSize: 12, color: d.fav ? T.lime : T.text2 }}>{d.pct}%</div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${d.pct}%`,
                      background: d.fav ? T.lime : 'rgba(255,255,255,0.18)',
                      borderRadius: 3,
                      boxShadow: d.fav ? `0 0 12px ${T.lime}66` : 'none',
                    }} />
                  </div>
                </div>
              ))}
            </div>
            {/* avatar pile */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex' }}>
                {window.LEADERBOARD.slice(0, 5).map((u, i) => (
                  <div key={u.handle} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                    <Avatar name={u.name} color={u.color} size={26} />
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.text2 }}>+ 3 more predicting…</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Score stepper ─────────────────────────────────────────────────
function Stepper({ code, value, setValue, disabled }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <button onClick={() => !disabled && setValue(Math.min(9, value + 1))} style={{
        all: 'unset', cursor: disabled ? 'default' : 'pointer',
        width: 36, height: 26, borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}>
        <svg width="11" height="7" viewBox="0 0 11 7"><path d="M1 6l4.5-5L10 6" stroke={T.text2} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      <div style={{
        position: 'relative',
        fontFamily: T.mono, fontSize: 64, fontWeight: 600, color: T.text,
        letterSpacing: -2, lineHeight: 1, minWidth: 64, textAlign: 'center',
        textShadow: `0 0 24px rgba(190,242,100,0.18)`,
      }}>
        {value}
      </div>
      <button onClick={() => !disabled && setValue(Math.max(0, value - 1))} style={{
        all: 'unset', cursor: disabled ? 'default' : 'pointer',
        width: 36, height: 26, borderRadius: 8,
        background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}>
        <svg width="11" height="7" viewBox="0 0 11 7" style={{ transform: 'rotate(180deg)' }}><path d="M1 6l4.5-5L10 6" stroke={T.text2} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

// ─── Confidence slider ─────────────────────────────────────────────
function ConfSlider({ value, setValue, disabled }) {
  const ref = React.useRef(null);
  const move = (clientX) => {
    const r = ref.current.getBoundingClientRect();
    const v = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    setValue(Math.round(v));
  };
  const start = (e) => {
    if (disabled) return;
    e.preventDefault();
    const onMove = (ev) => move(ev.touches ? ev.touches[0].clientX : ev.clientX);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    onMove(e);
  };
  return (
    <div ref={ref} onMouseDown={start} onTouchStart={start} style={{
      position: 'relative', height: 28, cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3,
        background: 'rgba(255,255,255,0.06)',
      }} />
      <div style={{
        position: 'absolute', left: 0, height: 6, borderRadius: 3,
        width: `${value}%`,
        background: `linear-gradient(90deg, ${T.limeDeep} 0%, ${T.lime} 100%)`,
        boxShadow: `0 0 14px ${T.lime}55`,
      }} />
      <div style={{
        position: 'absolute', left: `calc(${value}% - 12px)`,
        width: 24, height: 24, borderRadius: 12,
        background: T.text,
        boxShadow: `0 0 0 4px rgba(190,242,100,0.25), 0 4px 12px rgba(0,0,0,0.4)`,
      }} />
    </div>
  );
}

// ─── Big score number ──────────────────────────────────────────────
function Score({ n, hot }) {
  return (
    <div style={{
      fontFamily: T.mono, fontSize: 56, fontWeight: 600, color: T.text,
      letterSpacing: -1.5, lineHeight: 1,
      textShadow: hot ? `0 0 24px rgba(190,242,100,0.25)` : 'none',
    }}>{n}</div>
  );
}

window.ScreenMatch = ScreenMatch;
