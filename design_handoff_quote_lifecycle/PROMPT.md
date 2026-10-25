Build the **quote lifecycle** (modules 3+4: draft → waiting → answered) from the handoff in `design_handoff_quote_lifecycle/`. The new part is **B3, the laptop "What did she agree to?" dialog**, plus the B edge states on phone and laptop.

Read `README.md` first. Open `Quote_Lifecycle_Journey.dc.html` for the flow, then `Quotes_Jobs_Screens.dc.html` in a browser (section B: B1, B2, B3). Tokens are in `tokens.css`. All of these are authoritative.

**Scope: UI and UX only.**
- Build B3 (dialog plus its decline step) and add the edge states to the existing B1/B2.
- Wire the status moves between screens: Mark sent (A) → Waiting (D) → B → C or D.
- Supplied values, don't compute: proposed, floor, difference, profit, floor headroom, the under-floor flag, customer name/area, quote number, sent-ago text, `job_id`. Use mock data shaped like the reference if there's no source yet.
- Don't build the notes cards, the "Try" chips, the journey map, or the dashed "where he lands" card.

**Must get right:**
1. B is on the quote's own route and **opens automatically** for any `sent` quote: a sheet below ~900px, a dialog above it.
2. The agreed field has focus on open. Proposed is dashed and read-only; agreed is solid. They sit side by side on the laptop.
3. The gap box, floor line and primary label update as he types. Empty → disabled primary. Under floor → 2px border and a warning, **but Accept stays enabled**.
4. Laptop keyboard: Enter accepts, Esc = Not yet (on the decline step Esc = Back), focus is trapped, clicking the scrim does nothing.
5. Accept → C via `job_id`. Declined → D Answered. Not yet → D Waiting, still `sent`.
6. No signal: Accept and Declined are disabled, the no-signal line shows, and typed input is kept.
7. Amber mode band on, no "Show her". Hit targets ≥ 44px on the phone.

**Stubs:** what Mark sent shows afterwards (go to D Waiting for now), the declined read-only view, and the API error copy. They're listed under "Open decisions" in the README. Ask before inventing anything beyond them. When you're done, list anything you couldn't match and why.
