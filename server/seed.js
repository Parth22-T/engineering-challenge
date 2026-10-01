const db = require('./db');
const bcrypt = require('bcrypt');

const seed = () => {
    // Insert dummy teams
    const pass = bcrypt.hashSync('password123', 10);
    const teams = [
        ['TEAM001', pass, 'Team Alpha'],
        ['TEAM002', pass, 'Team Beta'],
        ['TEAM003', pass, 'Team Gamma'],
    ];

    db.serialize(() => {
        const stmt = db.prepare('INSERT INTO teams (username, password, name) VALUES (?, ?, ?)');
        for (let t of teams) {
            stmt.run(t, (err) => {
                if(err) console.log("Team exists or error", err.message);
            });
        }
        stmt.finalize();

        // Insert some dummy R1 questions
        const r1q = db.prepare('INSERT INTO r1_questions (level, question, options, answer, hint) VALUES (?, ?, ?, ?, ?)');
        for(let i=1; i<=10; i++) {
            r1q.run(['Easy', `Easy Question ${i}`, JSON.stringify(['A','B','C','D']), 'A', `Hint for easy ${i}`]);
            r1q.run(['Medium', `Medium Question ${i}`, JSON.stringify(['A','B','C','D']), 'B', `Hint for medium ${i}`]);
            r1q.run(['Hard', `Hard Question ${i}`, JSON.stringify(['A','B','C','D']), 'C', `Hint for hard ${i}`]);
        }
        r1q.finalize();

        // Insert some dummy R3 questions
        const r3q = db.prepare('INSERT INTO r3_questions (question, answer, hint) VALUES (?, ?, ?)');
        for(let i=1; i<=12; i++) {
            r3q.run([`Riddle ${i}`, `Answer ${i}`, `Hint ${i}`]);
        }
        r3q.finalize();
    });

    console.log("Seed complete");
}

setTimeout(seed, 1000); // Wait for db to connect
