const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "design-ui.js"), "utf8");
const split = source.slice(source.indexOf("  function splitText("), source.indexOf("  function paginateDialogue("));
const records = source.slice(source.indexOf("  function recordTextPages("), source.indexOf("  function pageText("));
const paginate = vm.runInNewContext(`${split}\n${records}\nrecordTextPages;`, {
  document: { createElement: () => ({ getContext: () => ({ measureText: text => ({ width: Array.from(text).length }) }) }) }
});

test("a speaker stays with the short turn when the previous page is nearly full", () => {
  const pages = Array.from(paginate([
    { kind: "narration", text: "あいうえおかきくけこさしすせそ" },
    { kind: "character", speaker: "先輩", text: "褒めすぎ" }
  ], 5, "test", 4));
  assert.deepEqual(pages, ["あいうえおかきくけこさしすせそ", "先輩\n褒めすぎ"]);
});

test("a long turn repeats the speaker while retaining every body character", () => {
  const text = "あいうえおかきくけこさしすせそたちつてと😀";
  const pages = Array.from(paginate([{ kind: "character", speaker: "先輩", text }], 5, "test", 3));
  assert.ok(pages.length > 1);
  for (const page of pages) {
    assert.ok(page.startsWith("先輩\n"));
    assert.ok(page.length > "先輩\n".length);
  }
  assert.equal(pages.map(page => page.slice("先輩\n".length)).join(""), text);
});
