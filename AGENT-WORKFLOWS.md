# Agent workflows & The "Memory Fortress" Architecture

Our agents use a **Memory Fortress** architecture backed by FalkorDB. Because LLMs naturally suffer from context decay, hallucinations, and "forgotten soldiers" (dropped tasks), we completely abandon flat chat histories. 

Instead, the agents anchor every memory, failed attempt, and open loop spatially onto a graph. 

## The Fortress Blueprint
**1. Choose Your Blueprint (The Graph Schema)**
The agent's memory palace is the physical geography of the disaster: `(Hazard) → (Zone) → (Shelter)`. When an agent needs context, it doesn't search a vector database; it physically "walks" the graph.

**2. Map Out a Fixed Route (The Traversal Planner)**
To guarantee the agent never forgets a constraint, it is hardwired to patrol the exact same route every time via an OpenCypher query:
`Hazard → Affected Zone → Needs → Shelter → OPEN Route → Authority → Asset`

**3. Station Your Soldiers (Anchoring Memories)**
Instead of telling an agent "don't forget North School failed," we literally station a `[:HAS_FAILED_ATTEMPT]` soldier directly on the `(Shelter:North School)` node. 
* *Example:* If an incoming agent needs to know what went wrong, they don't read a summary. They check the shelter node, and the "Mental Soldier" (the failed attempt flag) is standing right there blocking the path.

**4. Patrol the Fortress (Handoff & Rescue)**
When a shift change happens (e.g., 18:00 incoming watch), the new agent does not frantically search unstructured history. It executes a "Patrol" query to check the `(OpenLoop)` and `(FailedAttempt)` guard posts. The memory is instantly recovered with 100% precision.

---

## Output Contract

All agents return structured JSON from their patrols. None may set `APPROVED` themselves.

```json
{
  "status": "PROPOSED",
  "action": "Transfer west-side households to Civic Arena",
  "reference_time": "2026-10-15T18:00:00Z",
  "confidence": 0.88,
  "assumptions": [],
  "evidence_ids": [],
  "graph_path": [],
  "blocking_reasons": [],
  "requires_human_approval": true
}
```

## Agent Roles

| Role | Writes to Graph | Abstains when |
| --- | --- | --- |
| **Ingestor** | Source, Fact, Episode | Entity match is uncertain |
| **Outgoing watch** | Handoff, failed attempts, open loops | — |
| **Incoming watch** | Handoff acceptance, session | Handoff missing |
| **Planner (Patrol)** | Decision PROPOSED + DecisionTrace | No OPEN path / no evidence |
| **Reviewer** | Review state | Superseded fact, failed repeat, missing authority |
| **Human** | APPROVED / REJECTED | — |

## Handoff via Spatial Memory
An outgoing agent can go entirely `OFFLINE`. The incoming agent wakes up, enters the "Fortress" (FalkorDB), and physically walks to the `Handoff`, `OpenLoop`, and `FailedAttempt` nodes. The state is shared flawlessly without passing a single text transcript.
