const crypto = require('crypto');

class FlowLane {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://api.talocode.site';
    this.apiKey = options.apiKey || process.env.TALOCODE_API_KEY;
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    return response.json();
  }

  async createWorkflow({ name, nodes = [], edges = [] }) {
    return this.request('/v1/flowlane/workflows', {
      method: 'POST',
      body: JSON.stringify({ name, nodes, edges }),
    });
  }

  async generateSkill({ workflow, format = 'claude' }) {
    return this.request('/v1/flowlane/generate', {
      method: 'POST',
      body: JSON.stringify({ workflow, format }),
    });
  }

  async validateWorkflow(workflow) {
    return this.request('/v1/flowlane/validate', {
      method: 'POST',
      body: JSON.stringify(workflow),
    });
  }

  async listTemplates() {
    return this.request('/v1/flowlane/templates');
  }

  async health() {
    return this.request('/v1/flowlane/health');
  }
}

module.exports = { FlowLane };
