const db = require('./db');
const bcrypt = require('bcrypt');
const fs = require('fs');

function generateRandomString(length, chars) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function regenerate() {
    db.serialize(() => {
        db.all('SELECT id, name FROM teams WHERE name NOT LIKE "Dummy%" ORDER BY id ASC', async (err, rows) => {
            if (err) throw err;

            let output = "### New Team Credentials\n\n";
            let promises = [];
            
            for (let i = 0; i < rows.length; i++) {
                const team = rows[i];
                const newUsername = `team_${i + 1}`;
                const newPassword = generateRandomString(3, 'ABCDEFGHJKLMNPQRSTUVWXYZ') + generateRandomString(3, '23456789'); // avoid 1,I,O,0 for readability
                
                output += `**${i + 1}. ${team.name}**\n`;
                output += `- Username: \`${newUsername}\`\n`;
                output += `- Password: \`${newPassword}\`\n\n`;

                const hash = await bcrypt.hash(newPassword, 10);
                promises.push(new Promise((resolve, reject) => {
                    db.run('UPDATE teams SET username = ?, password = ? WHERE id = ?', [newUsername, hash, team.id], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }));
            }

            Promise.all(promises).then(() => {
                fs.writeFileSync('new_credentials.md', output);
                console.log("Credentials generated and written to new_credentials.md");
            }).catch(console.error);
        });
    });
}

regenerate();
