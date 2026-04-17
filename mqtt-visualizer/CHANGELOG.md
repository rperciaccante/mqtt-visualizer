# Changelog

## 1.0.11
- Sankey: guarantee 24px of vertical space per node so every link is individually visible
- Diagram grows taller than the viewport when needed; use zoom/pan to navigate

## 1.0.10
- Add Source column to Log tab — inferred from topic path using Tasmota, Home Assistant, and generic conventions
- Source column is sortable; hover shows which topic it was inferred from

## 1.0.9
- Fix scroll zoom error: attach wheel listener as non-passive to allow preventDefault
- Fix getBoundingClientRect null error: read rect synchronously before async state update

## 1.0.8
- Add Pause/Resume button to Sankey view — freezes the diagram while you explore
- Add zoom (scroll wheel, cursor-centered) and pan (click-drag) to Sankey view
- Add Reset button to restore 100% zoom
- Add Log tab — sortable table of all topics with rate, last seen, and last value columns
- Log tab has a filter box for searching topics

## 1.0.7
- Sankey now shows topic hierarchy flow (leaf topics → parent prefixes → roots)
- Link widths are proportional to aggregated message rates at each level
- Works from topic data alone — no broker $SYS support needed
- Connected clients (if detected) still appear as rightmost column

## 1.0.6
- Fix Sankey showing nothing: publisher tracking was never populated (broker doesn't expose it)
- Sankey now shows Topics → Connected Clients when $SYS client events are available
- Sankey falls back to a Topic Activity bar chart (sized by message rate) when no clients are detected

## 1.0.5
- Prettify JSON payloads in the Last Value and Message History panels

## 1.0.4
- Fix Sankey NaN errors: filter out isolated nodes before layout, guard NaN coordinates
- Fix Sankey performance: only recompute layout when topic/publisher keys or rates change, not on every message

## 1.0.3
- Add host_network: true so the add-on can resolve local hostnames and reach localhost

## 1.0.2
- Add Test Connection button to verify broker settings from the UI
- Add optional mqtt_client_id configuration option
- Use configured client ID for both main connection and test connection

## 1.0.1
- Fix asset paths for HA ingress compatibility (relative URLs instead of absolute)
- Fix WebSocket URL to work under HA ingress subpath

## 1.0.0 — Initial release
- Real-time MQTT topic tree with publisher/subscriber panels
- Sankey flow diagram view
- Expand/collapse topics with animated flow lines
- Configurable broker connection (host, port, credentials, TLS)
