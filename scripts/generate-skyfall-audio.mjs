// Original deterministic score/sound design. No sampled, downloaded or AI assets.
// Usage: node scripts/generate-skyfall-audio.mjs (requires existing ffmpeg).
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

const RATE = 24000;
const directory = path.resolve("public/audio/skyfall");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "skyfall-audio-"));
fs.mkdirSync(directory, { recursive: true });
const frequency = note => 440 * 2 ** ((note - 69) / 12);
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const envelope = (t, duration, attack = .008) => Math.min(1, t / attack) * Math.max(0, 1 - t / duration) ** 2;

function write(name, seconds, compose) {
  const frames = Math.round(RATE * seconds);
  const pcm = Buffer.alloc(frames * 4);
  for (let i = 0; i < frames; i++) {
    const t = i / RATE;
    const [left, right] = compose(t);
    pcm.writeInt16LE(Math.round(Math.tanh(left * .8) * 23000), i * 4);
    pcm.writeInt16LE(Math.round(Math.tanh(right * .8) * 23000), i * 4 + 2);
  }
  const wav = Buffer.alloc(44);
  wav.write("RIFF", 0); wav.writeUInt32LE(pcm.length + 36, 4); wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(RATE, 24); wav.writeUInt32LE(RATE * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
  wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40);
  const source = path.join(temporary, `${name}.wav`);
  fs.writeFileSync(source, Buffer.concat([wav, pcm]));
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-c:a", "libopus", "-b:a", name.startsWith("music") ? "56k" : "40k", "-application", "audio", "-metadata", "artist=HeroTyping", "-metadata", "title=Skyfall Protocol — original synthesis", path.join(directory, `${name}.opus`)]);
  fs.unlinkSync(source);
  console.log(`${name}.opus: ${fs.statSync(path.join(directory, `${name}.opus`)).size} bytes`);
}

function soundtrack(intensity) {
  const chords = [[57,60,64,67], [53,57,60,64], [48,52,55,59], [55,59,62,66]];
  return t => {
    const chord = chords[Math.floor(t / 8) % 4];
    const beat = t % .5;
    const step = Math.floor(t / .25);
    let left = 0, right = 0;
    for (let i = 0; i < 4; i++) {
      const f = frequency(chord[i]);
      const pad = (sine(f, t) + sine(f * 1.0015, t) * .3) * .021;
      // Smoothly overlap each chord with the previous to avoid bar clicks.
      const old = chords[(Math.floor(t / 8) + 3) % 4][i];
      const blend = Math.min(1, (t % 8) / .8);
      const voice = pad * blend + sine(frequency(old), t) * .021 * (1 - blend);
      left += voice * (i % 2 ? .6 : 1); right += voice * (i % 2 ? 1 : .6);
    }
    const arp = chord[[0,2,1,3,2,1,3,1][step % 8]] + 12;
    const dt = t % .25;
    const pluck = (sine(frequency(arp), dt) + .17 * sine(frequency(arp) * 2, dt)) * Math.exp(-dt * 15) * Math.min(1, dt / .004) * (.023 + intensity * .027);
    left += pluck * (step % 2 ? .55 : 1); right += pluck * (step % 2 ? 1 : .55);
    const bass = sine(frequency(chord[0] - 12), beat) * envelope(beat, .48, .035) * (.035 + intensity * .025);
    const kick = sine(44 + 65 * Math.exp(-beat * 30), beat) * Math.exp(-beat * 24) * Math.min(1, beat / .003) * intensity * .07;
    const hatTime = t % .25;
    const noise = Math.sin(t * 37517) * Math.sin(t * 24197) * Math.sin(t * 14923);
    const hat = noise * Math.exp(-hatTime * 105) * Math.min(1, hatTime / .001) * intensity * .013;
    // Low melodic counterline leaves the word channel unobscured.
    const phrase = [0,7,12,7,3,7,10,7][Math.floor(t / 2) % 8];
    const melody = sine(frequency(57 + phrase), t % 2) * envelope(t % 2, 1.8, .04) * (.012 + intensity * .006);
    const seam = Math.min(1, t / .025, (32 - t) / .025);
    return [(left + bass + kick + hat + melody) * seam, (right + bass + kick + hat + melody) * seam];
  };
}
write("music-calm", 32, soundtrack(.08));
write("music-storm", 32, soundtrack(.6));
write("music-overdrive", 32, soundtrack(1));

function chime(notes, seconds, gain = .17, gap = .065) {
  return t => {
    let value = 0;
    for (let i = 0; i < notes.length; i++) {
      const dt = t - i * gap;
      if (dt < 0) continue;
      const f = frequency(notes[i]);
      value += (sine(f, dt) + .22 * sine(f * 2.005, dt) + .08 * sine(f * 3.01, dt)) * envelope(dt, Math.max(.03, seconds - i * gap)) * gain;
    }
    return [value, value];
  };
}
for (const [name, notes, duration, gain] of [
  ["key", [76], .045, .035], ["typo", [45], .10, .055], ["spawn", [81], .18, .04],
  ["clear", [76,83,88], .42, .11], ["combo", [72,76,79,84], .5, .09],
  ["phase", [57,64,69,76], .95, .10], ["freeze", [88,83,95], .7, .08],
  ["overdrive", [57,64,69,76,81], 1.1, .10], ["milestone", [72,79,84], .65, .085],
  ["victory", [69,72,76,81,88], 1.1, .10], ["defeat", [69,64,60,57], 1, .085],
]) write(name, duration, chime(notes, duration, gain));
write("miss", .55, t => {
  const body = sine(54 + 70 * Math.exp(-t * 13), t) * envelope(t, .5) * .13;
  const glass = (sine(421, t) + sine(587, t) * .5) * Math.exp(-t * 20) * .03;
  return [body + glass, body + glass];
});
fs.rmdirSync(temporary);
