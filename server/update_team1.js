const db = require('./db');
const bcrypt = require('bcrypt');

async function updateTeam1() {
    const newUsername = '404_aanya_new';
    const newPassword = 'Aanya@404New';
    const hash = await bcrypt.hash(newPassword, 10);

    db.run(
        "UPDATE teams SET username = ?, password = ? WHERE username = '404_aanya'",
        [newUsername, hash],
        function(err) {
            if (err) {
                console.error("Error updating team 1:", err);
            } else {
                console.log(`Team 1 updated. Rows affected: ${this.changes}`);
            }
        }
    );
}

updateTeam1();
