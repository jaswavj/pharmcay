# Billing and purchase design

Saved from the previous retail app so pharmacy billing and purchase can be rebuilt on the same screens. User management and company admin stay in the app. Product and batch master come next.

## Billing screen

Company setting `billing_type` picks the screen:

- Type `1` — barcode / search counter.
- Type `2` — category tiles and a cart (cafe-style select).

### Type 1 — search counter

Top row:

- Code / item name, with suggestions. Stock shows beside the field.
- Unit (only when the product is sold by a convertible unit such as kg).
- Qty, Price, ADD.
- HOLD LIST.

Line table columns: `#`, Code, Item Name, Qty + unit, Price, Discount (`₹` or `%`), Commission, Total, Delete.

Click a line to open that product’s recent sale history.

Footer: payable total, KEYS, DUP, REFRESH, SAVE / UPDATE. After save, show bill number. A loaded hold shows its hold number.

### Type 2 — select menu

Left: category chips (All + each category), search, product cards with name, MRP, qty badge, out-of-stock mark.

Right cart: name, price each, stepper, line total, remove. Footer total, HOLD LIST, KEYS, DUP, REFRESH, place order.

### Save modal

Customer name (search existing customers), phone, Tax Bill checkbox, Commission checkbox.

If the customer has exchange points, they can be applied as extra discount.

Totals: price total, line discount, commission, grand total, extra discount, payable.

Payment:

- Pay mode: Cash `1`, Bank `2`, Mixed `3`.
- Pay type (disabled for cash): UPI, Debit Card, Credit Card, Net Banking, Wallet.
- Cash paid, bank paid, due / balance.
- Paid cannot exceed payable. A due amount needs a customer name and is posted to the customer account.

Actions: CANCEL BILL (edit only, reason required), CLOSE, HOLD (new bills), PRINT, SAVE / UPDATE.

### Shortcuts

- Alt+O hold
- Alt+R new bill
- Alt+S open save
- Alt+B save
- Alt+P print
- Alt+C close save. After a saved bill, close starts the next bill.

### Other billing actions

- Hold list and duplicate recent bills.
- Edit an existing bill (same screen, loaded by bill number).
- Cancel restores stock and writes a cancel reason. Do not cancel when the customer account balance is larger than this bill’s due.
- Print thermal (Windows printer share name) or A4, from company print type.
- Zero-stock billing was previously allowed only with a special permission. That screen is removed; decide the rule when billing is rebuilt.
- Bill number shape: year suffix plus sequence, for example `26-1`.

Line math: discount is rupees or percent of line amount. Commission is stored per unit and shown when commission mode is on. Payable = grand total − extra discount.

## Purchase entry

Same counter chrome as billing.

Add item: search by code or name. Enter opens a small dialog for qty and cost. MRP is shown from the product and can be edited on the line.

Line columns: delete, Item Name, Qty, Cost, MRP, Disc%, Tax%, Free, history, Cost Tot, MRP Tot, Tax Tot, Net Tot, Unit Cost.

Line math:

- Billable qty = qty − free.
- Cost total = billable qty × cost.
- Discount amount = cost total × disc% / 100.
- Tax amount = (cost total − discount) × tax% / 100.
- Net = cost total − discount + tax.
- MRP total = billable qty × MRP.
- Unit cost = net / full qty (free stock lowers the unit cost).

Footer summary of those totals, then SAVE.

Confirm dialog (required before save):

- Supplier. A GST supplier pre-selects bank / UPI.
- Invoice number and invoice date.
- Payment type. Non-cash requires a bank / mode.
- Total (net − extra discount), paid now, extra discount, balance.

Rules: at least one line with qty, every line needs MRP, grand total > 0, supplier, invoice number, and payment type are required.

History button shows the last 6 purchases of that item: supplier, date, invoice, qty, free, cost, MRP, disc%, tax%.

Save returns a purchase number (`prno`) and clears the lines.

## What this design expects later

Product master and batches are not rebuilt yet. Billing looks up a product with code, name, MRP, batch, unit, stock, and commission. Purchase looks up cost, MRP, GST, and unit conversion, then receipt should increase batch stock.
