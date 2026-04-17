# MQTT Visualizer

A Home Assistant add-on that provides real-time visualization of MQTT message flows and client subscriptions.

## Features

- **Live View** — three-panel layout with publishers on the left, topic tree in the center, and subscriber clients on the right. Animated flow lines connect publishers to topics to subscribers.
- **Sankey View** — flow diagram showing message volume between publishers, topics, and subscribers.
- **Topic tree** — expand/collapse topic hierarchy, filter by keyword, click any topic for message history.
- **Topic detail** — last payload value plus scrollable message history (last 100 messages).

## Installation

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**.
2. Click the menu (⋮) → **Repositories**.
3. Add: `https://github.com/rperciaccante/mqtt-visualizer`
4. Find **MQTT Visualizer** and click **Install**.

## Configuration

| Option | Description | Required |
|--------|-------------|----------|
| `mqtt_host` | MQTT broker hostname or IP | Yes |
| `mqtt_port` | MQTT broker port (default: 1883) | No |
| `mqtt_username` | Broker username (leave blank if none) | No |
| `mqtt_password` | Broker password (leave blank if none) | No |
| `mqtt_tls` | Enable TLS/SSL (default: false) | No |

## Notes

- **Subscriber data is approximate.** Standard MQTT does not expose which clients are subscribed to which topics. The subscriber panel shows connected clients from broker system topics (`$SYS`).
- All data is in-memory and cleared on restart.
- Read-only — this add-on cannot publish messages.
