const db = require('./db');
const bcrypt = require('bcrypt');

const teamsData = [
  { name: "404", username: "404_aanya", password: "404@Aanya26" },
  { name: "Waffle", username: "waffle_aariz", password: "Waffle@Aariz26" },
  { name: "404 Found", username: "404found_aditya", password: "404@Aditya26" },
  { name: "ARS Bot", username: "arsbot_arav", password: "ARS@Arav26" },
  { name: "LockedBotzz", username: "lockedbotzz_archit", password: "Lock@Archit26" },
  { name: "Bug Busters", username: "bugbusters_atharv", password: "Bug@Atharv26" },
  { name: "Masti", username: "masti_atharv", password: "Masti@Mehar26" },
  { name: "Stark Protocol", username: "starkprotocol_atharva", password: "Stark@Atharva26" },
  { name: "All Seasons", username: "allseasons_ayush", password: "Season@Ayush26" },
  { name: "Power Rangers", username: "powerrangers_chahak", password: "Power@Chahak26" },
  { name: "404", username: "404_daksh", password: "404@Daksh26" },
  { name: "Baba Group", username: "babagroup_ganveer", password: "Baba@Ganveer26" },
  { name: "Kings", username: "kings_kshudhant", password: "Kings@Kshudhant26" },
  { name: "MoodyMocha", username: "moodymocha_kunalika", password: "Mocha@Kunalika26" },
  { name: "Co.", username: "co_meet", password: "Co@Meet26" },
  { name: "STELLANTIS", username: "stellantis_nidhish", password: "Stell@Nidhish26" },
  { name: "Syntax Error", username: "syntaxerror_pranshu", password: "Syntax@Pranshu26" },
  { name: "Kasukabe Defence Group", username: "kasukabe_pratham", password: "Kasu@Pratham26" },
  { name: "Smashers", username: "smashers_rishi", password: "Smash@Rishi26" },
  { name: "Ctrl Freaks", username: "ctrlfreaks_rishi", password: "Ctrl@Rishi26" },
  { name: "TechBuzz", username: "techbuzz_rishit", password: "Tech@Rishit26" },
  { name: "Hackers", username: "hackers_samik", password: "Hack@Samik26" },
  { name: "Git Happens", username: "githappens_samriddhi", password: "Git@Samriddhi26" },
  { name: "Matrixx", username: "matrixx_shraddha", password: "Matrix@Shraddha26" },
  { name: "Kalu Lovers", username: "kalulovers_somy", password: "Kalu@Somy26" },
  { name: "Code Busters", username: "codebusters_soumya", password: "Code@Soumya26" },
  { name: "PRIME SUSPECTS", username: "primesuspects_suhani", password: "Prime@Suhani26" },
  { name: "Kalra Haters", username: "kalrahaters_vighnesh", password: "Kalra@Vighnesh26" },
  { name: "Beardos", username: "beardos_vinayak", password: "Beard@Vinayak26" }
];

async function seedTeams() {
    db.serialize(() => {
        db.run('DELETE FROM sessions'); // wipe active sessions
        db.run('DELETE FROM teams'); // Clear out old teams

        let stmt = db.prepare(`
            INSERT INTO teams (username, password, name, balance, lifelines, disabled, r2_eligible, r3_eligible, language, r1_q_index)
            VALUES (?, ?, ?, 10000, 2, 0, 0, 0, 'C', 1)
        `);

        let count = 0;
        teamsData.forEach(async (t) => {
            const hash = await bcrypt.hash(t.password, 10);
            stmt.run(t.username, hash, t.name, (err) => {
                if(err) console.error("Error inserting", t.username, err);
                count++;
                if (count === teamsData.length) {
                    stmt.finalize();
                    console.log("Successfully seeded 29 custom teams!");
                }
            });
        });
    });
}

seedTeams();
