const fs = require("fs");
const readline = require("readline");

const fileStream = fs.createReadStream("C:\\Users\\Mohamed Faizan\\.gemini\\antigravity\\brain\\4cff430b-6ade-4381-8550-5e60d4a444ef\\.system_generated\\logs\\transcript.jsonl");
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on("line", (line) => {
  if (line.includes("submissions") && line.includes("findMany")) {
    console.log("MATCH:", line.substring(0, 500));
  }
});
