const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const scenario = fs.readFileSync(path.join(root, "scenario.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(scenario + "\nglobalThis.room1Test = firstRoomScenario;", context);
const room = context.room1Test;
const textOf = lines => Array.from(lines, line => line.text);

test("room 1 introduces Hana as a guide rather than revealing her personal connection", () => {
  const lines = textOf(room.hanaFirst);
  assert.equal(lines[0], "……そういえば、何て呼んだらいいですか？");
  assert.ok(lines.includes("ハナって呼んで！"));
  assert.ok(lines.includes("わたしは、君の案内役……かな"));
  assert.ok(lines.includes("うん。君が忘れてしまった記憶を、少しずつ思い出すお手伝いをするの"));
  assert.ok(lines.includes("そう！　謎を解くことで、忘れていたことを思い出せるはずだから"));
  assert.ok(!lines.some(line => line.includes("本当の名前") || line.includes("花子さん")));
});

test("all eight puzzle mails and the note sequence remain unchanged in length", () => {
  assert.equal(room.phoneMail.inbox.length, 4);
  assert.equal(room.phoneMail.sent.length, 4);
  assert.equal(room.melody.join(""), "ソラファミドレドシ");
  assert.equal(room.hanaHints.length, 4);
  assert.deepEqual(textOf(room.phoneAfterAllMail), [
    "吹奏楽部の先輩と後輩のやり取りみたいだな",
    "……ただのメールなのに、なんだか懐かしい",
    "この二人は、一体……？"
  ]);
});

test("the first flashback ends with a remembered feeling and unknown identity", () => {
  const lines = textOf(room.afterMemory);
  const feeling = lines.indexOf("……楽しかったんです");
  const missing = lines.indexOf("でも……あの人が誰だったのか、思い出せなくて");
  const comfort = lines.indexOf("でも、楽しかったって気持ちは、ちゃんと残ってたんだね");
  assert.ok(0 < feeling && feeling < missing && missing < comfort);
  assert.equal(lines[lines.length - 1], "きっとね。ひとつずつ、探していこう");
  assert.ok(room.memory.some(line => line.text.includes("れんこんの南蛮漬け")));
});

test("both authored manuscripts contain the approved key lines", () => {
  for (const file of ["SCENARIO.md", "scenario/01_room1.md"]) {
    const manuscript = fs.readFileSync(path.join(root, file), "utf8");
    for (const text of ["何て呼んだらいいですか？", "君の案内役……かな", "ただのメールなのに、なんだか懐かしい", "楽しかったって気持ちは、ちゃんと残ってたんだね"]) {
      assert.ok(manuscript.includes(text), file + " is missing " + text);
    }
  }
});
