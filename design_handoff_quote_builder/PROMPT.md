Build the **quote builder** (modules 3+4, block A) from the handoff in `design_handoff_quote_builder/`.

Read `README.md` first. Then open `A_quote_builder.dc.html` in a browser as the live visual reference; only section A is in scope. Tokens are in `tokens.css`. Treat all three as authoritative.

**Scope: UI and UX only.**
- Build A1 (phone 390: his view, line editing, item picker sheet, money sheet, her view) and A2 (laptop 1440: his view by room and by need, type-ahead add, her view).
- Don't invent business rules. These are **supplied values**, so render them and don't compute them: every total and cost, proposed, expected profit, floor, the derived materials figure, stock warnings, default need, rooms, search results and save state. If the codebase has no source for them yet, use local mock data shaped like the reference.
- Don't build the notes cards. They are documentation.

**Must get right:**
1. **The cost wall.**
   - His view is light, with the 32px amber mode band `His view · cost on screen`. Her view is entirely dark (`.audience-customer`).
   - `Show her` is one tap.
   - Getting back needs a **900ms press-and-hold** with a fill bar. Releasing early or leaving the pill cancels it, and a tap does nothing.
   - The switch is instant, with no cross-fade.
2. **Her view is a separate screen rendered only from customer-safe data.** No cost value may exist in its data or DOM; never hide cost with CSS. Its layout differs from his: one row per need, plus Installation, Materials and Total. The itemised lines appear only when the itemise switch is on.
3. **Adding lands in the active room.**
   - Phone: the picker sheet stays open across taps.
   - Laptop: Enter adds the top match, keeps focus and the query; Esc clears.
   - Re-adding an item already in that room adds 1 to its line.
   - Rooms come from the house record and are never typed here.
4. **Solid = he set it, dashed = system.**
   - The default need chip or select is dashed and turns solid once changed.
   - Device total is a dashed read-only box.
   - Materials is dashed while derived and solid once overridden; clearing it returns it to derived.
   - The off toggle is dashed.
5. **Labour is empty until typed.** Never prefill 0. Empty labour shows `labour not set` (phone) or the refusal line (laptop) in `--risk`.
6. **The two money boxes never blur.**
   - "On her quote" has a dark top edge: devices, labour, materials, itemise switch.
   - "Yours only" has an amber top edge: misc cost estimate, device cost, profit and floor.
   - Amber (`--risk`) marks cost, owner-only figures and stock or labour warnings.
7. **Removing a line is "switch off", never delete.** Switched-off lines leave every total and her view, are listed under the dashed `<n> off` toggle with their date, and have `Switch on`. Quantity minimum is 1.
8. **Phone hit targets are at least 44px** (most are 48px). The money bar and mode band are always visible on the phone, including when a sheet is open (the sheet sits below the band).
9. Implement the hover, focus, press and keyboard states in the README.

Recreate the design in the existing app's framework, components and routing. Match the metrics and copy exactly. Reuse the laptop app bar, module tabs, segmented control and inputs already built for the catalogue and customers modules. Below ~900px use A1, and at ~900px and above use A2.

Out of scope: the quote list, proposed vs agreed (B), job recording (C), and `Mark sent`. Leave clear navigation stubs.

When done, list anything in the README you couldn't match and why.
