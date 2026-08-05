# Future Work / Backlog

Ideas raised during planning that are explicitly deferred — not part of the current build phase. Add to this list as new ideas come up; don't lose them in chat history.

## WhatsApp Bot / Agent

- **Natural-language data queries via WhatsApp.** Technician (or owner) sends a message like "bring me this person's invoice details for last month" and the bot looks up and returns the relevant customer/invoice data conversationally, instead of only handling the fixed INP/QOT/INV command flow. Needs a general query-intent layer on top of the structured commands.
- **Price negotiation handling.** Currently: any customer reply that isn't a clean approve/reject gets forwarded to the technician to handle manually. Later: bot could handle simple negotiation (e.g. re-quote at a lower price on request) before falling back to human handoff.
- **Formal technician registry.** Currently: technician identified informally by WhatsApp display name + what they state in-message. Later: proper technician accounts/numbers mapped in the system, so the bot recognizes them reliably regardless of display name changes.
