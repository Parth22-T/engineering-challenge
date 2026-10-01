import { useState, useEffect, useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const URL = window.location.origin;
let socket;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [team, setTeam] = useState(null);
  const [appState, setAppState] = useState(null);
  const [adminTeams, setAdminTeams] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      socket = io(URL);

      socket.on("connect", () => {
        socket.emit("authenticate", token);
      });

      socket.on("state_sync", (state) => {
        setAppState(state);
      });

      socket.on("team_data", (data) => {
        setTeam(data);
      });

      socket.on("admin_teams", (teams) => {
        setAdminTeams(teams);
      });

      socket.on("force_logout", (msg) => {
        alert(msg);
        handleLogout();
      });

      socket.on("force_refresh", () => {
        window.location.reload();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [token]);

  // Tab switch detection
  useEffect(() => {
    if (role === "team" && token && appState?.currentPhase !== "LOBBY") {
      const handleVisibilityChange = async () => {
        if (document.hidden) {
          // Send violation to server
          try {
            await fetch(`${URL}/api/violation`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            handleLogout();
            alert(
              "SESSION LOCKED\n\nA tab/window switch was detected.\nYour team has been logged out and cannot log in for 5 minutes.",
            );
          } catch (e) {}
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () =>
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
    }
  }, [role, token, appState]);

  // Fullscreen enforcement
  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;

    try {
      const res = await fetch(`${URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setRole(data.role);
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.team) setTeam(data.team);
        setError("");
        navigate("/");
      } else {
        if (data.locked_until) {
          setError(
            `Account locked until ${new Date(data.locked_until).toLocaleTimeString()}`,
          );
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError("Login failed. Server might be offline.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setTeam(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    if (socket) socket.disconnect();
    navigate("/login");
  };

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <h1 className="text-4xl font-bold mb-8 text-red-500 drop-shadow-md">
          ⛓️ ENGINEERING CHALLENGE ⛓️
        </h1>
        <h2 className="text-xl mb-4 text-gray-300">
          STME Turing Club — NMIMS Indore
        </h2>
        <div className="bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-8 rounded-lg shadow-lg border border-red-900/50 w-96">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {error &&
              (error.includes("locked") ? (
                <div className="bg-red-950 border border-red-500 text-red-500 p-6 rounded-lg text-center shadow-[inset_0_0_20px_rgba(220,38,38,0.5)]">
                  <div className="text-6xl mb-4">⛓️🔒⛓️</div>
                  <div className="font-bold text-xl uppercase mb-2">
                    System Locked
                  </div>
                  <div className="font-mono">{error}</div>
                </div>
              ) : (
                <div className="bg-red-500/20 text-red-400 p-3 rounded text-center font-bold border border-red-500/50">
                  {error}
                </div>
              ))}
            <input
              name="username"
              placeholder="Username"
              className="p-3 bg-zinc-950 border border-red-900/70 rounded text-white focus:outline-none focus:border-red-500"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="p-3 bg-zinc-950 border border-red-900/70 rounded text-white focus:outline-none focus:border-red-500"
              required
            />
            <button
              type="submit"
              className="p-3 bg-red-800 hover:bg-red-700 rounded font-bold transition flex justify-center items-center gap-2"
            >
              <span>⛓️</span> INITIATE LOGIN <span>⛓️</span>
            </button>
          </form>
        </div>
        <div className="mt-8 text-gray-400 max-w-lg text-sm bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)]/50 p-4 rounded border border-red-900/50">
          <h3 className="text-red-400 font-bold mb-2">RULES</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Each team may use only ONE laptop.</li>
            <li>Mobile phones are not allowed.</li>
            <li>Fullscreen mode is mandatory.</li>
            <li>
              Tab switching/window switching is strictly prohibited and results
              in a 5-minute lockout.
            </li>
            <li>Copy/paste is disabled.</li>
          </ul>
        </div>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <AdminDashboard
        appState={appState}
        teams={adminTeams}
        logout={handleLogout}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col user-select-none"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
    >
      <header className="bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-4 flex justify-between items-center border-b border-red-900/50 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-red-500">
            ⛓️ ENGINEERING CHALLENGE ⛓️
          </h1>
          <h2 className="text-sm text-gray-400">STME Turing Club</h2>
        </div>
        {team && (
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <div className="text-xl font-bold text-white">{team.name}</div>
              <div className="text-green-400 font-mono">
                Balance: {team.balance} 🪙
              </div>
              <div className="text-yellow-400 text-sm">
                Lifelines: {team.lifelines}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 p-2 rounded text-sm font-bold"
            >
              LOGOUT
            </button>
          </div>
        )}
      </header>

      <main className="flex-grow p-6 flex flex-col items-center">
        {!document.fullscreenElement && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center border-8 border-red-900 shadow-[inset_0_0_150px_rgba(220,38,38,0.4)]">
            <div className="text-9xl mb-8 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]">
              ⛓️🔒⛓️
            </div>
            <h1 className="text-5xl font-black text-red-600 mb-8 tracking-[0.2em] font-mono">
              SYSTEM LOCK REQUIRED
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              You must lock yourself into the environment to proceed.
            </p>
            <button
              onClick={requestFullscreen}
              className="bg-red-950 border-4 border-red-600 hover:bg-red-900 text-white font-black p-6 rounded-lg w-full max-w-2xl text-3xl shadow-[0_0_40px_rgba(220,38,38,0.6)] animate-pulse flex items-center justify-center gap-4 transition-all"
            >
              <span>⛓️</span> ENGAGE LOCKDOWN MODE <span>⛓️</span>
            </button>
          </div>
        )}

        {appState?.currentPhase === "LOBBY" && (
          <div className="text-center mt-20">
            {team?.name.startsWith("Team ") ? (
              <div className="mb-12 bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-8 rounded-lg border border-red-600 max-w-md mx-auto">
                <h3 className="text-xl font-bold mb-4">
                  🔒 SECURE YOUR IDENTITY 🔒
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const newName = e.target.teamName.value;
                    const language = e.target.language.value;
                    if (newName) socket.emit("update_team_profile", { name: newName, language });
                  }}
                >
                  <input
                    type="text"
                    name="teamName"
                    maxLength="30"
                    placeholder="Enter Team Name"
                    className="w-full p-3 mb-4 bg-zinc-950 border border-red-900/70 rounded text-white"
                    required
                  />
                  <div className="flex gap-4 mb-6">
                    <label className="flex-1 bg-zinc-900 border border-red-900/50 p-3 rounded text-center cursor-pointer hover:bg-zinc-800 transition">
                      <input type="radio" name="language" value="C" defaultChecked className="mr-2" />
                      C (Clang)
                    </label>
                    <label className="flex-1 bg-zinc-900 border border-red-900/50 p-3 rounded text-center cursor-pointer hover:bg-zinc-800 transition">
                      <input type="radio" name="language" value="C++" className="mr-2" />
                      C++ (GCC)
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-red-800 hover:bg-red-700 font-bold p-3 rounded"
                  >
                    ⛓️ LOCK IN NAME ⛓️
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-9xl mb-8">⛓️🔒⛓️</div>
                <h2 className="text-4xl font-black mb-4 text-red-600 font-mono tracking-widest">
                  SYSTEM LOCKED
                </h2>
                <h3 className="text-xl text-gray-400">
                  Awaiting Administrator Unlock Sequence...
                </h3>
              </div>
            )}
          </div>
        )}

        {appState?.currentPhase === "ROUND_1" && (
          <Round1 appState={appState} team={team} />
        )}
        {appState?.currentPhase === "ROUND_2" && (
          <div className="text-center mt-20">
            {team?.r2_eligible ? (
              <>
                <h1 className="text-4xl font-bold text-red-500 mb-4">ROUND 2</h1>
                <h2 className="text-2xl">Round 2 is conducted offline.</h2>
                <p className="mt-4 text-gray-400">
                  Please follow the event organizer's instructions.
                </p>
              </>
            ) : (
              <div className="bg-black border-2 border-red-900 shadow-[inset_0_0_50px_rgba(220,38,38,0.3)] p-12 rounded-xl">
                <h1 className="text-5xl font-black text-red-600 mb-4 tracking-widest">ELIMINATED</h1>
                <p className="text-xl text-gray-400 mt-4">Thank you for participating in the Engineering Challenge.</p>
              </div>
            )}
          </div>
        )}
        {appState?.currentPhase === "ROUND_3" &&
          (team?.r3_eligible ? (
            <Round3 appState={appState} team={team} />
          ) : (
            <div className="text-center mt-20">
              <h1 className="text-4xl font-bold text-red-500 mb-4">ROUND 3</h1>
              <h2 className="text-2xl">You have not qualified for Round 3.</h2>
              <p className="mt-4 text-gray-400">
                Please watch the main screen for the finals!
              </p>
            </div>
          ))}
        {appState?.currentPhase === "RESULTS" && <Results teams={adminTeams} />}
      </main>
    </div>
  );
}

function Round1({ appState, team }) {
  const ts = appState.r1.teamStates[team.id];
  const qIndex = team.r1_q_index;
  const [betAmount, setBetAmount] = useState(400);

  if (!ts || !ts.difficultySelected) {
    return (
      <div className="w-full max-w-2xl bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-8 rounded-lg shadow-xl border border-red-900/50">
        <h2 className="text-2xl font-bold mb-6 text-center text-red-500">
          Round 1 - Question {qIndex} / 10
        </h2>
        <h3 className="text-xl mb-8 text-center text-gray-300">
          Select your difficulty level first. The question will be revealed, and
          you will lock your bet afterwards.
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => socket.emit("r1_select_difficulty", "Easy")}
            className="p-6 bg-green-700 hover:bg-green-600 rounded-lg text-center flex flex-col items-center transition"
          >
            <span className="text-2xl mb-2 font-bold">🟢 EASY</span>
            <span className="bg-green-900 px-3 py-1 rounded text-sm">
              1.0× Multiplier
            </span>
          </button>

          <button
            onClick={() => socket.emit("r1_select_difficulty", "Medium")}
            className="p-6 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg text-center flex flex-col items-center transition"
          >
            <span className="text-2xl mb-2 font-bold">🟡 MEDIUM</span>
            <span className="bg-yellow-800 text-white px-3 py-1 rounded text-sm">
              2.5× Multiplier
            </span>
          </button>

          <button
            onClick={() => socket.emit("r1_select_difficulty", "Hard")}
            className="p-6 bg-red-700 hover:bg-red-600 rounded-lg text-center flex flex-col items-center transition"
          >
            <span className="text-2xl mb-2 font-bold">🔴 HARD</span>
            <span className="bg-red-900 px-3 py-1 rounded text-sm">
              3.2× Multiplier
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Active question revealed
  const q = ts.question;
  const options = q.options ? JSON.parse(q.options) : [];

  return (
    <div className="w-full max-w-4xl bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-8 rounded-lg shadow-xl border border-red-900/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-red-500">Question {qIndex}</h2>
        <div className="flex gap-4">
          <span className="bg-gray-700 px-4 py-2 rounded text-sm font-bold">
            Difficulty: {ts.difficulty}
          </span>
          {ts.betLocked && (
            <span className="bg-gray-700 px-4 py-2 rounded text-sm font-bold text-green-400">
              Bet: {ts.bet} 🪙
            </span>
          )}
        </div>
      </div>

      <div className="text-xl mb-8 whitespace-pre-wrap leading-relaxed border-l-4 border-red-600 pl-4 py-2 font-mono">
        {team.language === 'C++' ? q.question_cpp : q.question_c}
      </div>

      {!ts.betLocked ? (
        <div className="mb-8 p-6 bg-zinc-950 border border-red-600 rounded-lg shadow-inner">
          <label className="block text-gray-300 mb-4 font-bold text-center text-lg">
            Question Revealed! Enter your bet to unlock answers (Min 400)
          </label>
          <div className="flex justify-center gap-4">
            <input
              type="number"
              min="400"
              max={team.balance}
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
              className="p-4 bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] border border-red-900/70 rounded text-2xl font-mono text-center text-green-400 focus:outline-none focus:border-red-500 w-48"
            />
            <button
              disabled={betAmount < 400 || betAmount > team.balance}
              onClick={() => socket.emit("r1_lock_bet", betAmount)}
              className="bg-red-800 hover:bg-red-700 text-white font-bold p-4 rounded text-xl disabled:opacity-50 transition"
            >
              🔒 LOCK BET 🔒
            </button>
          </div>
        </div>
      ) : (
        !ts.answered && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() =>
                  socket.emit("r1_submit_answer", String.fromCharCode(65 + i))
                }
                className="p-4 bg-gray-700 hover:bg-gray-600 rounded text-lg border border-red-900/70 hover:border-red-500 text-left"
              >
                <span className="font-bold text-red-500 mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>{" "}
                {opt}
              </button>
            ))}
          </div>
        )
      )}

      {ts.answered && (
        <div
          className={`p-6 rounded-lg text-center mb-8 border ${ts.isCorrect ? "bg-green-900/30 border-green-500 text-green-400" : "bg-red-900/30 border-red-500 text-red-400"}`}
        >
          <h3 className="text-3xl font-bold mb-2">
            {ts.isCorrect ? "CORRECT!" : "WRONG!"}
          </h3>
          <p className="text-lg">You submitted: {ts.submittedAnswer}</p>
          <p className="text-xl font-mono mt-4 mb-6">
            {ts.isCorrect ? `+${ts.scoreGained} 🪙` : `${ts.scoreGained} 🪙`}
          </p>
          {qIndex < 10 ? (
            <button
              onClick={() => socket.emit("r1_next_question")}
              className="bg-red-600 text-white font-bold px-8 py-3 rounded border border-red-500 hover:bg-red-500 transition-colors"
            >
              NEXT QUESTION
            </button>
          ) : (
            <div className="text-yellow-500 font-bold mt-4">ROUND 1 COMPLETE. Please wait for the administrator.</div>
          )}
        </div>
      )}

      {!ts.answered && !ts.lifelineUsed && team.lifelines > 0 && (
        (() => {
          const costs = { 'Easy': 200, 'Medium': 400, 'Hard': 600 };
          const cost = costs[ts.difficulty] || 300;
          return (
            <div className="text-center border-t border-red-900/50 pt-6">
              <button
                onClick={() => socket.emit("r1_use_lifeline")}
                className="bg-yellow-600 text-black font-bold px-6 py-3 rounded-full shadow hover:bg-yellow-500"
              >
                USE LIFELINE (Cost: {cost})
              </button>
            </div>
          );
        })()
      )}

      {ts.lifelineUsed && (
        <div className="mt-6 bg-yellow-900/30 border border-yellow-700 p-4 rounded text-yellow-300">
          <span className="font-bold">HINT:</span> {q.hint}
        </div>
      )}
    </div>
  );
}

function Round3({ appState, team }) {
  const qIndex = appState.r3.activeQuestionIndex;
  const qState = appState.r3.questionState;
  const myBuzz = appState.r3.buzzes.find((b) => b.team_id === team.id);
  const myPos = myBuzz
    ? appState.r3.buzzes.findIndex((b) => b.team_id === team.id) + 1
    : null;

  return (
    <div className="w-full max-w-4xl bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-8 rounded-lg shadow-xl border border-red-900/50 text-center">
      <h2 className="text-3xl font-bold text-red-500 mb-6">
        BUZZER ROUND - Q{qIndex}
      </h2>

      {qState === "HIDDEN" ? (
        <div className="text-xl text-gray-400 py-12">
          Get ready... Waiting for admin to reveal.
        </div>
      ) : (
        <div className="mb-12">
          {!myBuzz ? (
            <button
              disabled={!appState.r3.buzzerActive}
              onClick={() => socket.emit("r3_buzz")}
              className={`w-64 h-64 rounded-full text-5xl font-black shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${appState.r3.buzzerActive ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/50" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
            >
              BUZZ
            </button>
          ) : (
            <div className="w-64 h-64 rounded-full bg-cyan-700 flex flex-col justify-center items-center mx-auto shadow-xl shadow-cyan-500/30">
              <span className="text-2xl text-cyan-200 mb-2">You are</span>
              <span className="text-6xl font-black">{myPos}</span>
            </div>
          )}
        </div>
      )}

      {appState.r3.answeringTeamId === team.id && (
        <div className="bg-green-600/20 border-2 border-green-500 p-4 rounded-lg mt-8 text-xl text-green-400 font-bold animate-pulse">
          ⚠️ YOUR TURN TO ANSWER! ⚠️
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ appState, teams, logout }) {
  const doAction = (action, payload) =>
    socket.emit("admin_action", { action, payload });

  return (
    <div className="min-h-screen p-6 bg-zinc-950 text-gray-200">
      <div className="flex justify-between items-center mb-8 border-b border-red-900/50 pb-4">
        <h1 className="text-3xl font-bold text-red-500">
          ADMINISTRATOR DASHBOARD
        </h1>
        <button
          onClick={logout}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-bold"
        >
          Logout Admin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="col-span-1 bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-6 rounded border border-red-900/50 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-red-500 mb-4">
              Phase Control
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {["LOBBY", "ROUND_1", "ROUND_2", "ROUND_3", "RESULTS"].map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => doAction("SET_PHASE", p)}
                    className={`px-4 py-2 rounded text-sm font-bold ${appState?.currentPhase === p ? "bg-red-800 text-white" : "bg-gray-700 hover:bg-gray-600"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            
            <h2 className="text-xl font-bold text-red-500 mb-4 mt-6 border-t border-red-900/50 pt-4">
              Round 2 Controls
            </h2>
            <button
                onClick={() => { if(confirm('Auto-qualify Top 8 teams for Round 2 based on current balance?')) doAction("AUTO_QUALIFY_R2") }}
                className="w-full bg-yellow-700 hover:bg-yellow-600 text-white py-2 rounded font-bold"
            >
                Auto-Qualify Top 8 Teams for R2
            </button>
          </div>

          {appState?.currentPhase === "ROUND_1" && (
            <div className="border-t border-red-900/50 pt-6">
              <h2 className="text-xl font-bold text-red-500 mb-4">Round 1 Controls</h2><p className="mb-4 text-gray-400 text-sm">(Teams progress individually at their own pace. Use this button ONLY if you need to force everyone to skip their current question simultaneously.)</p><button onClick={() => { if (confirm("Are you sure? This will wipe all currently active question progress for ALL teams and jump them to the next question!")) { doAction("FORCE_ALL_NEXT_Q"); } }} className="w-full bg-orange-700 hover:bg-orange-600 text-white py-2 rounded font-bold mt-2 mb-4">Force ALL Teams to Next Question</button></div>
          )}

          {appState?.currentPhase === "ROUND_3" && (
            <div className="border-t border-red-900/50 pt-6">
              <h2 className="text-xl font-bold text-red-500 mb-4">
                Round 3 (Buzzer) Controls
              </h2>
              <p className="mb-4 text-gray-400">
                Current Q: {appState.r3.activeQuestionIndex}
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => doAction("R3_NEXT_Q")}
                  className="w-full bg-blue-700 hover:bg-blue-600 py-2 rounded font-bold"
                >
                  Next Question (Clear Buzzer)
                </button>
                <button
                  onClick={() => doAction("R3_REVEAL")}
                  className="w-full bg-indigo-700 hover:bg-indigo-600 py-2 rounded font-bold"
                >
                  Start Question
                </button>
                <button
                  onClick={() =>
                    doAction("R3_TOGGLE_BUZZER", !appState.r3.buzzerActive)
                  }
                  className={`w-full py-2 rounded font-bold ${appState.r3.buzzerActive ? "bg-red-600" : "bg-gray-600"}`}
                >
                  {appState.r3.buzzerActive
                    ? "Close Buzzer"
                    : "Activate Buzzer"}
                </button>

                {appState.r3.answeringTeamId && (
                  <div className="mt-4 p-4 border border-yellow-500 rounded bg-yellow-900/20">
                    <p className="text-sm text-yellow-500 mb-2">
                      Currently Answering:
                    </p>
                    <p className="font-bold text-lg mb-4">
                      {
                        teams.find((t) => t.id === appState.r3.answeringTeamId)
                          ?.name
                      }
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => doAction("R3_MARK_CORRECT")}
                        className="flex-1 bg-green-600 py-2 rounded"
                      >
                        Correct (+1)
                      </button>
                      <button
                        onClick={() => doAction("R3_MARK_WRONG")}
                        className="flex-1 bg-red-600 py-2 rounded"
                      >
                        Wrong
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Monitoring */}
        <div className="col-span-2 bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-6 rounded border border-red-900/50 overflow-x-auto">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            Live Team Monitoring
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-950">
              <tr>
                <th className="p-2">Team</th>
                <th className="p-2">Status</th>
                <th className="p-2">Balance</th>
                <th className="p-2">R3 Pts</th>
                <th className="p-2">R1 State</th>
                <th className="p-2">Buzzer Pos</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-gray-700/50 transition">
                  <td className="p-2 font-bold">
                    {t.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({t.username})
                    </span>
                  </td>
                  <td className="p-2">
                    {t.locked_until && new Date(t.locked_until) > new Date() ? (
                      <span className="text-red-500 font-bold">LOCKED</span>
                    ) : t.online ? (
                      <span className="text-green-500 font-bold">ONLINE</span>
                    ) : (
                      <span className="text-gray-500">OFFLINE</span>
                    )}
                  </td>
                  <td className="p-2 text-green-400">{t.balance}</td>
                  <td className="p-2 text-blue-400">{t.r3score}</td>
                  <td className="p-2 text-xs">
                    {t.r1state ? (
                      <div>
                        D: {t.r1state.difficulty} | B:{" "}
                        {t.r1state.betLocked ? t.r1state.bet : "..."}
                        <br />
                        {t.r1state.answered
                          ? t.r1state.isCorrect
                            ? "✅"
                            : "❌"
                          : "⏳"}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2">
                    {t.buzzerPos !== -1 ? (
                      <span className="bg-red-900 text-white px-2 py-1 rounded-full">
                        {t.buzzerPos + 1}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2 flex flex-col gap-1">
                    <button
                      onClick={() => doAction("FORCE_TEAM_NEXT_Q", t.id)}
                      className="bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded text-xs text-white font-bold"
                    >
                      FORCE NEXT Q
                    </button>
                    <button
                      onClick={() => doAction("RESET_TEAM_Q1", t.id)}
                      className="bg-red-800 hover:bg-red-700 px-2 py-1 rounded text-xs text-white font-bold"
                    >
                      RESET Q1
                    </button>
                    {t.locked_until &&
                      new Date(t.locked_until) > new Date() && (
                        <button
                          onClick={() => doAction("UNLOCK_TEAM", t.id)}
                          className="bg-yellow-600 hover:bg-yellow-500 px-2 py-1 rounded text-xs text-black font-bold"
                        >
                          UNLOCK
                        </button>
                      )}
                    <button
                      onClick={() =>
                        doAction("R2_TOGGLE_ELIGIBILITY", {
                          teamId: t.id,
                          eligible: !t.r2_eligible,
                        })
                      }
                      className={`px-2 py-1 rounded text-xs font-bold ${t.r2_eligible ? "bg-purple-600 text-white" : "bg-gray-600 text-gray-300"}`}
                    >
                      {t.r2_eligible ? "R2: YES" : "R2: NO"}
                    </button>
                    <button
                      onClick={() =>
                        doAction("R3_TOGGLE_ELIGIBILITY", {
                          teamId: t.id,
                          eligible: !t.r3_eligible,
                        })
                      }
                      className={`px-2 py-1 rounded text-xs font-bold ${t.r3_eligible ? "bg-indigo-600 text-white" : "bg-gray-600 text-gray-300"}`}
                    >
                      {t.r3_eligible ? "R3: YES" : "R3: NO"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Results({ teams }) {
  const sorted = [...teams].sort((a, b) => b.r3score - a.r3score);
  return (
    <div className="text-center w-full max-w-2xl bg-black border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.2)] p-12 rounded-lg shadow-xl border-2 border-red-600">
      <h1 className="text-5xl font-black text-red-500 mb-8 drop-shadow-lg">
        FINAL RESULTS
      </h1>
      <h2 className="text-2xl font-bold mb-8">
        WINNER:{" "}
        <span className="text-yellow-400 text-4xl ml-2">{sorted[0]?.name}</span>
      </h2>

      <table className="w-full text-left text-lg">
        <thead className="bg-zinc-950 text-gray-400">
          <tr>
            <th className="p-4 rounded-tl">Rank</th>
            <th className="p-4">Team</th>
            <th className="p-4 rounded-tr text-right">R3 Points</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {sorted.map((t, i) => (
            <tr key={t.id} className={i === 0 ? "bg-yellow-900/20" : ""}>
              <td className="p-4 font-bold text-red-600">#{i + 1}</td>
              <td className="p-4 font-bold">{t.name}</td>
              <td className="p-4 text-right font-mono text-red-500">
                {t.r3score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

