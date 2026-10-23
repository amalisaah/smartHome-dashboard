Build the journey **from the quote list to the quote builder page** (modules 3+4, block G, phone + laptop) from the handoff in `design_handoff_new_quote/`.

**The quote list (D) is already built. Don't rebuild or restyle it.** Today its "+ New quote" button jumps straight to the builder. Change that one action so it opens G over the list. G then creates the draft and opens the builder (A).

Read `README.md` first. Then open `G_new_quote.dc.html` in a browser and look at section G only; `New_Quote_Journey.dc.html` shows the whole flow. Tokens are in `tokens.css`. All of these are authoritative.

**Scope: UI and UX only.**
- Build G1 (phone bottom sheet with two steps that swap in place) and G2 (laptop dialog with two columns).
- Rewire the existing "+ New quote" button on the quote list (phone and laptop) to open them. When G is cancelled, the list keeps its tab and search.
- Supplied values, don't compute: the customer list in recent-first order, each customer's houses with room counts, search results, and the new draft id. If there's no source yet, use mock data shaped like the reference.
- Don't build the notes cards or the "Prototype only" panel. In the build, picking a house goes straight to A.

**Must get right:**
1. **It's a sheet or dialog over the quote list, not a route.** Nothing is saved until he picks a house, and Cancel, Esc or the scrim leaves no trace.
2. **Search has focus on open.** The list is labelled RECENT with an empty search and MATCHES while typing.
3. **Phone: a customer with exactly one house with rooms skips step 2.**
4. **A no-rooms house can't be picked.** It shows `no rooms yet · can't quote` and an `Add rooms ›` button. A customer with no houses gets the empty message and `+ New house`.
5. **Laptop: both columns are always visible.** Before a customer is picked, the right column is greyed with `Pick a customer on the left first.` Keyboard support: type, ↑ ↓, Enter, Enter. Esc closes.
6. **Picking a house creates the draft** (level left at default) and opens A on the first room.
7. **The amber mode band stays on.** It's owner-only.
8. **Hit targets ≥ 44px on phone.**

Reuse the bottom sheet, inputs, buttons and mode band from A and B.

Out of scope: A–E and the Customers screens. Leave navigation stubs for `+ New customer`, `+ New house` and `Add rooms ›`.

The README's "Open" list needs a design answer: whether no-rooms houses block the quote, phone entry from a customer, and the wording for offline and failure. Ask before inventing one. When you're done, list anything you couldn't match and why.
