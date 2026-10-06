import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/brief-C_Js0AJJ.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var briefIncomingWatch_createServerFn_handler = createServerRpc({
	id: "8b3d974d3bd4de0669a5834751974a83ce4b55ec1c8133105126e9c0f7939201",
	name: "briefIncomingWatch",
	filename: "src/lib/ai/brief.ts"
}, (opts) => briefIncomingWatch.__executeServer(opts));
var briefIncomingWatch = createServerFn({ method: "POST" }).validator((input) => input).handler(briefIncomingWatch_createServerFn_handler, async ({ data }) => {
	const fallback = [
		"West Basin still needs an accessible overflow shelter.",
		"14:00: Riverside High was valid — West Connector open, 42 cots.",
		"16:30 superseded those facts: connector CLOSED, 8 cots remain.",
		"Do not retry North School. Failed attempt is on the graph.",
		"Civic Arena is the live path if Parks authority is confirmed.",
		"Human approval is required before the decision is APPROVED."
	].join(" ");
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: true,
		source: "graph",
		text: fallback
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			max_tokens: 280,
			temperature: .2,
			messages: [{
				role: "system",
				content: "You are the Incoming Watch briefing officer for WatchChange Mesh. Use ONLY the supplied graph packet. Six short operational sentences. No dispatch orders. Never invent node IDs, numbers, or sources. Label the scenario synthetic."
			}, {
				role: "user",
				content: `THEN FACTS:\n${data.thenFacts}\n\nNOW FACTS:\n${data.nowFacts}\n\nFAILED ATTEMPTS:\n${data.failed}\n\nOPEN LOOPS:\n${data.loops}\n\nCURRENT PLAN:\n${data.plan}`
			}]
		})
	});
	if (!res.ok) return {
		ok: true,
		source: "graph",
		text: fallback
	};
	return {
		ok: true,
		source: "xai",
		text: (await res.json()).choices?.[0]?.message?.content?.trim() || fallback
	};
});
//#endregion
export { briefIncomingWatch_createServerFn_handler };
