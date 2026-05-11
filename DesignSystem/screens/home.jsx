// Home Dashboard — live matches, ranking snapshot, group activity, upcoming, prediction nudge.

const { Flag, LiveDot, LiveBadge, Avatar, Card, SectionHead, LimeButton, Chip, Trend, T } = window;

function ScreenHome({ go }) {
  const live = window.MATCHES.filter(m => m.status === 'LIVE');
  const upcoming = window.MATCHES.filter(m => m.status === 'UPCOMING').slice(0, 3);
  const top3 = window.LEADERBOARD.slice(0, 3);
  const you = window.LEADERBOARD.find(r => r.isYou);
  const matchday = 'Matchday 8 · Group Stage';

  return (
    <div style={{ paddingBottom: 110 }}>
      {/* HERO HEADER */}
      <div style={{
        padding: '14px 20px 18px',
        background: `radial-gradient(140% 100% at 0% 0%, rgba(190,242,100,0.10), transparent 55%), ${T.bg}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg, ${T.lime}, ${T.limeDeep})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(190,242,100,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 1.5L14 5v6l-6 3.5L2 11V5l6-3.5Z" fill="none" stroke="#0A0A0C" strokeWidth="1.6" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="1.6" fill="#0A0A0C"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text }}>Sunday</div>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text3, letterSpacing: 0.6, textTransform: 'uppercase' }}>{matchday}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16M3.5 3.5l1 1M13.5 13.5l1 1M3.5 14.5l1-1M13.5 4.5l1-1" stroke={T.text2} strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="9" cy="9" r="3.2" stroke={T.text2} strokeWidth="1.6"/>
              </svg>
            </IconBtn>
            <IconBtn dot>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 13V8a5.5 5.5 0 1 1 11 0v5l1.5 2H2l1.5-2ZM7 16a2 2 0 0 0 4 0" stroke={T.text2} strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* Title + your rank capsule */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{
              fontFamily: T.font, fontSize: 34, fontWeight: 700, lineHeight: 1.05,
              color: T.text, letterSpacing: -0.8,
            }}>
              Your World<br/>Cup, live.
            </div>
          </div>
          <div onClick={() => go('leaderboard')} style={{
            padding: '10px 14px', borderRadius: 14, cursor: 'pointer',
            background: T.cardHi, border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>Rank</div>
              <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 600, color: T.lime, lineHeight: 1, marginTop: 2 }}>
                #{you.rank}
              </div>
            </div>
            <Trend delta={you.delta} />
          </div>
        </div>
      </div>

      {/* LIVE NOW */}
      <div style={{ marginTop: 8 }}>
        <SectionHead title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><LiveDot /> Live now</span>} action={`${live.length} matches`} />
        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '0 20px 6px', scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
        }}>
          {live.map(m => <LiveCard key={m.id} m={m} onClick={() => go('match', m.id)} />)}
        </div>
      </div>

      {/* GROUP ACTIVITY */}
      <div style={{ marginTop: 26 }}>
        <SectionHead title="Group · Les Cracks" action="View all" onAction={() => go('leaderboard')} />
        <div style={{ padding: '0 20px' }}>
          <Card padded={false}>
            {/* mini podium */}
            <div style={{
              padding: '14px 14px 12px',
              borderBottom: `1px solid ${T.border}`,
              display: 'flex', gap: 10,
            }}>
              {top3.map((u, i) => (
                <div key={u.handle} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 12,
                  background: i === 0 ? T.limeBg : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${i === 0 ? T.limeBg2 : T.border}`,
                }}>
                  <Avatar name={u.name} color={u.color} size={26} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.5 }}>#{u.rank}</div>
                    <div style={{ fontFamily: T.font, fontSize: 12.5, fontWeight: 600, color: i === 0 ? T.lime : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* recent moves */}
            <div>
              {window.ACTIVITY.slice(0, 3).map((a, i) => (
                <ActivityRow key={a.id} a={a} last={i === 2} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* UPCOMING — predict CTA cards */}
      <div style={{ marginTop: 26 }}>
        <SectionHead title="Predict next" action="See all" onAction={() => go('matches')} />
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {upcoming.map(m => <UpcomingRow key={m.id} m={m} onClick={() => go('match', m.id)} />)}
        </div>
      </div>

      {/* WEEK SUMMARY */}
      <div style={{ marginTop: 26 }}>
        <SectionHead title="This matchday" />
        <div style={{ padding: '0 20px' }}>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Stat label="Points" value="+47" delta="+12" />
              <Stat label="Accuracy" value="72%" delta="+4%" />
              <Stat label="Streak" value="4" deltaIcon="fire" />
            </div>
            <div style={{ height: 1, background: T.border, margin: '14px -16px 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.text }}>3 predictions left</div>
                <div style={{ fontFamily: T.font, fontSize: 12.5, color: T.text2, marginTop: 2 }}>Lock by 21:00 today</div>
              </div>
              <LimeButton size="sm" onClick={() => go('matches')}>Predict <Chevron/></LimeButton>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Live match card (horizontal scroll) ───────────────────────────
function LiveCard({ m, onClick }) {
  const home = window.TEAMS[m.home];
  const away = window.TEAMS[m.away];
  const correctSoFar = m.pred && m.hs >= m.pred.hs && m.as >= m.pred.as;
  return (
    <div onClick={onClick} style={{
      flex: '0 0 280px', scrollSnapAlign: 'start',
      background: `linear-gradient(180deg, ${T.cardHi} 0%, ${T.card} 100%)`,
      border: `1px solid ${T.border}`,
      borderRadius: 18, padding: 14, cursor: 'pointer',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* lime corner glow on live */}
      <div style={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%', background: T.lime, filter: 'blur(50px)', opacity: 0.18,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <LiveBadge minute={m.minute} />
        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {m.stage.split(' · ')[0]}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flag code={m.home} size={32} />
          <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text }}>{home.code}</span>
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 28, fontWeight: 600, color: T.text, letterSpacing: -0.5, lineHeight: 1 }}>
          {m.hs}<span style={{ color: T.text4, padding: '0 6px' }}>·</span>{m.as}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: T.font, fontSize: 15, fontWeight: 600, color: T.text }}>{away.code}</span>
          <Flag code={m.away} size={32} />
        </div>
      </div>
      {m.pred && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: T.font, fontSize: 12, color: T.text2 }}>
            Your pick · <span style={{ color: T.text, fontFamily: T.mono, fontWeight: 600 }}>{m.pred.hs}–{m.pred.as}</span>
          </div>
          <div style={{
            fontFamily: T.mono, fontSize: 10.5, fontWeight: 600,
            color: correctSoFar ? T.lime : T.amber, letterSpacing: 0.4,
          }}>
            {correctSoFar ? 'ON TRACK' : 'AT RISK'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Upcoming row ──────────────────────────────────────────────────
function UpcomingRow({ m, onClick }) {
  return (
    <Card onClick={onClick} padded={false} style={{ padding: 0 }}>
      <div style={{ padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flag code={m.home} size={28} />
          <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.text }}>{m.home}</span>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, padding: '0 4px' }}>vs</span>
          <span style={{ fontFamily: T.font, fontSize: 14, fontWeight: 600, color: T.text }}>{m.away}</span>
          <Flag code={m.away} size={28} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.4, textTransform: 'uppercase' }}>{m.kickoff.split(' · ')[0]}</div>
          <div style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 600, color: T.text, marginTop: 1 }}>{m.kickoffShort || m.kickoff.split(' · ')[1]}</div>
        </div>
        {m.pred ? (
          <div style={{
            padding: '6px 10px', borderRadius: 10,
            background: T.limeBg, border: `1px solid ${T.limeBg2}`,
            fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.lime,
          }}>{m.pred.hs}–{m.pred.as}</div>
        ) : (
          <div style={{
            padding: '6px 10px', borderRadius: 10,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            fontFamily: T.font, fontSize: 12, fontWeight: 500, color: T.text2,
          }}>Predict</div>
        )}
      </div>
    </Card>
  );
}

// ─── Activity row ──────────────────────────────────────────────────
function ActivityRow({ a, last }) {
  const u = window.LEADERBOARD.find(r => r.name === a.who);
  const tone = a.kind === 'win' ? T.lime
             : a.kind === 'rank' ? T.lime
             : a.kind === 'fall' ? T.red
             : T.text2;
  return (
    <div style={{
      padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <Avatar name={a.who} color={u?.color || T.lime} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.font, fontSize: 13.5, color: T.text, lineHeight: 1.3 }}>
          <span style={{ fontWeight: 600 }}>{a.who}</span>
          <span style={{ color: T.text2 }}> {a.action} </span>
          <span style={{ fontWeight: 600, color: tone }}>{a.detail}</span>
        </div>
        <div style={{ fontFamily: T.font, fontSize: 12, color: T.text3, marginTop: 1 }}>{a.meta}</div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3 }}>{a.time}</div>
    </div>
  );
}

// ─── Stat ──────────────────────────────────────────────────────────
function Stat({ label, value, delta, deltaIcon }) {
  return (
    <div>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <div style={{ fontFamily: T.mono, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: -0.5 }}>{value}</div>
        {delta && <div style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: T.lime }}>{delta}</div>}
        {deltaIcon === 'fire' && <span style={{ fontSize: 12 }}>
          <svg width="12" height="14" viewBox="0 0 12 14"><path d="M6 1c1 2 3 3 3 6a3 3 0 0 1-6 0c0-1 .5-1.5 1-2-2 1-3 3-3 5a5 5 0 0 0 10 0c0-4-3-6-5-9Z" fill={T.amber}/></svg>
        </span>}
      </div>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────
function IconBtn({ children, dot, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', position: 'relative',
      width: 38, height: 38, borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${T.border}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
      {dot && <span style={{
        position: 'absolute', top: 8, right: 9, width: 7, height: 7,
        borderRadius: '50%', background: T.lime, boxShadow: `0 0 0 2px ${T.bg}`,
      }} />}
    </button>
  );
}

function Chevron() {
  return <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

window.ScreenHome = ScreenHome;
window.IconBtn = IconBtn;
window.Chevron = Chevron;
