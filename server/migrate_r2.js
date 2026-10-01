const db = require('./db');

db.serialize(() => {
    db.run("ALTER TABLE teams ADD COLUMN r2_eligible BOOLEAN DEFAULT 0", (err) => {
        if(err) {
            console.error("Migration error:", err.message);
        } else {
            console.log("Migration successful: r2_eligible added.");
        }
    });
});
