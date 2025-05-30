# Production Deployment & Monitoring

Complete guide for deploying, scaling, and monitoring multi-agent systems in production environments.

## Overview

Production deployment of multi-agent systems requires careful consideration of:
- **Scalability** - Handling varying workloads efficiently
- **Reliability** - Ensuring high availability and fault tolerance
- **Security** - Protecting against threats and data breaches
- **Monitoring** - Real-time visibility into system health
- **Performance** - Optimizing response times and resource usage

## Infrastructure Architecture

### Containerized Deployment

```dockerfile
# Dockerfile for Agent Service
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY config/ ./config/

# Create non-root user
RUN addgroup -g 1001 -S agentuser && \
    adduser -S agentuser -u 1001

USER agentuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
```

### Kubernetes Deployment

```yaml
# agent-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: multi-agent-system
  labels:
    app: multi-agent-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: multi-agent-system
  template:
    metadata:
      labels:
        app: multi-agent-system
    spec:
      containers:
      - name: agent-service
        image: multi-agent-system:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-secret
              key: api-key
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        resources:
          limits:
            cpu: "1000m"
            memory: "1Gi"
          requests:
            cpu: "500m"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: agent-config
---
apiVersion: v1
kind: Service
metadata:
  name: multi-agent-service
spec:
  selector:
    app: multi-agent-system
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: agent-config
data:
  production.json: |
    {
      "agents": {
        "maxConcurrency": 10,
        "retryAttempts": 3,
        "timeout": 30000
      },
      "monitoring": {
        "metricsInterval": 30000,
        "healthCheckInterval": 10000
      }
    }
```

### Auto-Scaling Configuration

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: multi-agent-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: multi-agent-system
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: agent_queue_length
      target:
        type: AverageValue
        averageValue: "5"
```

## Production-Ready Implementation

### Robust Agent Service

```javascript
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';
import { createPrometheusMetrics } from './metrics.js';
import { AgentOrchestrator } from './orchestrator.js';
import { Logger } from './logger.js';
import { CircuitBreaker } from './circuit-breaker.js';

class ProductionAgentService {
  constructor(config) {
    this.config = config;
    this.logger = new Logger(config.logging);
    this.metrics = createPrometheusMetrics();
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.orchestrator = new AgentOrchestrator(config.agents);
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors(this.config.cors));
    
    // Performance
    this.app.use(compression());
    
    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP'
    }));
    
    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
    
    // Metrics collection
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.metrics.httpRequestDuration
          .labels(req.method, req.route?.path || req.path, res.statusCode)
          .observe(duration / 1000);
        this.metrics.httpRequestsTotal
          .labels(req.method, req.route?.path || req.path, res.statusCode)
          .inc();
      });
      next();
    });
  }

  setupRoutes() {
    // Health checks
    this.app.get('/health', (req, res) => {
      const health = this.getHealthStatus();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    this.app.get('/ready', (req, res) => {
      const ready = this.getReadinessStatus();
      res.status(ready ? 200 : 503).json({ ready });
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (req, res) => {
      res.set('Content-Type', this.metrics.register.contentType);
      res.end(await this.metrics.register.metrics());
    });

    // Main API endpoints
    this.app.post('/api/v1/execute', this.executeTask.bind(this));
    this.app.post('/api/v1/batch', this.executeBatch.bind(this));
    this.app.get('/api/v1/status/:taskId', this.getTaskStatus.bind(this));
    this.app.get('/api/v1/agents', this.getAgentStatus.bind(this));
  }

  async executeTask(req, res) {
    const taskId = this.generateTaskId();
    const startTime = Date.now();
    
    try {
      this.metrics.tasksInProgress.inc();
      
      const result = await this.circuitBreaker.execute(async () => {
        return await this.orchestrator.executeTask({
          id: taskId,
          ...req.body
        });
      });
      
      const duration = Date.now() - startTime;
      
      this.metrics.taskDuration.observe(duration / 1000);
      this.metrics.tasksTotal.labels('success').inc();
      
      res.json({
        taskId,
        result: result.output_text,
        duration,
        agentId: result.agentId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.metrics.taskDuration.observe(duration / 1000);
      this.metrics.tasksTotal.labels('error').inc();
      
      this.logger.error('Task execution failed', {
        taskId,
        error: error.message,
        duration
      });
      
      res.status(500).json({
        taskId,
        error: 'Task execution failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      this.metrics.tasksInProgress.dec();
    }
  }

  async executeBatch(req, res) {
    const batchId = this.generateBatchId();
    const { tasks } = req.body;
    
    try {
      const results = await Promise.allSettled(
        tasks.map(task => this.orchestrator.executeTask({
          id: this.generateTaskId(),
          ...task
        }))
      );
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.length - successCount;
      
      this.metrics.batchTasksTotal.labels('success').inc(successCount);
      this.metrics.batchTasksTotal.labels('error').inc(errorCount);
      
      res.json({
        batchId,
        totalTasks: tasks.length,
        successCount,
        errorCount,
        results: results.map((result, index) => ({
          taskIndex: index,
          status: result.status,
          result: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason.message : null
        })),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      this.logger.error('Batch execution failed', {
        batchId,
        error: error.message
      });
      
      res.status(500).json({
        batchId,
        error: 'Batch execution failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  getTaskStatus(req, res) {
    const { taskId } = req.params;
    const status = this.orchestrator.getTaskStatus(taskId);
    
    if (!status) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(status);
  }

  getAgentStatus(req, res) {
    const agentMetrics = this.orchestrator.getAgentMetrics();
    res.json({
      agents: agentMetrics,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    });
  }

  getHealthStatus() {
    const agentHealth = this.orchestrator.getHealthStatus();
    const systemHealth = this.checkSystemHealth();
    
    const isHealthy = agentHealth.healthy && systemHealth.healthy;
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      agents: agentHealth,
      system: systemHealth,
      timestamp: new Date().toISOString()
    };
  }

  getReadinessStatus() {
    return this.orchestrator.isReady() && this.checkSystemReadiness();
  }

  checkSystemHealth() {
    const memUsage = process.memoryUsage();
    const memUsagePercent = memUsage.heapUsed / memUsage.heapTotal;
    
    return {
      healthy: memUsagePercent < 0.9, // Unhealthy if using >90% memory
      memory: {
        usage: memUsagePercent,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      },
      uptime: process.uptime()
    };
  }

  checkSystemReadiness() {
    // Check if system is ready to accept requests
    return this.orchestrator.isReady();
  }

  setupErrorHandling() {
    // Catch unhandled errors
    this.app.use((error, req, res, next) => {
      this.logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path
      });
      
      res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    });

    // Handle 404s
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });
  }

  generateTaskId() {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateBatchId() {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async start(port = 3000) {
    await this.orchestrator.initialize();
    
    this.server = this.app.listen(port, () => {
      this.logger.info(`Agent service started on port ${port}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  async shutdown(signal) {
    this.logger.info(`Received ${signal}, shutting down gracefully`);
    
    this.server.close(() => {
      this.logger.info('HTTP server closed');
    });
    
    await this.orchestrator.shutdown();
    process.exit(0);
  }
}
```

### Monitoring and Metrics

```javascript
// metrics.js
import prometheus from 'prom-client';

export function createPrometheusMetrics() {
  const register = new prometheus.Registry();
  
  // Default metrics
  prometheus.collectDefaultMetrics({ register });
  
  // Custom metrics
  const httpRequestsTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
  });
  
  const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register]
  });
  
  const tasksTotal = new prometheus.Counter({
    name: 'agent_tasks_total',
    help: 'Total number of agent tasks',
    labelNames: ['status'],
    registers: [register]
  });
  
  const tasksInProgress = new prometheus.Gauge({
    name: 'agent_tasks_in_progress',
    help: 'Number of agent tasks currently in progress',
    registers: [register]
  });
  
  const taskDuration = new prometheus.Histogram({
    name: 'agent_task_duration_seconds',
    help: 'Duration of agent tasks in seconds',
    buckets: [1, 5, 10, 30, 60, 300, 600],
    registers: [register]
  });
  
  const agentHealthStatus = new prometheus.Gauge({
    name: 'agent_health_status',
    help: 'Health status of agents (1 = healthy, 0 = unhealthy)',
    labelNames: ['agent_id'],
    registers: [register]
  });
  
  const queueLength = new prometheus.Gauge({
    name: 'agent_queue_length',
    help: 'Number of tasks in agent queue',
    registers: [register]
  });
  
  const batchTasksTotal = new prometheus.Counter({
    name: 'agent_batch_tasks_total',
    help: 'Total number of batch tasks',
    labelNames: ['status'],
    registers: [register]
  });
  
  return {
    register,
    httpRequestsTotal,
    httpRequestDuration,
    tasksTotal,
    tasksInProgress,
    taskDuration,
    agentHealthStatus,
    queueLength,
    batchTasksTotal
  };
}
```

### Circuit Breaker Implementation

```javascript
// circuit-breaker.js
export class CircuitBreaker {
  constructor(config = {}) {
    this.failureThreshold = config.failureThreshold || 5;
    this.resetTimeout = config.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = config.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      circuitOpenCount: 0
    };
  }

  async execute(operation) {
    this.metrics.totalRequests++;
    
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= 3) { // Require 3 successes to close
          this.reset();
        }
      } else {
        this.failureCount = 0;
      }
      
      return result;
      
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.metrics.circuitOpenCount++;
    }
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      metrics: this.metrics
    };
  }
}
```

## Monitoring and Observability

### Prometheus Configuration

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'multi-agent-system'
    static_configs:
      - targets: ['multi-agent-service:80']
    metrics_path: '/metrics'
    scrape_interval: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Alert Rules

```yaml
# alert_rules.yml
groups:
- name: agent-system-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(agent_tasks_total{status="error"}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Agent task error rate is {{ $value }} per second"

  - alert: HighResponseTime
    expr: histogram_quantile(0.95, agent_task_duration_seconds) > 30
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High response time detected"
      description: "95th percentile response time is {{ $value }} seconds"

  - alert: AgentDown
    expr: agent_health_status == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Agent is down"
      description: "Agent {{ $labels.agent_id }} is unhealthy"

  - alert: HighQueueLength
    expr: agent_queue_length > 100
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High queue length"
      description: "Agent queue length is {{ $value }}"

  - alert: CircuitBreakerOpen
    expr: increase(circuit_breaker_open_total[5m]) > 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "Circuit breaker opened"
      description: "Circuit breaker has opened, indicating system issues"
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Multi-Agent System Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, http_request_duration_seconds)",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Agent Health",
        "type": "stat",
        "targets": [
          {
            "expr": "agent_health_status",
            "legendFormat": "{{agent_id}}"
          }
        ]
      },
      {
        "title": "Task Success Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(agent_tasks_total{status=\"success\"}[5m]) / rate(agent_tasks_total[5m])",
            "legendFormat": "Success Rate"
          }
        ]
      }
    ]
  }
}
```

## Security Implementation

### Authentication and Authorization

```javascript
// auth.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthManager {
  constructor(config) {
    this.jwtSecret = config.jwtSecret;
    this.tokenExpiry = config.tokenExpiry || '1h';
    this.users = new Map(); // In production, use a database
    this.permissions = new Map();
  }

  async authenticate(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  authorize(requiredPermissions) {
    return (req, res, next) => {
      const userPermissions = this.permissions.get(req.user.id) || [];
      
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      next();
    };
  }

  async login(username, password) {
    const user = this.users.get(username);
    
    if (!user || !await bcrypt.compare(password, user.hashedPassword)) {
      throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry }
    );
    
    return { token, user: { id: user.id, username: user.username } };
  }
}
```

### Input Validation

```javascript
// validation.js
import Joi from 'joi';

export const taskSchema = Joi.object({
  input: Joi.string().required().max(10000),
  instructions: Joi.string().max(5000),
  tools: Joi.array().items(Joi.object({
    type: Joi.string().valid('web_search', 'file_search', 'function').required()
  })).max(10),
  metadata: Joi.object().unknown(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  timeout: Joi.number().integer().min(1000).max(300000).default(30000)
});

export const batchSchema = Joi.object({
  tasks: Joi.array().items(taskSchema).min(1).max(100).required()
});

export function validateRequest(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }
    
    req.body = value;
    next();
  };
}
```

## Performance Optimization

### Caching Strategy

```javascript
// cache.js
import Redis from 'ioredis';

export class CacheManager {
  constructor(config) {
    this.redis = new Redis(config.redis);
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour
  }

  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }
}

// Usage in agent service
export class CachedAgentService extends ProductionAgentService {
  constructor(config) {
    super(config);
    this.cache = new CacheManager(config.cache);
  }

  async executeTask(req, res) {
    const cacheKey = this.cache.generateKey('task', 
      this.hashInput(req.body.input),
      req.body.instructions || 'default'
    );
    
    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.metrics.cacheHits.inc();
      return res.json({
        ...cached,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    this.metrics.cacheMisses.inc();
    
    // Execute and cache result
    const result = await super.executeTask(req, res);
    
    if (result && !result.error) {
      await this.cache.set(cacheKey, result, 3600); // Cache for 1 hour
    }
    
    return result;
  }

  hashInput(input) {
    // Simple hash for demonstration - use crypto.createHash in production
    return Buffer.from(input).toString('base64').substring(0, 16);
  }
}
```

### Database Integration

```javascript
// database.js
import { Pool } from 'pg';

export class DatabaseManager {
  constructor(config) {
    this.pool = new Pool(config.database);
  }

  async saveTask(task) {
    const query = `
      INSERT INTO tasks (id, input, instructions, status, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      task.id,
      task.input,
      task.instructions,
      'pending',
      new Date()
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateTaskStatus(taskId, status, result = null, error = null) {
    const query = `
      UPDATE tasks 
      SET status = $2, result = $3, error = $4, updated_at = $5
      WHERE id = $1
      RETURNING *
    `;
    
    const values = [taskId, status, result, error, new Date()];
    const dbResult = await this.pool.query(query, values);
    return dbResult.rows[0];
  }

  async getTaskHistory(limit = 100, offset = 0) {
    const query = `
      SELECT * FROM tasks 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.pool.query(query, [limit, offset]);
    return result.rows;
  }

  async getTaskMetrics() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration
      FROM tasks 
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY status
    `;
    
    const result = await this.pool.query(query);
    return result.rows;
  }
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Multi-Agent System

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:6
        ports:
          - 6379:6379
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
      env:
        REDIS_URL: redis://localhost:6379
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
    
    - name: Run security scan
      run: npm audit
    
    - name: Build Docker image
      run: docker build -t multi-agent-system:${{ github.sha }} .

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push Docker image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: multi-agent-system
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
    
    - name: Deploy to EKS
      run: |
        aws eks update-kubeconfig --name production-cluster
        kubectl set image deployment/multi-agent-system \
          agent-service=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        kubectl rollout status deployment/multi-agent-system
```

## Best Practices Summary

### 1. **Reliability**
- Implement circuit breakers and retries
- Use health checks and readiness probes
- Plan for graceful degradation
- Monitor and alert on key metrics

### 2. **Security**
- Use authentication and authorization
- Validate all inputs
- Encrypt sensitive data
- Regular security audits

### 3. **Performance**
- Implement caching strategies
- Use connection pooling
- Monitor resource usage
- Auto-scale based on demand

### 4. **Observability**
- Comprehensive logging
- Metrics collection
- Distributed tracing
- Real-time monitoring

### 5. **Deployment**
- Containerization
- Infrastructure as code
- Automated CI/CD
- Blue-green deployments

---

*This completes the comprehensive multi-agent system documentation suite. The files now provide complete coverage for building, deploying, and operating production-ready AI agent systems.* 