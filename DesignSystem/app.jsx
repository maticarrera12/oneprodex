// App shell — handles routing between screens + bottom nav.

const { T, NavIcons } = window;

function App() {
  const [route, setRoute] = React.useState({ name: 'home', param: null });
  const [prev, setPrev] = React.useState(null);
  const [animating, setAnimating] = React.useState(false);

  const go = (name, param = null) => {
    if (name === route.name && param === route.param) return;
    setPrev(route);
    setRoute({ name, param });
    setAnimating(true);
    setTimeout(() => {
      setPrev(null);
      setAnimating(false);
    }, 320);
  };

  // Map route to screen
  const screenFor = (r) => {
    if (!r) return null;
    switch (r.name) {
      case 'home':        return <window.ScreenHome go={go} />;
      case 'match':       return <window.ScreenMatch matchId={r.param} go={go} />;
      case 'matches':     return <window.ScreenHome go={go} />; // matches list = home for now
      case 'leaderboard': return <window.ScreenLeaderboard go={go} />;
      case 'standings':   return <window.ScreenStandings go={go} />;
      case 'bracket':     return <window.ScreenBracket go={go} />;
      case 'profile':     return <window.ScreenProfile go={go} />;
      default:            return <window.ScreenHome go={go} />;
    }
  };

  // Show bottom nav on tab routes only
  const tabRoutes = ['home','leaderboard','standings','bracket','profile'];
  const showTab = tabRoutes.includes(route.name);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: T.bg, color: T.text,
      fontFamily: T.font,
      position: 'relative', overflow: 'hidden',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* status bar spacer */}
      <div style={{ height: 54 }} />

      {/* Screen container */}
      <div style={{ position: 'relative', height: 'calc(100% - 54px)', overflow: 'hidden' }}>
        {/* Outgoing screen */}
        {prev && (
          <div key={`prev-${prev.name}-${prev.param}`} className="screen-out" style={screenStyle()}>
            {screenFor(prev)}
          </div>
        )}
        {/* Incoming screen */}
        <div key={`now-${route.name}-${route.param}`} className={animating ? 'screen-in' : ''} style={screenStyle()}>
          {screenFor(route)}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <BottomNav active={route.name} go={go} visible={showTab} />
    </div>
  );
}

function screenStyle() {
  return {
    position: 'absolute', inset: 0,
    overflowY: 'auto', overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  };
}

// ─── Bottom Nav ────────────────────────────────────────────────────
function BottomNav({ active, go, visible }) {
  const tabs = [
    { id: 'home',        label: 'Home',     icon: NavIcons.home },
    { id: 'standings',   label: 'Standings',icon: NavIcons.matches },
    { id: 'bracket',     label: 'Bracket',  icon: NavIcons.bracket },
    { id: 'leaderboard', label: 'Group',    icon: NavIcons.group },
    { id: 'profile',     label: 'You',      icon: NavIcons.profile },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
      transform: visible ? 'translateY(0)' : 'translateY(110%)',
      transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
      paddingBottom: 12,
    }}>
      <div style={{
        margin: '0 14px', padding: '8px 6px',
        borderRadius: 22,
        background: 'rgba(14,14,17,0.78)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${T.borderHi}`,
        boxShadow: `0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {tabs.map(t => {
          const on = active === t.id;
          return (
            <button key={t.id} onClick={() => go(t.id)} style={{
              all: 'unset', cursor: 'pointer',
              flex: 1, padding: '8px 0', borderRadius: 14,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              position: 'relative',
              transition: 'background .15s ease',
            }}>
              {on && (
                <div style={{
                  position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 26, height: 3, borderRadius: 2,
                  background: T.lime,
                  boxShadow: `0 0 10px ${T.lime}88`,
                }} />
              )}
              <div style={{ marginTop: 6 }}>{t.icon(on ? T.lime : T.text3)}</div>
              <div style={{
                fontFamily: T.font, fontSize: 10.5, fontWeight: 600,
                color: on ? T.lime : T.text3, letterSpacing: 0.2,
              }}>{t.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.App = App;
