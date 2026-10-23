Build **proposed vs agreed** (modules 3+4, block B, **phone only**) from the handoff in `design_handoff_proposed_agreed/`.

Read `README.md` first, then open `B_proposed_agreed.dc.html` in a browser (section B only). Tokens are in `tokens.css`. All three are authoritative.

**Scope: UI and UX only.**
- Build B1 (bottom sheet "What did she agree to?") and B2 (mark declined, same sheet).
- Supplied values, don't compute: proposed total, floor, the difference, profit and floor headroom for the typed figure, customer name/area, quote number, sent-ago text. Use mock data shaped like the reference if there's no source yet.
- Don't build the notes cards.

**Must get right:**
1. It's a **bottom sheet on the quote's route**, not a new route, and it **opens automatically** on any `sent` quote.
2. **The agreed field has focus on open** (solid, highlighted, numeric keyboard). Proposed is read-only and dashed above it.
3. The gap box and the `Accept at <n> · creates the job` label update as he types.
4. Accept goes straight to the new job (C) using the returned `job_id`.
5. "She declined" swaps the sheet content to B2; Back returns to B1 keeping the typed figure. The reason is optional; empty is normal.
6. Amber mode band on; no "Show her" (cost is on screen).
7. Hit targets ≥ 44px.

Reuse the mode band, bottom sheet, inputs and buttons from A. Out of scope: laptop layout, A, C, D, E. Leave navigation stubs.

The README's "Not drawn" list (empty field, above proposed, below floor, API failure) needs a design answer. Ask before inventing one. When done, list anything you couldn't match and why.
