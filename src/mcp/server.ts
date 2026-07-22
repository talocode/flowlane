import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  { name: 'flowlane', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'flowlane_create_workflow',
      description: 'Create a new FlowLane workflow',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Workflow name' },
          nodes: { type: 'array', description: 'Workflow nodes' },
          edges: { type: 'array', description: 'Workflow edges' },
        },
        required: ['name'],
      },
    },
    {
      name: 'flowlane_generate_skill',
      description: 'Generate SKILL.md from workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: { type: 'object', description: 'Workflow object' },
          format: { type: 'string', enum: ['claude', 'cursor', 'codra'], description: 'Export format' },
        },
        required: ['workflow'],
      },
    },
    {
      name: 'flowlane_validate_workflow',
      description: 'Validate a workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow: { type: 'object', description: 'Workflow object' },
        },
        required: ['workflow'],
      },
    },
    {
      name: 'flowlane_list_templates',
      description: 'List available workflow templates',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'flowlane_create_workflow': {
      const workflow = {
        id: crypto.randomUUID(),
        name: args?.name || 'untitled',
        nodes: args?.nodes || [],
        edges: args?.edges || [],
        created: new Date().toISOString(),
      };
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, workflow }, null, 2) }] };
    }

    case 'flowlane_generate_skill': {
      const { workflow, format } = args as any;
      const skill = generateSkill(workflow, format);
      return { content: [{ type: 'text', text: skill }] };
    }

    case 'flowlane_validate_workflow': {
      const { workflow } = args as any;
      const validation = validateWorkflow(workflow);
      return { content: [{ type: 'text', text: JSON.stringify(validation, null, 2) }] };
    }

    case 'flowlane_list_templates': {
      const templates = getTemplates();
      return { content: [{ type: 'text', text: JSON.stringify(templates, null, 2) }] };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

function generateSkill(workflow: any, format?: string): string {
  const lines = [
    '---',
    `name: ${workflow.name}`,
    `description: Auto-generated from FlowLane`,
    'steps:',
  ];

  (workflow.nodes || []).forEach((node: any, i: number) => {
    lines.push(`  - ${node.type}: ${node.label || node.type}`);
  });

  lines.push('---');
  lines.push('');
  lines.push(`# ${workflow.name}`);

  return lines.join('\n');
}

function validateWorkflow(workflow: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!workflow.nodes?.length) errors.push('No nodes');
  if (!workflow.nodes?.some((n: any) => n.type === 'input')) errors.push('No input node');
  if (!workflow.nodes?.some((n: any) => n.type === 'output')) errors.push('No output node');
  return { valid: errors.length === 0, errors };
}

function getTemplates() {
  return [
    { id: 'chatbot', name: 'Chatbot', description: 'Input → Prompt → Output' },
    { id: 'pipeline', name: 'Data Pipeline', description: 'Input → Transform → Output' },
  ];
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('FlowLane MCP server running');
}

main().catch(console.error);
