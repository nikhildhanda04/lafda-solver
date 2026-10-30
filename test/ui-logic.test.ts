import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldPoll, saveableLinks, appended } from "../lib/steps";

test("the page polls only while an outcome is still coming", () => {
  // Writing: nothing to wait for.
  assert.equal(shouldPoll("COLLECTING", false), false);
  // Locked, waiting for the other side.
  assert.equal(shouldPoll("COLLECTING", true), true);
  // The judge is running.
  assert.equal(shouldPoll("JUDGING", true), true);
  assert.equal(shouldPoll("JUDGING", false), true);
});

test("polling stops once the case is decided or failed", () => {
  assert.equal(shouldPoll("DECIDED", true), false, "still polling after the verdict arrived");
  assert.equal(shouldPoll("FAILED", true), false, "still polling after the run failed");
  assert.equal(shouldPoll("DECIDED", false), false);
});

test("a half-typed link is kept on screen but not sent to the server", () => {
  // The server rejects anything that is not a URL, so sending "h" mid-typing
  // turns every keystroke into a failed autosave.
  assert.deepEqual(saveableLinks(["h"]), []);
  assert.deepEqual(saveableLinks(["https://example.com/a"]), ["https://example.com/a"]);
  assert.deepEqual(
    saveableLinks(["https://example.com/a", "htt"]),
    ["https://example.com/a"],
  );
});

test("clearing one link in the middle does not break the save", () => {
  assert.deepEqual(
    saveableLinks(["https://a.example.com", "", "https://c.example.com"]),
    ["https://a.example.com", "https://c.example.com"],
  );
});

test("saveableLinks trims, drops blanks, and never exceeds the cap", () => {
  assert.deepEqual(saveableLinks(["  https://a.example.com  "]), ["https://a.example.com"]);
  assert.deepEqual(saveableLinks(["", "   "]), []);
  assert.equal(
    saveableLinks(Array.from({ length: 9 }, (_, i) => `https://e${i}.example.com`)).length,
    5,
  );
});

test("a spoken phrase joins onto what is already written", () => {
  // One space between the old text and the new phrase, never two.
  assert.equal(
    appended("I paid for the cabin.", "She cancelled it.", 100),
    "I paid for the cabin. She cancelled it.",
  );
  assert.equal(appended("I paid. ", "She cancelled.", 100), "I paid. She cancelled.");
  // An empty box starts clean, and a phrase that is only breath changes nothing.
  assert.equal(appended("", "  She cancelled.  ", 100), "She cancelled.");
  assert.equal(appended("I paid.", "   ", 100), "I paid.");
  // Speaking cannot push a statement past the limit the textarea enforces.
  assert.equal(appended("abc", "defghij", 6), "abc de");
});
