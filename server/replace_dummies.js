const db = require('./db');
const bcrypt = require('bcrypt');

const newDummies = [
  { name: "Dummy X", username: "test_x", password: "passwordX" },
  { name: "Dummy Y", username: "test_y", password: "passwordY" },
  { name: "Dummy Z", username: "test_z", password: "passwordZ" }
];

async function replaceDummies() {
    db.serialize(() => {
        db.run(`DELETE FROM teams WHERE username IN ('test_a', 'test_b', 'test_c', 'test_x', 'test_y', 'test_z')`, (err) => {
            if(err) console.error("Error deleting old dummies", err);
            
            let stmt = db.prepare(`
                INSERT INTO teams (username, password, name, balance, lifelines, disabled, r2_eligible, r3_eligible, language, r1_q_index)
                VALUES (?, ?, ?, 10000, 2, 0, 0, 0, 'C', 1)
            `);

            let count = 0;
            newDummies.forEach(async (t) => {
                const hash = await bcrypt.hash(t.password, 10);
                stmt.run(t.username, hash, t.name, (err) => {
                    if(err) console.error("Error inserting", t.username, err);
                    count++;
                    if (count === newDummies.length) {
                        stmt.finalize();
                        console.log("Successfully replaced dummy teams!");
                    }
                });
            });
        });
    });
}

replaceDummies();
