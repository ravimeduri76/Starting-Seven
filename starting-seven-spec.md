# Starting Seven — Game Specification

**Version:** 1.0 (v1 scope)
**Audience:** Claude Code (implementation agent)
**Working name:** Starting Seven (subject to change; treat as `STARTING_SEVEN` constant in code)

---

## 1. Purpose

Build a web-based card game called **Starting Seven**, a variant of the Sevens / Fan Tan / Parliament family. v1 ships local hot-seat play (one device, multiple humans taking turns) plus AI bots so a single human can play. Online multiplayer is explicitly out of scope for v1 but the architecture must not preclude it (see §11).

This spec defines the rules deterministically, the architecture in three layers (UI, game engine, storage), the data shapes, and the acceptance criteria. The tech stack is intentionally left open — Claude Code should pick sensible defaults for a modern web app.

---

## 2. Glossary

- **Suit pile:** the face-up ordered run of cards in one suit, built outward from the 7.
- **Chain:** synonym for suit pile.
- **Leftover pile / open pile:** cards that did not divide evenly during the deal. Placed face-up at the start; auto-incorporated into a suit pile when the chain extends adjacent to them.
- **Optional pass:** a voluntary pass when the player has at least one playable card. Limited.
- **Forced pass:** an automatic pass when the player has no playable card.
- **Hand:** the cards a player still holds.
- **Round / game:** one full deal-to-finish cycle. v1 plays one round at a time; users replay for a match.

---

## 3. Card values

| Card | Value |
|---|---|
| Ace (A) | 1 |
| 2–10 | face value |
| Jack (J) | 11 |
| Queen (Q) | 12 |
| King (K) | 13 |

Suits have no intrinsic value but matter for chain identity and for the starter rule (§5.4).

---

## 4. Setup

1. Use a single standard 52-card deck. No jokers.
2. Player count: **2–8**, recommended **4** (deals evenly).
3. One player is designated **dealer** (rotates between rounds; for v1, dealer is just the first player in the lobby on round 1, then rotates one seat counter-clockwise each round).
4. Shuffle. Deal cards one at a time, counter-clockwise, starting from the player to the right of the dealer, until cards run out OR until each player has the same count and remaining cards cannot be distributed evenly.
5. Any remaining cards are placed **face-up** in a clearly marked **leftover area** of the table. These are not in any player's hand.
6. (Optional, see §9) Each player may swap one card.

---

## 5. Turn order and starting player

### 5.1 Direction of play

Turn order is **counter-clockwise** (each turn passes to the player on the right of the current player).

### 5.2 Starting player

The starting player for the round is determined by the following priority:

1. The player holding **7♠** plays first by laying down 7♠.
2. If 7♠ is in the leftover pile, the holder of **7♥** starts. Their first move must be to play 7♥, opening the hearts chain. (7♠ is then incorporated automatically by §6.4 once the spades chain forms — but spades cannot form until someone opens with 7♠; with 7♠ in leftovers, the spades chain is "anchored" by the 7♠ in the leftover area immediately, see §6.4.)
3. If both 7♠ and 7♥ are in leftovers, the holder of **7♦** starts.
4. If 7♠, 7♥, and 7♦ are all in leftovers, the holder of **7♣** starts.
5. If all four 7s are in leftovers, the player to the right of the dealer starts. Their first move can be any card adjacent to a 7 in the leftover area (e.g., 6♠ or 8♠ if 7♠ is leftover) — the leftover 7s anchor their respective chains immediately, so adjacent cards become playable.

### 5.3 Subsequent turns

Play passes counter-clockwise. Each player takes exactly one action: play a card, optional pass, or forced pass.

---

## 6. Card play rules

### 6.1 Opening a suit

A suit's chain is opened by playing the **7** of that suit. Once opened, the 7 is the chain's seed, and the chain may extend down toward Ace and up toward King.

### 6.2 Extending a chain

A card is **playable** if it is the rank immediately adjacent (±1) to either end of an existing chain in its own suit. Examples (spades chain):

- Chain shows only 7♠. Playable next: 6♠ or 8♠.
- Chain shows 5♠–8♠. Playable next: 4♠ or 9♠.
- Chain shows A♠–K♠. The suit is complete; nothing more in spades is playable.

### 6.3 One card per turn

A player plays at most **one card per turn**. They cannot chain multiple of their own cards in a single turn even if they hold a run. (Rationale: the optional-pass mechanic would be defanged if multi-card plays were allowed.)

### 6.4 Leftover cards (auto-incorporation)

Cards in the leftover area are **dormant** but visible. They behave as follows:

- A leftover **7** anchors its suit's chain immediately at the start of the round. Players may extend that chain by playing adjacent cards from their hand even though no player has played the 7.
- Any other leftover card is auto-incorporated into its suit's chain the moment the chain extends adjacent to it.

**Example.** 5♠ is in the leftover pile. Spades chain currently shows 6♠–8♠. When a player plays 9♠ (extending up), nothing happens to 5♠ yet. When a player plays 5♠... wait, 5♠ isn't in any hand — it's in the leftovers. So when a player plays 6♠ (already done above) or in this case when a player plays 4♠, the 5♠ is auto-incorporated as the chain reaches it.

**Precise rule.** After every successful card play, the engine checks every leftover card. For each leftover card, if its rank is adjacent to either end of its suit's current chain, the leftover is moved into the chain. This may cascade: incorporating a leftover may make another leftover playable, which is then also incorporated, and so on, until no further leftovers can be incorporated. This all happens as part of the single play action, before the turn passes.

### 6.5 Playable card formal definition

A card `c` of rank `r` and suit `s` held by the active player is playable if:

- `r == 7` (a 7 can always be played to open its suit), OR
- The chain for suit `s` exists and `r` is adjacent (±1 rank) to either end of that chain.

If no card in the player's hand is playable, the player is in a **forced pass** state (§7.2).

---

## 7. Pass rules

### 7.1 Optional pass

A player who has at least one playable card may choose to pass instead of playing — but only under the following constraints:

- They did **not** use an optional pass on their immediately preceding turn. After an optional pass, the player **must** play a card on their very next turn. After playing, optional pass becomes available again. This creates an alternating rhythm: pass → play → pass → play. There is **no cap** on the total number of optional passes per round — only the alternating constraint.
- They do **not** hold any 7 in their hand. (Holding any 7 disables optional pass entirely. See §7.4.)

### 7.2 Forced pass

If a player has no playable card, the engine declares a forced pass automatically. The player has no choice. Turn passes counter-clockwise.

### 7.3 Challenge mechanic (always on, design-level)

A challenge mechanic exists by design, but its implementation depends on play mode:

- **v1 hot-seat:** the engine knows every hand and enforces honestly. Forced pass is auto-detected; players cannot lie. The challenge UI is therefore not exposed in v1, but the rules engine MUST always validate forced-pass eligibility (i.e., never accept a "forced pass" claim from the UI without confirming it against the player's hand). This guards against bugs and prepares the codebase for v2.
- **v2 online (out of scope here):** any non-active player may challenge a forced-pass claim within a short window. If the claim was a lie, the lying player takes a **+10 score penalty** and must immediately play a playable card.

### 7.4 Holding a 7

If a player holds **any 7** in their hand, they cannot use an optional pass — they must play. This prevents 7-hoarding and keeps the game moving. (A 7 in hand is always playable, since it can open its own suit.)

**Variant (toggleable, see §9, "soft 7-hold"):** instead of an absolute ban, allow optional pass while holding a 7, but require the 7 to be played within N turns from when the player first held it (default N=2). Tracked per 7 per player.

---

## 8. Round end and scoring

### 8.1 End condition

The round ends **immediately** the moment any player empties their hand. That player is the **winner** of the round and scores **0**.

### 8.2 Scoring losers

Every other player scores the **sum of card values** still in their hand (using the table in §3). Lower score is better. Cards in the leftover area are not scored against anyone.

### 8.3 Match play (manual)

v1 does not implement automatic match progression. The UI offers a "Play another round" button after each round. Cumulative scores across rounds in the same session are tracked and shown but do not affect game logic. Users decide when to stop.

---

## 9. Toggleable settings (variants)

All settings are configured before a round begins. They cannot change mid-round. The engine receives the settings object at round start.

| Setting | Default | Description |
|---|---|---|
| `preGameSwap` | off | Each player swaps one card with the player on their left (counter-clockwise = right, so this is "with neighbor whose turn comes after"). Swap is simultaneous and blind: each player picks a card to give before seeing what they receive. |
| `softSevenHold` | off | If on, holding a 7 does NOT block optional pass, but each held 7 must be played within N turns of the player first holding it. N is configured by `softSevenHoldTurns` (default 2). Engine tracks per-card tenure. |
| `ghostChain` | on | UI shows leftover cards positioned at their eventual chain slots, dimmed, from turn one. Pure UI affordance; no rules effect. Default on because it leans into the game's existing "open information" design. |

The challenge mechanic (§7.3) is **not** a toggle — it is always part of the design.

---

## 10. AI opponents (bots)

v1 must support filling any seat with an AI bot.

### 10.1 Bot difficulty levels

Three levels at minimum:

- **Easy:** plays a uniformly random playable card. Uses optional pass with probability 0 (always plays when it can). Forced pass when no card playable.
- **Medium:** plays a heuristic. Prefers high-value cards (J, Q, K) early to minimize score-on-loss risk. Avoids playing cards that immediately enable opponents' high-card dumps. Uses optional pass only when holding both ends of a chain (to delay opening it).
- **Hard:** medium heuristic plus card-counting (tracks every played card and infers opponents' likely holdings) plus a one-ply lookahead simulation. Additionally estimates **chain velocity** — for each suit, the probability that the chain will extend on the next full round of turns, computed from inferred opponent holdings and observed pass behavior. Uses this to (a) prefer dumping high-value cards into **slow** chains (less likely to be completed before round-end, so more likely to score against the bot), and (b) hold cards that block fast chains when ahead. Uses optional pass strategically — e.g., to deny an opponent a likely play.

### 10.2 Bot behavior constraints

- Bots must respect all rules including the 7-hold constraint and optional-pass allowance.
- Bots make decisions through the same engine API as humans — they call `legalActions(state, playerId)` and choose one. The engine must not have a "bot fast path" that bypasses validation.
- Bot decisions must complete in under 500ms to keep the UI responsive. If a decision exceeds this budget, fall back to a random legal action.

### 10.3 Bot identity

Bots have display names (e.g., "Bot Alice", "Bot Bob") and a difficulty badge visible in the UI.

---

## 11. Architecture

Three logical layers. v1 may collocate them in a single web app; the boundaries must be respected so v2 can split them.

### 11.1 UI layer

A web frontend (browser-based; mobile-responsive but not mobile-native).

**Responsibilities:**

- Render the table: each player's seat, hand (current player's hand visible, others abstracted to card-back counts in v1 hot-seat), the four suit chains, the leftover area, the turn indicator, score display, and a settings panel.
- Capture player actions: card-play (drag-and-drop or click-to-play), pass button (which the engine validates as forced or optional).
- Animate plays for clarity (card flies from hand to chain; leftover incorporation is visually distinct so players notice it).
- "Pass-and-play" mode for hot-seat: between turns, show a screen prompting "Pass device to [next player]" and require a tap to reveal the next hand. This protects hand secrecy.
- Show end-of-round scores and a "Play another round" CTA.

### 11.2 Game engine

A pure module (no I/O, no UI dependencies) implementing the rules. Easy to unit-test.

**Public API (illustrative; Claude Code may adapt names):**

```
createGame(settings, players) -> GameState
legalActions(state, playerId) -> Action[]
applyAction(state, action) -> { state: GameState, events: Event[] }
isRoundOver(state) -> boolean
score(state) -> { playerId: number, score: number }[]
```

**Action types:** `PlayCard(card)`, `OptionalPass`, `ForcedPass`, `SwapSelect(card)` (only valid during the `swap` phase if `preGameSwap` is on; each player submits exactly one `SwapSelect` and the engine resolves all swaps simultaneously when the last selection arrives).

**Engine guarantees:**

- Pure functions: same input → same output. No randomness inside `applyAction` (any randomness is supplied via the initial shuffle in `createGame`).
- The engine validates every action against `legalActions`. Invalid actions throw / return an error and do not mutate state.
- The engine emits an `events` array for each action so the UI can animate (e.g., `CardPlayed`, `LeftoverIncorporated`, `PassClaimed`, `RoundEnded`).
- Leftover cascade (§6.4) happens inside `applyAction`, before returning.

### 11.3 Storage layer

v1 storage scope is intentionally minimal:

- **Session state** (current round in progress): in browser memory. Survives navigation within the app via in-memory state management, lost on full page reload. Acceptable for v1 because hot-seat play is a single sitting.
- **Match history & cumulative scores** (across rounds in one session): in browser memory.
- **Persistent settings** (preferences, last-used player names, last-used variants): browser localStorage.

**Out of scope for v1:** server-side persistence, user accounts, replay storage, leaderboards. The engine's state shape (§12) must be JSON-serializable so v2 can persist it trivially.

---

## 12. Data model

JSON-serializable shapes. Names are illustrative.

```jsonc
// Card
{ "rank": 7, "suit": "S" }   // suit ∈ {"S","H","D","C"}; rank ∈ 1..13 (1=A, 11=J, 12=Q, 13=K)

// Player
{
  "id": "p1",
  "name": "Ravi",
  "isBot": false,
  "botDifficulty": null,        // "easy" | "medium" | "hard" | null
  "seatIndex": 0,               // 0..N-1, counter-clockwise
  "hand": [ /* Card[] */ ]
}

// Chain (one per suit; null until opened)
{
  "suit": "S",
  "low": 7,                      // lowest rank present (inclusive); 7 at start
  "high": 7,                     // highest rank present (inclusive)
  "cards": [ /* Card[] in order from low to high; for replay/animation */ ]
}

// LeftoverCard
{ "card": { "rank": 5, "suit": "S" }, "active": true }
// active == true means it's already anchored a chain (e.g., a leftover 7) or has been incorporated.
// If you prefer, drop `active` and just remove leftovers from this list as they're incorporated.

// GameState
{
  "settings": { /* see §9 */ },
  "players": [ /* Player[] */ ],
  "dealerSeat": 0,
  "currentSeat": 1,              // whose turn it is
  "direction": "ccw",            // fixed for v1
  "chains": { "S": null|Chain, "H": null|Chain, "D": null|Chain, "C": null|Chain },
  "leftovers": [ /* LeftoverCard[] */ ],
  "mustPlayNext": { "p1": false, "p2": false, ... },  // true after an optional pass; resets to false after a play
  "sevenHoldTenure": { "p1": { "7H": 0 } },   // only used if softSevenHold is on
  "history": [ /* Action[] for replay/UI animation */ ],
  "phase": "swap" | "play" | "ended",
  "winnerId": null | "p1"
}
```

---

## 13. UI requirements

### 13.1 Screens

1. **Lobby / setup screen.** Choose number of players (2–8), assign each seat a human name or a bot at a difficulty, toggle settings (§9), start round.
2. **Table screen.** The main play view (§11.1).
3. **Pass-the-device interstitial.** Shown between human turns in hot-seat to protect hand secrecy. Shows only the name of the next player and a "Tap to reveal" button.
4. **End-of-round screen.** Winner banner, per-player score breakdown, cumulative session scores, "Play another round" / "Back to lobby" buttons.

### 13.2 Interaction details

- Highlight playable cards in the active player's hand. (This is open information per §7.3 — the engine knows what's playable, so the UI may as well show it.)
- The "Pass" button has two visual states: when the player has no playable card, button reads **"Forced Pass"** and is the only enabled action; when the player has playable cards AND optional pass is available, button reads **"Optional Pass (N left)"**; otherwise hidden.
- Leftover incorporation is animated distinctly (e.g., the leftover card glides into the chain with a brief glow) so the rule is teachable through play.
- A "How to play" link on the lobby screen opens a rules modal summarizing §3–§8.

### 13.3 Accessibility

- Keyboard-navigable (arrow keys to select cards, Enter to play, P to pass).
- Color-blind safe: suits distinguished by symbol shape, not just color.
- Text scales with browser zoom.

---

## 14. Acceptance criteria

A round of Starting Seven is considered correctly implemented when ALL of the following hold:

1. **Setup correctness.** With 4 players, each receives 13 cards and the leftover area is empty. With 3 players, each receives 17 cards and 1 card is in the leftover area, face-up.
2. **Starting player.** The player holding 7♠ is forced to play it as their first action. If 7♠ is in leftovers, the priority chain in §5.2 is followed and tested for all combinations.
3. **Playability.** The engine's `legalActions` returns exactly the set of legal moves for any state, verified against a hand-written test suite covering: empty chain, chain reaching A, chain reaching K, multiple chains open, all chains open, leftover bridging.
4. **Leftover cascade.** Setup: 5♠ in leftovers, spades chain currently 6♠–8♠, player plays 4♠. Expected: chain becomes 4♠–8♠ AND 5♠ is auto-incorporated (so chain becomes 4♠–8♠ with 5♠ included; visually shown sliding in from the leftover area). Cascade test: leftovers contain 4♠ and 5♠, chain is 6♠–8♠, player plays 3♠ → chain extends to 3♠–8♠ and both 4♠ and 5♠ cascade in.
5. **Optional pass enforcement.** A player holding any 7 cannot use optional pass (default mode). A player with no 7s and at least one playable card may use optional pass, but must play on their very next turn — two consecutive optional passes are illegal. After playing, optional pass is available again. Attempting an invalid optional pass is rejected by the engine.
6. **Forced pass enforcement.** A player with no playable card has `ForcedPass` as their only legal action.
7. **Scoring.** After end-of-round, the winner scores 0 and each loser scores the sum of remaining card values, computed using §3.
8. **Bot rule compliance.** A 1000-round bot-vs-bot self-play test (4 easy bots) completes without any rule violation, every round terminates in finite turns, and every round produces a legal score.
9. **Determinism.** Given the same shuffle seed, settings, and bot RNG seed, two runs of a full round produce identical game states and event histories.
10. **Toggle behavior.** Each toggleable setting in §9 is testable independently and behaves per its description.

---

## 15. Out of scope for v1 (but architecturally allowed)

- Online multiplayer with real-time sync.
- User accounts, profiles, leaderboards.
- Persistent server-side game state.
- Spectator mode.
- Replays / shareable game logs.
- Tournament / match-play automation.
- Mobile-native apps.
- Localization (v1 English only).
- The challenge UI (§7.3) — kept as a design rule, not implemented in v1.

---

## 16. Open questions for the implementer

These are intentionally left for Claude Code to decide and document:

- Specific frontend framework (React, Svelte, SolidJS, etc.).
- Build tool (Vite, Next, etc.).
- Animation library (Framer Motion, GSAP, CSS transitions, etc.).
- Test framework (Vitest, Jest, Playwright for end-to-end).
- Whether to use TypeScript (strongly recommended) or JavaScript.
- Whether to implement the engine in a separate package (`/packages/engine`) or a folder (`/src/engine`) — the boundary must exist either way.

---

## 17. Reasoning notes (why these rules)

For the user's preference on tracing reasons:

- **Why end the round on first finisher (not play to last)?** User specified. Trade-off: faster rounds, simpler scoring; loses the ranking detail of multi-finisher games. Mitigated by playing multiple rounds.
- **Why ban optional pass while holding a 7?** Sevens variants suffer from "7-hoarding" stalemates. The ban forces 7s out and keeps the game flowing. The soft variant (§7.4) preserves the strategic option for groups that want it.
- **Why auto-incorporate leftovers?** Turns deal randomness into shared, visible information that all players can plan around. Reduces luck.
- **Why counter-clockwise?** User specified, consistent with the "right of dealer starts" fallback rule in §5.2.
- **Why 1 card per turn?** Multi-card turns would let a player dump a long run in one move, defeating the optional-pass strategic layer.
- **Why hot-seat-first for v1?** Smallest scope that proves the full rules engine and UI loop. Online multiplayer adds auth, sync, lobby, reconnection — none of which test the game's actual fun.

---

*End of spec.*
