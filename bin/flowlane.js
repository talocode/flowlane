#!/usr/bin/env node
const { Command } = require('commander');
const path = require('path');

const program = new Command();
program
  .name('flowlane')
  .description('Visual AI workflow builder — drag, drop, deploy')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new FlowLane project')
  .action(() => {
    const fs = require('fs');
    const dir = process.cwd();
    
    fs.mkdirSync(path.join(dir, '.flowlane'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.flowlane', 'workflow.json'), JSON.stringify({
      name: 'my-workflow',
      nodes: [],
      edges: [],
      created: new Date().toISOString()
    }, null, 2));
    
    fs.mkdirSync(path.join(dir, 'skills'), { recursive: true });
    
    console.log('FlowLane project initialized');
    console.log('Run `flowlane dev` to start the visual builder');
  });

program
  .command('dev')
  .description('Start the visual builder')
  .option('-p, --port <port>', 'Port number', '3000')
  .action((opts) => {
    const http = require('http');
    const fs = require('fs');
    
    const PORT = opts.port;
    
    const server = http.createServer((req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(getBuilderHTML());
      } else if (req.url === '/api/workflow') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const workflowPath = path.join(process.cwd(), '.flowlane', 'workflow.json');
        if (fs.existsSync(workflowPath)) {
          res.end(fs.readFileSync(workflowPath));
        } else {
          res.end(JSON.stringify({ nodes: [], edges: [] }));
        }
      } else if (req.url === '/api/workflow' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const workflowPath = path.join(process.cwd(), '.flowlane', 'workflow.json');
          fs.writeFileSync(workflowPath, body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        });
      } else if (req.url === '/api/generate' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const workflow = JSON.parse(body);
          const skill = generateSkill(workflow);
          const skillPath = path.join(process.cwd(), 'skills', `${workflow.name || 'workflow'}.md`);
          fs.mkdirSync(path.join(process.cwd(), 'skills'), { recursive: true });
          fs.writeFileSync(skillPath, skill);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, path: skillPath }));
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(PORT, () => {
      console.log(`FlowLane builder running at http://localhost:${PORT}`);
    });
  });

program
  .command('build')
  .description('Build workflow into SKILL.md')
  .action(() => {
    const fs = require('fs');
    const workflowPath = path.join(process.cwd(), '.flowlane', 'workflow.json');
    
    if (!fs.existsSync(workflowPath)) {
      console.log('No workflow found. Run `flowlane init` first.');
      return;
    }
    
    const workflow = JSON.parse(fs.readFileSync(workflowPath));
    const skill = generateSkill(workflow);
    
    fs.mkdirSync(path.join(process.cwd(), 'skills'), { recursive: true });
    const skillPath = path.join(process.cwd(), 'skills', `${workflow.name || 'workflow'}.md`);
    fs.writeFileSync(skillPath, skill);
    
    console.log(`Generated: ${skillPath}`);
  });

function generateSkill(workflow) {
  const lines = [
    '---',
    `name: ${workflow.name || 'workflow'}`,
    `description: Auto-generated from FlowLane visual builder`,
    'steps:',
  ];
  
  (workflow.nodes || []).forEach((node, i) => {
    lines.push(`  - ${node.type}: ${node.label || node.config?.text || 'step ' + (i+1)}`);
  });
  
  lines.push('---');
  lines.push('');
  lines.push(`# ${workflow.name || 'Workflow'}`);
  lines.push('');
  
  (workflow.nodes || []).forEach((node, i) => {
    lines.push(`## Step ${i + 1}: ${node.label || node.type}`);
    lines.push('');
    lines.push(`- Type: ${node.type}`);
    if (node.config) {
      Object.entries(node.config).forEach(([k, v]) => {
        lines.push(`- ${k}: ${v}`);
      });
    }
    lines.push('');
  });
  
  return lines.join('\n');
}

function getBuilderHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FlowLane — Visual AI Workflow Builder</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #171718; color: #fff; height: 100vh; overflow: hidden; }
    
    .header { background: #232326; border-bottom: 1px solid #37373c; padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 18px; color: #ffd166; }
    .header .actions { display: flex; gap: 10px; }
    .header button { background: #00d4aa; color: #000; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .header button:hover { background: #00b894; }
    .header button.secondary { background: #37373c; color: #fff; }
    
    .container { display: flex; height: calc(100vh - 52px); }
    
    .sidebar { width: 240px; background: #232326; border-right: 1px solid #37373c; padding: 16px; overflow-y: auto; }
    .sidebar h3 { color: #ffd166; margin-bottom: 12px; font-size: 14px; }
    .node-item { background: #2a2a2d; border: 1px solid #37373c; border-radius: 8px; padding: 10px; margin-bottom: 8px; cursor: grab; transition: all 0.2s; }
    .node-item:hover { border-color: #00d4aa; transform: translateY(-1px); }
    .node-item .icon { font-size: 18px; margin-bottom: 4px; }
    .node-item .name { font-size: 13px; font-weight: 600; }
    .node-item .desc { font-size: 11px; color: #888; }
    
    .canvas { flex: 1; background: #1a1a1b; position: relative; overflow: hidden; }
    .canvas svg { width: 100%; height: 100%; }
    
    .node { cursor: move; }
    .node rect { fill: #2a2a2d; stroke: #37373c; stroke-width: 2; rx: 8; }
    .node:hover rect { stroke: #00d4aa; }
    .node.selected rect { stroke: #ffd166; stroke-width: 3; }
    .node text { fill: #fff; font-size: 12px; font-weight: 600; }
    .node .type { fill: #888; font-size: 10px; }
    
    .edge { stroke: #37373c; stroke-width: 2; fill: none; marker-end: url(#arrow); }
    .edge:hover { stroke: #00d4aa; }
    
    .properties { width: 280px; background: #232326; border-left: 1px solid #37373c; padding: 16px; overflow-y: auto; }
    .properties h3 { color: #ffd166; margin-bottom: 12px; font-size: 14px; }
    .properties label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; margin-top: 12px; }
    .properties input, .properties select, .properties textarea { width: 100%; background: #2a2a2d; border: 1px solid #37373c; border-radius: 6px; padding: 8px; color: #fff; font-size: 13px; }
    .properties textarea { height: 80px; resize: vertical; }
    
    .drop-indicator { position: absolute; pointer-events: none; border: 2px dashed #00d4aa; border-radius: 8px; background: rgba(0, 212, 170, 0.1); }
  </style>
</head>
<body>
  <div class="header">
    <h1>FlowLane</h1>
    <div class="actions">
      <button class="secondary" onclick="clearCanvas()">Clear</button>
      <button class="secondary" onclick="exportWorkflow()">Export JSON</button>
      <button onclick="generateSkill()">Generate SKILL.md</button>
    </div>
  </div>
  <div class="container">
    <div class="sidebar">
      <h3>Nodes</h3>
      <div class="node-item" draggable="true" data-type="input">
        <div class="icon">📝</div>
        <div class="name">Input</div>
        <div class="desc">User input or text</div>
      </div>
      <div class="node-item" draggable="true" data-type="prompt">
        <div class="icon">🤖</div>
        <div class="name">AI Prompt</div>
        <div class="desc">Send to AI model</div>
      </div>
      <div class="node-item" draggable="true" data-type="transform">
        <div class="icon">🔄</div>
        <div class="name">Transform</div>
        <div class="desc">Process data</div>
      </div>
      <div class="node-item" draggable="true" data-type="condition">
        <div class="icon">🔀</div>
        <div class="name">Condition</div>
        <div class="desc">If/else logic</div>
      </div>
      <div class="node-item" draggable="true" data-type="output">
        <div class="icon">📤</div>
        <div class="name">Output</div>
        <div class="desc">Display or save</div>
      </div>
      <div class="node-item" draggable="true" data-type="api">
        <div class="icon">🌐</div>
        <div class="name">API Call</div>
        <div class="desc">External API</div>
      </div>
      <div class="node-item" draggable="true" data-type="skill">
        <div class="icon">⚡</div>
        <div class="name">Skill</div>
        <div class="desc">Import SKILL.md</div>
      </div>
    </div>
    
    <div class="canvas" id="canvas">
      <svg id="svg">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#37373c" />
          </marker>
        </defs>
      </svg>
    </div>
    
    <div class="properties" id="properties">
      <h3>Properties</h3>
      <p style="color: #666; font-size: 13px;">Select a node to edit</p>
    </div>
  </div>

  <script>
    let nodes = [];
    let edges = [];
    let selectedNode = null;
    let draggedType = null;
    let nodeIdCounter = 0;
    
    const svg = document.getElementById('svg');
    const canvas = document.getElementById('canvas');
    
    // Drag from sidebar
    document.querySelectorAll('.node-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedType = e.target.dataset.type;
      });
    });
    
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedType) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      addNode(draggedType, x, y);
      draggedType = null;
    });
    
    function addNode(type, x, y) {
      const id = 'node-' + (++nodeIdCounter);
      const icons = { input: '📝', prompt: '🤖', transform: '🔄', condition: '🔀', output: '📤', api: '🌐', skill: '⚡' };
      
      nodes.push({
        id, type, x, y,
        label: type.charAt(0).toUpperCase() + type.slice(1),
        icon: icons[type] || '📦',
        config: {}
      });
      
      render();
    }
    
    function render() {
      let html = '<defs><marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#37373c" /></marker></defs>';
      
      edges.forEach(edge => {
        const from = nodes.find(n => n.id === edge.from);
        const to = nodes.find(n => n.id === edge.to);
        if (from && to) {
          html += '<line class="edge" x1="' + (from.x + 75) + '" y1="' + (from.y + 30) + '" x2="' + (to.x + 75) + '" y2="' + (to.y + 30) + '" marker-end="url(#arrow)"/>';
        }
      });
      
      nodes.forEach(node => {
        const sel = selectedNode === node.id ? ' selected' : '';
        html += '<g class="node' + sel + '" data-id="' + node.id + '" transform="translate(' + node.x + ',' + node.y + ')">';
        html += '<rect width="150" height="60" />';
        html += '<text x="40" y="25">' + node.icon + '</text>';
        html += '<text x="40" y="42">' + node.label + '</text>';
        html += '<text x="40" y="55" class="type">' + node.type + '</text>';
        html += '</g>';
      });
      
      svg.innerHTML = html;
      
      // Add click handlers
      svg.querySelectorAll('.node').forEach(el => {
        el.addEventListener('click', () => {
          selectedNode = el.dataset.id;
          render();
          showProperties();
        });
        
        el.addEventListener('mousedown', (e) => {
          const node = nodes.find(n => n.id === el.dataset.id);
          const startX = e.clientX - node.x;
          const startY = e.clientY - node.y;
          
          const onMove = (e) => {
            node.x = e.clientX - startX;
            node.y = e.clientY - startY;
            render();
          };
          
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
          };
          
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    }
    
    function showProperties() {
      const node = nodes.find(n => n.id === selectedNode);
      if (!node) return;
      
      const props = document.getElementById('properties');
      props.innerHTML = '<h3>Properties</h3>' +
        '<label>Label</label><input id="prop-label" value="' + node.label + '" />' +
        '<label>Type</label><input value="' + node.type + '" disabled />' +
        '<label>Config</label><textarea id="prop-config">' + JSON.stringify(node.config, null, 2) + '</textarea>' +
        '<button style="background:#ff6b6b;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-top:16px;width:100%;" onclick="deleteNode()">Delete Node</button>';
      
      document.getElementById('prop-label').addEventListener('input', (e) => {
        node.label = e.target.value;
        render();
      });
      
      document.getElementById('prop-config').addEventListener('input', (e) => {
        try { node.config = JSON.parse(e.target.value); } catch(ex) {}
      });
    }
    
    function deleteNode() {
      nodes = nodes.filter(n => n.id !== selectedNode);
      edges = edges.filter(e => e.from !== selectedNode && e.to !== selectedNode);
      selectedNode = null;
      render();
      document.getElementById('properties').innerHTML = '<h3>Properties</h3><p style="color:#666;font-size:13px;">Select a node to edit</p>';
    }
    
    function clearCanvas() {
      nodes = [];
      edges = [];
      selectedNode = null;
      render();
    }
    
    function exportWorkflow() {
      const data = { name: 'workflow', nodes, edges };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'workflow.json';
      a.click();
    }
    
    async function generateSkill() {
      const data = { name: 'workflow', nodes, edges };
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.ok) {
        alert('Generated: ' + result.path);
      }
    }
  </script>
</body>
</html>`;
}

program.parse();
