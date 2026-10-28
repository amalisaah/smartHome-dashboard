Build **recording the job** (modules 3 + 4, block C, laptop) from the handoff in `design_handoff_job_recording/`.

Read `README.md` first, then open `C_job_recording.dc.html` in a browser and look at section C only. Tokens are in `tokens.css`. All three are authoritative.

**Scope: UI and UX only.**
- Every figure is **supplied**: profit, totals, owed, variance, consequence copy and change kinds. Don't compute business values. Use mock data shaped like the reference if there's no source yet.
- Don't build the notes cards or the other blocks.

**Must get right:**
1. It opens on the **Differences** view. As-quoted lines collapse into one `<n> lines fitted as quoted · show all` row.
2. **Dashed means system-set, solid means edited.** A pre-filled Fitted or Charged is dashed and muted. An edited one is solid `--action`, and an edited line also gets the tint and a change chip.
3. Change chips: `+n` / `−n` / `swapped` / `added` in `--action`; `not fitted` in `--risk`. A swap shows a `quoted: <item>` sub-line.
4. Job type is four radio tiles, not a dropdown. The consequence sentence and the complete bar's "as <type>" update as soon as he picks.
5. Cost is owner-only: the amber `Cost · owner` column and the dark profit card. No audience band on this screen.
6. Changes save as he goes, with `saved · <time>` in the app bar. There's no Save button.
7. Completed state: everything read-only except `+ Record a payment` and `+ Add a cost`. **No reopen.**

**Stubs:** the complete confirmation, the Record a payment dialog, the + Add line picker, the phone layout, and the owed = 0 / overpaid / completed / cancelled visuals. They're described under "States" and "Open decisions". Ask before inventing anything beyond that. When you're done, list anything you couldn't match and why.
