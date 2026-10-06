# Security

- HTTPS on the published origin.
- No arbitrary Cypher from clients. Allowlisted query catalog only.
- No secrets in the repo. No `.env` committed. `XAI_API_KEY` stays server-side.
- Synthetic households (`privacy_class: SYNTHETIC`). No real resident data.
- Human approval required before `APPROVED`. UI never labels a proposal as approved.
- Product is decision support — no dispatch, no evacuation orders.
- Optional xAI brief is user-initiated, capped tokens, graph packet only.
- Error responses do not include credentials or stack traces to the client.
