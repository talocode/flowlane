/**
 * Dynamic Workflow Patterns for FlowLane
 * 
 * Implements advanced agent orchestration patterns:
 * - LLM Council: Multiple models evaluate same task
 * - Dynamic Agent Routing: Route to best agent based on task type
 * - Judge/Executor: One agent reviews, another implements
 * - Cost-Based Routing: Choose model based on cost/quality tradeoff
 */

const crypto = require('crypto');

// Agent/Model registry with capabilities and costs
const AGENTS = {
  'claude-opus': {
    name: 'Claude Opus',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
    costPer1kTokens: 0.075,
    quality: 'highest',
    latency: 'high',
  },
  'claude-sonnet': {
    name: 'Claude Sonnet',
    capabilities: ['reasoning', 'coding', 'analysis'],
    costPer1kTokens: 0.015,
    quality: 'high',
    latency: 'medium',
  },
  'claude-haiku': {
    name: 'Claude Haiku',
    capabilities: ['simple-tasks', 'formatting', 'extraction'],
    costPer1kTokens: 0.00125,
    quality: 'good',
    latency: 'low',
  },
  'gpt-4o': {
    name: 'GPT-4o',
    capabilities: ['reasoning', 'coding', 'analysis', 'vision'],
    costPer1kTokens: 0.01,
    quality: 'high',
    latency: 'medium',
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    capabilities: ['simple-tasks', 'formatting', 'extraction'],
    costPer1kTokens: 0.00015,
    quality: 'good',
    latency: 'low',
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    capabilities: ['reasoning', 'coding', 'analysis', 'long-context'],
    costPer1kTokens: 0.00125,
    quality: 'high',
    latency: 'medium',
  },
};

// Task type detection patterns
const TASK_PATTERNS = {
  'code-review': [
    /review.*code/i,
    /check.*pr/i,
    /audit/i,
    /security.*review/i,
    /code.*quality/i,
  ],
  'code-generation': [
    /write.*code/i,
    /implement/i,
    /create.*function/i,
    /build.*api/i,
    /generate.*code/i,
  ],
  'analysis': [
    /analyze/i,
    /explain/i,
    /summarize/i,
    /compare/i,
    /evaluate/i,
  ],
  'creative': [
    /write.*blog/i,
    /draft.*email/i,
    /create.*content/i,
    /creative/i,
    /brainstorm/i,
  ],
  'extraction': [
    /extract/i,
    /parse/i,
    /convert/i,
    /transform/i,
    /format/i,
  ],
};

/**
 * Detect task type from description
 */
function detectTaskType(description) {
  const lower = description.toLowerCase();
  
  for (const [type, patterns] of Object.entries(TASK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lower)) {
        return type;
      }
    }
  }
  
  return 'general';
}

/**
 * Select best agent for task based on type and constraints
 */
function selectAgent(taskType, constraints = {}) {
  const { maxCost, maxLatency, requiredCapabilities = [] } = constraints;
  
  const candidates = Object.entries(AGENTS).filter(([id, agent]) => {
    // Check cost constraint
    if (maxCost && agent.costPer1kTokens > maxCost) return false;
    
    // Check latency constraint
    if (maxLatency) {
      const latencyOrder = { low: 0, medium: 1, high: 2 };
      if (latencyOrder[agent.latency] > latencyOrder[maxLatency]) return false;
    }
    
    // Check capabilities
    if (requiredCapabilities.length > 0) {
      const hasAll = requiredCapabilities.every(cap => 
        agent.capabilities.includes(cap)
      );
      if (!hasAll) return false;
    }
    
    return true;
  });
  
  if (candidates.length === 0) return null;
  
  // Score based on task type match
  const scored = candidates.map(([id, agent]) => {
    let score = 0;
    
    // Quality score
    const qualityScores = { highest: 4, high: 3, good: 2, fair: 1 };
    score += qualityScores[agent.quality] || 0;
    
    // Cost efficiency (lower is better)
    score += (1 - agent.costPer1kTokens / 0.1) * 2;
    
    // Task-specific bonuses
    if (taskType === 'code-review' && agent.capabilities.includes('reasoning')) {
      score += 2;
    }
    if (taskType === 'code-generation' && agent.capabilities.includes('coding')) {
      score += 2;
    }
    if (taskType === 'creative' && agent.capabilities.includes('creative')) {
      score += 2;
    }
    if (taskType === 'extraction' && agent.latency === 'low') {
      score += 1;
    }
    
    return { id, agent, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored[0].id;
}

/**
 * LLM Council Pattern
 * Multiple models evaluate the same task, results are aggregated
 */
function createCouncilWorkflow({ task, models = ['claude-sonnet', 'gpt-4o', 'gemini-pro'], aggregation = 'vote' }) {
  const id = `council_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  const nodes = [
    {
      id: 'input',
      type: 'input',
      label: 'Task Input',
      data: { task },
    },
    ...models.map((model, i) => ({
      id: `evaluator_${i}`,
      type: 'agent',
      label: `${AGENTS[model]?.name || model} Evaluator`,
      data: {
        model,
        prompt: `Evaluate the following task and provide your assessment:\n\n{{input}}`,
        role: 'evaluator',
      },
    })),
    {
      id: 'aggregator',
      type: 'aggregator',
      label: 'Result Aggregator',
      data: {
        method: aggregation,
        prompt: 'Combine the following evaluations into a single coherent response:\n\n{{evaluations}}',
      },
    },
    {
      id: 'output',
      type: 'output',
      label: 'Final Result',
    },
  ];
  
  const edges = [
    // Connect input to all evaluators
    ...models.map((_, i) => ({
      from: 'input',
      to: `evaluator_${i}`,
    })),
    // Connect all evaluators to aggregator
    ...models.map((_, i) => ({
      from: `evaluator_${i}`,
      to: 'aggregator',
    })),
    // Connect aggregator to output
    {
      from: 'aggregator',
      to: 'output',
    },
  ];
  
  return {
    id,
    name: `LLM Council: ${task.substring(0, 50)}`,
    type: 'council',
    nodes,
    edges,
    metadata: {
      models,
      aggregation,
      estimatedCost: estimateCouncilCost(task, models),
    },
  };
}

/**
 * Dynamic Router Pattern
 * Routes task to best agent based on task type
 */
function createRouterWorkflow({ task, constraints = {} }) {
  const id = `router_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const taskType = detectTaskType(task);
  const selectedAgent = selectAgent(taskType, constraints);
  
  const nodes = [
    {
      id: 'input',
      type: 'input',
      label: 'Task Input',
      data: { task },
    },
    {
      id: 'classifier',
      type: 'classifier',
      label: 'Task Classifier',
      data: {
        taskType,
        confidence: 0.85,
      },
    },
    {
      id: 'router',
      type: 'router',
      label: 'Dynamic Router',
      data: {
        taskType,
        selectedAgent,
        reason: `Task classified as "${taskType}", routing to ${AGENTS[selectedAgent]?.name || selectedAgent}`,
      },
    },
    {
      id: 'executor',
      type: 'agent',
      label: `${AGENTS[selectedAgent]?.name || selectedAgent} Executor`,
      data: {
        model: selectedAgent,
        prompt: '{{input}}',
        role: 'executor',
      },
    },
    {
      id: 'output',
      type: 'output',
      label: 'Result',
    },
  ];
  
  const edges = [
    { from: 'input', to: 'classifier' },
    { from: 'classifier', to: 'router' },
    { from: 'router', to: 'executor' },
    { from: 'executor', to: 'output' },
  ];
  
  return {
    id,
    name: `Router: ${task.substring(0, 50)}`,
    type: 'router',
    nodes,
    edges,
    metadata: {
      taskType,
      selectedAgent,
      estimatedCost: estimateExecutionCost(task, selectedAgent),
    },
  };
}

/**
 * Judge/Executor Pattern
 * One agent reviews, another implements based on feedback
 */
function createJudgeExecutorWorkflow({ task, judgeModel = 'claude-opus', executorModel = 'claude-sonnet', maxIterations = 3 }) {
  const id = `judge_executor_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  const nodes = [
    {
      id: 'input',
      type: 'input',
      label: 'Task Input',
      data: { task },
    },
    {
      id: 'executor',
      type: 'agent',
      label: `${AGENTS[executorModel]?.name || executorModel} Executor`,
      data: {
        model: executorModel,
        prompt: 'Implement the following task:\n\n{{input}}',
        role: 'executor',
      },
    },
    {
      id: 'judge',
      type: 'agent',
      label: `${AGENTS[judgeModel]?.name || judgeModel} Judge`,
      data: {
        model: judgeModel,
        prompt: 'Review the following implementation and provide feedback. If it needs changes, describe them clearly.\n\nOriginal task: {{input}}\n\nImplementation:\n{{execution}}',
        role: 'judge',
      },
    },
    {
      id: 'decision',
      type: 'decision',
      label: 'Approval Decision',
      data: {
        condition: 'judge_response contains "approved" or "LGTM"',
        trueBranch: 'output',
        falseBranch: 'executor',
      },
    },
    {
      id: 'output',
      type: 'output',
      label: 'Final Result',
    },
  ];
  
  const edges = [
    { from: 'input', to: 'executor' },
    { from: 'executor', to: 'judge' },
    { from: 'judge', to: 'decision' },
    { from: 'decision', to: 'output', condition: 'approved' },
    { from: 'decision', to: 'executor', condition: 'needs-changes' },
  ];
  
  return {
    id,
    name: `Judge/Executor: ${task.substring(0, 50)}`,
    type: 'judge-executor',
    nodes,
    edges,
    metadata: {
      judgeModel,
      executorModel,
      maxIterations,
      estimatedCost: estimateJudgeExecutorCost(task, judgeModel, executorModel, maxIterations),
    },
  };
}

/**
 * Cost-Based Router Pattern
 * Routes to cheapest model that meets quality threshold
 */
function createCostRouterWorkflow({ task, qualityThreshold = 'high', maxBudget = 0.10 }) {
  const id = `cost_router_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  // Find cheapest model meeting quality threshold
  const qualityOrder = { highest: 4, high: 3, good: 2, fair: 1 };
  const minQuality = qualityOrder[qualityThreshold] || 3;
  
  const candidates = Object.entries(AGENTS)
    .filter(([_, agent]) => qualityOrder[agent.quality] >= minQuality)
    .sort((a, b) => a[1].costPer1kTokens - b[1].costPer1kTokens);
  
  const selectedModel = candidates[0]?.[0] || 'claude-haiku';
  const estimatedTokens = estimateTokens(task);
  const estimatedCost = estimatedTokens * AGENTS[selectedModel].costPer1kTokens / 1000;
  
  const nodes = [
    {
      id: 'input',
      type: 'input',
      label: 'Task Input',
      data: { task },
    },
    {
      id: 'cost-analyzer',
      type: 'analyzer',
      label: 'Cost Analyzer',
      data: {
        estimatedTokens,
        budget: maxBudget,
        qualityThreshold,
      },
    },
    {
      id: 'cost-router',
      type: 'router',
      label: 'Cost-Based Router',
      data: {
        selectedModel,
        reason: `Cheapest model meeting "${qualityThreshold}" quality: ${AGENTS[selectedModel].name} ($${estimatedCost.toFixed(4)})`,
        alternatives: candidates.slice(1, 4).map(([id, agent]) => ({
          id,
          name: agent.name,
          cost: (estimatedTokens * agent.costPer1kTokens / 1000).toFixed(4),
        })),
      },
    },
    {
      id: 'executor',
      type: 'agent',
      label: `${AGENTS[selectedModel].name} Executor`,
      data: {
        model: selectedModel,
        prompt: '{{input}}',
      },
    },
    {
      id: 'output',
      type: 'output',
      label: 'Result',
    },
  ];
  
  const edges = [
    { from: 'input', to: 'cost-analyzer' },
    { from: 'cost-analyzer', to: 'cost-router' },
    { from: 'cost-router', to: 'executor' },
    { from: 'executor', to: 'output' },
  ];
  
  return {
    id,
    name: `Cost Router: ${task.substring(0, 50)}`,
    type: 'cost-router',
    nodes,
    edges,
    metadata: {
      selectedModel,
      estimatedTokens,
      estimatedCost,
      qualityThreshold,
      maxBudget,
    },
  };
}

// Helper functions
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function estimateCouncilCost(task, models) {
  const tokens = estimateTokens(task);
  return models.reduce((sum, model) => {
    const agent = AGENTS[model];
    return sum + (tokens * agent.costPer1kTokens / 1000);
  }, 0);
}

function estimateExecutionCost(task, model) {
  const tokens = estimateTokens(task);
  const agent = AGENTS[model];
  return tokens * agent.costPer1kTokens / 1000;
}

function estimateJudgeExecutorCost(task, judgeModel, executorModel, maxIterations) {
  const tokens = estimateTokens(task);
  const judgeAgent = AGENTS[judgeModel];
  const executorAgent = AGENTS[executorModel];
  
  // Assume 2 iterations on average
  const avgIterations = Math.min(2, maxIterations);
  const executorCost = tokens * executorAgent.costPer1kTokens / 1000 * avgIterations;
  const judgeCost = tokens * judgeAgent.costPer1kTokens / 1000 * avgIterations;
  
  return executorCost + judgeCost;
}

module.exports = {
  AGENTS,
  TASK_PATTERNS,
  detectTaskType,
  selectAgent,
  createCouncilWorkflow,
  createRouterWorkflow,
  createJudgeExecutorWorkflow,
  createCostRouterWorkflow,
  estimateTokens,
};
