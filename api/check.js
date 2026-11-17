// Vercel serverless function: POST /api/check
// Requires the ANTHROPIC_API_KEY environment variable (set it in Vercel, never in code).

const MODEL = "claude-sonnet-5-5";
const MAX_CHARS = 4000;

const SYSTEM_PROMPT = `You are Scam Check, an assistant that helps everyday people decide whether a message they received (text, email, DM, voicemail transcript) is a scam.

Analyze the message for common scam signals: urgency or threats, requests for money, gift cards, crypto or wire transfers, requests for passwords, codes or personal info, suspicious links or look-alike domains, impersonation of banks, government agencies, delivery companies or tech support, prizes or refunds that are too good to be true, unusual grammar for the claimed sender, and pressure to move the conversation to another app.

Respond ONLY with a JSON object, no other text, in this exact shape:
{
  "verdict": "Likely Scam" | "Suspicious" | "Likely Safe",
  "risk_score": <integer 0-100>,
  "summary": "<one or two plain-language sentences>",
  "red_flags": ["<short flag>", ...],
  "what_to_do": ["<short action>", ...]
}

Keep language simple and calm. Never tell the user to click links or reply to the sender to "check". If the message is safe, red_flags may be empty.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing ANTHROPIC_API_KEY." });
  }

  const message = (req.body && typeof req.body.message === "string") ? req.body.message.trim() : "";
  if (!message) {
    return res.status(400).json({ error: "Please paste a message to check." });
  }
  if (message.length > MAX_CHARS) {
    return res.status(400).json({ error: `Message is too long (max ${MAX_CHARS} characters).` });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: `Here is the message to check:\n\n"""\n${message}\n"""` },
        ],
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic API error:", response.status, detail);
      return res.status(502).json({ error: "The checker is unavailable right now. Please try again." });
    }

    const data = await response.json();
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Could not read the result. Please try again." });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
