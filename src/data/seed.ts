// Dev-only demo seed (the prototype's sample entries), applied when the
// app is opened with ?seed and there are no entries yet.

import { getStore } from './store';
import { keyFromOffset } from './dates';
import { words, entryKeys } from './selectors';

const SEED: Array<[number, string]> = [
  [-1, "Cut the first two pages of chapter four. The scene starts where Mara opens the letter, everything before it was throat-clearing. 380 words after the cut and the chapter reads faster.\n\nNoticed I keep reaching for weather when I don't know what a character feels. Flagging it."],
  [-2, "Wrote the ferry scene from Tomas's side instead. It's worse, but now I know why the original works – Mara withholds, Tomas explains. Keeping the draft anyway.\n\nAlso: 'the harbor exhaled' is doing too much. Simpler."],
  [-3, "Slow morning. Made a list of everything chapter five has to accomplish and it came to eleven items, which means it's two chapters. Split at the phone call.\n\nRead twenty pages of the Munro collection before bed – the way she skips years mid-paragraph without losing you."],
  [-4, "Outlined the middle third on index cards. The problem was never the pacing, it was that Mara has no reason to stay past the funeral. Gave her one – the house doesn't sell.\n\nFour mornings in a row now. The habit is quieter than I expected."],
  [-6, "First entry. Trying mornings before email, three hundred words as the floor. Wrote the opening image – the ferry parked against the fog like a held breath. Probably cut it later, but it got the hand moving."],
  [-365, "Finished the short story about the lighthouse keeper's daughter and sent it to three magazines before I could talk myself out of it. Whatever happens, it's out of the drawer.\n\nCelebrated with a long walk. Thinking there might be a novel in the harbor town. Parking that thought for now."],
];

const SEED_TIMES: Record<string, number> = { '-1': 22 * 60, '-2': 31 * 60, '-3': 18 * 60, '-4': 26 * 60, '-6': 14 * 60 };

export function maybeSeed() {
  if (!new URLSearchParams(window.location.search).has('seed')) return;
  const store = getStore();
  if (entryKeys(store.getSnapshot().entries).length > 0) return;
  SEED.forEach(([off, text], i) => {
    const k = keyFromOffset(off);
    store.setEntry(k, text);
    store.addSeconds(k, SEED_TIMES[String(off)] || 20 * 60);
    store.addHourWords(7 + (i % 3), words(text));
  });
}
