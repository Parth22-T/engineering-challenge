const db = require('./db');

db.serialize(() => {
    console.log("Resetting all teams to initial state...");
    db.run("UPDATE teams SET balance = 10000, lifelines = 2, locked_until = NULL, r2_eligible = 0, r3_eligible = 0, name = 'Team ' || substr(username, 5)", (err) => {
        if(err) console.error(err);
        else console.log("Teams reset.");
    });
    
    db.run("DELETE FROM r3_scores", (err) => {
        if(err) console.error(err);
        else console.log("Round 3 scores cleared.");
    });
    
    db.run("DELETE FROM sessions", (err) => {
        if(err) console.error(err);
        else console.log("All sessions cleared.");
    });
    
    // Optional: Clear logs if they want a totally fresh run
    // db.run("DELETE FROM logs");
    
    console.log("Progress reset successfully. Restart the node server or refresh Admin Dashboard.");
});
