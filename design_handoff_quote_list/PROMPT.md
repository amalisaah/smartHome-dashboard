Build the **quote list** (modules 3+4, block D) from the handoff in `design_handoff_quote_list/`.

Read `README.md` first. Then open `D_quote_list.dc.html` in a browser as the live visual reference; only section D is in scope. Tokens are in `tokens.css`. Treat all three as authoritative.

**Scope: UI and UX only.**
- Build D1 (phone 390: Waiting / Drafts / Answered tabs with search) and D2 (laptop 1440: the same three states as columns, with one search).
- Don't invent business rules. These are **supplied values**, so render them and don't compute them: status, days waiting, edited text, dates, declined reason, linked job number, tab counts, row order, and which answered quotes are recent enough to show. If the codebase has no source for them yet, use local mock data shaped like the reference.
- Don't build the notes cards. They are documentation.

**Must get right:**
1. **It answers "who do I chase?" first.**
   - The phone opens on **Waiting**.
   - Waiting is the leftmost column on the laptop.
   - Days waiting is the largest element on a sent row.
2. **No amounts anywhere on the list.**
3. **No colour for "late".** Days waiting is always the same ink. When to chase is his call.
4. **Each row is a single tap target, and its destination depends on its status:**
   - sent → B (record her answer)
   - draft → A
   - accepted → its job (C)
   - declined → read-only quote (stub it)
5. **An empty declined reason shows nothing.** No placeholder, no dash.
6. **The amber mode band is always on, and there's no "Show her".** This screen has other customers' names on it.
7. **Search:** on the phone it filters the current tab. On the laptop it filters all three columns, and the header counts stay unfiltered.
8. **Phone hit targets are at least 44px.** Rows are at least 64px.
9. Implement the hover, focus, press and keyboard states in the README.

Recreate the design in the existing app's framework, components and routing. Match the metrics and copy exactly. Reuse the mode band, segmented control, app bar, module tabs and inputs already built for the quote builder (A) and the catalogue. Below ~900px use D1, and at ~900px and above use D2.

Out of scope: A, B, C, E and the declined read-only view. Leave clear navigation stubs.

When done, list anything in the README you couldn't match and why.
