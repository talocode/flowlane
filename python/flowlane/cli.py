import argparse
import json
import os
import sys
from pathlib import Path

def cmd_init(args):
    flowdir = Path.cwd() / '.flowlane'
    flowdir.mkdir(exist_ok=True)
    
    workflow = {
        'name': 'my-workflow',
        'nodes': [],
        'edges': [],
        'created': __import__('datetime').datetime.now().isoformat()
    }
    
    (flowdir / 'workflow.json').write_text(json.dumps(workflow, indent=2))
    (Path.cwd() / 'skills').mkdir(exist_ok=True)
    
    print('FlowLane project initialized')
    print('Run `flowlane dev` to start the visual builder')

def cmd_build(args):
    workflow_path = Path.cwd() / '.flowlane' / 'workflow.json'
    if not workflow_path.exists():
        print('No workflow found. Run `flowlane init` first.')
        return
    
    workflow = json.loads(workflow_path.read_text())
    skill = generate_skill(workflow)
    
    skills_dir = Path.cwd() / 'skills'
    skills_dir.mkdir(exist_ok=True)
    
    skill_path = skills_dir / f"{workflow.get('name', 'workflow')}.md"
    skill_path.write_text(skill)
    
    print(f'Generated: {skill_path}')

def generate_skill(workflow):
    lines = [
        '---',
        f"name: {workflow.get('name', 'workflow')}",
        'description: Auto-generated from FlowLane visual builder',
        'steps:',
    ]
    
    for node in workflow.get('nodes', []):
        label = node.get('label', node.get('type', 'step'))
        lines.append(f"  - {node['type']}: {label}")
    
    lines.append('---')
    lines.append('')
    lines.append(f"# {workflow.get('name', 'Workflow')}")
    lines.append('')
    
    for i, node in enumerate(workflow.get('nodes', []), 1):
        lines.append(f"## Step {i}: {node.get('label', node['type'])}")
        lines.append('')
        lines.append(f"- Type: {node['type']}")
        for k, v in node.get('config', {}).items():
            lines.append(f"- {k}: {v}")
        lines.append('')
    
    return '\n'.join(lines)

def cmd_dev(args):
    import http.server
    import socketserver
    
    PORT = args.port
    
    class Handler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(get_builder_html().encode())
            else:
                self.send_response(404)
                self.end_headers()
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"FlowLane builder running at http://localhost:{PORT}")
        httpd.serve_forever()

def get_builder_html():
    return '''<!DOCTYPE html>
<html><head><title>FlowLane</title>
<style>body{margin:0;background:#171718;color:#fff;font-family:sans-serif;}</style>
</head><body>
<h1 style="color:#ffd166;padding:20px;">FlowLane — Visual AI Workflow Builder</h1>
<p style="padding:0 20px;color:#888;">Drag and drop nodes to build AI workflows</p>
</body></html>'''

def main():
    parser = argparse.ArgumentParser(description='FlowLane — Visual AI workflow builder')
    sub = parser.add_subparsers(dest='command')
    
    sub.add_parser('init', help='Initialize a new project')
    
    dev = sub.add_parser('dev', help='Start visual builder')
    dev.add_argument('-p', '--port', type=int, default=3000)
    
    sub.add_parser('build', help='Build workflow into SKILL.md')
    
    args = parser.parse_args()
    
    if args.command == 'init':
        cmd_init(args)
    elif args.command == 'dev':
        cmd_dev(args)
    elif args.command == 'build':
        cmd_build(args)
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
