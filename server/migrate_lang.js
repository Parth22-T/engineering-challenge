const db = require('./db');
db.serialize(() => {
    db.run("ALTER TABLE teams ADD COLUMN language TEXT DEFAULT 'C'", (err) => {
        if(err) console.log(err.message);
        else console.log("Language column added!");
    });
});
