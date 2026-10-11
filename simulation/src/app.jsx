
import { useEffect, useRef, useState } from "react";
import "./styles.css";

const N = 5;
const INITIAL_ROOM = 4;

const initialPhilosophers = () =>
  Array.from({ length: N }, (_, id) => ({
    id,
    state: "Thinking",
    meals: 0,
  }));

const initialForks = () => Array(N).fill(null);

const colors = {
  Thinking: "#94a3b8",
  Hungry: "#fbbf24",
  Waiting: "#fb7185",
  Eating: "#34d399",
};

export default function App() {
  const [philosophers, setPhilosophers] = useState(initialPhilosophers);
  const [forks, setForks] = useState(initialForks);
  const [room, setRoom] = useState(INITIAL_ROOM);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1200);
  const [events, setEvents] = useState([
    "Ready! Press Start to begin the simulation.",
  ]);

  const stateRef = useRef({});
  const runningRef = useRef(false);
  const timerRef = useRef(null);
  const speedRef = useRef(speed);

  stateRef.current = { philosophers, forks, room };

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  function addEvent(message) {
    setEvents((previous) => [message, ...previous].slice(0, 8));
  }

  function start() {
    runningRef.current = true;
    setRunning(true);
    addEvent("Simulation started. room = 4.");
  }

  function pause() {
    runningRef.current = false;
    setRunning(false);
    clearTimeout(timerRef.current);
    timerRef.current = null;

    setForks(initialForks());
    setRoom(INITIAL_ROOM);
    setPhilosophers((previous) =>
      previous.map((p) => ({ ...p, state: "Thinking" }))
    );

    addEvent("Simulation paused. All forks and permits released.");
  }

  function reset() {
    runningRef.current = false;
    setRunning(false);
    clearTimeout(timerRef.current);
    timerRef.current = null;

    setPhilosophers(initialPhilosophers());
    setForks(initialForks());
    setRoom(INITIAL_ROOM);
    setEvents(["Simulation reset. Press Start to begin."]);
  }

  useEffect(() => {
    if (!running) return;

    let cancelled = false;

    function tick() {
      if (cancelled || !runningRef.current) return;

      const current = stateRef.current;
      const nextP = current.philosophers.map((p) => ({ ...p }));
      const nextF = [...current.forks];
      let nextRoom = current.room;

      const candidates = Array.from({ length: N }, (_, i) => i)
        .sort(() => Math.random() - 0.5);

      let chosen = -1;

      for (const id of candidates) {
        if (nextP[id].state === "Eating") continue;

        const left = id;
        const right = (id + 1) % N;

        if (
          nextRoom > 0 &&
          nextF[left] === null &&
          nextF[right] === null
        ) {
          chosen = id;
          break;
        }
      }

      // Finish one meal before selecting another philosopher.
      const eater = nextP.find((p) => p.state === "Eating");

      if (eater) {
        const id = eater.id;
        nextP[id].state = "Thinking";
        nextP[id].meals += 1;
        nextF[id] = null;
        nextF[(id + 1) % N] = null;
        nextRoom = Math.min(INITIAL_ROOM, nextRoom + 1);

        setPhilosophers(nextP);
        setForks(nextF);
        setRoom(nextRoom);
        addEvent(`P${id + 1} finished eating and released both forks.`);
      } else if (chosen !== -1) {
        const id = chosen;
        const left = id;
        const right = (id + 1) % N;

        nextRoom -= 1;
        nextF[left] = id;
        nextF[right] = id;
        nextP[id].state = "Eating";

        setPhilosophers(nextP);
        setForks(nextF);
        setRoom(nextRoom);
        addEvent(`P${id + 1} acquired both forks and started eating.`);
      } else {
        const id = candidates[0];
        nextP[id].state = "Waiting";
        setPhilosophers(nextP);
        addEvent(`P${id + 1} is waiting for available forks.`);
      }

      timerRef.current = setTimeout(tick, speedRef.current);
    }

    timerRef.current = setTimeout(tick, speedRef.current);

    return () => {
      cancelled = true;
      clearTimeout(timerRef.current);
    };
  }, [running, speed]);

  const totalMeals = philosophers.reduce((sum, p) => sum + p.meals, 0);
  const eatingCount = philosophers.filter((p) => p.state === "Eating").length;

  return (
    <main className="app">
      <header className="header">
        <div className="logo">OS</div>
        <div>
          <p className="eyebrow">OPERATING SYSTEMS LAB</p>
          <h1>Dining Philosophers</h1>
        </div>
        <span className="header-tag">SEMAPHORE SIMULATION</span>
      </header>

      <section className="intro">
        <p className="eyebrow">SYNCHRONIZATION MADE SIMPLE</p>
        <h2>Five philosophers. Five forks. One shared table.</h2>
        <p>
          Watch how the semaphore <code>room = 4</code> limits competition
          for forks and prevents the classic deadlock situation.
        </p>
      </section>

      <section className="layout">
        <div className="panel simulation-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">LIVE SIMULATION</p>
              <h2>The dining table</h2>
            </div>
            <span className={`status ${running ? "active" : ""}`}>
              {running ? "● Running" : "● Paused"}
            </span>
          </div>

          <div className="table-area">
            <div className="dining-table">
              <div className="table-center">
                <span className="table-symbol">room</span>
                <strong>{room} / 4</strong>
                <small>permits available</small>
              </div>

              {philosophers.map((p) => {
                const angle = -90 + p.id * 72;
                const left = 50 + 39 * Math.cos((angle * Math.PI) / 180);
                const top = 50 + 39 * Math.sin((angle * Math.PI) / 180);

                return (
                  <div
                    key={p.id}
                    className="philosopher"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      "--person-color": colors[p.state],
                    }}
                  >
                    <div className={`person ${p.state.toLowerCase()}`}>
                      <span className="face">{p.state === "Eating" ? "😋" : "🙂"}</span>
                    </div>
                    <strong>P{p.id + 1}</strong>
                    <span className="person-state">{p.state}</span>
                    <span className="meal-count">Meals: {p.meals}</span>
                  </div>
                );
              })}

              {forks.map((owner, index) => {
                const angle = -90 + index * 72 + 36;
                const left = 50 + 23 * Math.cos((angle * Math.PI) / 180);
                const top = 50 + 23 * Math.sin((angle * Math.PI) / 180);

                return (
                  <div
                    key={index}
                    className={`fork ${owner !== null ? "locked" : ""}`}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                    }}
                    title={
                      owner === null
                        ? `Fork ${index + 1} is available`
                        : `Fork ${index + 1} is held by P${owner + 1}`
                    }
                  >
                    🍴<small>F{index + 1}</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="legend">
            <span><i style={{ background: colors.Thinking }} /> Thinking</span>
            <span><i style={{ background: colors.Waiting }} /> Waiting</span>
            <span><i style={{ background: colors.Eating }} /> Eating</span>
            <span><i style={{ background: "#fbbf24" }} /> Fork locked</span>
          </div>

          <div className="controls">
            {!running ? (
              <button className="primary" onClick={start}>▶ Start</button>
            ) : (
              <button className="primary" onClick={pause}>Ⅱ Pause</button>
            )}

            <button className="secondary" onClick={reset}>↻ Reset</button>

            <label className="speed">
              Speed
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={2000}>Slow</option>
                <option value={1200}>Normal</option>
                <option value={600}>Fast</option>
              </select>
            </label>
          </div>
        </div>

        <aside className="side">
          <div className="panel">
            <p className="eyebrow">COUNTING SEMAPHORE</p>
            <h2>room = 4</h2>
            <p className="muted">
              Only four philosophers can enter the fork competition at once.
            </p>

            <div className="permits">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`permit ${i < room ? "free" : "busy"}`}
                >
                  {i < room ? "FREE" : "IN USE"}
                </div>
              ))}
            </div>

            <div className="metric">
              <span>Available permits</span>
              <strong>{room} / 4</strong>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">ACTIVITY</p>
            <div className="stats">
              <div>
                <span>Eating now</span>
                <strong>{eatingCount}</strong>
              </div>
              <div>
                <span>Meals completed</span>
                <strong>{totalMeals}</strong>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <h2>Event log</h2>
              <span className="eyebrow">LATEST</span>
            </div>
            <div className="event-list">
              {events.map((event, i) => (
                <p key={`${event}-${i}`} className="event">
                  <span>›</span> {event}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="panel learning">
        <p className="eyebrow">QUICK LEARNING GUIDE</p>
        <h2>How does this solution work?</h2>
        <p>
          Imagine five friends sitting around a table. Each friend needs two
          forks to eat. If everyone picks up one fork and waits for the other,
          nobody can eat. This is called <strong>deadlock</strong>.
        </p>

        <div className="learning-grid">
          <article>
            <span>01</span>
            <h3>Wait for room</h3>
            <p>
              <code>wait(room)</code> takes one permit. The value starts at
              four, so all five philosophers cannot compete simultaneously.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Get both forks</h3>
            <p>
              A philosopher can eat only when both neighbouring forks are
              available. A busy fork cannot be shared.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Release resources</h3>
            <p>
              After eating, the philosopher releases both forks and returns
              the permit with <code>signal(room)</code>.
            </p>
          </article>
        </div>

        <div className="pseudocode">
          <h3>Semaphore pseudocode</h3>
          <pre>{`semaphore room = 4
semaphore fork[5] = {1, 1, 1, 1, 1}

while (true) {
    think()
    wait(room)
    wait(fork[left])
    wait(fork[right])
    eat()
    signal(fork[right])
    signal(fork[left])
    signal(room)
}`}</pre>
        </div>

        <div className="note">
          <strong>Why does it prevent deadlock?</strong>
          <p>
            At most four philosophers can compete for forks at a time. This
            prevents all five from holding one fork each and waiting in a
            circle. This demo models the rule visually; it is not a real
            operating-system semaphore implementation.
          </p>
        </div>
      </section>

      <footer>Dining Philosophers · Operating Systems Synchronization</footer>
    </main>
  );
}
