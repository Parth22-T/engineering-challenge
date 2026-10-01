const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS teams (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                name TEXT,
                balance INTEGER DEFAULT 10000,
                lifelines INTEGER DEFAULT 2,
                locked_until DATETIME,
                disabled BOOLEAN DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS sessions (
                team_id INTEGER PRIMARY KEY,
                socket_id TEXT,
                login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (team_id) REFERENCES teams (id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS r1_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                level TEXT, 
                question TEXT,
                options TEXT, 
                answer TEXT,
                hint TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS r3_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT,
                answer TEXT,
                hint TEXT
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS r3_scores (
                team_id INTEGER PRIMARY KEY,
                score INTEGER DEFAULT 0,
                FOREIGN KEY (team_id) REFERENCES teams (id)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS system_state (
                key TEXT PRIMARY KEY,
                value TEXT
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                team_id INTEGER,
                event_type TEXT,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });
    }
});

module.exports = db;
