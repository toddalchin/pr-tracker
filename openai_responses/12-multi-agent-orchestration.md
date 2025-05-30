# Multi-Agent Orchestration

Comprehensive guide for building, coordinating, and managing multiple AI agents working together in complex systems.

## Overview

Multi-agent orchestration involves coordinating multiple AI agents to work together on complex tasks that require:
- **Task decomposition** - Breaking complex problems into manageable parts
- **Agent coordination** - Managing communication and dependencies
- **Resource management** - Optimizing tool and API usage
- **State synchronization** - Maintaining consistency across agents
- **Conflict resolution** - Handling competing objectives

## Core Orchestration Patterns

### 1. Sequential Pipeline Pattern

Agents work in sequence, each building on the previous agent's output.

```javascript
class SequentialOrchestrator {
  constructor(openai) {
    this.openai = openai;
    this.pipeline = [];
  }

  addAgent(agentConfig) {
    this.pipeline.push({
      id: agentConfig.id,
      instructions: agentConfig.instructions,
      tools: agentConfig.tools || [],
      outputProcessor: agentConfig.outputProcessor
    });
  }

  async execute(initialInput) {
    let currentInput = initialInput;
    const results = [];

    for (let i = 0; i < this.pipeline.length; i++) {
      const agent = this.pipeline[i];
      console.log(`Executing agent ${i + 1}: ${agent.id}`);

      try {
        const response = await this.openai.responses.create({
          model: "gpt-4o",
          input: this.formatInput(agent.instructions, currentInput),
          tools: agent.tools
        });

        const result = {
          agentId: agent.id,
          step: i + 1,
          input: currentInput,
          output: response.output_text,
          timestamp: new Date()
        };

        results.push(result);

        // Process output for next agent
        currentInput = agent.outputProcessor 
          ? agent.outputProcessor(response.output_text, currentInput)
          : response.output_text;

      } catch (error) {
        console.error(`Agent ${agent.id} failed:`, error);
        throw new Error(`Pipeline failed at step ${i + 1}: ${error.message}`);
      }
    }

    return results;
  }

  formatInput(instructions, input) {
    return `${instructions}\n\nInput: ${input}`;
  }
}

// Usage example
const orchestrator = new SequentialOrchestrator(openai);

orchestrator.addAgent({
  id: "researcher",
  instructions: "Research the given topic and provide key facts",
  tools: [{ type: "web_search" }],
  outputProcessor: (output) => `Research findings: ${output}`
});

orchestrator.addAgent({
  id: "analyzer",
  instructions: "Analyze the research findings and identify trends",
  outputProcessor: (output) => `Analysis: ${output}`
});

orchestrator.addAgent({
  id: "writer",
  instructions: "Write a comprehensive report based on the analysis"
});

const results = await orchestrator.execute("Artificial Intelligence trends in 2024");
```

### 2. Parallel Execution Pattern

Multiple agents work simultaneously on different aspects of the same task.

```javascript
class ParallelOrchestrator {
  constructor(openai, maxConcurrency = 3) {
    this.openai = openai;
    this.maxConcurrency = maxConcurrency;
  }

  async executeParallel(tasks) {
    const results = [];
    const executing = [];

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Limit concurrency
      if (executing.length >= this.maxConcurrency) {
        const completed = await Promise.race(executing);
        results.push(completed);
        executing.splice(executing.indexOf(completed.promise), 1);
      }

      // Start new task
      const promise = this.executeAgent(task);
      executing.push({ promise, task });
    }

    // Wait for remaining tasks
    const remaining = await Promise.all(executing.map(e => e.promise));
    results.push(...remaining);

    return results;
  }

  async executeAgent(task) {
    const startTime = Date.now();
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: task.input,
        instructions: task.instructions,
        tools: task.tools || []
      });

      return {
        agentId: task.id,
        success: true,
        output: response.output_text,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        agentId: task.id,
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }
}

// Usage example
const parallelOrchestrator = new ParallelOrchestrator(openai);

const tasks = [
  {
    id: "market-research",
    input: "Research current market trends for electric vehicles",
    instructions: "Provide comprehensive market analysis",
    tools: [{ type: "web_search" }]
  },
  {
    id: "competitor-analysis",
    input: "Analyze top 5 EV manufacturers",
    instructions: "Compare features, pricing, and market share",
    tools: [{ type: "web_search" }]
  },
  {
    id: "technical-specs",
    input: "Research latest EV battery technologies",
    instructions: "Focus on range, charging speed, and costs",
    tools: [{ type: "web_search" }]
  }
];

const results = await parallelOrchestrator.executeParallel(tasks);
```

### 3. Event-Driven Pattern

Agents communicate through events and message passing.

```javascript
class EventDrivenOrchestrator {
  constructor(openai) {
    this.openai = openai;
    this.agents = new Map();
    this.eventBus = new EventEmitter();
    this.messageQueue = [];
  }

  registerAgent(agentConfig) {
    const agent = new EventAgent(this.openai, agentConfig, this.eventBus);
    this.agents.set(agentConfig.id, agent);
    
    // Subscribe to agent events
    agent.on('task-completed', (data) => {
      this.handleTaskCompleted(data);
    });
    
    agent.on('request-help', (data) => {
      this.handleHelpRequest(data);
    });
  }

  async startWorkflow(initialEvent) {
    this.eventBus.emit('workflow-started', initialEvent);
  }

  handleTaskCompleted(data) {
    console.log(`Agent ${data.agentId} completed task: ${data.taskId}`);
    
    // Trigger dependent tasks
    if (data.nextActions) {
      data.nextActions.forEach(action => {
        this.eventBus.emit(action.event, action.data);
      });
    }
  }

  handleHelpRequest(data) {
    console.log(`Agent ${data.requesterId} needs help with: ${data.task}`);
    
    // Find appropriate helper agent
    const helperAgent = this.findHelperAgent(data.requiredCapabilities);
    if (helperAgent) {
      helperAgent.handleHelpRequest(data);
    }
  }

  findHelperAgent(capabilities) {
    for (const [id, agent] of this.agents) {
      if (capabilities.every(cap => agent.capabilities.includes(cap))) {
        return agent;
      }
    }
    return null;
  }
}

class EventAgent extends EventEmitter {
  constructor(openai, config, eventBus) {
    super();
    this.openai = openai;
    this.id = config.id;
    this.instructions = config.instructions;
    this.tools = config.tools || [];
    this.capabilities = config.capabilities || [];
    this.eventBus = eventBus;
    
    // Subscribe to relevant events
    config.subscribeTo?.forEach(event => {
      this.eventBus.on(event, (data) => this.handleEvent(event, data));
    });
  }

  async handleEvent(eventType, data) {
    console.log(`Agent ${this.id} handling event: ${eventType}`);
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: this.formatEventInput(eventType, data),
        instructions: this.instructions,
        tools: this.tools
      });

      const result = this.parseResponse(response.output_text);
      
      this.emit('task-completed', {
        agentId: this.id,
        eventType,
        result,
        nextActions: result.nextActions
      });

    } catch (error) {
      this.emit('task-failed', {
        agentId: this.id,
        eventType,
        error: error.message
      });
    }
  }

  formatEventInput(eventType, data) {
    return `Event: ${eventType}\nData: ${JSON.stringify(data)}`;
  }

  parseResponse(response) {
    // Parse response to extract results and next actions
    try {
      return JSON.parse(response);
    } catch {
      return { result: response, nextActions: [] };
    }
  }
}
```

### 4. Hierarchical Pattern

Supervisor agents manage subordinate agents in a tree structure.

```javascript
class HierarchicalOrchestrator {
  constructor(openai) {
    this.openai = openai;
    this.supervisors = new Map();
    this.workers = new Map();
  }

  createSupervisor(config) {
    const supervisor = new SupervisorAgent(this.openai, config);
    this.supervisors.set(config.id, supervisor);
    return supervisor;
  }

  createWorker(config, supervisorId) {
    const worker = new WorkerAgent(this.openai, config);
    this.workers.set(config.id, worker);
    
    const supervisor = this.supervisors.get(supervisorId);
    if (supervisor) {
      supervisor.addWorker(worker);
    }
    
    return worker;
  }

  async executeHierarchicalTask(task, supervisorId) {
    const supervisor = this.supervisors.get(supervisorId);
    if (!supervisor) {
      throw new Error(`Supervisor ${supervisorId} not found`);
    }
    
    return await supervisor.delegateTask(task);
  }
}

class SupervisorAgent {
  constructor(openai, config) {
    this.openai = openai;
    this.id = config.id;
    this.instructions = config.instructions;
    this.workers = [];
    this.taskHistory = [];
  }

  addWorker(worker) {
    this.workers.push(worker);
  }

  async delegateTask(task) {
    // Analyze task and create delegation plan
    const plan = await this.createDelegationPlan(task);
    
    const results = [];
    for (const subtask of plan.subtasks) {
      const worker = this.selectWorker(subtask.requiredCapabilities);
      
      if (!worker) {
        throw new Error(`No suitable worker for capabilities: ${subtask.requiredCapabilities}`);
      }
      
      const result = await worker.executeSubtask(subtask);
      results.push(result);
    }
    
    // Compile final result
    return await this.compileResults(results, task);
  }

  async createDelegationPlan(task) {
    const response = await this.openai.responses.create({
      model: "gpt-4o",
      input: `Break down this task into subtasks: ${task}`,
      instructions: this.instructions
    });
    
    return this.parsePlan(response.output_text);
  }

  selectWorker(requiredCapabilities) {
    return this.workers.find(worker => 
      requiredCapabilities.every(cap => worker.capabilities.includes(cap))
    );
  }

  async compileResults(results, originalTask) {
    const response = await this.openai.responses.create({
      model: "gpt-4o",
      input: `Compile these results into a final answer for: ${originalTask}\n\nResults: ${JSON.stringify(results)}`,
      instructions: "Create a comprehensive final result"
    });
    
    return {
      task: originalTask,
      subtaskResults: results,
      finalResult: response.output_text,
      supervisor: this.id,
      timestamp: new Date()
    };
  }

  parsePlan(planText) {
    // Parse the delegation plan from text
    // This would need more sophisticated parsing in practice
    return {
      subtasks: [
        {
          description: planText,
          requiredCapabilities: ["general"]
        }
      ]
    };
  }
}

class WorkerAgent {
  constructor(openai, config) {
    this.openai = openai;
    this.id = config.id;
    this.instructions = config.instructions;
    this.capabilities = config.capabilities || [];
    this.tools = config.tools || [];
  }

  async executeSubtask(subtask) {
    const response = await this.openai.responses.create({
      model: "gpt-4o",
      input: subtask.description,
      instructions: this.instructions,
      tools: this.tools
    });
    
    return {
      workerId: this.id,
      subtask: subtask.description,
      result: response.output_text,
      capabilities: this.capabilities,
      timestamp: new Date()
    };
  }
}
```

## Advanced Coordination Patterns

### State Synchronization

```javascript
class SharedStateManager {
  constructor() {
    this.state = new Map();
    this.subscribers = new Map();
    this.locks = new Map();
  }

  async setState(key, value, agentId) {
    // Acquire lock
    await this.acquireLock(key, agentId);
    
    try {
      const oldValue = this.state.get(key);
      this.state.set(key, {
        value,
        updatedBy: agentId,
        timestamp: new Date()
      });
      
      // Notify subscribers
      this.notifySubscribers(key, value, oldValue, agentId);
      
    } finally {
      this.releaseLock(key, agentId);
    }
  }

  async getState(key) {
    const stateEntry = this.state.get(key);
    return stateEntry ? stateEntry.value : null;
  }

  subscribe(key, agentId, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Map());
    }
    this.subscribers.get(key).set(agentId, callback);
  }

  async acquireLock(key, agentId) {
    while (this.locks.has(key) && this.locks.get(key) !== agentId) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locks.set(key, agentId);
  }

  releaseLock(key, agentId) {
    if (this.locks.get(key) === agentId) {
      this.locks.delete(key);
    }
  }

  notifySubscribers(key, newValue, oldValue, updatedBy) {
    const keySubscribers = this.subscribers.get(key);
    if (keySubscribers) {
      keySubscribers.forEach((callback, agentId) => {
        if (agentId !== updatedBy) {
          callback(newValue, oldValue, updatedBy);
        }
      });
    }
  }
}

class StatefulAgent {
  constructor(openai, config, stateManager) {
    this.openai = openai;
    this.id = config.id;
    this.stateManager = stateManager;
    this.subscribedKeys = config.subscribedKeys || [];
    
    // Subscribe to state changes
    this.subscribedKeys.forEach(key => {
      this.stateManager.subscribe(key, this.id, (newValue, oldValue, updatedBy) => {
        this.handleStateChange(key, newValue, oldValue, updatedBy);
      });
    });
  }

  async updateSharedState(key, value) {
    await this.stateManager.setState(key, value, this.id);
  }

  async getSharedState(key) {
    return await this.stateManager.getState(key);
  }

  handleStateChange(key, newValue, oldValue, updatedBy) {
    console.log(`Agent ${this.id} notified of state change: ${key} = ${newValue} (updated by ${updatedBy})`);
  }
}
```

### Load Balancing and Resource Management

```javascript
class LoadBalancedOrchestrator {
  constructor(openai) {
    this.openai = openai;
    this.agents = [];
    this.taskQueue = [];
    this.activeJobs = new Map();
    this.metrics = new Map();
  }

  addAgent(agentConfig) {
    const agent = {
      id: agentConfig.id,
      capabilities: agentConfig.capabilities,
      maxConcurrency: agentConfig.maxConcurrency || 1,
      currentLoad: 0,
      totalProcessed: 0,
      averageResponseTime: 0
    };
    
    this.agents.push(agent);
    this.metrics.set(agent.id, {
      successRate: 1.0,
      averageResponseTime: 0,
      totalTasks: 0
    });
  }

  async submitTask(task) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({
        ...task,
        resolve,
        reject,
        submittedAt: Date.now()
      });
      
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableAgent = this.findBestAgent();
    if (!availableAgent) return; // No agents available
    
    const task = this.taskQueue.shift();
    await this.executeTask(task, availableAgent);
  }

  findBestAgent() {
    // Find agent with lowest load that has required capabilities
    return this.agents
      .filter(agent => agent.currentLoad < agent.maxConcurrency)
      .sort((a, b) => {
        const aScore = this.calculateAgentScore(a);
        const bScore = this.calculateAgentScore(b);
        return bScore - aScore; // Higher score is better
      })[0];
  }

  calculateAgentScore(agent) {
    const metrics = this.metrics.get(agent.id);
    const loadFactor = 1 - (agent.currentLoad / agent.maxConcurrency);
    const performanceFactor = metrics.successRate;
    const responsivenessFactor = 1 / (metrics.averageResponseTime + 1);
    
    return loadFactor * 0.4 + performanceFactor * 0.4 + responsivenessFactor * 0.2;
  }

  async executeTask(task, agent) {
    const startTime = Date.now();
    agent.currentLoad++;
    
    const jobId = `${agent.id}-${Date.now()}`;
    this.activeJobs.set(jobId, { task, agent, startTime });
    
    try {
      const response = await this.openai.responses.create({
        model: "gpt-4o",
        input: task.input,
        instructions: task.instructions || agent.defaultInstructions,
        tools: task.tools || []
      });
      
      const executionTime = Date.now() - startTime;
      this.updateMetrics(agent.id, true, executionTime);
      
      task.resolve({
        result: response.output_text,
        agentId: agent.id,
        executionTime
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(agent.id, false, executionTime);
      
      task.reject(error);
      
    } finally {
      agent.currentLoad--;
      this.activeJobs.delete(jobId);
      
      // Process next task in queue
      setTimeout(() => this.processQueue(), 0);
    }
  }

  updateMetrics(agentId, success, executionTime) {
    const metrics = this.metrics.get(agentId);
    
    const totalTasks = metrics.totalTasks + 1;
    const successfulTasks = success ? 
      Math.floor(metrics.successRate * metrics.totalTasks) + 1 :
      Math.floor(metrics.successRate * metrics.totalTasks);
    
    metrics.successRate = successfulTasks / totalTasks;
    metrics.averageResponseTime = (
      metrics.averageResponseTime * metrics.totalTasks + executionTime
    ) / totalTasks;
    metrics.totalTasks = totalTasks;
  }

  getSystemMetrics() {
    return {
      totalAgents: this.agents.length,
      queueLength: this.taskQueue.length,
      activeJobs: this.activeJobs.size,
      agentMetrics: Array.from(this.metrics.entries()).map(([id, metrics]) => ({
        agentId: id,
        ...metrics,
        currentLoad: this.agents.find(a => a.id === id)?.currentLoad || 0
      }))
    };
  }
}
```

## Production Implementation Examples

### Enterprise Multi-Agent System

```javascript
class EnterpriseAgentOrchestrator {
  constructor(config) {
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.stateManager = new SharedStateManager();
    this.loadBalancer = new LoadBalancedOrchestrator(this.openai);
    this.healthChecker = new AgentHealthChecker();
    this.logger = new AgentLogger(config.logLevel);
    
    this.setupAgents(config.agents);
    this.startHealthChecking();
  }

  setupAgents(agentConfigs) {
    agentConfigs.forEach(config => {
      this.loadBalancer.addAgent(config);
      this.healthChecker.registerAgent(config.id, config.healthEndpoint);
    });
  }

  async executeBusinessProcess(processDefinition) {
    const processId = this.generateProcessId();
    this.logger.info(`Starting business process: ${processId}`);
    
    try {
      await this.stateManager.setState(`process-${processId}`, {
        status: 'running',
        startTime: new Date()
      }, 'orchestrator');
      
      const results = [];
      
      for (const step of processDefinition.steps) {
        const result = await this.executeProcessStep(step, processId);
        results.push(result);
        
        if (step.conditions && !this.evaluateConditions(step.conditions, result)) {
          throw new Error(`Process condition failed at step: ${step.id}`);
        }
      }
      
      await this.stateManager.setState(`process-${processId}`, {
        status: 'completed',
        results,
        endTime: new Date()
      }, 'orchestrator');
      
      return { processId, results };
      
    } catch (error) {
      await this.stateManager.setState(`process-${processId}`, {
        status: 'failed',
        error: error.message,
        endTime: new Date()
      }, 'orchestrator');
      
      throw error;
    }
  }

  async executeProcessStep(step, processId) {
    this.logger.info(`Executing step: ${step.id} for process: ${processId}`);
    
    return await this.loadBalancer.submitTask({
      input: step.input,
      instructions: step.instructions,
      tools: step.tools,
      metadata: {
        processId,
        stepId: step.id
      }
    });
  }

  evaluateConditions(conditions, result) {
    // Implement condition evaluation logic
    return true;
  }

  generateProcessId() {
    return `proc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  startHealthChecking() {
    setInterval(() => {
      this.healthChecker.checkAllAgents();
    }, 30000); // Check every 30 seconds
  }
}

class AgentHealthChecker {
  constructor() {
    this.agents = new Map();
    this.healthStatus = new Map();
  }

  registerAgent(agentId, healthEndpoint) {
    this.agents.set(agentId, { healthEndpoint });
    this.healthStatus.set(agentId, { status: 'unknown', lastCheck: null });
  }

  async checkAllAgents() {
    const checks = Array.from(this.agents.keys()).map(id => this.checkAgent(id));
    await Promise.allSettled(checks);
  }

  async checkAgent(agentId) {
    try {
      // Simplified health check - in practice, this would ping the agent
      const isHealthy = Math.random() > 0.1; // 90% uptime simulation
      
      this.healthStatus.set(agentId, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date()
      });
      
    } catch (error) {
      this.healthStatus.set(agentId, {
        status: 'error',
        lastCheck: new Date(),
        error: error.message
      });
    }
  }

  getHealthStatus(agentId) {
    return this.healthStatus.get(agentId);
  }

  getAllHealthStatus() {
    return Array.from(this.healthStatus.entries()).map(([id, status]) => ({
      agentId: id,
      ...status
    }));
  }
}

class AgentLogger {
  constructor(logLevel = 'info') {
    this.logLevel = logLevel;
  }

  info(message) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  error(message, error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
  }

  debug(message) {
    if (this.logLevel === 'debug') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }
}
```

## Integration Examples

### With Microservices Architecture

```javascript
// Agent service
class AgentService {
  constructor(config) {
    this.orchestrator = new EnterpriseAgentOrchestrator(config);
    this.app = express();
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/api/execute', async (req, res) => {
      try {
        const result = await this.orchestrator.executeBusinessProcess(req.body.process);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/health', (req, res) => {
      const health = this.orchestrator.healthChecker.getAllHealthStatus();
      res.json({ agents: health, system: 'healthy' });
    });

    this.app.get('/api/metrics', (req, res) => {
      const metrics = this.orchestrator.loadBalancer.getSystemMetrics();
      res.json(metrics);
    });
  }

  start(port = 3000) {
    this.app.listen(port, () => {
      console.log(`Agent service running on port ${port}`);
    });
  }
}
```

---

*Next: [13-production-deployment.md](13-production-deployment.md) - Scaling and monitoring in production* 