const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadHasCheckedAllMail(openedInbox, openedSent) {
  const source = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");
  const start = source.indexOf("function hasCheckedAllMail(folder){");
  const end = source.indexOf("function inspectRoomItem", start);
  assert.notEqual(start, -1, "hasCheckedAllMail must exist");
  assert.notEqual(end, -1, "hasCheckedAllMail boundary must exist");

  const context = vm.createContext({
    firstRoomState: {
      openedInbox: new Set(openedInbox),
      openedSent: new Set(openedSent)
    },
    firstRoomScenario: {
      phoneMail: {
        inbox: ["inbox-1", "inbox-2", "inbox-3", "inbox-4"].map(id => ({ id })),
        sent: ["sent-1", "sent-2", "sent-3", "sent-4"].map(id => ({ id }))
      }
    }
  });

  vm.runInContext(source.slice(start, end), context, { filename: "hasCheckedAllMail.js" });
  return folder => vm.runInContext(`hasCheckedAllMail(${JSON.stringify(folder)})`, context);
}

test("mail completion requires every expected mail id, not only the same count", () => {
  const valid = loadHasCheckedAllMail(
    ["inbox-1", "inbox-2", "inbox-3", "inbox-4"],
    ["sent-1", "sent-2", "sent-3", "sent-4"]
  );
  assert.equal(valid("inbox"), true);
  assert.equal(valid("sent"), true);

  const wrongSameSize = loadHasCheckedAllMail(
    ["inbox-1", "inbox-2", "inbox-3", "unknown-inbox"],
    ["sent-1", "sent-2", "sent-3", "unknown-sent"]
  );
  assert.equal(wrongSameSize("inbox"), false);
  assert.equal(wrongSameSize("sent"), false);
});

test("mail completion stays false for missing or unknown folders", () => {
  const check = loadHasCheckedAllMail(
    ["inbox-1", "inbox-2", "inbox-3"],
    ["sent-1", "sent-2", "sent-3", "sent-4"]
  );
  assert.equal(check("inbox"), false);
  assert.equal(check("missing"), false);
});

test("opening Hana lines no longer carry the stale anonymous displayName metadata", () => {
  const scenario = fs.readFileSync(path.join(__dirname, "..", "scenario.js"), "utf8");
  assert.equal(scenario.includes("displayName"), false);
  assert.equal(scenario.includes('speaker: "ハナ"'), true);
});
