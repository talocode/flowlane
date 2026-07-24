const { FlowLane } = require('./sdk');
const { generateSkill, validateWorkflow, getTemplates } = require('./utils');
const {
  AGENTS,
  TASK_PATTERNS,
  detectTaskType,
  selectAgent,
  createCouncilWorkflow,
  createRouterWorkflow,
  createJudgeExecutorWorkflow,
  createCostRouterWorkflow,
  estimateTokens,
} = require('./dynamic-workflows');

module.exports = {
  FlowLane,
  generateSkill,
  validateWorkflow,
  getTemplates,
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
