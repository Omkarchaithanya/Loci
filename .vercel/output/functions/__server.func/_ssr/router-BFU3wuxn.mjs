import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { _ as createFileRoute, b as require_jsx_runtime, d as Scripts, f as HeadContent, g as lazyRouteComponent, h as Outlet, m as createRouter, v as createRootRoute, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BFU3wuxn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var styles_default = "/assets/styles-B4Tkbv8r.css";
var APP_NAME = "WatchChange Mesh";
var Route$3 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: APP_NAME },
			{
				name: "description",
				content: "See what changed. Act with evidence. Human-approved disaster-coordination memory on a graph."
			},
			{
				name: "theme-color",
				content: "#0b0d11"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "antialiased",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-bg text-fg",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	})
});
var $$splitComponentImporter = () => import("./routes-D1OMH9EK.mjs");
var Route$2 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var GRAPH_NAME = "watchchange_flood_demo";
var T14 = "2026-10-15T14:00:00Z";
var T1630 = "2026-10-15T16:30:00Z";
var T18 = "2026-10-15T18:00:00Z";
var T_HANDOFF = "2026-10-15T17:55:00Z";
function isValidAt(from, to, t) {
	if (from && from > t) return false;
	if (to && to <= t) return false;
	return true;
}
function factRecord(g, factId) {
	const f = g.get(factId);
	if (!f || !f.labels.includes("Fact")) return null;
	const about = g.out(factId, "ABOUT")[0];
	const subject = about ? g.get(about.to) : void 0;
	const superseder = g.in(factId, "SUPERSEDES")[0];
	return {
		id: f.id,
		subjectId: String(f.props.subject_id ?? subject?.id ?? ""),
		subjectLabels: subject?.labels ?? [],
		predicate: String(f.props.predicate ?? ""),
		objectValue: String(f.props.object_value ?? ""),
		validFrom: String(f.props.valid_from ?? ""),
		validTo: f.props.valid_to == null ? null : String(f.props.valid_to),
		observedAt: String(f.props.observed_at ?? ""),
		confidence: Number(f.props.confidence ?? 0),
		status: String(f.props.status ?? ""),
		sourceId: String(f.props.source_id ?? ""),
		supersededBy: superseder?.from
	};
}
function factsAtTime(g, t, statuses = ["VALID", "SUPERSEDED"]) {
	const out = [];
	for (const f of g.nodesByLabel("Fact")) {
		const rec = factRecord(g, f.id);
		if (!rec) continue;
		if (!statuses.includes(rec.status) && rec.status !== "VALID") {
			if (!statuses.includes(rec.status)) continue;
		}
		if (!isValidAt(rec.validFrom, rec.validTo, t)) continue;
		if (rec.status === "SUPERSEDED" && !statuses.includes("SUPERSEDED")) continue;
		if (rec.status === "VALID" && !statuses.includes("VALID")) continue;
		out.push(rec);
	}
	return out.sort((a, b) => a.subjectId.localeCompare(b.subjectId) || a.predicate.localeCompare(b.predicate));
}
function supersedeFact(g, oldFactId, newId, newValue, validFrom, sourceId, confidence, observedAt) {
	const old = g.must(oldFactId);
	const about = g.out(oldFactId, "ABOUT")[0];
	if (!about) throw new Error(`Fact ${oldFactId} has no ABOUT`);
	g.mergeNode(["Fact"], newId, {
		id: newId,
		subject_id: String(old.props.subject_id),
		predicate: String(old.props.predicate),
		object_value: newValue,
		value_type: String(old.props.value_type ?? "STRING"),
		valid_from: validFrom,
		valid_to: null,
		observed_at: observedAt,
		confidence,
		status: "VALID",
		source_id: sourceId,
		created_at: observedAt,
		updated_at: observedAt
	});
	g.mergeRel("ABOUT", newId, about.to);
	g.mergeRel("SUPERSEDES", newId, oldFactId);
	const support = g.out(oldFactId, "SUPPORTED_BY")[0];
	if (support) g.mergeRel("SUPPORTED_BY", newId, support.to);
	g.setProps(oldFactId, {
		valid_to: validFrom,
		status: "SUPERSEDED",
		updated_at: observedAt
	});
	return newId;
}
function evidenceForFact(g, factId) {
	const out = [];
	for (const rel of g.out(factId, "SUPPORTED_BY")) {
		const e = g.get(rel.to);
		if (!e) continue;
		const srcRel = g.out(e.id, "FROM_SOURCE")[0];
		const src = srcRel ? g.get(srcRel.to) : void 0;
		out.push({
			evidenceId: e.id,
			quote: String(e.props.quote ?? ""),
			sourceId: src?.id ?? String(e.props.source_id ?? ""),
			url: String(src?.props.url ?? "")
		});
	}
	return out;
}
var CYPHER = {
	factsAtTime: `MATCH (f:Fact)-[:ABOUT]->(subject)
WHERE f.valid_from <= $reference_time
  AND (f.valid_to IS NULL OR f.valid_to > $reference_time)
  AND f.status IN ['VALID', 'SUPERSEDED']
RETURN subject.id, labels(subject), f.predicate, f.object_value, f.valid_from, f.valid_to, f.status`,
	candidatePlan: `MATCH (h:Hazard {id: $hazard_id})-[:AFFECTS]->(z:Zone)
MATCH (hh:Household)-[:LOCATED_IN]->(z)
MATCH (hh)-[:HAS_NEED]->(need:Need)
MATCH (s:Shelter)
MATCH (s)-[:LOCATED_IN]->(sz:Zone)
MATCH (s)-[:STAGED_AT]->(dest:Site)
MATCH (origin:Site)<-[:CONTAINS]-(z)
OPTIONAL MATCH (fa:FailedAttempt)-[:TARGETS]->(s)
OPTIONAL MATCH (a:Agency)-[auth:HAS_AUTHORITY]->(z)
OPTIONAL MATCH (destAgency:Agency)-[dauth:HAS_AUTHORITY]->(sz)
OPTIONAL MATCH (a)-[:CONTROLS]->(asset:Asset)
WHERE h.status = 'ACTIVE' AND s.status = 'OPEN' AND need.status = 'OPEN'
RETURN z, s, dest, origin, fa, a, destAgency, asset, need`,
	supersession: `MATCH (newer:Fact)-[:SUPERSEDES]->(older:Fact)
MATCH (newer)-[:ABOUT]->(subject)
RETURN subject.id, newer.predicate, newer.object_value, older.object_value, older.valid_from, older.valid_to`,
	unownedLoops: `MATCH (o:OpenLoop)
WHERE o.status IN ['OPEN', 'BLOCKED', 'ESCALATED']
  AND NOT (o)<-[:OWNS]-(:Agent)
RETURN o.id, o.title, o.priority, o.due_at`,
	failedAttempts: `MATCH (fa:FailedAttempt)-[:ABOUT]->(o:OpenLoop)
OPTIONAL MATCH (fa)-[:TARGETS]->(target)
RETURN fa.id, fa.action_kind, fa.reason, target.id, o.title`,
	handoff: `MATCH (h:Handoff {id: $handoff_id})-[:TRANSFERS]->(o:OpenLoop)
OPTIONAL MATCH (owner:Agent)-[:OWNS]->(o)
OPTIONAL MATCH (fa:FailedAttempt)-[:ABOUT]->(o)
RETURN h.summary, o, owner, fa`
};
function activeHazards(g, t) {
	return g.nodesByLabel("Hazard").filter((h) => {
		if (h.props.status !== "ACTIVE") return false;
		return isValidAt(String(h.props.valid_from ?? ""), h.props.valid_to == null ? null : String(h.props.valid_to), t);
	}).map((h) => ({
		id: h.id,
		kind: String(h.props.kind),
		severity: Number(h.props.severity),
		description: String(h.props.description),
		observedAt: String(h.props.observed_at),
		zones: g.out(h.id, "AFFECTS").map((rel) => {
			const z = g.must(rel.to);
			return {
				id: z.id,
				name: String(z.props.name)
			};
		})
	}));
}
function needsByZone(g, t) {
	const rows = [];
	for (const z of g.nodesByLabel("Zone")) {
		const households = g.in(z.id, "LOCATED_IN").map((rel) => g.get(rel.from)).filter((n) => n?.labels.includes("Household"));
		let openNeeds = 0;
		let qty = 0;
		const kinds = /* @__PURE__ */ new Set();
		for (const hh of households) {
			if (!hh) continue;
			for (const rel of g.out(hh.id, "HAS_NEED")) {
				const need = g.get(rel.to);
				if (!need || need.props.status !== "OPEN") continue;
				if (!isValidAt(String(need.props.valid_from ?? ""), need.props.valid_to == null ? null : String(need.props.valid_to), t)) continue;
				openNeeds += 1;
				qty += Number(need.props.quantity ?? 0);
				kinds.add(String(need.props.kind));
			}
		}
		if (households.length === 0) continue;
		rows.push({
			zoneId: z.id,
			zoneName: String(z.props.name),
			households: households.length,
			openNeeds,
			needTypes: [...kinds],
			totalQuantity: qty
		});
	}
	return rows.sort((a, b) => b.openNeeds - a.openNeeds);
}
function shelterSite(g, shelterId) {
	return g.out(shelterId, "STAGED_AT")[0]?.to ?? null;
}
function originSiteForZone(g, zoneId) {
	return g.out(zoneId, "CONTAINS")[0]?.to ?? null;
}
function failedAttemptsFor(g, targetId) {
	return g.nodesByLabel("FailedAttempt").filter((fa) => targetId ? fa.props.target_id === targetId : true).map((fa) => ({
		id: fa.id,
		actionKind: String(fa.props.action_kind),
		targetId: String(fa.props.target_id),
		reason: String(fa.props.reason),
		attemptedAt: String(fa.props.attempted_at),
		openLoopId: g.out(fa.id, "ABOUT")[0]?.to ?? null
	}));
}
function unownedOpenLoops(g) {
	return g.nodesByLabel("OpenLoop").filter((o) => [
		"OPEN",
		"BLOCKED",
		"ESCALATED"
	].includes(String(o.props.status))).filter((o) => g.in(o.id, "OWNS").length === 0).map((o) => ({
		id: o.id,
		title: String(o.props.title),
		description: String(o.props.description),
		priority: Number(o.props.priority),
		status: String(o.props.status),
		dueAt: String(o.props.due_at ?? "")
	}));
}
function openLoops(g) {
	return g.nodesByLabel("OpenLoop").map((o) => {
		const ownerRel = g.in(o.id, "OWNS")[0];
		const owner = ownerRel ? g.get(ownerRel.from) : void 0;
		return {
			id: o.id,
			title: String(o.props.title),
			description: String(o.props.description),
			priority: Number(o.props.priority),
			status: String(o.props.status),
			dueAt: String(o.props.due_at ?? ""),
			ownerId: owner?.id ?? null,
			ownerName: owner ? String(owner.props.name) : null
		};
	});
}
function handoffContext(g, handoffId) {
	const h = g.get(handoffId);
	if (!h) return null;
	const from = g.out(h.id, "FROM_AGENT")[0];
	const to = g.out(h.id, "TO_AGENT")[0];
	const loops = g.out(h.id, "TRANSFERS").map((rel) => {
		const o = g.must(rel.to);
		const ownerRel = g.in(o.id, "OWNS")[0];
		return {
			id: o.id,
			title: String(o.props.title),
			status: String(o.props.status),
			ownerId: ownerRel?.from ?? null
		};
	});
	return {
		id: h.id,
		summary: String(h.props.summary),
		status: String(h.props.status),
		referenceTime: String(h.props.reference_time),
		fromAgentId: from?.to ?? String(h.props.from_agent_id),
		toAgentId: to?.to ?? String(h.props.to_agent_id),
		loops,
		failedAttempts: failedAttemptsFor(g)
	};
}
function supersessionChain(g, t) {
	const rows = [];
	for (const rel of [...g.nodesByLabel("Fact")].flatMap((f) => g.out(f.id, "SUPERSEDES").map((r) => ({
		newer: f,
		rel: r
	})))) {
		const older = g.get(rel.rel.to);
		if (!older) continue;
		const newerRec = factRecord(g, rel.newer.id);
		const olderRec = factRecord(g, older.id);
		if (!newerRec || !olderRec) continue;
		if (!isValidAt(newerRec.validFrom, newerRec.validTo, t) && newerRec.validFrom > t) continue;
		rows.push({
			subjectId: newerRec.subjectId,
			predicate: newerRec.predicate,
			currentValue: newerRec.objectValue,
			currentValidFrom: newerRec.validFrom,
			previousValue: olderRec.objectValue,
			previousValidFrom: olderRec.validFrom,
			previousValidTo: olderRec.validTo,
			previousFactId: olderRec.id,
			currentFactId: newerRec.id
		});
	}
	return rows;
}
function sheltersAt(g, _t) {
	return g.nodesByLabel("Shelter").map((s) => {
		const zone = g.out(s.id, "LOCATED_IN")[0];
		const z = zone ? g.get(zone.to) : void 0;
		return {
			id: s.id,
			name: String(s.props.name),
			capacity: Number(s.props.capacity),
			occupied: Number(s.props.occupied),
			available: Number(s.props.capacity) - Number(s.props.occupied),
			accessible: Boolean(s.props.accessible),
			status: String(s.props.status),
			services: Array.isArray(s.props.services) ? s.props.services : [],
			zoneId: z?.id ?? "",
			zoneName: z ? String(z.props.name) : ""
		};
	});
}
function candidatePlans(g, hazardId, t) {
	if (!g.get(hazardId)) return [];
	const zones = g.out(hazardId, "AFFECTS").map((rel) => g.must(rel.to));
	const candidates = [];
	for (const z of zones) {
		const origin = originSiteForZone(g, z.id);
		const households = g.in(z.id, "LOCATED_IN").map((rel) => g.get(rel.from)).filter((n) => n?.labels.includes("Household"));
		const needs = households.flatMap((hh) => hh ? g.out(hh.id, "HAS_NEED").map((r) => g.get(r.to)).filter(Boolean) : []);
		const requested = needs.reduce((sum, n) => sum + (n && n.props.kind === "SHELTER" ? Number(n.props.quantity ?? 0) : 0), 0);
		const needKinds = new Set(needs.filter(Boolean).map((n) => String(n.props.kind)));
		const mobilityLimited = households.some((hh) => hh && hh.props.mobility === "LIMITED");
		const originAgencies = g.in(z.id, "HAS_AUTHORITY").filter((rel) => isValidAt(rel.props.valid_from ? String(rel.props.valid_from) : null, rel.props.valid_to ? String(rel.props.valid_to) : null, t)).map((rel) => g.must(rel.from));
		for (const s of g.nodesByLabel("Shelter")) {
			if (s.props.status !== "OPEN") continue;
			const destZoneRel = g.out(s.id, "LOCATED_IN")[0];
			const destZone = destZoneRel ? g.must(destZoneRel.to) : z;
			const dest = shelterSite(g, s.id);
			const available = Number(s.props.capacity) - Number(s.props.occupied);
			const services = Array.isArray(s.props.services) ? s.props.services : [];
			const accessible = Boolean(s.props.accessible);
			const failed = failedAttemptsFor(g, s.id)[0] ?? null;
			let routeOpen = true;
			let routeMinutes = 0;
			let routeSiteIds = origin && dest ? [origin, dest] : [];
			let routeRoadIds = [];
			const blockedRoads = [];
			if (origin && dest && origin !== dest) {
				const openPath = g.shortestPath(origin, dest, "CONNECTED_BY", { edgeOk: (rel) => String(rel.props.status) === "OPEN" });
				const anyPath = g.shortestPath(origin, dest, "CONNECTED_BY", { edgeOk: () => true });
				if (!openPath) {
					routeOpen = false;
					if (anyPath) {
						routeSiteIds = anyPath.nodeIds;
						routeRoadIds = anyPath.relIds.map((rid) => {
							const rel = [...g.out(origin, "CONNECTED_BY"), ...g.nodesByLabel("Site").flatMap((site) => g.out(site.id, "CONNECTED_BY"))].find((x) => x.id === rid);
							return String(rel?.props.road_id ?? rid);
						});
						for (const rid of anyPath.relIds);
						routeMinutes = anyPath.minutes;
						for (const site of anyPath.nodeIds.slice(0, -1)) for (const rel of g.out(site, "CONNECTED_BY")) if (anyPath.relIds.includes(rel.id) && String(rel.props.status) !== "OPEN") blockedRoads.push(String(rel.props.road_id));
					}
				} else {
					routeSiteIds = openPath.nodeIds;
					routeMinutes = openPath.minutes;
					routeRoadIds = [];
					for (const site of openPath.nodeIds.slice(0, -1)) for (const rel of g.out(site, "CONNECTED_BY")) if (openPath.relIds.includes(rel.id)) routeRoadIds.push(String(rel.props.road_id));
				}
			}
			const destAgencies = g.in(destZone.id, "HAS_AUTHORITY").filter((rel) => isValidAt(rel.props.valid_from ? String(rel.props.valid_from) : null, rel.props.valid_to ? String(rel.props.valid_to) : null, t)).map((rel) => g.must(rel.from));
			const destAuthority = destAgencies.length > 0;
			const agency = originAgencies[0] ?? destAgencies[0] ?? null;
			const assetRel = agency ? g.out(agency.id, "CONTROLS").find((rel) => {
				const a = g.get(rel.to);
				return a && a.props.status === "AVAILABLE";
			}) : void 0;
			const asset = assetRel ? g.get(assetRel.to) : void 0;
			const blockingReasons = [];
			if (!routeOpen) blockingReasons.push(`Route closed: ${blockedRoads.map((id) => g.get(id)?.props.name ?? id).join(", ") || "no open path"}`);
			if (available < requested) blockingReasons.push(`Capacity ${available} < requested ${requested}`);
			if (mobilityLimited && !accessible) blockingReasons.push("Shelter is not step-free; mobility-limited households present");
			if (failed) blockingReasons.push(`Previous failed attempt: ${failed.reason}`);
			if (!destAuthority) blockingReasons.push(`No confirmed authority on destination zone ${destZone.props.name}`);
			if (!agency) blockingReasons.push("No origin authority");
			const coverage = requested <= 0 ? 1 : Math.min(1, available / requested);
			let score = coverage * .55 + (accessible ? .2 : 0) + (routeOpen ? .15 : 0) + (destAuthority ? .1 : 0);
			if (failed) score -= .5;
			if (!routeOpen) score -= .4;
			if (needKinds.has("MEDICAL") && services.includes("MEDICAL")) score += .05;
			candidates.push({
				shelterId: s.id,
				shelterName: String(s.props.name),
				zoneId: destZone.id,
				zoneName: String(destZone.props.name),
				availableSpaces: available,
				accessible,
				services,
				routeOpen,
				routeMinutes,
				routeSiteIds,
				routeRoadIds,
				blockedRoads,
				authorityAgencyId: agency?.id ?? null,
				authorityAgencyName: agency ? String(agency.props.name) : null,
				destinationAuthority: destAuthority,
				assetId: asset?.id ?? null,
				assetKind: asset ? String(asset.props.kind) : null,
				failedAttempt: failed ? {
					id: failed.id,
					reason: failed.reason
				} : null,
				exposedHouseholds: households.length,
				requestedQuantity: requested,
				capacityCoverage: coverage,
				planScore: Number(score.toFixed(3)),
				blockingReasons
			});
		}
	}
	return candidates.sort((a, b) => b.planScore - a.planScore);
}
function evidencePacket(g, factIds) {
	return factIds.flatMap((id) => {
		const rec = factRecord(g, id);
		if (!rec) return [];
		return evidenceForFact(g, id).map((e) => ({
			...e,
			factId: rec.id,
			predicate: rec.predicate,
			value: rec.objectValue,
			validFrom: rec.validFrom,
			validTo: rec.validTo
		}));
	});
}
function graphHealth(g) {
	return {
		graph: g.name,
		nodes: g.nodeCount(),
		relationships: g.relCount(),
		labels: {
			Fact: g.nodesByLabel("Fact").length,
			Shelter: g.nodesByLabel("Shelter").length,
			Household: g.nodesByLabel("Household").length,
			Episode: g.nodesByLabel("Episode").length,
			Decision: g.nodesByLabel("Decision").length
		},
		ready: g.nodeCount() > 0
	};
}
function episodesSince(g, since) {
	return g.nodesByLabel("Episode").filter((e) => String(e.props.occurred_at) >= since).sort((a, b) => String(b.props.occurred_at).localeCompare(String(a.props.occurred_at))).map((e) => ({
		id: e.id,
		kind: String(e.props.kind),
		text: String(e.props.text),
		occurredAt: String(e.props.occurred_at),
		author: String(e.props.author_agent_id),
		importance: Number(e.props.importance ?? 0)
	}));
}
function decisions(g) {
	return g.nodesByLabel("Decision").map((d) => ({
		id: d.id,
		actionKind: String(d.props.action_kind),
		status: String(d.props.status),
		rationale: String(d.props.rationale),
		referenceTime: String(d.props.reference_time),
		confidence: Number(d.props.confidence ?? 0),
		createdBy: String(d.props.created_by ?? ""),
		approvedBy: d.props.approved_by ? String(d.props.approved_by) : null,
		shelterId: d.props.shelter_id ? String(d.props.shelter_id) : null,
		action: d.props.action ? String(d.props.action) : null,
		factIds: g.out(d.id, "USES_FACT").map((r) => r.to)
	})).sort((a, b) => b.referenceTime.localeCompare(a.referenceTime));
}
function reconstructFacts(g, t) {
	return factsAtTime(g, t, ["VALID", "SUPERSEDED"]);
}
function cloneProps(props) {
	const out = {};
	for (const [k, v] of Object.entries(props)) out[k] = Array.isArray(v) ? [...v] : v;
	return out;
}
var PropertyGraph = class PropertyGraph {
	name;
	nodes = /* @__PURE__ */ new Map();
	rels = /* @__PURE__ */ new Map();
	outIndex = /* @__PURE__ */ new Map();
	inIndex = /* @__PURE__ */ new Map();
	labelIndex = /* @__PURE__ */ new Map();
	nextRel = 1;
	constructor(name) {
		this.name = name;
	}
	clone() {
		return PropertyGraph.restore(this.snapshot());
	}
	snapshot() {
		return {
			name: this.name,
			nodes: [...this.nodes.values()].map((n) => ({
				id: n.id,
				labels: [...n.labels],
				props: cloneProps(n.props)
			})),
			rels: [...this.rels.values()].map((r) => ({
				id: r.id,
				type: r.type,
				from: r.from,
				to: r.to,
				props: cloneProps(r.props)
			})),
			nextRel: this.nextRel
		};
	}
	static restore(data) {
		const g = new PropertyGraph(data.name);
		g.nextRel = data.nextRel;
		for (const n of data.nodes) {
			g.nodes.set(n.id, {
				id: n.id,
				labels: [...n.labels],
				props: cloneProps(n.props)
			});
			for (const label of n.labels) {
				let set = g.labelIndex.get(label);
				if (!set) {
					set = /* @__PURE__ */ new Set();
					g.labelIndex.set(label, set);
				}
				set.add(n.id);
			}
		}
		for (const r of data.rels) {
			g.rels.set(r.id, {
				...r,
				props: cloneProps(r.props)
			});
			g.indexRel(r);
		}
		return g;
	}
	nodeCount() {
		return this.nodes.size;
	}
	relCount() {
		return this.rels.size;
	}
	get(id) {
		return this.nodes.get(id);
	}
	must(id) {
		const n = this.nodes.get(id);
		if (!n) throw new Error(`Missing node ${id}`);
		return n;
	}
	mergeNode(labels, id, props) {
		const existing = this.nodes.get(id);
		if (existing) {
			for (const label of labels) if (!existing.labels.includes(label)) {
				existing.labels.push(label);
				let set = this.labelIndex.get(label);
				if (!set) {
					set = /* @__PURE__ */ new Set();
					this.labelIndex.set(label, set);
				}
				set.add(id);
			}
			Object.assign(existing.props, props);
			return existing;
		}
		const node = {
			id,
			labels: [...labels],
			props: { ...props }
		};
		this.nodes.set(id, node);
		for (const label of labels) {
			let set = this.labelIndex.get(label);
			if (!set) {
				set = /* @__PURE__ */ new Set();
				this.labelIndex.set(label, set);
			}
			set.add(id);
		}
		return node;
	}
	setProps(id, props) {
		const n = this.must(id);
		Object.assign(n.props, props);
	}
	mergeRel(type, from, to, props = {}, id) {
		if (id) {
			const existing = this.rels.get(id);
			if (existing) {
				existing.type = type;
				existing.from = from;
				existing.to = to;
				Object.assign(existing.props, props);
				return existing;
			}
		} else for (const relId of this.outIndex.get(from) ?? []) {
			const rel = this.rels.get(relId);
			if (rel && rel.type === type && rel.to === to) {
				Object.assign(rel.props, props);
				return rel;
			}
		}
		const rel = {
			id: id ?? `rel_${this.nextRel++}`,
			type,
			from,
			to,
			props: { ...props }
		};
		this.rels.set(rel.id, rel);
		this.indexRel(rel);
		return rel;
	}
	deleteRel(id) {
		const rel = this.rels.get(id);
		if (!rel) return;
		this.rels.delete(id);
		this.outIndex.set(rel.from, (this.outIndex.get(rel.from) ?? []).filter((x) => x !== id));
		this.inIndex.set(rel.to, (this.inIndex.get(rel.to) ?? []).filter((x) => x !== id));
	}
	nodesByLabel(label) {
		const ids = this.labelIndex.get(label);
		if (!ids) return [];
		return [...ids].map((id) => this.must(id));
	}
	out(id, type) {
		return (this.outIndex.get(id) ?? []).map((rid) => this.rels.get(rid)).filter((r) => type ? r.type === type : true);
	}
	in(id, type) {
		return (this.inIndex.get(id) ?? []).map((rid) => this.rels.get(rid)).filter((r) => type ? r.type === type : true);
	}
	neighbors(id, type, direction = "out") {
		const rels = [];
		if (direction === "out" || direction === "both") rels.push(...this.out(id, type));
		if (direction === "in" || direction === "both") rels.push(...this.in(id, type));
		const seen = /* @__PURE__ */ new Set();
		const nodes = [];
		for (const rel of rels) {
			const nid = rel.from === id ? rel.to : rel.from;
			if (seen.has(nid)) continue;
			seen.add(nid);
			const n = this.nodes.get(nid);
			if (n) nodes.push(n);
		}
		return nodes;
	}
	hasRel(from, type, to) {
		return this.out(from, type).some((r) => r.to === to);
	}
	/**
	* Weighted BFS over CONNECTED_BY (or any rel type) honoring a status predicate.
	* Returns the lowest travel_minutes path, or null if unreachable.
	*/
	shortestPath(sourceId, targetId, relType, opts = {}) {
		if (sourceId === targetId) return {
			nodeIds: [sourceId],
			relIds: [],
			minutes: 0
		};
		const maxHops = opts.maxHops ?? 8;
		const edgeOk = opts.edgeOk ?? (() => true);
		const weightKey = opts.weightKey ?? "travel_minutes";
		const dist = /* @__PURE__ */ new Map();
		const prev = /* @__PURE__ */ new Map();
		const queue = [sourceId];
		dist.set(sourceId, 0);
		const hops = /* @__PURE__ */ new Map([[sourceId, 0]]);
		while (queue.length) {
			const cur = queue.shift();
			const curHops = hops.get(cur) ?? 0;
			if (curHops >= maxHops) continue;
			for (const rel of this.out(cur, relType)) {
				if (!edgeOk(rel)) continue;
				const w = Number(rel.props[weightKey] ?? 1);
				const nextCost = (dist.get(cur) ?? 0) + (Number.isFinite(w) ? w : 1);
				const existing = dist.get(rel.to);
				if (existing !== void 0 && existing <= nextCost) continue;
				dist.set(rel.to, nextCost);
				prev.set(rel.to, {
					node: cur,
					rel: rel.id
				});
				hops.set(rel.to, curHops + 1);
				queue.push(rel.to);
			}
		}
		if (!dist.has(targetId)) return null;
		const nodeIds = [];
		const relIds = [];
		let walk = targetId;
		while (walk && walk !== sourceId) {
			nodeIds.push(walk);
			const step = prev.get(walk);
			if (!step) break;
			relIds.push(step.rel);
			walk = step.node;
		}
		nodeIds.push(sourceId);
		nodeIds.reverse();
		relIds.reverse();
		return {
			nodeIds,
			relIds,
			minutes: dist.get(targetId) ?? 0
		};
	}
	indexRel(rel) {
		const outs = this.outIndex.get(rel.from) ?? [];
		outs.push(rel.id);
		this.outIndex.set(rel.from, outs);
		const ins = this.inIndex.get(rel.to) ?? [];
		ins.push(rel.id);
		this.inIndex.set(rel.to, ins);
	}
};
var NOW = T14;
function n(g, labels, id, props) {
	g.mergeNode(labels, id, {
		id,
		...props
	});
}
function r(g, type, from, to, props = {}) {
	g.mergeRel(type, from, to, props);
}
function fact(g, id, subject, predicate, value, sourceId, evidenceId, quote, validFrom = T14, confidence = .93) {
	n(g, ["Fact"], id, {
		subject_id: subject,
		predicate,
		object_value: value,
		value_type: "STRING",
		valid_from: validFrom,
		valid_to: null,
		observed_at: validFrom,
		confidence,
		status: "VALID",
		source_id: sourceId,
		created_at: validFrom,
		updated_at: validFrom
	});
	r(g, "ABOUT", id, subject);
	n(g, ["Evidence"], evidenceId, {
		quote,
		source_span: "radio-log",
		observed_at: validFrom,
		confidence,
		created_at: validFrom
	});
	r(g, "SUPPORTED_BY", id, evidenceId);
	r(g, "FROM_SOURCE", evidenceId, sourceId);
	r(g, "ABOUT", evidenceId, subject);
}
function seedBaseline() {
	const g = new PropertyGraph(GRAPH_NAME);
	n(g, ["Tenant"], "tenant_cedar", {
		name: "Cedar County OEM",
		created_at: NOW
	});
	n(g, ["Incident"], "inc_cedar_flood", {
		name: "Cedar River rise — West Basin",
		kind: "flood",
		status: "ACTIVE",
		severity: 4,
		start_at: "2026-10-15T09:40:00Z",
		synthetic: true,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "OWNS_INCIDENT", "tenant_cedar", "inc_cedar_flood");
	n(g, ["Watch"], "watch_flood_ops", {
		name: "Flood operations watch",
		reference_time: T14,
		status: "ACTIVE",
		timezone: "UTC",
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "HAS_WATCH", "inc_cedar_flood", "watch_flood_ops");
	for (const [id, name, role] of [
		[
			"agent_outgoing_watch",
			"Outgoing Watch",
			"OUTGOING_WATCH"
		],
		[
			"agent_incoming_watch",
			"Incoming Watch",
			"INCOMING_WATCH"
		],
		[
			"agent_planner",
			"Planner",
			"PLANNER"
		],
		[
			"agent_reviewer",
			"Reviewer",
			"REVIEWER"
		],
		[
			"agent_coordinator",
			"Coordinator",
			"COORDINATOR"
		],
		[
			"agent_ingestor",
			"Ingestor",
			"INGESTOR"
		]
	]) {
		n(g, ["Agent"], id, {
			name,
			role,
			status: "ACTIVE",
			model: "graph-native",
			created_at: NOW
		});
		r(g, "MEMBER_OF", id, "tenant_cedar");
	}
	n(g, ["Human"], "human_approver", {
		name: "Duty Officer Patel",
		role: "APPROVER",
		agency_id: "agency_oem",
		approval_scope: "SHELTER_TRANSFER",
		created_at: NOW
	});
	r(g, "MEMBER_OF", "human_approver", "tenant_cedar");
	n(g, ["Session"], "session_outgoing", {
		agent_id: "agent_outgoing_watch",
		watch_id: "watch_flood_ops",
		started_at: "2026-10-15T13:00:00Z",
		status: "ACTIVE",
		last_reference_time: T14,
		created_at: NOW
	});
	r(g, "HAS_SESSION", "watch_flood_ops", "session_outgoing");
	r(g, "RUN_BY", "session_outgoing", "agent_outgoing_watch");
	n(g, ["Zone"], "zone_west_basin", {
		name: "West Basin",
		zone_type: "floodplain",
		geometry_ref: "cedar:west-basin",
		population_estimate: 1840,
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Zone"], "zone_riverside", {
		name: "Riverside Campus",
		zone_type: "shelter-campus",
		geometry_ref: "cedar:riverside",
		population_estimate: 220,
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Zone"], "zone_civic", {
		name: "Civic District",
		zone_type: "urban",
		geometry_ref: "cedar:civic",
		population_estimate: 3100,
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Zone"], "zone_north_ridge", {
		name: "North Ridge",
		zone_type: "residential",
		geometry_ref: "cedar:north-ridge",
		population_estimate: 960,
		created_at: NOW,
		updated_at: NOW
	});
	for (const [id, name, zone, lat, lon] of [
		[
			"site_west_neighborhoods",
			"West Basin neighborhoods",
			"zone_west_basin",
			41.662,
			-91.598
		],
		[
			"site_riverside_high",
			"Riverside High campus",
			"zone_riverside",
			41.668,
			-91.572
		],
		[
			"site_civic_arena",
			"Civic Arena loading dock",
			"zone_civic",
			41.676,
			-91.534
		],
		[
			"site_north_school",
			"North School entrance",
			"zone_north_ridge",
			41.689,
			-91.581
		],
		[
			"site_east_gym",
			"East Gym lot",
			"zone_civic",
			41.671,
			-91.528
		]
	]) {
		n(g, ["Site"], id, {
			name,
			site_type: "node",
			address: "Cedar County, IA (synthetic)",
			latitude: lat,
			longitude: lon,
			status: "OPEN",
			created_at: NOW,
			updated_at: NOW
		});
		r(g, "CONTAINS", zone, id);
	}
	n(g, ["Road"], "road_west_connector", {
		name: "West Connector",
		road_type: "arterial",
		status: "OPEN",
		distance_km: 3.2,
		travel_minutes: 8,
		geometry_ref: "cedar:west-connector",
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Road"], "road_north_civic", {
		name: "North Civic",
		road_type: "arterial",
		status: "OPEN",
		distance_km: 5.4,
		travel_minutes: 14,
		geometry_ref: "cedar:north-civic",
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Road"], "road_ridge", {
		name: "Ridge Road",
		road_type: "collector",
		status: "OPEN",
		distance_km: 4.1,
		travel_minutes: 11,
		geometry_ref: "cedar:ridge",
		created_at: NOW,
		updated_at: NOW
	});
	n(g, ["Road"], "road_civic_loop", {
		name: "Civic Loop",
		road_type: "local",
		status: "OPEN",
		distance_km: 1.6,
		travel_minutes: 5,
		geometry_ref: "cedar:civic-loop",
		created_at: NOW,
		updated_at: NOW
	});
	function link(from, to, roadId) {
		const road = g.must(roadId);
		r(g, "CONNECTED_BY", from, to, {
			road_id: roadId,
			distance_km: Number(road.props.distance_km),
			travel_minutes: Number(road.props.travel_minutes),
			status: String(road.props.status),
			valid_from: T14,
			valid_to: null,
			source_id: "src_dot_1400"
		});
		r(g, "CONNECTS_TO", roadId, from);
		r(g, "CONNECTS_TO", roadId, to);
	}
	link("site_west_neighborhoods", "site_riverside_high", "road_west_connector");
	link("site_west_neighborhoods", "site_civic_arena", "road_north_civic");
	link("site_west_neighborhoods", "site_north_school", "road_ridge");
	link("site_civic_arena", "site_east_gym", "road_civic_loop");
	n(g, ["Hazard"], "hazard_river_rise", {
		kind: "flood",
		severity: 4,
		status: "ACTIVE",
		description: "Cedar River overtopping West Basin levee toe. Water in streets west of Connector.",
		observed_at: "2026-10-15T13:20:00Z",
		valid_from: "2026-10-15T13:20:00Z",
		valid_to: null,
		source_id: "src_nws_river",
		confidence: .96,
		synthetic: true,
		created_at: NOW
	});
	r(g, "HAS_HAZARD", "inc_cedar_flood", "hazard_river_rise");
	r(g, "AFFECTS", "hazard_river_rise", "zone_west_basin", {
		observed_at: "2026-10-15T13:20:00Z",
		source_id: "src_nws_river",
		confidence: .96
	});
	n(g, ["Constraint"], "constraint_step_free", {
		kind: "ACCESSIBILITY",
		expression: "shelter.accessible = true",
		threshold: 1,
		blocking: true,
		valid_from: T14,
		valid_to: null,
		source_id: "src_oem_sop",
		created_at: NOW
	});
	r(g, "HAS_CONSTRAINT", "zone_west_basin", "constraint_step_free");
	n(g, ["Source"], "src_nws_river", {
		provider: "NWS Advanced Hydrologic Prediction Service (fixture)",
		url: "https://water.noaa.gov/gauges/synthetic-cedar-river",
		source_type: "hydrology",
		retrieved_at: "2026-10-15T13:18:00Z",
		published_at: "2026-10-15T13:15:00Z",
		content_hash: "sha256:nws-cedar-1315",
		license: "US Government public domain (fixture)",
		reliability: .96,
		snapshot_path: "fixtures/nws-cedar-river.json",
		created_at: NOW
	});
	n(g, ["Source"], "src_shelter_radio_1400", {
		provider: "Cedar OEM shelter radio net",
		url: "https://oem.cedar.example/radio/2026-10-15T14:00",
		source_type: "radio-log",
		retrieved_at: T14,
		published_at: T14,
		content_hash: "sha256:radio-1400",
		license: "synthetic demo",
		reliability: .92,
		snapshot_path: "fixtures/radio-1400.json",
		created_at: NOW
	});
	n(g, ["Source"], "src_dot_1400", {
		provider: "County DOT road board",
		url: "https://dot.cedar.example/board/2026-10-15T14:00",
		source_type: "road-status",
		retrieved_at: T14,
		published_at: T14,
		content_hash: "sha256:dot-1400",
		license: "synthetic demo",
		reliability: .9,
		snapshot_path: "fixtures/dot-1400.json",
		created_at: NOW
	});
	n(g, ["Source"], "src_dot_1630", {
		provider: "County DOT road board",
		url: "https://dot.cedar.example/board/2026-10-15T16:30",
		source_type: "road-status",
		retrieved_at: T1630,
		published_at: T1630,
		content_hash: "sha256:dot-1630",
		license: "synthetic demo",
		reliability: .94,
		snapshot_path: "fixtures/dot-1630.json",
		created_at: T1630
	});
	n(g, ["Source"], "src_shelter_radio_1630", {
		provider: "Cedar OEM shelter radio net",
		url: "https://oem.cedar.example/radio/2026-10-15T16:30",
		source_type: "radio-log",
		retrieved_at: T1630,
		published_at: T1630,
		content_hash: "sha256:radio-1630",
		license: "synthetic demo",
		reliability: .93,
		snapshot_path: "fixtures/radio-1630.json",
		created_at: T1630
	});
	n(g, ["Source"], "src_oem_sop", {
		provider: "Cedar OEM accessibility SOP",
		url: "https://oem.cedar.example/sop/accessibility",
		source_type: "procedure",
		retrieved_at: T14,
		published_at: "2025-04-01T00:00:00Z",
		content_hash: "sha256:sop-access",
		license: "synthetic demo",
		reliability: .99,
		snapshot_path: "fixtures/sop-access.json",
		created_at: NOW
	});
	r(g, "SUPPORTS", "src_nws_river", "hazard_river_rise");
	for (const h of [
		{
			id: "hh_w01",
			size: 4,
			mobility: "LIMITED",
			vulnerability: "MEDICAL",
			needs: [{
				id: "need_w01_s",
				kind: "SHELTER",
				qty: 4
			}, {
				id: "need_w01_m",
				kind: "MEDICAL",
				qty: 1
			}]
		},
		{
			id: "hh_w02",
			size: 3,
			mobility: "FULL",
			vulnerability: "FOOD",
			needs: [{
				id: "need_w02_s",
				kind: "SHELTER",
				qty: 3
			}, {
				id: "need_w02_f",
				kind: "FOOD",
				qty: 3
			}]
		},
		{
			id: "hh_w03",
			size: 5,
			mobility: "FULL",
			vulnerability: "NONE",
			needs: [{
				id: "need_w03_s",
				kind: "SHELTER",
				qty: 5
			}]
		},
		{
			id: "hh_w04",
			size: 2,
			mobility: "LIMITED",
			vulnerability: "MEDICAL",
			needs: [{
				id: "need_w04_s",
				kind: "SHELTER",
				qty: 2
			}, {
				id: "need_w04_m",
				kind: "MEDICAL",
				qty: 1
			}]
		},
		{
			id: "hh_w05",
			size: 6,
			mobility: "FULL",
			vulnerability: "FOOD",
			needs: [{
				id: "need_w05_s",
				kind: "SHELTER",
				qty: 6
			}, {
				id: "need_w05_f",
				kind: "FOOD",
				qty: 6
			}]
		},
		{
			id: "hh_w06",
			size: 4,
			mobility: "FULL",
			vulnerability: "NONE",
			needs: [{
				id: "need_w06_s",
				kind: "SHELTER",
				qty: 4
			}]
		}
	]) {
		n(g, ["Household"], h.id, {
			size: h.size,
			language: "en",
			mobility: h.mobility,
			vulnerability_class: h.vulnerability,
			privacy_class: "SYNTHETIC",
			synthetic: true,
			created_at: NOW
		});
		r(g, "LOCATED_IN", h.id, "zone_west_basin", { valid_from: T14 });
		n(g, ["Person"], `${h.id}_head`, {
			household_id: h.id,
			role: "HEAD",
			age_band: "ADULT",
			mobility: h.mobility,
			language: "en",
			vulnerability_class: h.vulnerability,
			privacy_class: "SYNTHETIC",
			synthetic: true,
			created_at: NOW
		});
		r(g, "MEMBER_OF", `${h.id}_head`, h.id);
		r(g, "LOCATED_IN", `${h.id}_head`, "zone_west_basin");
		for (const need of h.needs) {
			n(g, ["Need"], need.id, {
				kind: need.kind,
				quantity: need.qty,
				priority: h.mobility === "LIMITED" ? 5 : 3,
				status: "OPEN",
				valid_from: T14,
				valid_to: null,
				created_at: NOW
			});
			r(g, "HAS_NEED", h.id, need.id);
		}
	}
	n(g, ["Shelter"], "shelter_riverside", {
		name: "Riverside High / Shelter A",
		capacity: 60,
		occupied: 18,
		accessible: true,
		services: ["SHELTER", "FOOD"],
		status: "OPEN",
		latitude: 41.668,
		longitude: -91.572,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "HAS_SHELTER", "zone_riverside", "shelter_riverside");
	r(g, "LOCATED_IN", "shelter_riverside", "zone_riverside");
	r(g, "STAGED_AT", "shelter_riverside", "site_riverside_high");
	n(g, ["Shelter"], "shelter_civic", {
		name: "Civic Arena",
		capacity: 140,
		occupied: 40,
		accessible: true,
		services: [
			"SHELTER",
			"FOOD",
			"MEDICAL"
		],
		status: "OPEN",
		latitude: 41.676,
		longitude: -91.534,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "HAS_SHELTER", "zone_civic", "shelter_civic");
	r(g, "LOCATED_IN", "shelter_civic", "zone_civic");
	r(g, "STAGED_AT", "shelter_civic", "site_civic_arena");
	n(g, ["Shelter"], "shelter_north_school", {
		name: "North School",
		capacity: 80,
		occupied: 10,
		accessible: false,
		services: ["SHELTER", "FOOD"],
		status: "OPEN",
		latitude: 41.689,
		longitude: -91.581,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "HAS_SHELTER", "zone_north_ridge", "shelter_north_school");
	r(g, "LOCATED_IN", "shelter_north_school", "zone_north_ridge");
	r(g, "STAGED_AT", "shelter_north_school", "site_north_school");
	n(g, ["Shelter"], "shelter_east_gym", {
		name: "East Gym",
		capacity: 30,
		occupied: 28,
		accessible: true,
		services: ["SHELTER"],
		status: "OPEN",
		latitude: 41.671,
		longitude: -91.528,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "HAS_SHELTER", "zone_civic", "shelter_east_gym");
	r(g, "LOCATED_IN", "shelter_east_gym", "zone_civic");
	r(g, "STAGED_AT", "shelter_east_gym", "site_east_gym");
	n(g, ["Agency"], "agency_transit", {
		name: "County Transit",
		kind: "TRANSPORT",
		jurisdiction: "Cedar County",
		contact_channel: "radio-7",
		created_at: NOW
	});
	n(g, ["Agency"], "agency_fire", {
		name: "Fire Rescue",
		kind: "FIRE",
		jurisdiction: "West Basin / Civic",
		contact_channel: "radio-3",
		created_at: NOW
	});
	n(g, ["Agency"], "agency_parks", {
		name: "Parks & Arena Ops",
		kind: "FACILITY",
		jurisdiction: "Civic District",
		contact_channel: "radio-11",
		created_at: NOW
	});
	n(g, ["Agency"], "agency_oem", {
		name: "Cedar OEM",
		kind: "COORDINATION",
		jurisdiction: "Cedar County",
		contact_channel: "watch-desk",
		created_at: NOW
	});
	r(g, "HAS_AUTHORITY", "agency_transit", "zone_west_basin", {
		valid_from: T14,
		valid_to: null,
		confidence: .95
	});
	r(g, "HAS_AUTHORITY", "agency_transit", "zone_riverside", {
		valid_from: T14,
		valid_to: null,
		confidence: .95
	});
	r(g, "HAS_AUTHORITY", "agency_fire", "zone_west_basin", {
		valid_from: T14,
		valid_to: null,
		confidence: .9
	});
	r(g, "OPERATES", "agency_parks", "shelter_civic");
	r(g, "OPERATES", "agency_oem", "shelter_riverside");
	r(g, "WORKS_FOR", "human_approver", "agency_oem");
	r(g, "REPRESENTS", "agent_coordinator", "agency_oem");
	n(g, ["Asset"], "asset_bus_01", {
		kind: "ACCESSIBLE_BUS",
		quantity: 1,
		status: "AVAILABLE",
		owner_id: "agency_transit",
		available_from: T14,
		available_to: null,
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "CONTROLS", "agency_transit", "asset_bus_01");
	r(g, "STAGED_AT", "asset_bus_01", "site_west_neighborhoods");
	r(g, "CAN_SERVE", "asset_bus_01", "need_w01_s");
	fact(g, "fact_shelter_a_cots_1400", "shelter_riverside", "available_cots", "42", "src_shelter_radio_1400", "ev_cots_1400", "Riverside High reports 42 cots open, ramps staffed.");
	fact(g, "fact_shelter_a_access_1400", "shelter_riverside", "accessible", "true", "src_shelter_radio_1400", "ev_access_1400", "West door and gym ramp clear.");
	fact(g, "fact_road_west_1400", "road_west_connector", "status", "OPEN", "src_dot_1400", "ev_road_west_1400", "West Connector open both directions, 8 min.");
	fact(g, "fact_road_civic_1400", "road_north_civic", "status", "OPEN", "src_dot_1400", "ev_road_civic_1400", "North Civic open, 14 min to Arena.");
	fact(g, "fact_shelter_b_cots_1400", "shelter_civic", "available_cots", "100", "src_shelter_radio_1400", "ev_cots_b_1400", "Civic Arena 100 cots, medical bay ready.");
	fact(g, "fact_north_inaccessible", "shelter_north_school", "accessible", "false", "src_oem_sop", "ev_north_access", "North School gym is stairs-only. No step-free access.");
	n(g, ["OpenLoop"], "ol_west_overflow", {
		title: "Resolve west-side overflow shelter",
		description: "Place West Basin households into an accessible shelter with a live route and confirmed authority.",
		priority: 5,
		status: "OPEN",
		due_at: "2026-10-15T19:00:00Z",
		created_at: NOW,
		updated_at: NOW
	});
	r(g, "DEPENDS_ON", "ol_west_overflow", "shelter_riverside");
	n(g, ["FailedAttempt"], "fa_north_school", {
		action_kind: "TRANSFER_TO_SHELTER",
		target_id: "shelter_north_school",
		reason: "North School is not step-free. Mobility-limited households cannot enter the gym.",
		attempted_at: "2026-10-15T13:40:00Z",
		source_id: "src_oem_sop",
		created_at: NOW
	});
	r(g, "ABOUT", "fa_north_school", "ol_west_overflow");
	r(g, "TARGETS", "fa_north_school", "shelter_north_school");
	n(g, ["Episode"], "ep_outgoing_1400", {
		kind: "WATCH_NOTE",
		text: "Outgoing watch: West Connector open. Riverside High recommended for West Basin overflow. North School already failed on accessibility.",
		occurred_at: T14,
		recorded_at: T14,
		author_agent_id: "agent_outgoing_watch",
		session_id: "session_outgoing",
		source_id: "src_shelter_radio_1400",
		importance: .9,
		synthetic: true,
		created_at: NOW
	});
	r(g, "RECORDED", "session_outgoing", "ep_outgoing_1400");
	r(g, "RECORDED", "agent_outgoing_watch", "ep_outgoing_1400");
	r(g, "MENTIONS", "ep_outgoing_1400", "fact_shelter_a_cots_1400");
	r(g, "CREATED", "ep_outgoing_1400", "ol_west_overflow");
	r(g, "RECORDED_ATTEMPT", "ep_outgoing_1400", "fa_north_school");
	n(g, ["Decision"], "d_1400_shelter_a", {
		action_kind: "TRANSFER_TO_SHELTER",
		status: "APPROVED",
		rationale: "Riverside High has 42 cots, an open West Connector, and County Transit authority on origin and campus.",
		reference_time: T14,
		proposed_at: "2026-10-15T14:08:00Z",
		approved_at: "2026-10-15T14:12:00Z",
		approved_by: "human_approver",
		confidence: .91,
		created_by: "agent_planner",
		created_at: "2026-10-15T14:08:00Z",
		updated_at: "2026-10-15T14:12:00Z"
	});
	r(g, "FOR_INCIDENT", "d_1400_shelter_a", "inc_cedar_flood");
	r(g, "FOR_ZONE", "d_1400_shelter_a", "zone_west_basin");
	r(g, "USES_FACT", "d_1400_shelter_a", "fact_shelter_a_cots_1400");
	r(g, "USES_FACT", "d_1400_shelter_a", "fact_road_west_1400");
	r(g, "SUPPORTED_BY", "d_1400_shelter_a", "ev_cots_1400");
	r(g, "MADE", "agent_planner", "d_1400_shelter_a");
	r(g, "REQUIRES_APPROVAL_FROM", "d_1400_shelter_a", "human_approver");
	r(g, "RECORDED_DECISION", "ep_outgoing_1400", "d_1400_shelter_a");
	n(g, ["Handoff"], "handoff_1755", {
		from_agent_id: "agent_outgoing_watch",
		to_agent_id: "agent_incoming_watch",
		created_at: T_HANDOFF,
		reference_time: T_HANDOFF,
		status: "PENDING_REVIEW",
		summary: "West Basin overflow still open. Riverside High plan was valid at 14:00. Unowned loop remains. Do not retry North School.",
		checklist_json: JSON.stringify([
			"reconstruct 14:00",
			"diff current facts",
			"failed attempts",
			"unowned loops"
		])
	});
	r(g, "HAS_HANDOFF", "watch_flood_ops", "handoff_1755");
	r(g, "FROM_AGENT", "handoff_1755", "agent_outgoing_watch");
	r(g, "TO_AGENT", "handoff_1755", "agent_incoming_watch");
	r(g, "TRANSFERS", "handoff_1755", "ol_west_overflow");
	r(g, "CREATED_HANDOFF", "ep_outgoing_1400", "handoff_1755");
	return g;
}
function injectChange1630(g) {
	g.setProps("road_west_connector", {
		status: "CLOSED",
		closed_at: T1630,
		closed_reason: "Water over both lanes at mile 1.4",
		updated_at: T1630
	});
	for (const rel of [...g.out("site_west_neighborhoods", "CONNECTED_BY")]) if (rel.props.road_id === "road_west_connector") Object.assign(rel.props, {
		status: "CLOSED",
		closed_at: T1630,
		closed_reason: "Water over both lanes"
	});
	g.setProps("shelter_riverside", {
		occupied: 52,
		updated_at: T1630
	});
	supersedeFact(g, "fact_road_west_1400", "fact_road_west_1630", "CLOSED", T1630, "src_dot_1630", .94, T1630);
	n(g, ["Evidence"], "ev_road_west_1630", {
		quote: "DOT: West Connector closed. Standing water both lanes. Do not send buses.",
		source_span: "road-board",
		observed_at: T1630,
		confidence: .94,
		created_at: T1630
	});
	r(g, "SUPPORTED_BY", "fact_road_west_1630", "ev_road_west_1630");
	r(g, "FROM_SOURCE", "ev_road_west_1630", "src_dot_1630");
	r(g, "ABOUT", "ev_road_west_1630", "road_west_connector");
	supersedeFact(g, "fact_shelter_a_cots_1400", "fact_shelter_a_cots_1630", "8", T1630, "src_shelter_radio_1630", .93, T1630);
	n(g, ["Evidence"], "ev_cots_1630", {
		quote: "Riverside High: gym taking on seepage. 8 dry cots remain. Do not send additional overflow.",
		source_span: "radio-log",
		observed_at: T1630,
		confidence: .93,
		created_at: T1630
	});
	r(g, "SUPPORTED_BY", "fact_shelter_a_cots_1630", "ev_cots_1630");
	r(g, "FROM_SOURCE", "ev_cots_1630", "src_shelter_radio_1630");
	r(g, "ABOUT", "ev_cots_1630", "shelter_riverside");
	n(g, ["Episode"], "ep_change_1630", {
		kind: "ROAD_CLOSURE",
		text: "16:30: West Connector closed. Riverside High capacity superseded 42 → 8. Prior Shelter A plan is no longer valid.",
		occurred_at: T1630,
		recorded_at: T1630,
		author_agent_id: "agent_ingestor",
		session_id: "session_outgoing",
		source_id: "src_dot_1630",
		importance: .97,
		synthetic: true,
		created_at: T1630
	});
	r(g, "RECORDED", "session_outgoing", "ep_change_1630");
	r(g, "RECORDED", "agent_ingestor", "ep_change_1630");
	r(g, "MENTIONS", "ep_change_1630", "fact_road_west_1630");
	r(g, "MENTIONS", "ep_change_1630", "fact_shelter_a_cots_1630");
	r(g, "OBSERVED", "ep_change_1630", "ev_road_west_1630");
}
function confirmParksAuthority(g, at) {
	r(g, "HAS_AUTHORITY", "agency_parks", "zone_civic", {
		valid_from: at,
		valid_to: null,
		confidence: .97,
		source_id: "human_approver"
	});
	n(g, ["Episode"], "ep_authority_confirm", {
		kind: "AUTHORITY_CONFIRMED",
		text: "Duty officer confirmed Parks & Arena Ops authority for Civic District sheltering.",
		occurred_at: at,
		recorded_at: at,
		author_agent_id: "agent_coordinator",
		importance: .88,
		synthetic: true,
		created_at: at
	});
	r(g, "RECORDED", "agent_coordinator", "ep_authority_confirm");
}
function acceptHandoff(g, at) {
	g.setProps("handoff_1755", {
		status: "ACCEPTED",
		accepted_at: at,
		accepted_by: "agent_incoming_watch"
	});
	n(g, ["Session"], "session_incoming", {
		agent_id: "agent_incoming_watch",
		watch_id: "watch_flood_ops",
		started_at: at,
		status: "ACTIVE",
		last_reference_time: at,
		created_at: at
	});
	r(g, "HAS_SESSION", "watch_flood_ops", "session_incoming");
	r(g, "RUN_BY", "session_incoming", "agent_incoming_watch");
}
function killOutgoing(g, at) {
	g.setProps("agent_outgoing_watch", { status: "OFFLINE" });
	g.setProps("session_outgoing", {
		status: "INTERRUPTED",
		ended_at: at
	});
}
function assignOpenLoop(g, agentId, at) {
	for (const rel of g.in("ol_west_overflow", "OWNS")) g.deleteRel(rel.id);
	r(g, "OWNS", agentId, "ol_west_overflow", {
		assigned_at: at,
		assigned_by: "agent_coordinator"
	});
	g.setProps("ol_west_overflow", {
		status: "ASSIGNED",
		updated_at: at
	});
}
function writeProposal(g, input) {
	n(g, ["DecisionTrace"], "trace_1800", {
		question: "Which accessible shelter can receive West Basin households now?",
		reference_time: input.referenceTime,
		started_at: input.referenceTime,
		status: "RUNNING",
		planner_agent_id: "agent_planner",
		assumptions_json: "[]",
		created_at: input.referenceTime
	});
	n(g, ["Decision"], input.decisionId, {
		action_kind: "TRANSFER_TO_SHELTER",
		status: "PROPOSED",
		rationale: input.rationale,
		reference_time: input.referenceTime,
		proposed_at: input.referenceTime,
		confidence: input.confidence,
		created_by: "agent_planner",
		created_at: input.referenceTime,
		updated_at: input.referenceTime,
		action: input.action,
		shelter_id: input.shelterId
	});
	r(g, "PROPOSED", "trace_1800", input.decisionId);
	r(g, "FOR_INCIDENT", input.decisionId, "inc_cedar_flood");
	r(g, "FOR_ZONE", input.decisionId, input.zoneId);
	r(g, "MADE", "agent_planner", input.decisionId);
	r(g, "REQUIRES_APPROVAL_FROM", input.decisionId, "human_approver");
	for (const fid of input.factIds) if (g.get(fid)) r(g, "USES_FACT", input.decisionId, fid);
	for (const eid of input.evidenceIds) if (g.get(eid)) r(g, "SUPPORTED_BY", input.decisionId, eid);
}
function setDecisionStatus(g, decisionId, status, at, extra = {}) {
	g.setProps(decisionId, {
		status,
		updated_at: at,
		...extra
	});
}
function recordOutcome(g, decisionId, at, notes) {
	n(g, ["Outcome"], "out_civic_sim", {
		status: "EXECUTED_IN_SIMULATION",
		metric_name: "households_assigned",
		metric_value: 6,
		observed_at: at,
		notes,
		created_at: at
	});
	r(g, "LED_TO", decisionId, "out_civic_sim");
	g.setProps("ol_west_overflow", {
		status: "CLOSED",
		updated_at: at
	});
	n(g, ["Episode"], "ep_outcome", {
		kind: "OPEN_LOOP_CLOSED",
		text: notes,
		occurred_at: at,
		recorded_at: at,
		author_agent_id: "agent_coordinator",
		importance: .8,
		synthetic: true,
		created_at: at
	});
	r(g, "RECORDED_OUTCOME", "ep_outcome", "out_civic_sim");
	r(g, "RECORDED", "agent_coordinator", "ep_outcome");
}
var Route$1 = createFileRoute("/api/health")({ server: { handlers: { GET: async () => {
	const health = graphHealth(seedBaseline());
	return Response.json({
		ok: health.ready,
		service: "watchchange-mesh",
		graph: health.graph,
		nodes: health.nodes,
		relationships: health.relationships,
		engine: "falkor-compatible-kernel",
		falkordb_image: "falkordb/falkordb:v4.20.4"
	});
} } } });
function node(g, id, role) {
	const n = g.get(id);
	if (!n) return null;
	const name = String(n.props.name ?? n.props.kind ?? n.props.predicate ?? n.id);
	return {
		id: n.id,
		labels: n.labels,
		name,
		role
	};
}
function planShelterTransfer(g, opts) {
	const ranked = candidatePlans(g, opts.hazardId, opts.referenceTime);
	const pick = ranked.filter((c) => c.blockingReasons.length === 0)[0] ?? ranked[0];
	const decisionId = opts.decisionId ?? "d_incoming_plan";
	if (!pick) return {
		status: "ABSTAINED",
		action: "No shelter candidate in the graph",
		reference_time: opts.referenceTime,
		confidence: 0,
		assumptions: [],
		evidence_ids: [],
		fact_ids: [],
		graph_path: [],
		blocking_reasons: ["Candidate plan traversal returned no shelters"],
		requires_human_approval: true,
		shelter_id: null,
		shelter_name: null,
		route_road_ids: [],
		decision_id: decisionId,
		planner_notes: "Abstain — the graph has no OPEN shelter nodes."
	};
	const blocked = pick.blockingReasons.length > 0;
	const path = [];
	const push = (id, role) => {
		const n = node(g, id, role);
		if (n && !path.some((p) => p.id === n.id)) path.push(n);
	};
	push(opts.hazardId, "hazard");
	const hazardZones = g.out(opts.hazardId, "AFFECTS");
	if (hazardZones[0]) push(hazardZones[0].to, "affected-zone");
	const hh = g.nodesByLabel("Household")[0];
	if (hh) {
		push(hh.id, "household");
		const need = g.out(hh.id, "HAS_NEED")[0];
		if (need) push(need.to, "need");
	}
	push(pick.shelterId, "shelter");
	push(pick.zoneId, "shelter-zone");
	for (const site of pick.routeSiteIds) push(site, "site");
	for (const road of pick.routeRoadIds) push(road, "road");
	if (pick.authorityAgencyId) push(pick.authorityAgencyId, "agency");
	if (pick.assetId) push(pick.assetId, "asset");
	const factIds = [];
	for (const f of g.nodesByLabel("Fact")) {
		const about = g.out(f.id, "ABOUT")[0];
		if (!about) continue;
		if (about.to === pick.shelterId || pick.routeRoadIds.includes(about.to) || about.to === "road_west_connector" || about.to === "road_north_civic") {
			if (f.props.status === "VALID") factIds.push(f.id);
		}
	}
	const evidence = evidencePacket(g, factIds);
	const assumptions = [
		`${pick.shelterName} remains OPEN at ${opts.referenceTime}`,
		pick.routeOpen ? "Selected route edges are OPEN" : "Route must be restored before dispatch",
		pick.destinationAuthority ? "Destination authority is present in the graph" : "Destination authority still unconfirmed"
	];
	const action = blocked ? `Do not send West Basin households to ${pick.shelterName} until blockers clear` : `Transfer West Basin households to ${pick.shelterName} via ${pick.routeRoadIds.map((id) => g.get(id)?.props.name ?? id).join(" → ") || "open route"}`;
	const confidence = blocked ? Math.max(.2, .45 - pick.blockingReasons.length * .05) : Math.min(.94, .7 + pick.planScore * .2);
	return {
		status: blocked ? "BLOCKED" : "PROPOSED",
		action,
		reference_time: opts.referenceTime,
		confidence: Number(confidence.toFixed(2)),
		assumptions,
		evidence_ids: evidence.map((e) => e.evidenceId),
		fact_ids: factIds,
		graph_path: path,
		blocking_reasons: pick.blockingReasons,
		requires_human_approval: true,
		shelter_id: pick.shelterId,
		shelter_name: pick.shelterName,
		route_road_ids: pick.routeRoadIds,
		decision_id: decisionId,
		planner_notes: blocked ? `Top-ranked graph candidate is ${pick.shelterName} (score ${pick.planScore}) but the reviewer must see blockers. Ranked: ${ranked.map((c) => `${c.shelterName}:${c.planScore}`).join(" · ")}` : `Graph ranking selected ${pick.shelterName} (score ${pick.planScore}). Capacity coverage ${Math.round(pick.capacityCoverage * 100)}%, route ${pick.routeMinutes} min.`
	};
}
function rankTable(g, hazardId, t) {
	return candidatePlans(g, hazardId, t);
}
function reviewProposal(g, proposal) {
	const checks = [];
	const blocking = [];
	checks.push({
		id: "evidence",
		ok: proposal.evidence_ids.length > 0 && proposal.fact_ids.length > 0,
		detail: `${proposal.fact_ids.length} facts, ${proposal.evidence_ids.length} evidence nodes`
	});
	if (!checks[0].ok) blocking.push("No source evidence attached to the proposal");
	let superseded = false;
	let expired = false;
	for (const fid of proposal.fact_ids) {
		const rec = factRecord(g, fid);
		if (!rec) continue;
		if (rec.status === "SUPERSEDED") superseded = true;
		if (rec.validTo && rec.validTo <= proposal.reference_time) expired = true;
	}
	checks.push({
		id: "temporal",
		ok: !superseded && !expired,
		detail: superseded ? "Uses a superseded fact" : expired ? "Uses an expired fact" : "Facts valid at reference time"
	});
	if (superseded) blocking.push("Proposal cites a superseded fact");
	if (expired) blocking.push("Proposal cites a fact whose valid_to is at or before reference time");
	const failedRepeat = proposal.graph_path.some((n) => n.id === "shelter_north_school");
	checks.push({
		id: "failed-attempt",
		ok: !failedRepeat,
		detail: failedRepeat ? "Repeats the North School accessibility failure" : "Does not repeat a recorded failed attempt"
	});
	if (failedRepeat) blocking.push("Repeats a recorded failed attempt");
	const routeClosed = proposal.blocking_reasons.some((r) => r.toLowerCase().includes("route closed"));
	checks.push({
		id: "route",
		ok: !routeClosed,
		detail: routeClosed ? "Selected route has a CLOSED edge" : "Route edges are OPEN"
	});
	if (routeClosed) blocking.push("Route is closed at reference time");
	const cap = proposal.blocking_reasons.some((r) => r.toLowerCase().startsWith("capacity"));
	checks.push({
		id: "capacity",
		ok: !cap,
		detail: cap ? "Shelter capacity below requested quantity" : "Capacity covers requested quantity"
	});
	if (cap) blocking.push("Insufficient shelter capacity");
	const noAuth = proposal.blocking_reasons.some((r) => r.toLowerCase().includes("authority"));
	checks.push({
		id: "authority",
		ok: !noAuth,
		detail: noAuth ? "Destination zone has no HAS_AUTHORITY edge at reference time" : "Authority present on destination zone"
	});
	if (noAuth) blocking.push("Missing destination authority confirmation");
	let review_state = "READY_FOR_HUMAN_REVIEW";
	if (!checks[0].ok) review_state = "ABSTAIN_NO_EVIDENCE";
	else if (superseded) review_state = "REVIEW_SUPERSEDED_FACT";
	else if (expired) review_state = "REVIEW_EXPIRED_FACT";
	else if (failedRepeat) review_state = "BLOCKED_FAILED_ATTEMPT";
	else if (routeClosed) review_state = "BLOCKED_ROUTE_CLOSED";
	else if (cap) review_state = "BLOCKED_CAPACITY";
	else if (noAuth) review_state = "BLOCKED_NO_AUTHORITY";
	else if (proposal.blocking_reasons.length > 0) review_state = "BLOCKED_BY_CONSTRAINT";
	const status = review_state === "READY_FOR_HUMAN_REVIEW" ? "IN_REVIEW" : review_state.startsWith("ABSTAIN") ? "ABSTAINED" : "BLOCKED";
	return {
		decision_id: proposal.decision_id,
		status,
		review_state,
		blocking_reasons: blocking.length ? blocking : proposal.blocking_reasons,
		checks,
		requires_human_approval: true
	};
}
var INITIAL_FLAGS = {
	referenceTime: T14,
	injectedChange: false,
	handoffAccepted: false,
	outgoingKilled: false,
	loopOwner: null,
	parksAuthority: false,
	proposalWritten: false,
	decisionStatus: "NONE",
	rejectionReason: "",
	outcomeRecorded: false
};
function buildWorld(flags) {
	const g = seedBaseline();
	if (flags.injectedChange) injectChange1630(g);
	const t = flags.referenceTime;
	if (flags.handoffAccepted) acceptHandoff(g, t);
	if (flags.outgoingKilled) killOutgoing(g, t);
	if (flags.loopOwner) assignOpenLoop(g, flags.loopOwner, t);
	if (flags.parksAuthority) confirmParksAuthority(g, t);
	if (flags.proposalWritten || flags.decisionStatus !== "NONE") {
		const proposal = planShelterTransfer(g, {
			hazardId: "hazard_river_rise",
			referenceTime: t,
			decisionId: "d_incoming_plan"
		});
		writeProposal(g, {
			decisionId: proposal.decision_id,
			action: proposal.action,
			rationale: proposal.planner_notes,
			confidence: proposal.confidence,
			referenceTime: t,
			factIds: proposal.fact_ids,
			evidenceIds: proposal.evidence_ids,
			shelterId: proposal.shelter_id ?? "shelter_civic",
			zoneId: "zone_west_basin"
		});
		if (flags.decisionStatus === "IN_REVIEW") setDecisionStatus(g, "d_incoming_plan", "IN_REVIEW", t);
		if (flags.decisionStatus === "APPROVED") setDecisionStatus(g, "d_incoming_plan", "APPROVED", t, {
			approved_at: t,
			approved_by: "human_approver"
		});
		if (flags.decisionStatus === "REJECTED") setDecisionStatus(g, "d_incoming_plan", "REJECTED", t, {
			rejected_at: t,
			rejected_by: "human_approver",
			rejection_reason: flags.rejectionReason || "Rejected by duty officer"
		});
		if (flags.outcomeRecorded) recordOutcome(g, "d_incoming_plan", t, "Simulation: West Basin households staged to Civic Arena. No field dispatch.");
	}
	return g;
}
function planNow(flags) {
	return planShelterTransfer(buildWorld(flags), {
		hazardId: "hazard_river_rise",
		referenceTime: flags.referenceTime,
		decisionId: "d_incoming_plan"
	});
}
function reviewNow(flags, proposal) {
	return reviewProposal(buildWorld(flags), proposal ?? planNow(flags));
}
var Route = createFileRoute("/api/plan")({ server: { handlers: { GET: async ({ request }) => {
	const url = new URL(request.url);
	const t = url.searchParams.get("t") === "14" ? "2026-10-15T14:00:00Z" : T18;
	const injected = url.searchParams.get("change") !== "0";
	const parks = url.searchParams.get("auth") === "1";
	const flags = {
		...INITIAL_FLAGS,
		referenceTime: t,
		injectedChange: t !== "2026-10-15T14:00:00Z" && injected,
		parksAuthority: parks
	};
	const g = buildWorld(flags);
	const proposal = planShelterTransfer(g, {
		hazardId: "hazard_river_rise",
		referenceTime: flags.referenceTime,
		decisionId: "d_incoming_plan"
	});
	const review = reviewProposal(g, proposal);
	return Response.json({
		proposal,
		review,
		graph: g.name
	});
} } } });
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	ApiHealthRoute: Route$1.update({
		id: "/api/health",
		path: "/api/health",
		getParentRoute: () => Route$3
	}),
	ApiPlanRoute: Route.update({
		id: "/api/plan",
		path: "/api/plan",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { T18 as S, sheltersAt as _, reviewNow as a, T14 as b, activeHazards as c, failedAttemptsFor as d, graphHealth as f, reconstructFacts as g, openLoops as h, planNow as i, decisions as l, needsByZone as m, INITIAL_FLAGS as n, rankTable as o, handoffContext as p, buildWorld as r, CYPHER as s, router_exports as t, episodesSince as u, supersessionChain as v, T1630 as x, unownedOpenLoops as y };
