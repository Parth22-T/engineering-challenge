const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('./db');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const JWT_SECRET = 'super-secret-turing-key-2028';

let appState = {
    currentPhase: 'LOBBY', 
    r1: {
        activeQuestionIndex: 0,
        teamStates: {} // teamId -> { difficulty, bet, locked, answered, scoreGained, lifelineUsed, answer }
    },
    r3: {
        activeQuestionIndex: 0,
        questionState: 'HIDDEN',
        buzzerActive: false,
        buzzes: [],
        answeringTeamId: null
    }
};

let questionsR1 = { 'Easy': [], 'Medium': [], 'Hard': [] };
let questionsR3 = [];

// Load questions into memory
function loadQuestions() {
    db.all('SELECT * FROM r1_questions', (err, rows) => {
        if(rows) {
            rows.forEach(r => {
                if(!questionsR1[r.level]) questionsR1[r.level] = [];
                questionsR1[r.level].push(r);
            });
        }
    });
    db.all('SELECT * FROM r3_questions', (err, rows) => {
        if(rows) questionsR3 = rows;
    });
}
loadQuestions();

function logEvent(teamId, type, details) {
    db.run('INSERT INTO logs (team_id, event_type, details) VALUES (?, ?, ?)', 
        [teamId, type, JSON.stringify(details)], (err) => {
        if(err) console.error("Log error", err);
    });
}

// REST APIs
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'Parth' && password === 'Parth486@') {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET);
        return res.json({ token, role: 'admin' });
    }

    db.get('SELECT * FROM teams WHERE username = ?', [username], (err, team) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!team) return res.status(401).json({ error: 'Invalid credentials' });
        if (team.disabled) return res.status(403).json({ error: 'Account is disabled' });

        if (team.locked_until) {
            if (new Date(team.locked_until) > new Date()) {
                return res.status(403).json({ error: 'Account locked due to security violation.', locked_until: team.locked_until });
            } else {
                db.run('UPDATE teams SET locked_until = NULL WHERE id = ?', [team.id]);
            }
        }

        const valid = bcrypt.compareSync(password, team.password) || password === team.password;
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        db.get('SELECT * FROM sessions WHERE team_id = ?', [team.id], (err, session) => {
            if (session) return res.status(403).json({ error: 'This team account is already active on another device.' });

            const token = jwt.sign({ role: 'team', id: team.id, name: team.name }, JWT_SECRET);
            logEvent(team.id, 'LOGIN', { ip: req.ip });
            res.json({ token, role: 'team', team: { id: team.id, name: team.name, balance: team.balance, lifelines: team.lifelines, r2_eligible: !!team.r2_eligible, r3_eligible: !!team.r3_eligible, language: team.language } });
        });
    });
});

app.post('/api/violation', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.sendStatus(401);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if(decoded.role === 'team') {
            const lockTime = new Date(Date.now() + 5 * 60000).toISOString();
            db.run('UPDATE teams SET locked_until = ? WHERE id = ?', [lockTime, decoded.id], () => {
                logEvent(decoded.id, 'TAB_SWITCH_VIOLATION', { lockTime });
                db.get('SELECT socket_id FROM sessions WHERE team_id = ?', [decoded.id], (err, session) => {
                    if(session) {
                        const socket = io.sockets.sockets.get(session.socket_id);
                        if(socket) socket.disconnect(true);
                        db.run('DELETE FROM sessions WHERE team_id = ?', [decoded.id]);
                    }
                });
                res.json({ locked: true, lockTime });
                broadcastAdminData();
            });
        }
    } catch(e) {
        res.sendStatus(401);
    }
});

io.on('connection', (socket) => {
    let currentTeamId = null;
    let isAdmin = false;

    socket.on('authenticate', (token) => {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded.role === 'admin') {
                isAdmin = true;
                socket.join('admin');
                socket.emit('state_sync', appState);
                broadcastAdminData();
            } else if (decoded.role === 'team') {
                currentTeamId = decoded.id;
                db.run('INSERT INTO sessions (team_id, socket_id) VALUES (?, ?)', [currentTeamId, socket.id], function(err) {
                    if (err) {
                        socket.emit('force_logout', 'Session already active on another device.');
                        socket.disconnect();
                    } else {
                        socket.join('teams');
                        socket.emit('state_sync', appState);
                        sendTeamData(socket, currentTeamId);
                        broadcastAdminData();
                    }
                });
            }
        } catch(e) {
            socket.disconnect();
        }
    });

    socket.on('disconnect', () => {
        if (currentTeamId) {
            db.run('DELETE FROM sessions WHERE socket_id = ?', [socket.id], () => {
                broadcastAdminData();
            });
        }
    });

    // TEAM R1 ACTIONS
    socket.on('r1_select_difficulty', (difficulty) => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_1') return;
        
        db.get('SELECT r1_q_index FROM teams WHERE id = ?', [currentTeamId], (err, team) => {
            if(!team) return;

            if(!appState.r1.teamStates[currentTeamId]) {
                appState.r1.teamStates[currentTeamId] = {};
            }
            if(appState.r1.teamStates[currentTeamId].difficultySelected) return;

            const idx = team.r1_q_index - 1;
            const q = questionsR1[difficulty] && questionsR1[difficulty][idx];
            if(!q) return;

            appState.r1.teamStates[currentTeamId].difficultySelected = true;
            appState.r1.teamStates[currentTeamId].difficulty = difficulty;
            appState.r1.teamStates[currentTeamId].question = q;
            
            logEvent(currentTeamId, 'R1_DIFFICULTY_SELECTED', { difficulty, qIndex: team.r1_q_index });
            socket.emit('state_sync', appState);
            broadcastAdminData();
        });
    });

    socket.on('r1_lock_bet', (bet) => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_1') return;
        if(bet < 400) return;
        
        db.get('SELECT balance FROM teams WHERE id = ?', [currentTeamId], (err, team) => {
            if(!team || team.balance < bet) return;
            const ts = appState.r1.teamStates[currentTeamId];
            if(!ts || !ts.difficultySelected || ts.betLocked) return; 

            ts.bet = bet;
            ts.betLocked = true;
            ts.answered = false;
            
            logEvent(currentTeamId, 'R1_BET_LOCKED', { bet, qIndex: appState.r1.activeQuestionIndex });
            socket.emit('state_sync', appState);
            broadcastAdminData();
        });
    });

    socket.on('r1_next_question', () => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_1') return;
        const ts = appState.r1.teamStates[currentTeamId];
        if(!ts || !ts.answered) return;

        db.run('UPDATE teams SET r1_q_index = r1_q_index + 1 WHERE id = ?', [currentTeamId], () => {
            appState.r1.teamStates[currentTeamId] = {};
            sendTeamData(socket, currentTeamId);
            socket.emit('state_sync', appState);
            broadcastAdminData();
        });
    });

    socket.on('r1_use_lifeline', () => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_1') return;
        const ts = appState.r1.teamStates[currentTeamId];
        if(!ts || !ts.difficultySelected || ts.answered || ts.lifelineUsed) return;

        const costs = { 'Easy': 200, 'Medium': 400, 'Hard': 600 };
        const cost = costs[ts.difficulty] || 300;

        db.get('SELECT balance, lifelines FROM teams WHERE id = ?', [currentTeamId], (err, team) => {
            if(team && team.lifelines > 0 && team.balance >= cost) {
                db.run('UPDATE teams SET lifelines = lifelines - 1, balance = balance - ? WHERE id = ?', [cost, currentTeamId], () => {
                    ts.lifelineUsed = true;
                    // Note: activeQuestionIndex is technically global, but let's keep it for logging or leave it alone.
                    logEvent(currentTeamId, 'LIFELINE_USED', { qIndex: appState.r1.activeQuestionIndex });
                    sendTeamData(socket, currentTeamId);
                    socket.emit('state_sync', appState);
                    broadcastAdminData();
                });
            }
        });
    });

    socket.on('r1_submit_answer', (answer) => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_1') return;
        const ts = appState.r1.teamStates[currentTeamId];
        if(!ts || !ts.betLocked || ts.answered) return;

        const q = ts.question;
        if(!q) return;

        const isCorrect = (answer === q.answer);
        
        const mult = ts.difficulty === 'Easy' ? 1 : (ts.difficulty === 'Medium' ? 2.5 : 3.2);
        const reward = isCorrect ? Math.floor(ts.bet * mult) : -ts.bet;

        db.run('UPDATE teams SET balance = balance + ? WHERE id = ?', [reward, currentTeamId], () => {
            ts.answered = true;
            ts.isCorrect = isCorrect;
            ts.scoreGained = reward;
            ts.submittedAnswer = answer;
            
            logEvent(currentTeamId, 'R1_ANSWER', { isCorrect, reward, bet: ts.bet, diff: ts.difficulty });
            sendTeamData(socket, currentTeamId);
            socket.emit('state_sync', appState);
            broadcastAdminData();
        });
    });

    // TEAM R3 ACTIONS
    socket.on('r3_buzz', () => {
        if (!currentTeamId || appState.currentPhase !== 'ROUND_3' || !appState.r3.buzzerActive) return;
        
        db.get('SELECT r3_eligible FROM teams WHERE id = ?', [currentTeamId], (err, team) => {
            if(!team || !team.r3_eligible) return;
            if (appState.r3.buzzes.find(b => b.team_id === currentTeamId)) return;
            
            appState.r3.buzzes.push({ team_id: currentTeamId, timestamp: Date.now() });
            if(!appState.r3.answeringTeamId) {
                appState.r3.answeringTeamId = currentTeamId;
            }

            io.emit('state_sync', appState);
            broadcastAdminData();
        });
    });

    socket.on('update_team_profile', (data) => {
        if (!currentTeamId || !data) return;
        const newName = typeof data.name === 'string' ? data.name.trim().substring(0, 30) : null;
        const language = (data.language === 'C++') ? 'C++' : 'C';
        if (!newName || newName.length === 0) return;
        
        db.run('UPDATE teams SET name = ?, language = ? WHERE id = ?', [newName, language, currentTeamId], () => {
            sendTeamData(socket, currentTeamId);
            broadcastAdminData();
        });
    });

    // ADMIN ACTIONS
    socket.on('admin_action', (data) => {
        if (!isAdmin) return;
        const { action, payload } = data;

        if (action === 'SET_PHASE') {
            appState.currentPhase = payload;
            io.emit('state_sync', appState);
        }
        else if (action === 'R1_NEXT_Q') {
            appState.r1.activeQuestionIndex++;
            appState.r1.teamStates = {};
            io.emit('state_sync', appState);
            broadcastAdminData();
        }

        else if (action === 'FORCE_TEAM_NEXT_Q') {
            const teamId = payload;
            db.run('UPDATE teams SET r1_q_index = r1_q_index + 1 WHERE id = ?', [teamId], () => {
                appState.r1.teamStates[teamId] = {};
                io.emit('state_sync', appState);
                db.get('SELECT socket_id FROM sessions WHERE team_id = ?', [teamId], (err, session) => {
                    if (session) {
                        const teamSocket = io.sockets.sockets.get(session.socket_id);
                        if (teamSocket) sendTeamData(teamSocket, teamId);
                    }
                });
                broadcastAdminData();
            });
        }
        else if (action === 'FORCE_ALL_NEXT_Q') {
            db.run('UPDATE teams SET r1_q_index = r1_q_index + 1', () => {
                appState.r1.teamStates = {};
                io.emit('state_sync', appState);
                io.emit('force_refresh'); // easiest way to sync all teams instantly
                broadcastAdminData();
            });
        }
        else if (action === 'RESET_TEAM_Q1') {
            const teamIdToReset = payload;
            db.run('UPDATE teams SET r1_q_index = 1 WHERE id = ?', [teamIdToReset], () => {
                appState.r1.teamStates[teamIdToReset] = {};
                io.emit('force_refresh');
                io.emit('state_sync', appState);
                broadcastAdminData();
            });
        }
        else if (action === 'R3_NEXT_Q') {
            appState.r3.activeQuestionIndex++;
            appState.r3.questionState = 'HIDDEN';
            appState.r3.buzzerActive = false;
            appState.r3.buzzes = [];
            appState.r3.answeringTeamId = null;
            io.emit('state_sync', appState);
        }
        else if (action === 'R3_REVEAL') {
            appState.r3.questionState = 'REVEALED';
            io.emit('state_sync', appState);
        }
        else if (action === 'R3_TOGGLE_BUZZER') {
            appState.r3.buzzerActive = payload;
            io.emit('state_sync', appState);
        }
        else if (action === 'R3_MARK_CORRECT') {
            const teamId = appState.r3.answeringTeamId;
            if(teamId) {
                db.run('INSERT INTO r3_scores (team_id, score) VALUES (?, 1) ON CONFLICT(team_id) DO UPDATE SET score = score + 1', [teamId], () => {
                    appState.r3.buzzerActive = false;
                    appState.r3.answeringTeamId = null; // round over
                    io.emit('state_sync', appState);
                    broadcastAdminData();
                });
            }
        }
        else if (action === 'R3_MARK_WRONG') {
            // pass to next
            const currentIndex = appState.r3.buzzes.findIndex(b => b.team_id === appState.r3.answeringTeamId);
            if (currentIndex !== -1 && currentIndex + 1 < appState.r3.buzzes.length) {
                appState.r3.answeringTeamId = appState.r3.buzzes[currentIndex + 1].team_id;
            } else {
                appState.r3.answeringTeamId = null; // No one else buzzed
            }
            io.emit('state_sync', appState);
        }
        else if (action === 'UNLOCK_TEAM') {
            db.run('UPDATE teams SET locked_until = NULL WHERE id = ?', [payload], () => {
                broadcastAdminData();
            });
        }
        else if (action === 'R3_TOGGLE_ELIGIBILITY') {
            const { teamId, eligible } = payload;
            db.run('UPDATE teams SET r3_eligible = ? WHERE id = ?', [eligible ? 1 : 0, teamId], () => {
                db.get('SELECT socket_id FROM sessions WHERE team_id = ?', [teamId], (err, session) => {
                    if (session) {
                        const socket = io.sockets.sockets.get(session.socket_id);
                        if (socket) sendTeamData(socket, teamId);
                    }
                });
                broadcastAdminData();
            });
        }
        else if (action === 'R2_TOGGLE_ELIGIBILITY') {
            const { teamId, eligible } = payload;
            db.run('UPDATE teams SET r2_eligible = ? WHERE id = ?', [eligible ? 1 : 0, teamId], () => {
                db.get('SELECT socket_id FROM sessions WHERE team_id = ?', [teamId], (err, session) => {
                    if (session) {
                        const socket = io.sockets.sockets.get(session.socket_id);
                        if (socket) sendTeamData(socket, teamId);
                    }
                });
                broadcastAdminData();
            });
        }
        else if (action === 'AUTO_QUALIFY_R2') {
            db.all('SELECT id FROM teams ORDER BY balance DESC LIMIT 8', (err, topTeams) => {
                if (topTeams && topTeams.length > 0) {
                    const ids = topTeams.map(t => t.id);
                    db.run(`UPDATE teams SET r2_eligible = 1 WHERE id IN (${ids.join(',')})`, () => {
                        broadcastAdminData();
                        db.all('SELECT * FROM sessions', (err, sessions) => {
                            sessions.forEach(s => {
                                const socket = io.sockets.sockets.get(s.socket_id);
                                if(socket) sendTeamData(socket, s.team_id);
                            });
                        });
                    });
                }
            });
        }
    });
});

function sendTeamData(socket, teamId) {
    db.get('SELECT id, name, balance, lifelines, r2_eligible, r3_eligible, language, r1_q_index FROM teams WHERE id = ?', [teamId], (err, team) => {
        if(team) {
            team.r2_eligible = !!team.r2_eligible;
            team.r3_eligible = !!team.r3_eligible;
            socket.emit('team_data', team);
        }
    });
}

function broadcastAdminData() {
    db.all('SELECT * FROM teams', (err, teams) => {
        db.all('SELECT * FROM sessions', (err, sessions) => {
            db.all('SELECT * FROM r3_scores', (err, r3scores) => {
                const sMap = {};
                sessions.forEach(s => sMap[s.team_id] = true);
                
                const r3Map = {};
                r3scores.forEach(s => r3Map[s.team_id] = s.score);

                const data = teams.map(t => ({
                    ...t,
                    online: !!sMap[t.id],
                    r3score: r3Map[t.id] || 0,
                    r1state: appState.r1.teamStates[t.id] || null,
                    buzzerPos: appState.r3.buzzes.findIndex(b => b.team_id === t.id)
                }));
                io.to('admin').emit('admin_teams', data);
            });
        });
    });
}

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
