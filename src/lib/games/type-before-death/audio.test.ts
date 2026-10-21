import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TYPE_BEFORE_DEATH_AUDIO } from "@/lib/games/type-before-death/audio";
import { DEATH_WEAPONS } from "@/lib/games/type-before-death/content";

describe("Type Before Death audio cues", () => {
  it("uses local firearm and enemy-death samples for combat", () => {
    assert.equal(TYPE_BEFORE_DEATH_AUDIO.cues.shot, "/audio/sfx/sfx-turret-fire.opus");
    assert.equal(TYPE_BEFORE_DEATH_AUDIO.cues.buckshot, "/audio/sfx/sfx-wb-explosion.opus");
    assert.equal(TYPE_BEFORE_DEATH_AUDIO.cues.headshot, "/audio/sfx/sfx-crit-hit.opus");
    assert.equal(TYPE_BEFORE_DEATH_AUDIO.cues.kill, "/audio/sfx/sfx-enemy-death.opus");
    assert.ok(!(Object.values(TYPE_BEFORE_DEATH_AUDIO.cues) as readonly string[]).includes("/audio/sfx/sfx-sword-hit.opus"));
  });

  it("exposes named levelled firearm loadouts with distinct fire modes", () => {
    assert.deepEqual(
      Object.values(DEATH_WEAPONS).map((weapon) => [weapon.level, weapon.name, weapon.fireMode]),
      [
        [1, "Glock 17", "semi-auto"],
        [2, "MP5A3", "burst"],
        [3, "Remington 870", "pump"],
        [4, "M24 SWS", "bolt-action"],
        [5, "M4A1 Carbine", "automatic"],
      ],
    );
  });
});
