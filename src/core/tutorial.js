/**
 * Tutorial — Interactive onboarding for FlowLane
 * 
 * Step-by-step guide teaching users how to use dynamic workflows.
 */

const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const steps = [
  {
    title: 'Welcome to FlowLane',
    description: 'FlowLane is a visual AI workflow builder with dynamic agent routing.\nIt automatically routes tasks to the best AI model based on task type.',
    tip: 'Think of it as a "traffic controller" for your AI agents.',
  },
  {
    title: 'Step 1: Initialize',
    description: 'First, initialize a FlowLane project.',
    command: 'flowlane init',
    tip: 'This creates .flowlane/ directory with a workflow.json.',
  },
  {
    title: 'Step 2: List Available Agents',
    description: 'See which AI agents are available.',
    command: 'flowlane dynamic agents',
    tip: 'Each agent has different capabilities, costs, and latency.',
  },
  {
    title: 'Step 3: Detect Task Type',
    description: 'Let FlowLane detect the best agent for your task.',
    command: 'flowlane dynamic detect "Review this code for security vulnerabilities"',
    example: '# Try other tasks:\n# flowlane dynamic detect "Write a blog post about AI"\n# flowlane dynamic detect "Extract data from CSV"\n# flowlane dynamic detect "Analyze this dataset"',
    tip: 'FlowLane matches task type to agent capabilities.',
  },
  {
    title: 'Step 4: Dynamic Router',
    description: 'Route a task to the best agent automatically.',
    command: 'flowlane dynamic router "Implement JWT authentication"',
    tip: 'The router selects the optimal agent based on task type.',
  },
  {
    title: 'Step 5: LLM Council',
    description: 'Have multiple models evaluate the same task.',
    command: 'flowlane dynamic council "Should we use microservices?"',
    example: '# Customize models:\n# flowlane dynamic council "Design decision" -m claude-opus gpt-4o gemini-pro',
    tip: 'Councils provide diverse perspectives on complex decisions.',
  },
  {
    title: 'Step 6: Judge/Executor',
    description: 'One agent reviews, another implements.',
    command: 'flowlane dynamic judge-executor "Add user registration endpoint"',
    example: '# Customize judge and executor:\n# flowlane dynamic judge-executor "task" --judge claude-opus --executor claude-sonnet',
    tip: 'The judge catches errors the executor might miss.',
  },
  {
    title: 'Step 7: Cost Router',
    description: 'Route to the cheapest model meeting quality threshold.',
    command: 'flowlane dynamic cost-router "Format this JSON" -q high -b 0.01',
    tip: 'Save money by using cheaper models for simple tasks.',
  },
  {
    title: 'Step 8: Visual Builder',
    description: 'Start the visual workflow builder.',
    command: 'flowlane dev',
    tip: 'Drag and drop nodes to create custom workflows.',
  },
  {
    title: 'You are ready!',
    description: 'You now know the basics of FlowLane.\n\nFor more information:\n- Run: flowlane --help\n- Docs: https://docs.talocode.site\n- GitHub: https://github.com/talocode/flowlane',
    tip: 'Combine patterns for complex multi-agent workflows!',
  },
];

async function startTutorial() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  clearScreen();
  printHeader();

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    printStep(i + 1, steps.length, step);

    if (i < steps.length - 1) {
      await waitForEnter(rl);
      clearScreen();
    }
  }

  rl.close();
}

function clearScreen() {
  process.stdout.write('\x1b[2J\x1b[0f');
}

function printHeader() {
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}║                          FlowLane Tutorial                                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log();
}

function printStep(current, total, step) {
  // Progress bar
  const progress = Math.floor((current / total) * 30);
  const filled = '█'.repeat(progress);
  const empty = '░'.repeat(30 - progress);
  
  console.log(`${colors.dim}Progress: ${colors.cyan}${filled}${colors.dim}${empty}${colors.reset} ${current}/${total}`);
  console.log();

  // Step title
  console.log(`${colors.bright}${colors.green}Step ${current}: ${step.title}${colors.reset}`);
  console.log();

  // Description
  console.log(step.description);
  console.log();

  // Command
  if (step.command) {
    console.log(`${colors.yellow}Run:${colors.reset}`);
    console.log(`  ${colors.cyan}${step.command}${colors.reset}`);
    console.log();
  }

  // Example
  if (step.example) {
    console.log(`${colors.yellow}Examples:${colors.reset}`);
    step.example.split('\n').forEach(line => {
      console.log(`  ${colors.dim}${line}${colors.reset}`);
    });
    console.log();
  }

  // Tip
  if (step.tip) {
    console.log(`${colors.magenta}💡 Tip: ${step.tip}${colors.reset}`);
    console.log();
  }

  // Footer
  console.log(`${colors.dim}Press Enter to continue...${colors.reset}`);
}

function waitForEnter(rl) {
  return new Promise((resolve) => {
    rl.question('', () => {
      resolve();
    });
  });
}

module.exports = { startTutorial };
