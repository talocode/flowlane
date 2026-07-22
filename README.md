# FlowLane

Visual AI workflow builder — drag, drop, deploy.

Build AI workflows by connecting nodes visually. Export to SKILL.md for any agent.

## Features

- **Drag & Drop** — Visual node builder with 7 node types
- **AI Nodes** — Input, AI Prompt, Transform, Condition, Output, API Call, Skill
- **SKILL.md Export** — Generate structured skill files for Claude, Cursor, Codra
- **CLI** — Initialize, dev server, build from command line
- **MCP Server** — Tool calls for workflow generation
- **SDK** — npm and Python clients

## Install

```bash
npm install -g @talocode/flowlane
```

```bash
pip install talocode-flowlane
```

## Quickstart

```bash
flowlane init
flowlane dev
# Open http://localhost:3000
# Drag nodes, connect them, generate SKILL.md
```

## CLI Commands

```bash
flowlane init      # Initialize project
flowlane dev       # Start visual builder (default: port 3000)
flowlane build     # Generate SKILL.md from workflow
```

## Node Types

| Node | Description |
|------|-------------|
| Input | User input or text |
| AI Prompt | Send to AI model |
| Transform | Process data |
| Condition | If/else logic |
| Output | Display or save |
| API Call | External API |
| Skill | Import SKILL.md |

## MCP Server

```bash
flowlane-mcp
```

Tools:
- `flowlane_create_workflow` — Create a new workflow
- `flowlane_generate_skill` — Generate SKILL.md from workflow
- `flowlane_validate_workflow` — Validate a workflow
- `flowlane_list_templates` — List available templates

## API

```javascript
const { FlowLane } = require('@talocode/flowlane');

const client = new FlowLane({ apiKey: 'your-key' });

await client.createWorkflow({ name: 'chatbot', nodes: [...], edges: [...] });
await client.generateSkill({ workflow, format: 'claude' });
```

## Python SDK

```python
from flowlane import FlowLane

client = FlowLane(api_key="your-key")

client.create_workflow(name="chatbot", nodes=[...], edges=[...])
client.generate_skill(workflow=workflow, format="claude")
```

## Links

- GitHub: https://github.com/talocode/flowlane
- X: https://x.com/talocode
- Telegram: https://t.me/TalocodeChannel
- Site: https://talocode.site

## License

MIT © Talocode
