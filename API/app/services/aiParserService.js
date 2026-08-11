const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const isConfigured = () =>
  Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-v7-your-key-here');

const SYSTEM_PROMPT = `You read free-text WhatsApp messages from appliance-repair technicians and convert them into structured job data.

Pick exactly one command:
- INP: technician did an inspection and is reporting findings (no price agreed yet, or an estimate only)
- QOT: technician wants to send the customer a quotation for approval (has a firm price)
- INV: technician wants to bill the customer directly, no quotation step (has a firm price, job may already be done)

If the message doesn't contain enough info to act (missing customer phone, or not job-related at all), set "command" to null and put the reason in "clarification" — do not guess a phone number.

Respond with ONLY a JSON object, no prose, no markdown fences:
{
  "command": "INP" | "QOT" | "INV" | null,
  "customer": "string or null",
  "phone": "string or null",
  "appliance": "string or null",
  "findings": ["string", ...],
  "amount": number or null,
  "clarification": "string or null"
}`;

/**
 * Turns a technician's natural free-text message into the same shape
 * parseCommand() used to produce from the rigid "Key: value" format, so
 * whatsappBotService's downstream logic doesn't need to change.
 * Falls back to null (caller should use the legacy parser) when no API
 * key is configured, so the bot keeps working before this is wired up.
 */
const parseTechnicianMessage = async (body) => {
  if (!isConfigured()) return null;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.CREWAI_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: body }],
    }),
  });

  if (!response.ok) {
    console.error('[AIParser] Anthropic API error:', await response.text());
    return null;
  }

  const result = await response.json();
  const text = result?.content?.[0]?.text?.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (!parsed.command) return { command: null, clarification: parsed.clarification || "Couldn't work out what you need — mention the customer's phone number and whether this is an inspection, quotation, or invoice." };

    return {
      command: parsed.command,
      fields: {
        customer: parsed.customer || undefined,
        phone: parsed.phone || undefined,
        appliance: parsed.appliance || undefined,
        findings: Array.isArray(parsed.findings) ? parsed.findings.join('; ') : undefined,
        items: Array.isArray(parsed.findings) ? parsed.findings.join('; ') : undefined,
        amount: parsed.amount != null ? String(parsed.amount) : undefined,
      },
    };
  } catch (err) {
    console.error('[AIParser] Failed to parse model output as JSON:', text);
    return null;
  }
};

export { parseTechnicianMessage, isConfigured };
