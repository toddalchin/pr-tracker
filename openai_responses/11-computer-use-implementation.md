# Computer Use Implementation Guide

Complete guide for implementing and using OpenAI's Computer Use tool in multi-agent systems for desktop automation and computer control.

## Overview

The Computer Use tool enables AI agents to interact with computer interfaces through:
- **Screen capture** - Taking screenshots to see the current state
- **Mouse control** - Moving cursor, clicking, dragging
- **Keyboard input** - Typing text, sending key combinations
- **Window management** - Switching between applications

## Core Concepts

### Computer Use Flow
1. **Observe** - Take screenshot to see current screen
2. **Plan** - Determine what actions to take
3. **Act** - Execute mouse/keyboard commands
4. **Verify** - Take another screenshot to confirm results
5. **Iterate** - Repeat until task is complete

### Safety Mechanisms
- **Sandboxed environment** recommended for production
- **Permission controls** to limit accessible applications
- **Action logging** for audit trails
- **Timeout controls** to prevent infinite loops

## Basic Implementation

### Setting Up Computer Use

```javascript
import OpenAI from "openai";

const openai = new OpenAI();

// Create a response with computer use capability
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Please open a text editor and write 'Hello World'",
  tools: [
    {
      type: "computer_use",
      computer_use: {
        display_width_px: 1920,
        display_height_px: 1080,
        display_number: 0
      }
    }
  ]
});
```

### Basic Computer Automation

```javascript
class ComputerAutomation {
  constructor(openai, displayConfig = {}) {
    this.openai = openai;
    this.displayConfig = {
      display_width_px: 1920,
      display_height_px: 1080,
      display_number: 0,
      ...displayConfig
    };
  }

  async executeTask(instruction) {
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: instruction,
      tools: [
        {
          type: "computer_use",
          computer_use: this.displayConfig
        }
      ]
    });
  }

  async takeScreenshot() {
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: "Please take a screenshot of the current screen",
      tools: [
        {
          type: "computer_use",
          computer_use: this.displayConfig
        }
      ]
    });
  }
}
```

## Advanced Computer Use Patterns

### Multi-Step Task Automation

```javascript
class TaskOrchestrator {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
    this.taskHistory = [];
  }

  async executeMultiStepTask(steps) {
    const results = [];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`Executing step ${i + 1}: ${step.description}`);
      
      try {
        const result = await this.automation.executeTask(step.instruction);
        
        this.taskHistory.push({
          step: i + 1,
          description: step.description,
          instruction: step.instruction,
          result,
          timestamp: new Date(),
          success: true
        });
        
        results.push(result);
        
        // Optional delay between steps
        if (step.delay) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
        
      } catch (error) {
        console.error(`Step ${i + 1} failed:`, error);
        
        this.taskHistory.push({
          step: i + 1,
          description: step.description,
          error: error.message,
          timestamp: new Date(),
          success: false
        });
        
        if (step.required !== false) {
          throw error; // Stop execution if step is required
        }
      }
    }
    
    return results;
  }
}

// Usage example
const orchestrator = new TaskOrchestrator(openai, { 
  display_width_px: 1920, 
  display_height_px: 1080 
});

const documentProcessingSteps = [
  {
    description: "Open word processor",
    instruction: "Open Microsoft Word or a text editor",
    required: true
  },
  {
    description: "Create new document",
    instruction: "Create a new document",
    delay: 2000
  },
  {
    description: "Type document content",
    instruction: "Type the following text: 'This is an automated document created by AI'",
    delay: 1000
  },
  {
    description: "Save document",
    instruction: "Save the document as 'AI_Generated_Document.docx'",
    required: true
  }
];

await orchestrator.executeMultiStepTask(documentProcessingSteps);
```

### Application-Specific Agents

```javascript
class WebBrowserAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
  }

  async navigateToUrl(url) {
    return await this.automation.executeTask(
      `Open a web browser and navigate to ${url}`
    );
  }

  async fillForm(formData) {
    const instruction = `Fill out the form on the current page with the following data: ${JSON.stringify(formData)}`;
    return await this.automation.executeTask(instruction);
  }

  async extractData(selector) {
    return await this.automation.executeTask(
      `Extract text data from elements matching: ${selector}`
    );
  }

  async performWebTask(task) {
    return await this.automation.executeTask(
      `Perform the following web browsing task: ${task}`
    );
  }
}

class SpreadsheetAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
  }

  async openSpreadsheet(filePath) {
    return await this.automation.executeTask(
      `Open the spreadsheet file at: ${filePath}`
    );
  }

  async enterData(cellRange, data) {
    const instruction = `Enter the following data into cells ${cellRange}: ${JSON.stringify(data)}`;
    return await this.automation.executeTask(instruction);
  }

  async createChart(dataRange, chartType = "column") {
    return await this.automation.executeTask(
      `Create a ${chartType} chart using data from range ${dataRange}`
    );
  }

  async applyFormula(cell, formula) {
    return await this.automation.executeTask(
      `Apply the formula "${formula}" to cell ${cell}`
    );
  }
}
```

### Computer Vision Integration

```javascript
class VisualComputerAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
  }

  async findAndClick(elementDescription) {
    return await this.automation.executeTask(
      `Look for ${elementDescription} on the screen and click on it`
    );
  }

  async verifyScreenState(expectedState) {
    const screenshot = await this.automation.takeScreenshot();
    
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          type: "text",
          text: `Verify if the current screen shows: ${expectedState}`
        },
        {
          type: "image",
          image: screenshot.output[0].content[0].image_url.url
        }
      ]
    });
  }

  async waitForElement(elementDescription, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const found = await this.automation.executeTask(
        `Check if ${elementDescription} is visible on the screen`
      );
      
      // Check if element was found (this would need proper response parsing)
      if (this.elementFound(found)) {
        return found;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Element "${elementDescription}" not found within ${timeout}ms`);
  }

  elementFound(response) {
    // Parse response to determine if element was found
    // This would need to be implemented based on actual response structure
    return response.output_text?.toLowerCase().includes('found') || 
           response.output_text?.toLowerCase().includes('visible');
  }
}
```

## Error Handling and Recovery

### Robust Task Execution

```javascript
class RobustComputerAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  async executeWithRetry(instruction, retries = this.maxRetries) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.automation.executeTask(instruction);
        
        // Verify the action was successful
        const verification = await this.verifyAction(instruction, result);
        if (verification.success) {
          return result;
        }
        
        throw new Error(`Action verification failed: ${verification.reason}`);
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`Task failed after ${retries} attempts: ${error.message}`);
        }
        
        // Take screenshot to assess current state
        await this.automation.takeScreenshot();
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        
        // Optionally adjust instruction based on current state
        instruction = await this.adjustInstructionForRetry(instruction, error, attempt);
      }
    }
  }

  async verifyAction(instruction, result) {
    // Implement verification logic based on the instruction and expected outcome
    return { success: true, reason: null };
  }

  async adjustInstructionForRetry(originalInstruction, error, attempt) {
    // Modify instruction based on error and attempt number
    return `${originalInstruction} (Attempt ${attempt + 1}: ${error.message})`;
  }

  async recoverFromError(error, context) {
    console.log(`Attempting recovery from error: ${error.message}`);
    
    // Common recovery strategies
    if (error.message.includes('element not found')) {
      await this.automation.takeScreenshot();
      return await this.automation.executeTask("Press Alt+Tab to switch windows and try again");
    }
    
    if (error.message.includes('timeout')) {
      return await this.automation.executeTask("Press Escape and wait for the interface to respond");
    }
    
    // Generic recovery
    await this.automation.executeTask("Take a screenshot to assess the current state");
  }
}
```

### State Management

```javascript
class StatefulComputerAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
    this.state = {
      currentApplication: null,
      openWindows: [],
      lastAction: null,
      screenshots: []
    };
  }

  async updateState() {
    const screenshot = await this.automation.takeScreenshot();
    
    this.state.screenshots.push({
      timestamp: new Date(),
      data: screenshot
    });
    
    // Keep only last 10 screenshots
    if (this.state.screenshots.length > 10) {
      this.state.screenshots = this.state.screenshots.slice(-10);
    }
    
    // Analyze current state
    const stateAnalysis = await this.analyzeCurrentState(screenshot);
    this.state.currentApplication = stateAnalysis.activeApplication;
    this.state.openWindows = stateAnalysis.openWindows;
  }

  async analyzeCurrentState(screenshot) {
    const analysis = await this.openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          type: "text",
          text: "Analyze this screenshot and identify: 1) The currently active application, 2) All visible windows or applications"
        },
        {
          type: "image",
          image: screenshot.output[0].content[0].image_url.url
        }
      ]
    });
    
    return this.parseStateAnalysis(analysis.output_text);
  }

  parseStateAnalysis(analysisText) {
    // Parse the analysis text to extract state information
    // This would need to be implemented based on actual response format
    return {
      activeApplication: "Unknown",
      openWindows: []
    };
  }

  async executeWithStateTracking(instruction) {
    await this.updateState();
    
    const result = await this.automation.executeTask(instruction);
    
    this.state.lastAction = {
      instruction,
      result,
      timestamp: new Date()
    };
    
    await this.updateState();
    
    return result;
  }
}
```

## Production Implementation

### Secure Computer Use Environment

```javascript
class SecureComputerAgent {
  constructor(openai, securityConfig) {
    this.openai = openai;
    this.securityConfig = {
      allowedApplications: [],
      blockedPaths: [],
      restrictedActions: [],
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      ...securityConfig
    };
    this.sessionStart = Date.now();
  }

  async validateAction(instruction) {
    // Check session timeout
    if (Date.now() - this.sessionStart > this.securityConfig.sessionTimeout) {
      throw new Error("Session timeout exceeded");
    }

    // Check for restricted actions
    const lowerInstruction = instruction.toLowerCase();
    for (const restricted of this.securityConfig.restrictedActions) {
      if (lowerInstruction.includes(restricted.toLowerCase())) {
        throw new Error(`Restricted action detected: ${restricted}`);
      }
    }

    // Check for blocked paths
    for (const blockedPath of this.securityConfig.blockedPaths) {
      if (lowerInstruction.includes(blockedPath)) {
        throw new Error(`Access to blocked path: ${blockedPath}`);
      }
    }

    return true;
  }

  async executeSecureTask(instruction) {
    await this.validateAction(instruction);
    
    // Log the action
    console.log(`[SECURE] Executing: ${instruction}`);
    
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: instruction,
      tools: [
        {
          type: "computer_use",
          computer_use: {
            display_width_px: 1920,
            display_height_px: 1080,
            display_number: 0
          }
        }
      ]
    });
  }
}
```

### Performance Monitoring

```javascript
class MonitoredComputerAgent {
  constructor(openai, displayConfig) {
    this.automation = new ComputerAutomation(openai, displayConfig);
    this.metrics = {
      tasksExecuted: 0,
      successRate: 0,
      averageExecutionTime: 0,
      errors: []
    };
  }

  async executeWithMetrics(instruction) {
    const startTime = Date.now();
    
    try {
      const result = await this.automation.executeTask(instruction);
      
      const executionTime = Date.now() - startTime;
      this.updateMetrics(true, executionTime);
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.updateMetrics(false, executionTime, error);
      throw error;
    }
  }

  updateMetrics(success, executionTime, error = null) {
    this.metrics.tasksExecuted++;
    
    // Update success rate
    const previousSuccesses = Math.floor(this.metrics.successRate * (this.metrics.tasksExecuted - 1));
    const newSuccesses = previousSuccesses + (success ? 1 : 0);
    this.metrics.successRate = newSuccesses / this.metrics.tasksExecuted;
    
    // Update average execution time
    const previousTotal = this.metrics.averageExecutionTime * (this.metrics.tasksExecuted - 1);
    this.metrics.averageExecutionTime = (previousTotal + executionTime) / this.metrics.tasksExecuted;
    
    // Track errors
    if (error) {
      this.metrics.errors.push({
        message: error.message,
        timestamp: new Date(),
        executionTime
      });
      
      // Keep only last 100 errors
      if (this.metrics.errors.length > 100) {
        this.metrics.errors = this.metrics.errors.slice(-100);
      }
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      recentErrors: this.metrics.errors.slice(-10)
    };
  }
}
```

## Multi-Agent Computer Use

### Coordinated Desktop Automation

```javascript
class MultiAgentDesktopOrchestrator {
  constructor(openai, agentConfigs) {
    this.agents = agentConfigs.map(config => ({
      id: config.id,
      type: config.type,
      agent: new ComputerAutomation(openai, config.displayConfig),
      capabilities: config.capabilities
    }));
  }

  async distributeTask(task) {
    // Analyze task to determine which agents are needed
    const taskAnalysis = await this.analyzeTask(task);
    const requiredAgents = this.selectAgents(taskAnalysis);
    
    // Execute task steps across multiple agents
    const results = [];
    for (const step of taskAnalysis.steps) {
      const agent = this.findBestAgent(step, requiredAgents);
      const result = await agent.agent.executeTask(step.instruction);
      results.push({ agent: agent.id, step, result });
    }
    
    return results;
  }

  analyzeTask(task) {
    // Analyze task and break it down into steps
    // This would be implemented based on task complexity
    return {
      steps: [
        { instruction: task, capabilities: ['computer_use'] }
      ]
    };
  }

  selectAgents(taskAnalysis) {
    // Select agents based on required capabilities
    return this.agents.filter(agent => 
      taskAnalysis.steps.some(step => 
        step.capabilities.every(cap => agent.capabilities.includes(cap))
      )
    );
  }

  findBestAgent(step, availableAgents) {
    // Find the most suitable agent for this step
    return availableAgents.find(agent => 
      step.capabilities.every(cap => agent.capabilities.includes(cap))
    ) || availableAgents[0];
  }
}
```

## Integration Examples

### With Express.js API

```javascript
import express from 'express';

const app = express();
app.use(express.json());

const computerAgent = new RobustComputerAgent(openai, {
  display_width_px: 1920,
  display_height_px: 1080
});

app.post('/api/automate', async (req, res) => {
  try {
    const { task, options = {} } = req.body;
    
    const result = await computerAgent.executeWithRetry(task);
    
    res.json({
      success: true,
      result: result.output_text,
      metrics: computerAgent.getMetrics()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/screenshot', async (req, res) => {
  try {
    const screenshot = await computerAgent.automation.takeScreenshot();
    res.json({ screenshot });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### With Queue Processing

```javascript
import Bull from 'bull';

const automationQueue = new Bull('computer automation', {
  redis: { port: 6379, host: '127.0.0.1' }
});

automationQueue.process(async (job) => {
  const { task, agentId } = job.data;
  
  const agent = getAgentById(agentId);
  const result = await agent.executeWithRetry(task);
  
  return {
    result: result.output_text,
    timestamp: new Date(),
    agentId
  };
});

// Add job to queue
async function scheduleAutomation(task, agentId) {
  return await automationQueue.add({
    task,
    agentId
  }, {
    attempts: 3,
    backoff: 'exponential'
  });
}
```

## Best Practices

### 1. Safety First
- Always run in sandboxed environments
- Implement proper permission controls
- Log all actions for audit trails
- Set reasonable timeouts

### 2. Error Handling
- Implement retry mechanisms
- Take screenshots for debugging
- Have recovery strategies
- Graceful degradation

### 3. Performance
- Cache common operations
- Optimize screenshot frequency
- Use appropriate delays
- Monitor resource usage

### 4. Security
- Validate all instructions
- Restrict file system access
- Monitor for suspicious activity
- Regular security audits

---

*Next: [12-multi-agent-orchestration.md](12-multi-agent-orchestration.md) - Coordination patterns and communication* 