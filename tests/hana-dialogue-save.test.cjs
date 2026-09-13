const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadTalkToHana(state, checkedMail = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const start = source.indexOf("function talkToHana(){");
  const end = source.indexOf("function hasCheckedAllMail", start);
  assert.notEqual(start, -1, "talkToHana must exist");
  assert.notEqual(end, -1, "talkToHana boundary must exist");

  let completion;
  let shownLines;
  let saves = 0;
  const context = vm.createContext({
    firstRoomState: state,
    firstRoomScenario: {
      hanaFirst: ["first"],
      hanaMailHint: ["hint"],
      hanaAfterQuestion: ["after"],
      hanaBeforeQuestion: ["before"]
    },
    hasCheckedAllMail(folder) { return checkedMail[folder] === true; },
    showRoomDialog(lines, onComplete) {
      shownLines = lines;
      completion = onComplete;
    },
    saveGame() { saves++; }
  });

  vm.runInContext(source.slice(start, end), context, { filename: "talkToHana.js" });
  return {
    talk: () => vm.runInContext("talkToHana()", context),
    complete: () => completion?.(),
    get shownLines() { return shownLines; },
    get saves() { return saves; }
  };
}

test("first Hana visit is committed only after the dialogue finishes", () => {
  const state = { hanaVisits: 0, mailHintGiven: false, pianoAttempted: false, questionSeen: false };
  const h = loadTalkToHana(state);

  h.talk();
  assert.equal(state.hanaVisits, 0);
  assert.equal(h.saves, 0);
  assert.deepEqual(h.shownLines, ["first"]);

  h.complete();
  assert.equal(state.hanaVisits, 1);
  assert.equal(h.saves, 1);
});

test("mail hint remains available after an interrupted dialogue and commits on completion", () => {
  const state = { hanaVisits: 2, mailHintGiven: false, pianoAttempted: true, questionSeen: true };
  const h = loadTalkToHana(state, { inbox: true, sent: false });

  h.talk();
  assert.equal(state.hanaVisits, 2);
  assert.equal(state.mailHintGiven, false);
  assert.equal(h.saves, 0);
  assert.deepEqual(h.shownLines, ["hint"]);

  h.complete();
  assert.equal(state.hanaVisits, 3);
  assert.equal(state.mailHintGiven, true);
  assert.equal(h.saves, 1);
});

test("ordinary repeat visits also increment only after their dialogue finishes", () => {
  const state = { hanaVisits: 1, mailHintGiven: false, pianoAttempted: false, questionSeen: false };
  const h = loadTalkToHana(state);

  h.talk();
  assert.equal(state.hanaVisits, 1);
  assert.equal(h.saves, 0);
  assert.deepEqual(h.shownLines, ["before"]);

  h.complete();
  assert.equal(state.hanaVisits, 2);
  assert.equal(h.saves, 1);
});
