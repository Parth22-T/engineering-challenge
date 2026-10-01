const db = require('./db');
db.serialize(() => {
    db.run("ALTER TABLE teams ADD COLUMN r1_q_index INTEGER DEFAULT 1", (err) => {
        if(err) console.log(err.message);
        else console.log("Added r1_q_index to teams!");
    });
});
