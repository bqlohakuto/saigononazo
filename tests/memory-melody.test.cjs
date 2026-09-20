const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const audio = name => fs.readFileSync(path.join(__dirname, "..", "audio", name));

function readVlq(buffer, cursor) {
  let value = 0, byte;
  do { byte = buffer[cursor.index++]; value = (value << 7) | (byte & 0x7f); } while (byte & 0x80);
  return value;
}

function midiNoteOns(buffer) {
  assert.equal(buffer.toString("ascii", 0, 4), "MThd");
  const trackStart = 14;
  assert.equal(buffer.toString("ascii", trackStart, trackStart + 4), "MTrk");
  const cursor = {index: trackStart + 8};
  const end = cursor.index + buffer.readUInt32BE(trackStart + 4);
  const notes = [];
  let runningStatus = 0;
  while (cursor.index < end) {
    readVlq(buffer, cursor);
    let status = buffer[cursor.index];
    if (status & 0x80) { runningStatus = status; cursor.index++; } else status = runningStatus;
    if (status === 0xff) {
      cursor.index++;
      cursor.index += readVlq(buffer, cursor);
    } else if ((status & 0xf0) === 0xc0 || (status & 0xf0) === 0xd0) {
      cursor.index++;
    } else {
      const note = buffer[cursor.index++], velocity = buffer[cursor.index++];
      if ((status & 0xf0) === 0x90 && velocity > 0) notes.push(note);
    }
  }
  return notes;
}

test("memory melody assets use the eight-note room-one answer", () => {
  assert.deepEqual(midiNoteOns(audio("memory_melody.mid")), [67, 69, 65, 64, 60, 62, 60, 71]);

  const wav = audio("memory_melody_piano.wav");
  assert.equal(wav.toString("ascii", 0, 4), "RIFF");
  assert.equal(wav.toString("ascii", 8, 12), "WAVE");
  const byteRate = wav.readUInt32LE(28);
  const dataOffset = wav.indexOf(Buffer.from("data"));
  const duration = wav.readUInt32LE(dataOffset + 4) / byteRate;
  assert.ok(duration > 6.5 && duration < 6.6, `unexpected WAV duration: ${duration}`);
});
