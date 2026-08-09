# WhatsApp Message Templates

The bot automatically uses these ONLY when needed: if a customer hasn't
messaged the business number in the last 24 hours, WhatsApp requires a
pre-approved template to start that conversation — a plain document message
gets silently refused. If they *have* messaged recently (e.g. replying
"approved" to something), the bot sends a normal free-form document instead —
no template needed, nothing to do here for that case.

In practice: the **first** document sent for a job (inspection, or a
quotation/invoice if INP was skipped) needs a template. Everything that
follows a customer reply does not.

You don't need to do anything in code — this is already built and will pick
the right one automatically. What's left is submitting these 3 templates in
Meta so they exist and get approved. That's a Meta review step (can't be
automated), typically minutes to a day.

## How to submit (repeat 3 times, once per template below)

1. business.facebook.com → your Business → **WhatsApp Manager**
2. **Account tools → Message Templates → Create Template**
3. Category: **Utility** (transactional, not marketing — faster approval, no opt-in requirement)
4. Fill in exactly as below, then **Submit**

---

## Template 1 — `inspection_ready`

| Field | Value |
|---|---|
| Name | `inspection_ready` |
| Language | English (US) |
| Header type | Document |
| Body | `Hi {{1}}, we've completed the inspection for your {{2}}. Please find the report attached. Reply "approved" to proceed with a quotation, or let us know if you'd like any changes.` |

Variables, in order: `{{1}}` = customer name, `{{2}}` = appliance type

## Template 2 — `quotation_ready`

| Field | Value |
|---|---|
| Name | `quotation_ready` |
| Language | English (US) |
| Header type | Document |
| Body | `Hi {{1}}, here is your quotation for the {{2}} repair. Reply "approved" to proceed, or let us know if you'd like to discuss.` |

Variables: `{{1}}` = customer name, `{{2}}` = appliance type

## Template 3 — `invoice_ready`

| Field | Value |
|---|---|
| Name | `invoice_ready` |
| Language | English (US) |
| Header type | Document |
| Body | `Hi {{1}}, here is your invoice — total {{2}} AED. Thank you for your business.` |

Variables: `{{1}}` = customer name, `{{2}}` = total amount

---

## After they're approved

Nothing to change — the code already references these exact names. Once
Meta shows all 3 as **Approved** in WhatsApp Manager, the bot will
successfully reach customers outside the 24-hour window the moment real
credentials (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`) are set.

If a template name, language, or variable count doesn't match exactly what's
submitted in Meta, the send will fail — Meta is strict about this. Don't
rename them without updating `whatsappBotService.js` and `invoiceBatchService.js`
to match.
