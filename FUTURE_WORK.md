# Future Work / Backlog

Ideas raised during planning that are explicitly deferred — not part of the current build phase. Add to this list as new ideas come up; don't lose them in chat history.

## WhatsApp Bot / Agent

- **Natural-language data queries via WhatsApp.** Technician (or owner) sends a message like "bring me this person's invoice details for last month" and the bot looks up and returns the relevant customer/invoice data conversationally, instead of only handling the fixed INP/QOT/INV command flow. Needs a general query-intent layer on top of the structured commands.
- **Price negotiation handling.** Currently: any customer reply that isn't a clean approve/reject gets forwarded to the technician to handle manually. Later: bot could handle simple negotiation (e.g. re-quote at a lower price on request) before falling back to human handoff.
- **Formal technician registry.** Currently: technician identified informally by WhatsApp display name + what they state in-message. Later: proper technician accounts/numbers mapped in the system, so the bot recognizes them reliably regardless of display name changes.

## Call Agent

- **AI outbound calling** — automated reminder/follow-up calls to customers (e.g. "your repair is scheduled tomorrow", "please approve your quotation"). Needs a telephony provider (e.g. Twilio Voice) — unlike WhatsApp, real phone calls have no free tier, billed per minute. Deferred until there's budget for it.
- **AI inbound call answering** — customer calls the business number, an AI agent answers, captures the issue, books a job. Same cost blocker as above, plus needs a dedicated business phone number from the provider.
- Current interim state (built): a plain call **log** — record who called, when, why, and notes — no AI/automation, $0 cost. This is the foundation the AI features above would build on top of once budget exists.
