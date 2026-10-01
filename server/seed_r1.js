const db = require('./db');

const r1_questions = [
  // EASY
  {
    level: "Easy",
    question_c: "int a[5] = {2,4,6,8,10};\nint *p = a;\nprintf(\"%d\", *(p+2) + *(a+3) - a[1]);",
    question_cpp: "int a[5] = {2,4,6,8,10};\nint *p = a;\ncout << *(p+2) + *(a+3) - a[1];",
    options: ["10", "12", "14", "8"],
    answer: "A",
    hint: "Array indexing starts from 0. Work out p+2 and a+3 first, then substitute their values into the expression."
  },
  {
    level: "Easy",
    question_c: "int f(int n){\n static int sum = 0;\n if(n == 0) return sum;\n sum += n;\n return f(n-1);\n}\nint main(){\n int x = f(3);\n printf(\"%d\", x + f(0));\n}",
    question_cpp: "int f(int n){\n static int sum = 0;\n if(n == 0) return sum;\n sum += n;\n return f(n-1);\n}\nint main(){\n int x = f(3);\n cout << x + f(0);\n}",
    options: ["6", "12", "9", "3"],
    answer: "B",
    hint: "static sum is shared across recursive calls and keeps its value after f(3) finishes. Add 3+2+1, then notice what f(0) returns."
  },
  {
    level: "Easy",
    question_c: "int a[4] = {5, 10, 15, 20};\nint i = 0;\nint sum = 0;\nwhile(i < 4){\n sum += a[i++];\n}\nprintf(\"%d\", sum + i);",
    question_cpp: "int a[4] = {5, 10, 15, 20};\nint i = 0;\nint sum = 0;\nwhile(i < 4){\n sum += a[i++];\n}\ncout << sum + i;",
    options: ["50", "54", "55", "5"],
    answer: "B",
    hint: "The loop adds every array element exactly once because i increases after each access. After the loop, i has moved one position past the last valid index."
  },
  {
    level: "Easy",
    question_c: "int x = 10;\nprintf(\"%d %d\", x++, ++x);",
    question_cpp: "int x = 10;\ncout << x++ << \" \" << ++x;",
    options: ["10 12", "11 12", "Undefined Behavior", "10 11"],
    answer: "C",
    hint: "Modifying a variable multiple times in the same expression or sequence point without a defined sequence order causes Undefined Behavior."
  },
  {
    level: "Easy",
    question_c: "int x = 15, y = 25;\nx ^= y;\ny ^= x;\nx ^= y;\nprintf(\"%d %d\", x, y);",
    question_cpp: "int x = 15, y = 25;\nx ^= y;\ny ^= x;\nx ^= y;\ncout << x << \" \" << y;",
    options: ["15 25", "25 15", "0 0", "40 40"],
    answer: "B",
    hint: "This is the classic XOR swap algorithm. It swaps the values of x and y without using a temporary variable."
  },
  {
    level: "Easy",
    question_c: "char str[] = \"WORLD\";\nprintf(\"%c\", *(str+2) + 2);",
    question_cpp: "char str[] = \"WORLD\";\ncout << (char)(*(str+2) + 2);",
    options: ["S", "T", "U", "R"],
    answer: "B",
    hint: "Find the character at str[2]. Add 2 to its ASCII value. str[2] is 'R'. 'R' + 2 = 'T'."
  },
  {
    level: "Easy",
    question_c: "int a = 4, b = 5;\nprintf(\"%d\", a | b & a);",
    question_cpp: "int a = 4, b = 5;\ncout << (a | b & a);",
    options: ["4", "5", "0", "1"],
    answer: "A",
    hint: "Bitwise AND (&) has higher precedence than bitwise OR (|). Evaluate b & a first, then a | result."
  },
  {
    level: "Easy",
    question_c: "int arr[] = {10, 20, 30};\nprintf(\"%d\", 2[arr]);",
    question_cpp: "int arr[] = {10, 20, 30};\ncout << 2[arr];",
    options: ["10", "20", "30", "Error"],
    answer: "C",
    hint: "In C/C++, a[b] is exactly equivalent to *(a + b). Thus, 2[arr] is the same as arr[2]."
  },
  {
    level: "Easy",
    question_c: "int i = 7;\nif(i = 0) printf(\"A\");\nelse printf(\"B\");",
    question_cpp: "int i = 7;\nif(i = 0) cout << \"A\";\nelse cout << \"B\";",
    options: ["A", "B", "AB", "Error"],
    answer: "B",
    hint: "Notice that it is an assignment (=), not a comparison (==). i becomes 0, which is false."
  },
  {
    level: "Easy",
    question_c: "int i;\nfor(i = 0; i < 8; i++);\nprintf(\"%d\", i);",
    question_cpp: "int i;\nfor(i = 0; i < 8; i++);\ncout << i;",
    options: ["7", "8", "0", "Error"],
    answer: "B",
    hint: "The loop has a semicolon at the end, meaning its body is empty. i increments until the condition fails (i = 8)."
  },

  // MEDIUM
  {
    level: "Medium",
    question_c: "int arr[4] = {10, 20, 30, 40};\nint arr2[4] = {10, 30, 20, 40};\nprintf(\"%lu\", sizeof(arr) / sizeof(arr2[2]));",
    question_cpp: "int arr[4] = {10, 20, 30, 40};\nint arr2[4] = {10, 30, 20, 40};\ncout << sizeof(arr) / sizeof(arr2[2]);",
    options: ["4", "8", "16", "1"],
    answer: "A",
    hint: "sizeof(arr) gives the total bytes for 4 integers. Divide total array size by one element size."
  },
  {
    level: "Medium",
    question_c: "int fib(int n){\n if(n <= 1) return n;\n return fib(n-1) + fib(n-2);\n}\nint main(){ printf(\"%d\", fib(5)); }",
    question_cpp: "int fib(int n){\n if(n <= 1) return n;\n return fib(n-1) + fib(n-2);\n}\nint main(){ cout << fib(5); }",
    options: ["3", "4", "5", "8"],
    answer: "C",
    hint: "Classic Fibonacci sequence: fib(0)=0, fib(1)=1, fib(2)=1, fib(3)=2, fib(4)=3, fib(5)=5."
  },
  {
    level: "Medium",
    question_c: "int a = 30, b = 15;\nint c = (a > b) ? a : b;\nprintf(\"%d\", c - 10);",
    question_cpp: "int a = 30, b = 15;\nint c = (a > b) ? a : b;\ncout << c - 10;",
    options: ["20", "15", "10", "30"],
    answer: "A",
    hint: "The ternary operator chooses the larger of a and b. Since a is 30, c becomes 30 before subtracting 10."
  },
  {
    level: "Medium",
    question_c: "char *s = \"C Programming\";\ns += 3;\nprintf(\"%s\", s);",
    question_cpp: "const char *s = \"C++ Programming\";\ns += 5;\ncout << s;",
    options: ["Programming", "rogramming", "C Programming", "gramming"],
    answer: "B",
    hint: "Pointer arithmetic moves the pointer forward by N characters, skipping the first N characters of the string."
  },
  {
    level: "Medium",
    question_c: "int x = 6, y = 2, z;\nz = x-- - y;\nprintf(\"%d %d %d\", x, y, z);",
    question_cpp: "int x = 6, y = 2, z;\nz = x-- - y;\ncout << x << \" \" << y << \" \" << z;",
    options: ["5 2 4", "6 2 4", "5 2 3", "6 2 3"],
    answer: "A",
    hint: "x-- is post-decrement. It uses the original value of x (6) for the subtraction (6 - 2 = 4) before decrementing x to 5."
  },
  {
    level: "Medium",
    question_c: "int n = 3;\nprintf(\"%d\", n << 3 >> 1);",
    question_cpp: "int n = 3;\ncout << (n << 3 >> 1);",
    options: ["12", "6", "24", "3"],
    answer: "A",
    hint: "Left shift by 3 multiplies by 8 (3*8=24). Right shift by 1 divides by 2 (24/2=12)."
  },
  {
    level: "Medium",
    question_c: "struct { int a : 1; int b : 2; } bit;\nbit.a = 1;\nbit.b = 2;\nprintf(\"%d %d\", bit.a, bit.b);",
    question_cpp: "struct { int a : 1; int b : 2; } bit;\nbit.a = 1;\nbit.b = 2;\ncout << bit.a << \" \" << bit.b;",
    options: ["1 2", "-1 -2", "1 -2", "Error"],
    answer: "B",
    hint: "Signed bit fields. A 2-bit signed int holds -2 to 1. Assigning 2 causes overflow and sign extension to -2."
  },
  {
    level: "Medium",
    question_c: "int a = -5;\nif(a > sizeof(a)) printf(\"A\"); else printf(\"B\");",
    question_cpp: "int a = -5;\nif(a > sizeof(a)) cout << \"A\"; else cout << \"B\";",
    options: ["A", "B", "Error", "Undefined"],
    answer: "A",
    hint: "sizeof returns an unsigned type (size_t). The signed integer 'a' (-5) is implicitly converted to an unsigned type, making it a massive positive number."
  },
  {
    level: "Medium",
    question_c: "int i = 1;\nswitch(i){\n case 1: printf(\"1\");\n case 2: printf(\"2\"); break;\n default: printf(\"3\");\n}",
    question_cpp: "int i = 1;\nswitch(i){\n case 1: cout << \"1\";\n case 2: cout << \"2\"; break;\n default: cout << \"3\";\n}",
    options: ["1", "12", "123", "2"],
    answer: "B",
    hint: "Missing break statement in case 1 causes fallthrough into case 2."
  },
  {
    level: "Medium",
    question_c: "char str1[] = \"World\";\nchar str2[] = \"World\";\nif(str1 == str2) printf(\"EQ\");\nelse printf(\"NEQ\");",
    question_cpp: "char str1[] = \"World\";\nchar str2[] = \"World\";\nif(str1 == str2) cout << \"EQ\";\nelse cout << \"NEQ\";",
    options: ["EQ", "NEQ", "Error", "Undefined"],
    answer: "B",
    hint: "Comparing two array names compares their memory addresses, not their contents. They are stored in different locations."
  },

  // HARD
  {
    level: "Hard",
    question_c: "int a = 4; // 100\nint b = 6; // 110\nint c = (a << 1) | b;\nprintf(\"%d\", c);",
    question_cpp: "int a = 4; // 100\nint b = 6; // 110\nint c = (a << 1) | b;\ncout << c;",
    options: ["10", "12", "14", "16"],
    answer: "C",
    hint: "Convert 4 and 6 to binary: 100 and 110. Left-shift 4 by one place (1000), then apply bitwise OR with 6 (0110)."
  },
  {
    level: "Hard",
    question_c: "float *ptr;\nfloat arr[] = {1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 10.1, 20.2};\nptr = arr + 5;\nprintf(\"%.1f\", ptr[2] + 4[ptr]);",
    question_cpp: "float *ptr;\nfloat arr[] = {1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 10.1, 20.2};\nptr = arr + 5;\ncout << ptr[2] + 4[ptr];",
    options: ["18.9", "16.5", "20.2", "15.4"],
    answer: "A",
    hint: "ptr = arr + 5 points to arr[5]. Therefore ptr[2] means arr[7], while 4[ptr] is another way of writing ptr[4], i.e. arr[9]. Add those two elements."
  },
  {
    level: "Hard",
    question_c: "int x = 512;\nchar *p = (char *)&x;\nprintf(\"%d\", *p);",
    question_cpp: "int x = 512;\nchar *p = (char *)&x;\ncout << (int)*p;",
    options: ["0", "2", "512", "Error"],
    answer: "A",
    hint: "Assuming a Little-Endian architecture, 512 (0x00000200) is stored as 00 02 00 00. A char pointer reads the first byte, which is 0."
  },
  {
    level: "Hard",
    question_c: "void swap(int *x, int *y) { *x ^= *y ^= *x ^= *y; }\nint main() {\n int a = 10; swap(&a, &a);\n printf(\"%d\", a);\n}",
    question_cpp: "void swap(int &x, int &y) { x ^= y ^= x ^= y; }\nint main() {\n int a = 10; swap(a, a);\n cout << a;\n}",
    options: ["10", "0", "20", "Undefined"],
    answer: "B",
    hint: "When passing the same variable twice, the XOR swap algorithm XORs the variable with itself, resulting in 0."
  },
  {
    level: "Hard",
    question_c: "int a = ~((1 << 31) - 1);\nprintf(\"%d\", a);",
    question_cpp: "int a = ~((1 << 31) - 1);\ncout << a;",
    options: ["0", "-1", "2147483648", "INT_MAX"],
    answer: "A",
    hint: "(1 << 31) - 1 evaluates to INT_MAX (0111...11). ~ of INT_MAX flips all bits, including the sign bit, resulting in 0."
  },
  {
    level: "Hard",
    question_c: "int main() {\n if(printf(\"X\")) printf(\"Y\");\n else printf(\"Z\");\n}",
    question_cpp: "int main() {\n if(cout << \"X\") cout << \"Y\";\n else cout << \"Z\";\n}",
    options: ["XY", "X", "XZ", "Error"],
    answer: "A",
    hint: "printf returns the number of characters printed (1), which is true. cout returns the stream object, which evaluates to true."
  },
  {
    level: "Hard",
    question_c: "int arr[2][2] = {{5,6},{7,8}};\nprintf(\"%d \", **arr + 2);\nprintf(\"%d\", *(*arr + 1));",
    question_cpp: "int arr[2][2] = {{5,6},{7,8}};\ncout << **arr + 2 << \" \" << *(*arr + 1);",
    options: ["7 6", "6 7", "5 8", "Error"],
    answer: "A",
    hint: "**arr is arr[0][0]=5. **arr + 2 = 7. *(*arr + 1) is arr[0][1]=6."
  },
  {
    level: "Hard",
    question_c: "#define SQR(x) (x * x)\nprintf(\"%d\", SQR(4 + 3));",
    question_cpp: "#define SQR(x) (x * x)\ncout << SQR(4 + 3);",
    options: ["49", "19", "25", "Error"],
    answer: "B",
    hint: "Macros do literal text replacement without evaluating first. SQR(4+3) expands to (4 + 3 * 4 + 3) = 4 + 12 + 3 = 19."
  },
  {
    level: "Hard",
    question_c: "int i = 2;\nint j = i++ + ++i;\nprintf(\"%d\", j);",
    question_cpp: "int i = 2;\nint j = i++ + ++i;\ncout << j;",
    options: ["6", "5", "7", "Undefined Behavior"],
    answer: "D",
    hint: "Modifying 'i' twice within the same sequence point (before a semicolon) is Undefined Behavior in C/C++."
  },
  {
    level: "Hard",
    question_c: "char *s = \"world\";\ns[0] = 'W';\nprintf(\"%s\", s);",
    question_cpp: "const char *s = \"world\";\n// Assume const casted to non-const, then modified\nchar *p = (char*)s;\np[0] = 'W';\ncout << p;",
    options: ["World", "world", "Segmentation Fault", "Compilation Error"],
    answer: "C",
    hint: "String literals are stored in read-only memory. Attempting to modify them leads to a Segmentation Fault."
  }
];

const seed = () => {
    db.serialize(() => {
        // Drop and recreate table to alter schema
        db.run('DROP TABLE IF EXISTS r1_questions');
        db.run(`CREATE TABLE r1_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level TEXT,
            question_c TEXT,
            question_cpp TEXT,
            options TEXT,
            answer TEXT,
            hint TEXT
        )`);

        const r1q = db.prepare('INSERT INTO r1_questions (level, question_c, question_cpp, options, answer, hint) VALUES (?, ?, ?, ?, ?, ?)');
        for(let r of r1_questions) {
            r1q.run([r.level, r.question_c, r.question_cpp, JSON.stringify(r.options), r.answer, r.hint]);
        }
        r1q.finalize();
    });

    console.log("Round 1 modified DUAL language questions seeded successfully!");
}

seed();
