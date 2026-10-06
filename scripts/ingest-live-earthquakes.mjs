import { createClient } from "redis";

async function ingestEarthquakes() {
  console.log("Connecting to FalkorDB...");
  const client = createClient({ url: "redis://localhost:6379" });
  await client.connect();

  console.log("Fetching live earthquakes from USGS...");
  const res = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson");
  const data = await res.json();

  console.log(`Found ${data.features.length} earthquakes in the last hour.`);

  for (const feature of data.features) {
    const id = feature.id;
    const mag = feature.properties.mag;
    const place = feature.properties.place;
    const time = feature.properties.time;
    
    if (mag > 0) {
      const query = `
        MERGE (h:Hazard {id: '${id}'})
        SET h.type = 'Earthquake', h.magnitude = ${mag}, h.place = '${place.replace(/'/g, "''")}', h.time = ${time}
      `;
      try {
        await client.sendCommand(["GRAPH.QUERY", "watchchange", query]);
        console.log(`Ingested: ${place} (Mag ${mag})`);
      } catch (err) {
        console.error("Failed to ingest:", err);
      }
    }
  }

  await client.quit();
  console.log("Ingestion complete.");
}

ingestEarthquakes().catch(console.error);
