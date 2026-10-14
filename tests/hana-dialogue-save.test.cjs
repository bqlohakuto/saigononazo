const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// Inspect choices without opening a modal. game-flow.test.cjs exercises the
// production click/completion/save path with the complete hana-choice module.
function choicesFor(state = {}) {
  const source = fs.readFileSync(path.join(__dirname, "..", "hana-choice.js"), "utf8");
  const marker = "talkToHana = showHanaChoiceMenu;";
  assert.ok(source.includes(marker));
  const context = vm.createContext({
    firstRoomState: { hanaVisits: 0, openedInbox: new Set(), openedSent: new Set(), ...state },
    firstRoomScenario: { hanaHints: [["hint1"], ["hint2"], ["hint3"], ["hint4"]] },
    window: {}, talkToHana: null
  });
  vm.runInContext(source.replace(marker, `${marker}\nglobalThis.testChoices = getHanaChoices;`), context);
  return { state: context.firstRoomState, choices: () => context.testChoices(), ids: () => Array.from(context.testChoices(), item => item.id) };
}

test("anonymous and legacy Hana saves select the correct introduction branch", () => {
  assert.deepEqual(choicesFor().ids(), ["about-hana"]);
  assert.deepEqual(choicesFor({ hanaIntroduced: false, hanaVisits: 3 }).ids(), ["about-hana"]);
  assert.ok(choicesFor({ hanaVisits: 1 }).ids().includes("about-room"));
  assert.ok(choicesFor({ hanaIntroduced: true }).ids().includes("first-puzzle"));
});

test("object conversations become available only after their relevant discoveries", () => {
  const h = choicesFor({ hanaIntroduced: true });
  for (const id of ["poster", "phone", "piano", "hint-1"]) assert.equal(h.ids().includes(id), false);
  h.state.posterInspected = true;
  h.state.openedSent.add("sent-1");
  h.state.pianoIntroductionSeen = true;
  h.state.questionSeen = true;
  for (const id of ["poster", "phone", "piano", "hint-1", "hint-2"]) assert.ok(h.ids().includes(id));
  assert.equal(h.ids().includes("first-puzzle"), false);
});

test("four hints advance on completion, remain repeatable and stop at level four", () => {
  const h = choicesFor({ hanaIntroduced: true, questionSeen: true, hintLevel: 0 });
  const hintIds = () => h.ids().filter(id => id.startsWith("hint-"));
  assert.deepEqual(hintIds(), ["hint-1"]);
  h.state.posterInspected = true;
  h.state.openedInbox.add("inbox-1");
  assert.deepEqual(hintIds(), ["hint-1", "hint-2"]);
  for (const level of [2, 3, 4]) {
    const choice = h.choices().find(item => item.id === `hint-${level}`);
    assert.ok(choice);
    assert.ok(h.state.hintLevel < level);
    choice.onComplete();
    assert.equal(h.state.hintLevel, level);
  }
  assert.deepEqual(hintIds(), ["hint-1", "hint-2", "hint-3", "hint-4"]);
  assert.equal(h.state.mailHintGiven, true);
  h.choices().find(item => item.id === "hint-1").onComplete();
  assert.equal(h.state.hintLevel, 4);
  h.state.doorUnlocked = true;
  assert.deepEqual(hintIds(), []);
});
