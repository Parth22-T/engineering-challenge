const db = require('./db');

const r3_real = [
  {
    question: "I have keys, but no locks. I have a space, but no room. I have an enter, but nowhere to go.\n\n[ CLUE ] QWERTY | SPACE | ENTER | ASCII",
    answer: "KEYBOARD",
    hint: "You are probably touching me right now. / My “keys” are inputs, not locks."
  },
  {
    question: "A security sensor has no middle state.\nIt reports:\nDOOR = 1\nWINDOW = 0\n\nThe guard says: “I understand only two worlds. But from these two worlds, computers build everything you see.”\n\nThe riddle asks for the unit, not the number.\n0 ↔ OFF / FALSE\n1 ↔ ON / TRUE",
    answer: "BIT",
    hint: "It is smaller than a byte. / It represents one binary state."
  },
  {
    question: "You enter a room marked START.\nYou open a door marked CHECK.\nThe door sends you back to START.\nAgain.\nAgain.\nAgain.\n\nOn the terminal, someone left this behind:\nwhile (true) {\n  repeat();\n}",
    answer: "INFINITE LOOP",
    hint: "There is no terminating condition. / The instructions keep executing."
  },
  {
    question: "A vault contains a value worth millions.\nA strange guide leads to it, but the guide itself contains no treasure.\n\nIt whispers:\n“Don't ask me what is stored. Ask me where it is.”\n\nA C programmer has written:\nint treasure = 42;\nint *guide = &treasure;",
    answer: "POINTER",
    hint: "Think memory address. / In C/C++, * and & are major clues."
  },
  {
    question: "Two digital guards stand at the final door.\n\nGuard A says: NO\nGuard B says: YES\n\nThe door opens because at least one condition is true.\n\nThe system labels the rule:\nA ? B = 1\n0 ? 1 = 1",
    answer: "OR GATE",
    hint: "This is a Boolean operation. / Think of the word meaning “either this or that.”"
  },
  {
    question: "A program works perfectly for everyone except one user.\nThe developer says:\n“Nothing is wrong with the computer. Something is wrong with the instructions.”\n\nThe error hides somewhere inside the code and changes the program's behaviour.\n\nINPUT → CODE → ??? → WRONG OUTPUT",
    answer: "BUG",
    hint: "Developers hunt this. / Its name sounds biological."
  },
  {
    question: "I have a name.\nI have a value.\nI can change while the program is running.\n\nBut I am not a person, and my “name” is not my location.\n\nA tiny program says:\nscore = 100\nscore = score + 50",
    answer: "VARIABLE",
    hint: "Think storage inside a program. / The value can change."
  },
  {
    question: "A password enters a machine.\nThe machine refuses to keep the password itself.\nInstead, it creates a strange fixed-looking fingerprint.\n\nChange one character and the fingerprint changes dramatically.\n\nThe terminal shows:\npassword → ? → 5f4dcc3b5aa765d61d8327deb882cf99",
    answer: "HASH",
    hint: "It is not encryption. / The output is used as a representation of data."
  },
  {
    question: "You isolate one infected computer.\nMinutes later, another machine is infected.\nNo human carried a file across.\n\nThe thing inside the first machine found a way to spread by itself.\n\nHOST A → NETWORK → HOST B → NETWORK → ...",
    answer: "WORM",
    hint: "It is malware. / It can spread automatically."
  },
  {
    question: "A message must travel through a room full of strangers.\nEveryone is allowed to know one key.\nOnly the owner knows the other.\n\nThe two keys work together, but they do not have the same job.\n\nPUBLIC → [ ? ] → PRIVATE",
    answer: "PUBLIC-KEY CRYPTOGRAPHY",
    hint: "Think cryptography. / RSA is a famous example."
  },
  {
    question: "I cannot think.\nI cannot choose my own goal.\nYet I can make a machine perform thousands of actions.\n\nGive me instructions and I execute them.\nGive me a bad condition and I may never stop.\n\nI can contain variables, loops and functions.\n\nINPUT → INSTRUCTIONS → EXECUTION → OUTPUT",
    answer: "PROGRAM",
    hint: "I am made by programmers. / I am more than a single instruction."
  },
  {
    question: "I can be entered, but you cannot walk into me.\nI can be broken, but I am not glass.\nI can be strong, but I have no muscles.\nI can be forgotten, but I can also unlock everything.\n\nThe terminal adds one final line:\n“Never reveal me to the person trying to get in.”\n\nLOGIN → [ ???????? ] → ACCESS GRANTED",
    answer: "PASSWORD",
    hint: "It is a secret used for authentication. / If you reveal it, the lock loses much of its purpose."
  }
];

const seed = () => {
    db.serialize(() => {
        // Clear old r3 questions
        db.run('DELETE FROM r3_questions');
        db.run('DELETE FROM sqlite_sequence WHERE name="r3_questions"'); // Reset autoincrement

        const r3q = db.prepare('INSERT INTO r3_questions (question, answer, hint) VALUES (?, ?, ?)');
        for(let r of r3_real) {
            r3q.run([r.question, r.answer, r.hint]);
        }
        r3q.finalize();
    });

    console.log("Round 3 real questions seeded successfully!");
}

setTimeout(seed, 1000); // Wait for db to connect
