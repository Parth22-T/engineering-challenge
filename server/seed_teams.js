const db = require('./db');
const bcrypt = require('bcrypt');

const seed = () => {
    db.serialize(() => {
        // Clear all teams and sessions first
        db.run('DELETE FROM sessions');
        db.run('DELETE FROM teams');
        
        const stmt = db.prepare('INSERT INTO teams (username, password, name) VALUES (?, ?, ?)');
        
        for (let i = 1; i <= 20; i++) {
            const num = i.toString().padStart(3, '0');
            const username = `TEAM${num}`;
            const plainPassword = `pass${num}`;
            const hashedPassword = bcrypt.hashSync(plainPassword, 10);
            const teamName = `Team ${i}`;
            
            stmt.run([username, hashedPassword, teamName]);
        }
        stmt.finalize();
    });

    console.log("Database cleared. Strictly 20 Teams seeded successfully!");
}

setTimeout(seed, 1000);
