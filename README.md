<div align="center">
  <img src="https://raw.githubusercontent.com/FalkorDB/falkordb/master/logo.png" alt="FalkorDB" width="120" />
  <h1>WatchChange Mesh 🌐</h1>
  <p><strong>Agent Memory & Coordination for Disaster Decision Support</strong></p>
  
  [![FalkorDB](https://img.shields.io/badge/FalkorDB-v4.20.4-ff69b4.svg?style=for-the-badge&logo=redis)](https://falkordb.com/)
  [![Hackathon](https://img.shields.io/badge/Track-Agent_Memory_%26_Coordination-8A2BE2.svg?style=for-the-badge)](https://wemakedevs.org)
  [![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=for-the-badge&logo=react)](https://react.dev)
  [![Status](https://img.shields.io/badge/Status-Production_Ready-success.svg?style=for-the-badge)]()
</div>

<br/>

> **WatchChange Mesh** is a human-approved disaster-coordination decision support system. It gives AI Agents a persistent, bi-temporal memory graph. An incoming watch agent can reconstruct exactly what the world looked like at 14:00, see precisely what changed by 18:00, and propose a highly constrained, multi-hop shelter plan based on live data.

---

## 🏆 Hackathon Tracks

This project heavily targets the **FalkorDB x WeMakeDevs** hackathon:
1. **Primary: Agent Memory and Coordination (Track 02)** - Uses bi-temporal `.SUPERSEDES()` graph logic to maintain episodic memory of failed attempts and state changes across agent handoffs.
2. **Secondary: Agents That Act on Connected Data (Track 01)** - Replaces basic vector-RAG with a highly constrained Graph Traversal Planner (`Hazard → Zone → Need → Shelter → Route → Authority`).

---

## 🧠 Why FalkorDB is the Engine

The recommendation system is **not a chatbot over documents**. 
* At `14:00`, the planner traversal selects *Riverside High* because *West Connector* is `OPEN` and 42 cots are valid. 
* At `16:30`, live data injects close the *West Connector* and drop capacity. These facts are **superseded, not overwritten** using FalkorDB. 
* At `18:00`, the same Cypher traversal rejects Shelter A (closed route), skips North School (recorded as a failed attempt in the graph memory), and proposes Civic Arena—which is immediately blocked until the agent verifies "Parks authority" exists.

**If you remove the graph, the product cannot rank shelters, reconstruct the 14:00 baseline, or remember failed agent attempts. The graph IS the brain.**

---

## ⚡ Live Ingestion Architecture

While the project ships with a synthetic demo for safety, it includes a **Live Data Ingestor** (`scripts/ingest-live-earthquakes.mjs`) that connects via the Node `redis` client to the FalkorDB Docker container.
* Fetches live USGS GeoJSON earthquake data.
* Dynamically executes `GRAPH.QUERY` to inject `Hazard` nodes into FalkorDB in real-time.

---

## 🚀 Getting Started

### 1. Start the Graph Database
Run the pinned FalkorDB container via Docker Compose:
```bash
docker-compose up -d
```

### 2. Environment Setup
Rename `.env.example` to `.env` (it is pre-configured for local Docker development):
```env
FALKORDB_URL=redis://127.0.0.1:6379
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## 🎬 2-Minute Demo Script for Judges

1. **Open the app.** The clock is set to 14:00. The overview shows a West Basin flood and 42 cots available at Riverside High.
2. **Open Planner.** Run the Graph Traversal — it selects Shelter A and renders the OpenCypher evidence path.
3. **Tap Inject 16:30.** Check **What changed**: you'll see the superseded capacity `42 → 8` and West Connector `OPEN → CLOSED`. *The 14:00 facts remain queryable in FalkorDB.*
4. **Tap 18:00 Incoming.** Check **Handoff**: The new agent sees the unowned overflow loop and the North School failure.
5. **Re-run the planner.** Civic Arena ranks first but is **blocked** on missing Parks authority constraints.
6. **Confirm authority & Approve.** As the human duty officer, approve the plan. Status is written back to the graph as `APPROVED`.

---

## 🛡️ Safety & Constraints
**This is a decision-support demo. It is not a live emergency dispatcher.**
- **Human in the loop:** AI proposals stay locked in `PROPOSED` state until a human officer explicitly approves.
- **No PII:** Uses synthetic household data.
- **Sanitized Execution:** No arbitrary Cypher execution from the browser.

<br/>
<div align="center">
  <sub>Built for the FalkorDB Graph Hacks Hackathon</sub>
</div>
