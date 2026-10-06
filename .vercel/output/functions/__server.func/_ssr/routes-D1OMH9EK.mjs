import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Radio, c as CircleCheck, i as ShieldCheck, l as Ban, n as TriangleAlert, o as Lock, r as Siren, s as CircleDot, t as Waypoints } from "../_libs/lucide-react.mjs";
import { S as T18, _ as sheltersAt, a as reviewNow, b as T14, c as activeHazards, d as failedAttemptsFor, f as graphHealth, g as reconstructFacts, h as openLoops, i as planNow, l as decisions, m as needsByZone, n as INITIAL_FLAGS, o as rankTable, p as handoffContext, r as buildWorld, s as CYPHER, u as episodesSince, v as supersessionChain, x as T1630, y as unownedOpenLoops } from "./router-BFU3wuxn.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D1OMH9EK.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Mark({ className = "size-9" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className,
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				width: "32",
				height: "32",
				rx: "8",
				fill: "#0b0d11"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16.5",
				r: "9.4",
				fill: "none",
				stroke: "#4fd6e8",
				strokeWidth: "2.3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M16 7.1 L24.1 21.2 L7.9 21.2 Z",
				fill: "none",
				stroke: "#4fd6e8",
				strokeWidth: "1.5",
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "7.1",
				r: "2.8",
				fill: "#4fd6e8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24.1",
				cy: "21.2",
				r: "2.8",
				fill: "#e0a054"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "7.9",
				cy: "21.2",
				r: "2.8",
				fill: "#5dba8a"
			})
		]
	});
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var badgeVariants = cva("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]", {
	variants: { tone: {
		mute: "bg-elevated text-muted shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
		cyan: "bg-cyan-dim text-cyan",
		amber: "bg-amber-dim text-amber",
		hazard: "bg-hazard-dim text-hazard",
		ok: "bg-ok-dim text-ok"
	} },
	defaultVariants: { tone: "mute" }
});
function Badge({ className, tone, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ tone }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,box-shadow] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0", {
	variants: {
		variant: {
			primary: "bg-cyan text-primary-foreground shadow-[0_0_0_1px_rgba(79,214,232,0.4)] hover:opacity-90 active:scale-[0.98]",
			secondary: "bg-elevated text-fg shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.13)]",
			ghost: "bg-transparent text-fg hover:bg-elevated",
			danger: "bg-hazard-dim text-hazard shadow-[0_0_0_1px_rgba(224,90,79,0.35)] hover:opacity-90",
			ok: "bg-ok-dim text-ok shadow-[0_0_0_1px_rgba(93,186,138,0.35)] hover:opacity-90",
			amber: "bg-amber-dim text-amber shadow-[0_0_0_1px_rgba(224,160,84,0.35)] hover:opacity-90"
		},
		size: {
			sm: "h-9 rounded-sm px-3 text-xs",
			md: "h-11 rounded-md px-4 text-sm",
			lg: "h-12 rounded-md px-5 text-sm",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "secondary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var ROLE_FILL = {
	hazard: "var(--color-hazard)",
	"affected-zone": "var(--color-cyan)",
	household: "var(--color-fg)",
	need: "var(--color-amber)",
	shelter: "var(--color-ok)",
	"shelter-zone": "var(--color-cyan)",
	site: "var(--color-muted)",
	road: "var(--color-amber)",
	agency: "var(--color-cyan)",
	asset: "var(--color-ok)"
};
function EvidencePath({ nodes, className }) {
	if (!nodes.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("text-sm text-muted", className),
		children: "Run the planner to materialize a graph path."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: cn("flex flex-wrap items-stretch gap-2", className),
		children: nodes.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 rounded-md bg-inset px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted",
						children: n.role
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-sm text-fg",
						children: n.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate font-mono text-[11px] text-cyan",
						children: n.id
					})
				]
			}), i < nodes.length - 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-cyan",
				"aria-hidden": true,
				children: "→"
			}) : null]
		}, `${n.id}-${i}`))
	});
}
function PathCanvas({ nodes }) {
	const w = 720;
	const h = 280;
	const shown = nodes.slice(0, 10);
	const cx = (i) => 70 + i % 5 * 140;
	const cy = (i) => i < 5 ? 80 : 200;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "h-auto w-full",
		role: "img",
		"aria-label": "Evidence path graph",
		children: [shown.map((n, i) => {
			if (i === 0) return null;
			const prev = i - 1;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1: cx(prev),
				y1: cy(prev),
				x2: cx(i),
				y2: cy(i),
				stroke: "var(--color-cyan)",
				strokeOpacity: "0.55",
				strokeWidth: "1.5"
			}, `e-${n.id}-${i}`);
		}), shown.map((n, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: cx(i),
				cy: cy(i),
				r: "18",
				fill: ROLE_FILL[n.role] ?? "var(--color-fg)",
				fillOpacity: "0.18",
				stroke: ROLE_FILL[n.role] ?? "var(--color-fg)",
				strokeWidth: "1.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx(i),
				y: cy(i) + 36,
				textAnchor: "middle",
				fill: "var(--color-fg)",
				fontSize: "11",
				children: n.name.length > 18 ? `${n.name.slice(0, 16)}…` : n.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx(i),
				y: cy(i) + 50,
				textAnchor: "middle",
				fill: "var(--color-muted)",
				fontSize: "9",
				fontFamily: "var(--font-mono)",
				children: n.id
			})
		] }, n.id + i))]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var briefIncomingWatch = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("8b3d974d3bd4de0669a5834751974a83ce4b55ec1c8133105126e9c0f7939201"));
function stamp(flags, extra = {}) {
	const proposal = extra.proposal === void 0 ? planNow({
		...flags,
		...extra
	}) : extra.proposal;
	const review = extra.review === void 0 ? reviewNow({
		...flags,
		...extra
	}, proposal ?? void 0) : extra.review;
	return {
		...extra,
		proposal,
		review
	};
}
var useDemo = create()((set, get) => ({
	...INITIAL_FLAGS,
	view: "overview",
	proposal: null,
	review: null,
	lastEvent: "Watch opened at 14:00. Riverside High plan is live.",
	setView: (view) => set({ view }),
	goBaseline: () => set({
		...INITIAL_FLAGS,
		view: get().view,
		proposal: null,
		review: null,
		lastEvent: "Reconstructed 14:00 baseline. West Connector open. 42 cots at Riverside High."
	}),
	injectChange: () => {
		const next = {
			...get(),
			injectedChange: true,
			referenceTime: T1630
		};
		set({
			injectedChange: true,
			referenceTime: T1630,
			lastEvent: "16:30 ingest: West Connector CLOSED. Riverside High capacity 42 → 8 (superseded, not overwritten).",
			view: "temporal",
			...stamp(next)
		});
	},
	goIncoming: () => {
		const next = {
			...get(),
			injectedChange: true,
			referenceTime: T18
		};
		set({
			injectedChange: true,
			referenceTime: T18,
			lastEvent: "Reference time 18:00. Incoming watch can reconstruct 14:00 and current state.",
			view: "handoff",
			...stamp(next)
		});
	},
	acceptIncoming: () => {
		const next = {
			...get(),
			handoffAccepted: true,
			injectedChange: true,
			referenceTime: T18
		};
		set({
			handoffAccepted: true,
			injectedChange: true,
			referenceTime: T18,
			lastEvent: "Incoming watch accepted the handoff package from the graph.",
			...stamp(next)
		});
	},
	killOutgoingWatch: () => {
		set({
			outgoingKilled: true,
			handoffAccepted: true,
			lastEvent: "Outgoing watch is OFFLINE. Incoming continues from shared graph memory.",
			...stamp({
				...get(),
				outgoingKilled: true,
				handoffAccepted: true
			})
		});
	},
	assignLoopToIncoming: () => {
		set({
			loopOwner: "agent_incoming_watch",
			lastEvent: "Coordinator assigned open loop ol_west_overflow to Incoming Watch.",
			...stamp({
				...get(),
				loopOwner: "agent_incoming_watch"
			})
		});
	},
	runPlanner: () => {
		const next = {
			...get(),
			injectedChange: true,
			referenceTime: get().referenceTime < "2026-10-15T18:00:00Z" ? T18 : get().referenceTime,
			proposalWritten: true,
			decisionStatus: "PROPOSED"
		};
		const proposal = planNow(next);
		const review = reviewNow(next, proposal);
		set({
			...next,
			proposal,
			review,
			view: "plan",
			lastEvent: `Planner traversal selected ${proposal.shelter_name ?? "none"} (${proposal.status}).`
		});
	},
	confirmAuthority: () => {
		const next = {
			...get(),
			parksAuthority: true
		};
		const proposal = planNow(next);
		set({
			parksAuthority: true,
			proposal,
			review: reviewNow(next, proposal),
			lastEvent: "Parks & Arena Ops HAS_AUTHORITY written on Civic District.",
			view: "review"
		});
	},
	sendToHuman: () => {
		if (!get().parksAuthority) return;
		set({
			decisionStatus: "IN_REVIEW",
			proposalWritten: true,
			lastEvent: "Proposal moved to IN_REVIEW. Waiting on duty officer.",
			view: "review",
			...stamp({
				...get(),
				decisionStatus: "IN_REVIEW",
				proposalWritten: true
			}, {
				proposal: get().proposal,
				review: get().review
			})
		});
	},
	approve: () => {
		if (get().review?.review_state !== "READY_FOR_HUMAN_REVIEW") return;
		set({
			decisionStatus: "APPROVED",
			proposalWritten: true,
			lastEvent: "Human approved Civic Arena transfer. Status APPROVED is now in the graph."
		});
	},
	reject: (reason) => set({
		decisionStatus: "REJECTED",
		rejectionReason: reason,
		lastEvent: `Human rejected the proposal: ${reason}`
	}),
	closeOutcome: () => set({
		outcomeRecorded: true,
		lastEvent: "Coordinator recorded simulation outcome. Open loop closed. No field dispatch."
	}),
	reset: () => set({
		...INITIAL_FLAGS,
		view: "overview",
		proposal: null,
		review: null,
		lastEvent: "Demo reset to 14:00 baseline seed."
	})
}));
function Panel({ title, kicker, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-xl bg-surface p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] md:p-5", className),
		children: [
			kicker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted",
				children: kicker
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mb-4 text-base font-medium tracking-tight text-fg",
				children: title
			}),
			children
		]
	});
}
function Metric({ label, value, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-inset px-3 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-[10px] uppercase tracking-[0.16em] text-muted",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("mt-1 font-mono text-xl tabular-nums", tone === "hazard" ? "text-hazard" : tone === "ok" ? "text-ok" : tone === "amber" ? "text-amber" : tone === "cyan" ? "text-cyan" : "text-fg"),
			children: value
		})]
	});
}
function OverviewPanel({ flags }) {
	const graph = (0, import_react.useMemo)(() => buildWorld(flags), [flags]);
	const hazards = activeHazards(graph, flags.referenceTime);
	const needs = needsByZone(graph, flags.referenceTime);
	const shelters = sheltersAt(graph, flags.referenceTime);
	const loops = openLoops(graph);
	const health = graphHealth(graph);
	const west = needs.find((n) => n.zoneId === "zone_west_basin");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Incident",
				title: "Cedar River rise — West Basin",
				className: "lg:col-span-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Severity",
							value: "4 / 5",
							tone: "hazard"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Households",
							value: String(west?.households ?? 0),
							tone: "cyan"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Open needs",
							value: String(west?.totalQuantity ?? 0),
							tone: "amber"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
							label: "Graph nodes",
							value: String(health.nodes)
						})
					]
				}), hazards.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-3 rounded-lg bg-hazard-dim p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Siren, { className: "mt-0.5 size-4 shrink-0 text-hazard" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: h.description
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-[11px] text-muted",
						children: [
							h.id,
							" · observed ",
							h.observedAt,
							" · zones ",
							h.zones.map((z) => z.name).join(", ")
						]
					})] })]
				}, h.id))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Database",
				title: "Graph readiness",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm text-cyan",
						children: health.graph
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							health.relationships,
							" relationships · ",
							health.labels.Fact,
							" facts · ",
							health.labels.Episode,
							" episodes"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "ok",
						className: "mt-4",
						children: "Kernel ready"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs leading-relaxed text-muted",
						children: "Intelligence is a typed traversal over this graph. Removing the graph removes the recommendation."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Capacity",
				title: "Shelters at reference time",
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[520px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Shelter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Zone"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Open"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Access"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Services"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: shelters.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: s.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-[11px] text-muted",
										children: s.id
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-muted",
									children: s.zoneName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono tabular-nums",
									children: s.available
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5",
									children: s.accessible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-ok",
										children: "step-free"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-hazard",
										children: "stairs"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-muted",
									children: s.services.join(" · ")
								})
							]
						}, s.id)) })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Unresolved work",
				title: "Open loops",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: loops.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: o.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-[11px] text-muted",
						children: [
							o.id,
							" · ",
							o.status,
							o.ownerName ? ` · owner ${o.ownerName}` : " · no owner"
						]
					})] }, o.id))
				})
			})
		]
	});
}
function TemporalPanel({ flags }) {
	const graph = (0, import_react.useMemo)(() => buildWorld(flags), [flags]);
	const thenFacts = reconstructFacts(graph, T14);
	const nowFacts = reconstructFacts(graph, flags.referenceTime);
	const chain = supersessionChain(graph, flags.referenceTime);
	const keyPreds = [
		"available_cots",
		"status",
		"accessible"
	];
	const pick = (list, subject, pred) => list.find((f) => f.subjectId === subject && f.predicate === pred);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "What changed since the last watch?",
				title: "14:00 versus reference time",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Fact"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "14:00"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Now"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [
							{
								subject: "shelter_riverside",
								pred: "available_cots",
								label: "Riverside High cots"
							},
							{
								subject: "road_west_connector",
								pred: "status",
								label: "West Connector"
							},
							{
								subject: "shelter_civic",
								pred: "available_cots",
								label: "Civic Arena cots"
							},
							{
								subject: "road_north_civic",
								pred: "status",
								label: "North Civic"
							}
						].map((row) => {
							const a = pick(thenFacts, row.subject, row.pred);
							const b = pick(nowFacts, row.subject, row.pred);
							const changed = a?.objectValue !== b?.objectValue;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-line",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: row.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-mono text-[11px] text-muted",
											children: row.subject
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 font-mono tabular-nums text-muted",
										children: a?.objectValue ?? "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: cn("py-3 font-mono tabular-nums", changed ? "text-amber" : "text-fg"),
										children: [b?.objectValue ?? "—", changed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											tone: "amber",
											className: "ml-2",
											children: "changed"
										}) : null]
									})
								]
							}, row.subject + row.pred);
						}) })]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "SUPERSEDES",
				title: "History was not overwritten",
				children: chain.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "No supersession yet. Inject the 16:30 change to close the 14:00 facts and attach replacements."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: chain.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-lg bg-inset p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-fg",
								children: [
									c.predicate,
									" on ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-cyan",
										children: c.subjectId
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-mono text-xs text-muted",
								children: [
									c.previousValue,
									" (",
									c.previousFactId,
									") → ",
									c.currentValue,
									" (",
									c.currentFactId,
									")"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "amber",
								className: "mt-2",
								children: "superseded"
							})
						]
					}, c.currentFactId))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Point-in-time",
				title: "Facts true at 14:00",
				className: "lg:col-span-1",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "max-h-72 space-y-2 overflow-auto pr-1",
					children: thenFacts.filter((f) => keyPreds.includes(f.predicate)).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: f.subjectId
							}),
							" ",
							f.predicate,
							"=",
							f.objectValue
						]
					}, f.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Point-in-time",
				title: `Facts true at ${flags.referenceTime.slice(11, 16)}Z`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "max-h-72 space-y-2 overflow-auto pr-1",
					children: nowFacts.filter((f) => keyPreds.includes(f.predicate)).map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: f.subjectId
							}),
							" ",
							f.predicate,
							"=",
							f.objectValue,
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: f.status
							})
						]
					}, f.id))
				})
			})
		]
	});
}
function HandoffPanel({ flags }) {
	const graph = (0, import_react.useMemo)(() => buildWorld(flags), [flags]);
	const ctx = handoffContext(graph, "handoff_1755");
	const failed = failedAttemptsFor(graph);
	const unowned = unownedOpenLoops(graph);
	const thenFacts = reconstructFacts(graph, T14);
	const nowFacts = reconstructFacts(graph, flags.referenceTime);
	const acceptIncoming = useDemo((s) => s.acceptIncoming);
	const killOutgoingWatch = useDemo((s) => s.killOutgoingWatch);
	const assignLoopToIncoming = useDemo((s) => s.assignLoopToIncoming);
	const proposal = useDemo((s) => s.proposal);
	const [brief, setBrief] = (0, import_react.useState)(null);
	const [briefing, setBriefing] = (0, import_react.useState)(false);
	async function runBrief() {
		setBriefing(true);
		try {
			const res = await briefIncomingWatch({ data: {
				thenFacts: thenFacts.map((f) => `${f.subjectId} ${f.predicate}=${f.objectValue}`).join("; "),
				nowFacts: nowFacts.map((f) => `${f.subjectId} ${f.predicate}=${f.objectValue}`).join("; "),
				failed: failed.map((f) => `${f.targetId}: ${f.reason}`).join("; "),
				loops: unowned.map((l) => `${l.id} ${l.title} ${l.status}`).join("; "),
				plan: proposal ? `${proposal.status} ${proposal.action}` : "no proposal yet"
			} });
			setBrief(res.text);
		} catch {
			setBrief("Brief unavailable. Use the graph panels — they are authoritative.");
		} finally {
			setBriefing(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Agent handoff",
				title: "Outgoing → Incoming",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: flags.outgoingKilled ? "hazard" : "cyan",
							children: flags.outgoingKilled ? "outgoing offline" : "outgoing active"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: flags.handoffAccepted ? "ok" : "amber",
							children: ctx?.status ?? "pending"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-fg",
						children: ctx?.summary
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 font-mono text-[11px] text-muted",
						children: [
							ctx?.fromAgentId,
							" → ",
							ctx?.toAgentId,
							" · ",
							ctx?.referenceTime
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "primary",
								onClick: acceptIncoming,
								children: "Accept handoff"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: killOutgoingWatch,
								children: "Kill outgoing watch"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "amber",
								onClick: assignLoopToIncoming,
								children: "Assign unowned loop"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Previous attempt",
				title: "Do not repeat North School",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: failed.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ban, { className: "mt-0.5 size-4 shrink-0 text-hazard" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-fg",
							children: f.reason
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-mono text-[11px] text-muted",
							children: [
								f.id,
								" · ",
								f.actionKind,
								" · ",
								f.targetId
							]
						})] })]
					}, f.id))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Unresolved work",
				title: "Transferred open loops",
				children: [unowned.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-amber",
					children: "At least one loop has no owner."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-3 text-sm text-ok",
					children: "All transferred loops have an owner."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-2",
					children: ctx?.loops.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "font-mono text-xs text-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-fg",
								children: l.title
							}),
							" · ",
							l.status,
							" · ",
							l.ownerId ?? "unowned"
						]
					}, l.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Optional narrative",
				title: "Incoming watch brief",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 text-sm text-muted",
						children: "Graph facts stay authoritative. This brief is a grounded summary of the packet, not a source of operational truth."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						variant: "secondary",
						onClick: runBrief,
						disabled: briefing,
						children: briefing ? "Briefing…" : "Brief incoming watch"
					}),
					brief ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm leading-relaxed text-fg",
						children: brief
					}) : null
				]
			})
		]
	});
}
function PlanPanel({ flags }) {
	const graph = (0, import_react.useMemo)(() => buildWorld(flags), [flags]);
	const ranked = rankTable(graph, "hazard_river_rise", flags.referenceTime);
	const proposal = useDemo((s) => s.proposal);
	const runPlanner = useDemo((s) => s.runPlanner);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Planner",
				title: "Which shelter can receive West Basin households?",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 max-w-3xl text-sm leading-relaxed text-muted",
						children: "The planner does not generate a plan from a document. It ranks OPEN shelters by a multi-hop path: hazard → zone → need → shelter → CONNECTED_BY route → HAS_AUTHORITY → asset, then drops failed attempts."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "primary",
						onClick: runPlanner,
						children: "Run planner traversal"
					}),
					proposal ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 rounded-lg bg-inset p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 flex flex-wrap items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: proposal.status === "PROPOSED" ? "cyan" : proposal.status === "BLOCKED" ? "hazard" : "amber",
										children: proposal.status
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
										tone: "mute",
										children: ["confidence ", proposal.confidence.toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										tone: "amber",
										children: "needs human approval"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-base text-fg",
								children: proposal.action
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-sm text-muted",
								children: proposal.planner_notes
							}),
							proposal.blocking_reasons.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
								className: "mt-3 space-y-1",
								children: proposal.blocking_reasons.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "flex gap-2 text-sm text-amber",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 shrink-0" }), b]
								}, b))
							}) : null
						]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Evidence path",
				title: "Hazard to shelter to source",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EvidencePath, { nodes: proposal?.graph_path ?? [] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Ranking",
				title: "Candidates from the graph",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full min-w-[640px] text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "font-mono text-[10px] uppercase tracking-[0.14em] text-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Shelter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Score"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Open"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Route"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Authority"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-2 font-medium",
									children: "Blockers"
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: ranked.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t border-line",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: c.shelterName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-mono text-[11px] text-muted",
										children: c.shelterId
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono tabular-nums text-cyan",
									children: c.planScore.toFixed(2)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 font-mono tabular-nums",
									children: c.availableSpaces
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5",
									children: c.routeOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-ok",
										children: [
											"open ",
											c.routeMinutes,
											"m"
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-hazard",
										children: "closed"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5",
									children: c.destinationAuthority ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-ok",
										children: "yes"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-amber",
										children: "missing"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2.5 text-muted",
									children: c.blockingReasons[0] ?? "—"
								})
							]
						}, c.shelterId)) })]
					})
				})
			})
		]
	});
}
function ReviewPanel({ flags }) {
	const review = useDemo((s) => s.review);
	const proposal = useDemo((s) => s.proposal);
	const status = useDemo((s) => s.decisionStatus);
	const confirmAuthority = useDemo((s) => s.confirmAuthority);
	const sendToHuman = useDemo((s) => s.sendToHuman);
	const approve = useDemo((s) => s.approve);
	const reject = useDemo((s) => s.reject);
	const closeOutcome = useDemo((s) => s.closeOutcome);
	const outcomeRecorded = useDemo((s) => s.outcomeRecorded);
	const parksAuthority = flags.parksAuthority;
	const [confirmOpen, setConfirmOpen] = (0, import_react.useState)(false);
	const ready = review?.review_state === "READY_FOR_HUMAN_REVIEW";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Reviewer",
				title: "Constraint checks",
				children: !review ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Run the planner first. The reviewer only scores a graph-backed proposal."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: ready ? "ok" : "hazard",
					children: review.review_state
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2",
					children: review.checks.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-start gap-2 text-sm",
						children: [c.ok ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "mt-0.5 size-4 text-ok" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 text-amber" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: c.id
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [" — ", c.detail]
						})] })]
					}, c.id))
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
				kicker: "Human review",
				title: "Duty officer controls",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted",
						children: "AI may propose. Only a human writes APPROVED. This product does not dispatch vehicles or issue evacuation orders."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "amber",
								onClick: confirmAuthority,
								disabled: parksAuthority,
								children: parksAuthority ? "Authority confirmed" : "Confirm Parks authority"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: sendToHuman,
								disabled: !ready,
								children: "Send to human review"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ok",
								onClick: () => setConfirmOpen(true),
								disabled: !ready || status === "APPROVED",
								children: "Approve"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "danger",
								onClick: () => reject("Duty officer rejected pending more evidence"),
								disabled: status === "APPROVED",
								children: "Reject"
							})
						]
					}),
					status !== "NONE" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 font-mono text-xs text-cyan",
						children: [
							"decision d_incoming_plan · ",
							status,
							status === "APPROVED" ? " · approved_by human_approver" : ""
						]
					}) : null,
					status === "APPROVED" && !outcomeRecorded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-4",
						size: "sm",
						onClick: closeOutcome,
						children: "Record simulation outcome"
					}) : null,
					outcomeRecorded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-sm text-ok",
						children: "Outcome written. Open loop closed. Simulation only."
					}) : null,
					confirmOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg bg-inset p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-fg",
							children: [
								"Approve transferring West Basin households to ",
								proposal?.shelter_name ?? "the proposed shelter",
								" in simulation?"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ok",
								onClick: () => {
									approve();
									setConfirmOpen(false);
								},
								children: "Confirm approval"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								onClick: () => setConfirmOpen(false),
								children: "Cancel"
							})]
						})]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Assumptions",
				title: "What the planner is betting on",
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid gap-2 sm:grid-cols-2",
					children: (proposal?.assumptions ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "rounded-md bg-inset px-3 py-2 text-sm text-muted",
						children: a
					}, a))
				})
			})
		]
	});
}
function GraphPanel({ flags }) {
	const graph = (0, import_react.useMemo)(() => buildWorld(flags), [flags]);
	const proposal = useDemo((s) => s.proposal);
	const health = graphHealth(graph);
	const episodes = episodesSince(graph, "2026-10-15T13:00:00Z");
	const ds = decisions(graph);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			kicker: "Graph explorer",
			title: "Selected decision path",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PathCanvas, { nodes: proposal?.graph_path ?? [] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 font-mono text-[11px] text-muted",
				children: [
					health.graph,
					" · ",
					health.nodes,
					" nodes · ",
					health.relationships,
					" edges"
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Episodes",
				title: "Watch memory",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: episodes.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-fg",
						children: e.text
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-[11px] text-muted",
						children: [
							e.kind,
							" · ",
							e.occurredAt,
							" · ",
							e.author
						]
					})] }, e.id))
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				kicker: "Decisions",
				title: "Audit trail",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-3",
					children: ds.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "rounded-md bg-inset p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: d.status === "APPROVED" ? "ok" : d.status === "REJECTED" ? "hazard" : "amber",
								children: d.status
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] text-muted",
								children: d.id
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-fg",
							children: d.rationale
						})]
					}, d.id))
				})
			})]
		})]
	});
}
function QueryPanel() {
	const entries = [
		{
			id: "factsAtTime",
			title: "Facts true at a reference time",
			cypher: CYPHER.factsAtTime
		},
		{
			id: "candidatePlan",
			title: "Candidate plan traversal",
			cypher: CYPHER.candidatePlan
		},
		{
			id: "supersession",
			title: "Supersession chain",
			cypher: CYPHER.supersession
		},
		{
			id: "unownedLoops",
			title: "Unowned open loops",
			cypher: CYPHER.unownedLoops
		},
		{
			id: "failedAttempts",
			title: "Failed attempts",
			cypher: CYPHER.failedAttempts
		},
		{
			id: "handoff",
			title: "Handoff context",
			cypher: CYPHER.handoff
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid gap-4 lg:grid-cols-2",
		children: entries.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			kicker: e.id,
			title: e.title,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "overflow-x-auto rounded-lg bg-inset p-3 font-mono text-[11px] leading-relaxed text-cyan",
				children: e.cypher
			})
		}, e.id))
	});
}
var VIEW_META = [
	{
		id: "overview",
		label: "Overview",
		icon: Radio
	},
	{
		id: "temporal",
		label: "What changed",
		icon: CircleDot
	},
	{
		id: "handoff",
		label: "Handoff",
		icon: Waypoints
	},
	{
		id: "plan",
		label: "Planner",
		icon: ShieldCheck
	},
	{
		id: "review",
		label: "Human review",
		icon: Lock
	},
	{
		id: "graph",
		label: "Graph",
		icon: Siren
	},
	{
		id: "queries",
		label: "Cypher",
		icon: CircleCheck
	}
];
function clockLabel(iso) {
	return iso.slice(11, 16) + "Z";
}
function MissionApp() {
	const view = useDemo((s) => s.view);
	const setView = useDemo((s) => s.setView);
	const referenceTime = useDemo((s) => s.referenceTime);
	const injectedChange = useDemo((s) => s.injectedChange);
	const handoffAccepted = useDemo((s) => s.handoffAccepted);
	const outgoingKilled = useDemo((s) => s.outgoingKilled);
	const loopOwner = useDemo((s) => s.loopOwner);
	const parksAuthority = useDemo((s) => s.parksAuthority);
	const proposalWritten = useDemo((s) => s.proposalWritten);
	const decisionStatus = useDemo((s) => s.decisionStatus);
	const rejectionReason = useDemo((s) => s.rejectionReason);
	const outcomeRecorded = useDemo((s) => s.outcomeRecorded);
	const lastEvent = useDemo((s) => s.lastEvent);
	const goBaseline = useDemo((s) => s.goBaseline);
	const injectChange = useDemo((s) => s.injectChange);
	const goIncoming = useDemo((s) => s.goIncoming);
	const runPlanner = useDemo((s) => s.runPlanner);
	const confirmAuthority = useDemo((s) => s.confirmAuthority);
	const reset = useDemo((s) => s.reset);
	const flags = (0, import_react.useMemo)(() => ({
		referenceTime,
		injectedChange,
		handoffAccepted,
		outgoingKilled,
		loopOwner,
		parksAuthority,
		proposalWritten,
		decisionStatus,
		rejectionReason,
		outcomeRecorded
	}), [
		referenceTime,
		injectedChange,
		handoffAccepted,
		outgoingKilled,
		loopOwner,
		parksAuthority,
		proposalWritten,
		decisionStatus,
		rejectionReason,
		outcomeRecorded
	]);
	const steps = [
		{
			id: "t14",
			label: "14:00 baseline",
			done: true,
			active: !injectedChange && referenceTime === "2026-10-15T14:00:00Z",
			run: goBaseline
		},
		{
			id: "t1630",
			label: "Inject 16:30",
			done: injectedChange,
			active: injectedChange && referenceTime === "2026-10-15T16:30:00Z",
			run: injectChange
		},
		{
			id: "t18",
			label: "18:00 incoming",
			done: referenceTime >= T18,
			active: referenceTime >= "2026-10-15T18:00:00Z" && !proposalWritten,
			run: goIncoming
		},
		{
			id: "plan",
			label: "Run planner",
			done: proposalWritten,
			active: proposalWritten && decisionStatus === "PROPOSED",
			run: runPlanner
		},
		{
			id: "auth",
			label: "Confirm authority",
			done: parksAuthority,
			active: proposalWritten && !parksAuthority,
			run: confirmAuthority
		},
		{
			id: "ok",
			label: "Human approval",
			done: decisionStatus === "APPROVED",
			active: parksAuthority && decisionStatus !== "APPROVED",
			run: () => setView("review")
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "#main",
				className: "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cyan focus:px-3 focus:py-2 focus:text-primary-foreground",
				children: "Skip to content"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-line",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, { className: "size-10 shrink-0 rounded-lg shadow-[0_0_0_1px_rgba(255,255,255,0.08)]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-[10px] uppercase tracking-[0.22em] text-cyan",
							children: "WatchChange Mesh"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-medium tracking-tight",
							children: "Cedar County flood watch"
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "amber",
								children: "Synthetic demo"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								tone: "cyan",
								children: ["graph ", clockLabel(referenceTime)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: outgoingKilled ? "hazard" : "ok",
								children: outgoingKilled ? "outgoing offline" : "watch live"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "mute",
								children: "watchchange_flood_demo"
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto max-w-[1440px] px-4 pb-3 font-mono text-[11px] text-muted md:px-6",
					children: lastEvent
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-line bg-surface",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-[1440px] gap-2 overflow-x-auto px-4 py-3 md:px-6",
					children: [steps.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: s.run,
						className: cn("flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-left text-xs shadow-[0_0_0_1px_rgba(255,255,255,0.08)]", s.active ? "bg-cyan-dim text-cyan" : s.done ? "bg-ok-dim text-ok" : "bg-inset text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono tabular-nums",
							children: i + 1
						}), s.label]
					}, s.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "ml-auto shrink-0",
						onClick: reset,
						children: "Reset demo"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[1440px] flex-col lg:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "Views",
					className: "flex gap-1 overflow-x-auto border-b border-line p-3 lg:w-52 lg:flex-col lg:border-b-0 lg:border-r lg:py-5",
					children: VIEW_META.map((v) => {
						const Icon = v.icon;
						const on = view === v.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setView(v.id),
							className: cn("flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm", on ? "bg-elevated text-cyan" : "text-muted hover:bg-elevated hover:text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }), v.label]
						}, v.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					id: "main",
					className: "min-w-0 flex-1 px-4 py-5 md:px-6 md:py-6",
					children: [
						view === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewPanel, { flags }) : null,
						view === "temporal" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TemporalPanel, { flags }) : null,
						view === "handoff" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HandoffPanel, { flags }) : null,
						view === "plan" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanPanel, { flags }) : null,
						view === "review" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewPanel, { flags }) : null,
						view === "graph" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraphPanel, { flags }) : null,
						view === "queries" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryPanel, {}) : null
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "border-t border-line px-4 py-4 text-center text-xs text-subtle md:px-6",
				children: "Decision support only. Synthetic households. No live emergency dispatch."
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MissionApp, {});
}
//#endregion
export { Home as component };
