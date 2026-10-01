const db = require('./db');
const bcrypt = require('bcrypt');

const dummyTeams = [
  { name: "Dummy Team A", username: "test_a", password: "passwordA" },
  { name: "Dummy Team B", username: "test_b", password: "passwordB" },
  { name: "Dummy Team C", username: "test_c", password: "passwordC" }
];

async function addDummies() {
    db.serialize(() => {
        let stmt = db.prepare(`
            INSERT INTO teams (username, password, name, balance, lifelines, disabled, r2_eligible, r3_eligible, language, r1_q_index)
            VALUES (?, ?, ?, 10000, 2, 0, 0, 0, 'C', 1)
        `);

        let count = 0;
        dummyTeams.forEach(async (t) => {
            const hash = await bcrypt.hash(t.password, 10);
            stmt.run(t.username, hash, t.name, (err) => {
                if(err) console.error("Error inserting", t.username, err);
                count++;
                if (count === dummyTeams.length) {
                    stmt.finalize();
                    console.log("Successfully added 3 dummy teams!");
                }
            });
        });
    });
}

addDummies();
