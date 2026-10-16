# API gaps — quotes (modules 3+4, block A)

Written from building the quote builder against the live API. Each gap says what
the screen has to do instead, and what it costs.

---

## 1. There is no bulk write for line **edits** — only for line **adds**

**Priority: high.** This is the one worth fixing first.

### What exists

| Write | Shape |
|---|---|
| `POST /quotes/{id}/lines` | one line |
| `POST /quotes/{id}/lines/bulk` | several lines, **one room**, *"written in a single transaction"* |
| `PATCH /quote-lines/{id}` | **one** line |
| `POST /quote-lines/{id}/remove` | **one** line |
| `POST /quote-lines/{id}/restore` | **one** line |

Adding is batched and transactional. Editing, switching off and switching back
on are one request per line, each able to fail on its own.

### What it costs

The builder holds every change locally and submits once. A representative
session — three items added to a room, two quantities changed, one line switched
off, labour set — submits as:

```
POST  /quotes/2/lines/bulk      1   (the three adds, one transaction)
PATCH /quote-lines/41           1
PATCH /quote-lines/58           1
POST  /quote-lines/63/remove    1
PATCH /quotes/2/charges         1
GET   /quotes/2/owner-view      1   (for the recomputed totals)
GET   /quotes/2/customer-view   1
                             ── 7 requests
```

Four of those seven are per-line writes that a batch would collapse into one.

**Atomicity is the bigger problem.** If the second `PATCH` fails, the first has
already landed: the quote is left in a state he never asked for — one line moved,
the next not — while he is standing in a customer's living room looking at it.
The client keeps the unsent remainder so nothing he typed is lost, but it cannot
put the server back. `lines/bulk` already solves exactly this for adds.

A negotiation where she says no to four things is four independent `remove`
calls today, and that is the common case, not the edge case.

### What would fix it

```
PATCH /quotes/{id}/lines/bulk
{
  "lines": [
    { "id": 41, "quantity": 4 },
    { "id": 58, "need": "security", "note": "no neutral in the box" },
    { "id": 63, "is_removed": true },
    { "id": 70, "is_removed": false }
  ]
}
```

- one transaction, like its `POST` sibling
- `is_removed` folds `remove` and `restore` in, so a negotiation is one call
- **respond with the quote and its new totals**, exactly as
  `PATCH /quotes/{id}/charges` already documents (*"The quote with its new
  totals"*). That removes the follow-up `GET /owner-view` from every submit.

Session above: **7 → 3**. Fold adds into the same endpoint and it is **2**.

### Why the count matters

This screen is used on a phone, on mobile data, standing in somebody's house.
Each separate request wakes the radio and holds it in a high-power state for
seconds afterwards, so a burst of small writes costs far more battery than one
larger one — and the quote builder is the screen most likely to be used far from
a charger.

---

## 2. `GET /quotes/{id}/rooms` carries no line count or room total

**Priority: low — the client can derive it.**

The room chips and the left rail both show `<n> lines` and the room's total
beside each name. Neither is on this payload, so both are counted and summed
client-side from the lines `owner-view` supplies. That is arithmetic over given
figures rather than pricing, so it is safe — but every consumer of this endpoint
will have to repeat it.

---

## 3. Device cost is not supplied on its own

**Priority: low.**

The money box shows `Device cost` by itself. `owner-view.money` carries
`cost_total_pesewas` (device landed cost **plus** the misc estimate) and
`misc_cost_estimate_pesewas`, so the client subtracts one from the other. It is
the one figure the screen takes apart rather than reads off.

---

## 4. There is no merge when adding an item already on the quote

**Priority: low — deliberate on the client, but worth stating.**

Tapping an item already in the active room must add one to its line rather than
start a second (handoff rule 3). `POST /lines` always creates, so the client
finds the existing line and steps it instead. Fine as it stands; it only becomes
a problem if another client ever adds lines without that rule.

---

## 5. A house has no `area`

**Priority: low — cosmetic.**

Both frames head the quote `<Surname> — <area>`, e.g. `Adjei — East Legon`.
`GET /houses/{id}` has `label` (`"Spintex house"`), `address_text` and
`landmark_directions`, but nothing that is the area. The builder uses `label`.

---

## 6. `customer-view` omits three things her screen shows

**Priority: low.**

Her view needs the quote's date, the customer's surname and the house's room
count. None is a cost, and the serializer having no cost field on its input type
is the whole point — so these are fetched separately from the quote, the
customer record and the quote's rooms, and handed in explicitly. Adding them to
`customer-view` would save two reads and keep her screen to a single document.

---

## 7. `GET /items?q=` matches name and keywords, not group

**Priority: none — noted only.**

The handoff has the picker searching "name and group". `?q=` covers name and
keywords. The builder fetches the catalogue once and filters in memory, which
covers group as well and costs nothing per keystroke — so this needs no change
unless the catalogue grows past being fetchable in one go.
