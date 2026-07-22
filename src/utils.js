function generateSkill(workflow, format = 'claude') {
  const lines = [
    '---',
    `name: ${workflow.name}`,
    `description: Auto-generated from FlowLane`,
    'steps:',
  ];

  (workflow.nodes || []).forEach((node, i) => {
    lines.push(`  - ${node.type}: ${node.label || node.type}`);
  });

  lines.push('---');
  lines.push('');
  lines.push(`# ${workflow.name}`);

  return lines.join('\n');
}

function validateWorkflow(workflow) {
  const errors = [];
  if (!workflow.nodes?.length) errors.push('No nodes');
  if (!workflow.nodes?.some(n => n.type === 'input')) errors.push('No input node');
  if (!workflow.nodes?.some(n => n.type === 'output')) errors.push('No output node');
  return { valid: errors.length === 0, errors };
}

function getTemplates() {
  return [
    { id: 'chatbot', name: 'Chatbot', description: 'Input → Prompt → Output' },
    { id: 'pipeline', name: 'Data Pipeline', description: 'Input → Transform → Output' },
  ];
}

module.exports = { generateSkill, validateWorkflow, getTemplates };
