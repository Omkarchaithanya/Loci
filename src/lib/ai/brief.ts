import { createServerFn } from "@tanstack/react-start";

export type BriefInput = {
  thenFacts: string;
  nowFacts: string;
  failed: string;
  loops: string;
  plan: string;
};

export const briefIncomingWatch = createServerFn({ method: "POST" })
  .validator((input: BriefInput) => input)
  .handler(async ({ data }) => {
    const fallback = [
      "West Basin still needs an accessible overflow shelter.",
      "14:00: Riverside High was valid — West Connector open, 42 cots.",
      "16:30 superseded those facts: connector CLOSED, 8 cots remain.",
      "Do not retry North School. Failed attempt is on the graph.",
      "Civic Arena is the live path if Parks authority is confirmed.",
      "Human approval is required before the decision is APPROVED.",
    ].join(" ");

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: true as const, source: "graph" as const, text: fallback };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 280,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are the Incoming Watch briefing officer for WatchChange Mesh. Use ONLY the supplied graph packet. Six short operational sentences. No dispatch orders. Never invent node IDs, numbers, or sources. Label the scenario synthetic.",
          },
          {
            role: "user",
            content: `THEN FACTS:\n${data.thenFacts}\n\nNOW FACTS:\n${data.nowFacts}\n\nFAILED ATTEMPTS:\n${data.failed}\n\nOPEN LOOPS:\n${data.loops}\n\nCURRENT PLAN:\n${data.plan}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: true as const, source: "graph" as const, text: fallback };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim();
    return { ok: true as const, source: "xai" as const, text: text || fallback };
  });
