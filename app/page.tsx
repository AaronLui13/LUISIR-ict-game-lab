import { GAME_CATALOG } from "./game-catalog";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  return (
    <main className="hub-shell">
      <nav className="hub-nav" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Lui Sir's ICT Game Lab home">
          <span className="brand-mark">L</span>
          <span>LUI SIR’S <b>ICT GAME LAB</b></span>
        </a>
        <span className="signal"><i /> SYSTEMS ONLINE</span>
      </nav>

      <section className="hub-hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">CLASSROOM MISSIONS · 01</span>
          <h1>Learn ICT.<br /><em>Run the mission.</em></h1>
          <p>
            Step into interactive simulations where every decision makes a system
            work—or fail.
          </p>
          <a className="launch-button" href={`${BASE_PATH}/games/mars-iot-rescue`}>
            Launch first mission <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="mars-window" aria-label="Mars base mission preview">
          <div className="window-chrome">
            <span>MARS // ELYSIUM BASE</span>
            <span>04:18:32 UTC</span>
          </div>
          <div className="space"><div className="mars" /></div>
          <div className="mission-card">
            <span className="mission-number">MISSION 01</span>
            <h2>Mars IoT Rescue</h2>
            <p>Restore the life-support network before the crew runs out of time.</p>
            <div className="mission-meta">
              <span>IoT SYSTEMS</span><span>6–8 MIN</span><span>S3</span>
            </div>
          </div>
        </div>
      </section>

      <section className="game-library" aria-labelledby="mission-library">
        <div className="library-heading">
          <div><span className="eyebrow">MISSION ARCHIVE</span><h2 id="mission-library">Choose a simulation.</h2></div>
          <p>Short classroom-ready games. No account required.</p>
        </div>
        <div className="catalog-grid">
          {GAME_CATALOG.map((game) => (
            <a className="catalog-card" href={`${BASE_PATH}${game.href.replace(/\/$/, "")}`} key={game.slug}>
              <div className="catalog-number">{game.number}</div>
              <span>{game.status}</span>
              <h3>{game.title}</h3>
              <p>{game.topic}</p>
              <dl><div><dt>LEVEL</dt><dd>{game.level}</dd></div><div><dt>TIME</dt><dd>{game.duration}</dd></div></dl>
              <b>LAUNCH MISSION ↗</b>
            </a>
          ))}
          <div className="catalog-card coming-soon">
            <div className="catalog-number">02</div><span>IN DEVELOPMENT</span><h3>Next mission</h3><p>More ICT challenges are coming.</p>
          </div>
        </div>
      </section>

      <footer>
        <span>Built for curious minds.</span>
        <span>More missions incoming.</span>
      </footer>
    </main>
  );
}
