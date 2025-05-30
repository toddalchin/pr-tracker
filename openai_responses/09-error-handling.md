# OpenAI Responses API - Error Handling

## Overview

The Responses API uses conventional HTTP response codes to indicate the success or failure of an API request. This guide covers common error scenarios, how to handle them, and best practices for robust error handling.

## HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid API key |
| 403 | Forbidden | Request refused (e.g., insufficient permissions) |
| 404 | Not Found | Resource not found (e.g., invalid response ID) |
| 422 | Unprocessable Entity | Valid request but couldn't be processed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Server temporarily unavailable |
| 503 | Service Unavailable | Service temporarily overloaded |

---

## Error Response Format

All errors return a JSON object with error details:

```json
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

### Error Object Properties

| Property | Type | Description |
|----------|------|-------------|
| `message` | string | Human-readable error description |
| `type` | string | Error category |
| `param` | string\|null | Parameter that caused the error |
| `code` | string | Specific error code |

---

## Common Error Types

### 1. Authentication Errors

#### Invalid API Key
```json
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error", 
    "code": "invalid_api_key"
  }
}
```

**Causes:**
- Missing API key in Authorization header
- Incorrect API key format
- Revoked or expired API key

**Solutions:**
```javascript
// Correct authorization header
const response = await fetch('https://api.openai.com/v1/responses', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});
```

#### Organization Not Found
```json
{
  "error": {
    "message": "Organization not found",
    "type": "invalid_request_error",
    "code": "organization_not_found"
  }
}
```

### 2. Rate Limit Errors

#### Rate Limit Exceeded
```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

**Handling Rate Limits:**
```python
import time
import random

def handle_rate_limit_error(func, max_retries=5):
    for attempt in range(max_retries):
        try:
            return func()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            
            # Exponential backoff with jitter
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            print(f"Rate limit hit. Waiting {wait_time:.2f}s before retry {attempt + 1}")
            time.sleep(wait_time)
    
    raise Exception("Max retries exceeded")

# Usage
response = handle_rate_limit_error(
    lambda: client.responses.create(
        model="gpt-4o",
        input="Hello world"
    )
)
```

### 3. Request Validation Errors

#### Invalid Model
```json
{
  "error": {
    "message": "The model 'invalid-model' does not exist",
    "type": "invalid_request_error",
    "param": "model",
    "code": "model_not_found"
  }
}
```

#### Invalid Parameters
```json
{
  "error": {
    "message": "Temperature must be between 0 and 2",
    "type": "invalid_request_error", 
    "param": "temperature",
    "code": "invalid_parameter_value"
  }
}
```

**Validation Example:**
```javascript
function validateRequestParameters(params) {
  const errors = [];
  
  if (!params.model) {
    errors.push("Model is required");
  }
  
  if (!params.input) {
    errors.push("Input is required");
  }
  
  if (params.temperature !== undefined) {
    if (typeof params.temperature !== 'number' || 
        params.temperature < 0 || params.temperature > 2) {
      errors.push("Temperature must be a number between 0 and 2");
    }
  }
  
  if (params.max_output_tokens !== undefined) {
    if (!Number.isInteger(params.max_output_tokens) || 
        params.max_output_tokens < 1) {
      errors.push("max_output_tokens must be a positive integer");
    }
  }
  
  return errors;
}

// Usage
const errors = validateRequestParameters(requestBody);
if (errors.length > 0) {
  throw new Error(`Validation failed: ${errors.join(', ')}`);
}
```

### 4. Content Policy Errors

#### Content Filtered
```json
{
  "error": {
    "message": "Your request was rejected as a result of our safety system",
    "type": "invalid_request_error",
    "code": "content_policy_violation"
  }
}
```

**Handling Content Filtering:**
```python
def handle_content_policy_error(input_text):
    try:
        response = client.responses.create(
            model="gpt-4o",
            input=input_text
        )
        return response
    except ContentPolicyError as e:
        # Log the violation for review
        logger.warning(f"Content policy violation: {input_text[:100]}...")
        
        # Return a user-friendly message
        return {
            "error": "Sorry, I can't process that request due to content guidelines.",
            "type": "content_filtered"
        }
```

### 5. Context Length Errors

#### Context Too Long
```json
{
  "error": {
    "message": "This model's maximum context length is 128000 tokens",
    "type": "invalid_request_error",
    "code": "context_length_exceeded"
  }
}
```

**Solutions:**
1. **Use truncation:**
```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: longInput,
  truncation: "auto"  // Automatically truncate if needed
});
```

2. **Summarize previous context:**
```python
def handle_long_context(input_text, previous_response_id):
    try:
        return client.responses.create(
            model="gpt-4o",
            input=input_text,
            previous_response_id=previous_response_id
        )
    except ContextLengthExceededError:
        # Summarize the conversation and start fresh
        summary_response = client.responses.create(
            model="gpt-4o",
            input="Please summarize our conversation so far in 200 words or less.",
            previous_response_id=previous_response_id
        )
        
        # Start new conversation with summary
        return client.responses.create(
            model="gpt-4o",
            input=f"Previous conversation summary: {summary_response.output_text}\n\nNew request: {input_text}"
        )
```

### 6. Server Errors

#### Internal Server Error
```json
{
  "error": {
    "message": "The server had an error while processing your request",
    "type": "server_error"
  }
}
```

#### Service Unavailable
```json
{
  "error": {
    "message": "The server is temporarily overloaded",
    "type": "server_error",
    "code": "service_unavailable"
  }
}
```

---

## Response Status Handling

### Failed Response Status

When a response has `status: "failed"`, check the error object:

```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Hello"
});

if (response.status === "failed") {
  console.error("Response failed:", response.error);
  
  switch (response.error.code) {
    case "server_error":
      // Retry after delay
      break;
    case "content_policy_violation":
      // Handle content filtering
      break;
    case "context_length_exceeded":
      // Truncate or summarize
      break;
    default:
      // Handle other errors
      break;
  }
}
```

### Incomplete Response Status

When a response has `status: "incomplete"`:

```python
if response.status == "incomplete":
    reason = response.incomplete_details.reason
    
    if reason == "max_tokens":
        print("Response was truncated due to token limit")
        # Consider requesting continuation or increasing max_output_tokens
        
    elif reason == "timeout":
        print("Response timed out")
        # Retry with simpler input or background processing
        
    elif reason == "content_filter":
        print("Response was filtered")
        # Handle content filtering
```

---

## Robust Error Handling Patterns

### Comprehensive Handler Class

```python
import logging
import time
import random
from typing import Any, Callable
from openai import OpenAI
from openai.error import (
    RateLimitError, 
    APIError, 
    ContentPolicyError,
    ContextLengthExceededError
)

class RobustResponseClient:
    def __init__(self, api_key: str, max_retries: int = 3):
        self.client = OpenAI(api_key=api_key)
        self.max_retries = max_retries
        self.logger = logging.getLogger(__name__)
    
    def create_response(self, **kwargs) -> Any:
        """Create response with comprehensive error handling"""
        
        for attempt in range(self.max_retries):
            try:
                response = self.client.responses.create(**kwargs)
                
                # Check response status
                if response.status == "failed":
                    return self._handle_failed_response(response, kwargs)
                elif response.status == "incomplete":
                    return self._handle_incomplete_response(response, kwargs)
                
                return response
                
            except RateLimitError as e:
                if attempt == self.max_retries - 1:
                    raise
                wait_time = self._calculate_backoff(attempt)
                self.logger.warning(f"Rate limit hit. Waiting {wait_time}s")
                time.sleep(wait_time)
                
            except ContextLengthExceededError as e:
                return self._handle_context_length_error(kwargs)
                
            except ContentPolicyError as e:
                return self._handle_content_policy_error(e)
                
            except APIError as e:
                if e.status_code >= 500 and attempt < self.max_retries - 1:
                    wait_time = self._calculate_backoff(attempt)
                    self.logger.warning(f"Server error {e.status_code}. Retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:
                    raise
                    
            except Exception as e:
                self.logger.error(f"Unexpected error: {e}")
                if attempt == self.max_retries - 1:
                    raise
                time.sleep(1)
        
        raise Exception(f"Failed after {self.max_retries} attempts")
    
    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff with jitter"""
        base_delay = 2 ** attempt
        jitter = random.uniform(0, 1)
        return base_delay + jitter
    
    def _handle_failed_response(self, response, original_kwargs):
        """Handle failed response status"""
        error = response.error
        
        if error.code == "content_policy_violation":
            return {
                "error": "Content policy violation",
                "user_message": "I can't process that request due to content guidelines."
            }
        elif error.code == "server_error":
            # Retry logic could go here
            raise Exception(f"Server error: {error.message}")
        else:
            raise Exception(f"Response failed: {error.message}")
    
    def _handle_incomplete_response(self, response, original_kwargs):
        """Handle incomplete response status"""
        reason = response.incomplete_details.reason
        
        if reason == "max_tokens":
            # Could implement continuation logic here
            self.logger.warning("Response truncated due to token limit")
            return response  # Return partial response
        else:
            raise Exception(f"Response incomplete: {reason}")
    
    def _handle_context_length_error(self, kwargs):
        """Handle context length exceeded"""
        # Enable truncation and retry
        kwargs["truncation"] = "auto"
        return self.client.responses.create(**kwargs)
    
    def _handle_content_policy_error(self, error):
        """Handle content policy violations"""
        return {
            "error": "content_policy_violation",
            "message": "Request rejected due to content policy",
            "user_message": "I can't help with that request."
        }

# Usage
client = RobustResponseClient(api_key="your-api-key")
response = client.create_response(
    model="gpt-4o",
    input="Tell me a story"
)
```

### JavaScript Error Handler

```javascript
class ResponseErrorHandler {
  constructor(openai, options = {}) {
    this.openai = openai;
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
  }
  
  async createResponseWithRetry(params) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.openai.responses.create(params);
        
        if (response.status === 'failed') {
          return this.handleFailedResponse(response, params);
        }
        
        if (response.status === 'incomplete') {
          return this.handleIncompleteResponse(response, params);
        }
        
        return response;
        
      } catch (error) {
        if (this.shouldRetry(error, attempt)) {
          const delay = this.calculateDelay(attempt);
          console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms`);
          await this.sleep(delay);
          continue;
        }
        
        return this.handleError(error);
      }
    }
    
    throw new Error(`Failed after ${this.maxRetries} attempts`);
  }
  
  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries - 1) return false;
    
    // Retry on rate limits and server errors
    return error.status === 429 || 
           (error.status >= 500 && error.status < 600);
  }
  
  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }
  
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  handleError(error) {
    switch (error.status) {
      case 400:
        return { error: 'Invalid request', details: error.message };
      case 401:
        return { error: 'Authentication failed', details: 'Check your API key' };
      case 403:
        return { error: 'Forbidden', details: 'Insufficient permissions' };
      case 429:
        return { error: 'Rate limited', details: 'Too many requests' };
      default:
        return { error: 'Unknown error', details: error.message };
    }
  }
  
  handleFailedResponse(response, originalParams) {
    const error = response.error;
    
    if (error.code === 'content_policy_violation') {
      return {
        success: false,
        error: 'content_filtered',
        message: 'Request was filtered due to content policy'
      };
    }
    
    throw new Error(`Response failed: ${error.message}`);
  }
  
  handleIncompleteResponse(response, originalParams) {
    const reason = response.incomplete_details?.reason;
    
    if (reason === 'max_tokens') {
      console.warn('Response truncated due to token limit');
      return {
        ...response,
        warning: 'Response was truncated'
      };
    }
    
    throw new Error(`Response incomplete: ${reason}`);
  }
}

// Usage
const errorHandler = new ResponseErrorHandler(openai);
const response = await errorHandler.createResponseWithRetry({
  model: "gpt-4o",
  input: "Hello world"
});
```

---

## Monitoring and Logging

### Error Tracking

```python
import logging
from datetime import datetime

class ErrorTracker:
    def __init__(self):
        self.errors = []
        self.logger = logging.getLogger(__name__)
    
    def track_error(self, error, context=None):
        error_info = {
            "timestamp": datetime.now().isoformat(),
            "error_type": type(error).__name__,
            "message": str(error),
            "context": context
        }
        
        self.errors.append(error_info)
        self.logger.error(f"API Error: {error_info}")
        
        # Send to monitoring service
        # self.send_to_monitoring(error_info)
    
    def get_error_stats(self):
        if not self.errors:
            return {}
        
        error_types = {}
        for error in self.errors:
            error_type = error["error_type"]
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        return {
            "total_errors": len(self.errors),
            "error_types": error_types,
            "last_error": self.errors[-1] if self.errors else None
        }
```

### Health Check Endpoint

```javascript
app.get('/health', async (req, res) => {
  try {
    // Simple health check request
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: "test",
      max_output_tokens: 1
    });
    
    res.json({
      status: 'healthy',
      openai_api: 'connected',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

## Best Practices

### 1. Implement Circuit Breaker Pattern

```python
import time
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self.reset()
            return result
        except Exception as e:
            self.record_failure()
            raise
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
    
    def reset(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
```

### 2. Use Graceful Degradation

```javascript
async function generateResponseWithFallback(input) {
  try {
    // Try primary model
    return await openai.responses.create({
      model: "gpt-4o",
      input: input
    });
  } catch (error) {
    if (error.status === 429) {
      // Fallback to simpler model if rate limited
      return await openai.responses.create({
        model: "gpt-4o-mini",
        input: input
      });
    }
    
    if (error.code === 'content_policy_violation') {
      return {
        output_text: "I apologize, but I cannot process that request.",
        error: "content_filtered"
      };
    }
    
    throw error;
  }
}
```

### 3. Validate Input Before Sending

```python
def validate_and_send(client, **params):
    # Pre-validate to avoid API errors
    errors = []
    
    if not params.get("model"):
        errors.append("Model is required")
    
    if not params.get("input"):
        errors.append("Input is required")
    
    if params.get("temperature") is not None:
        temp = params["temperature"]
        if not isinstance(temp, (int, float)) or temp < 0 or temp > 2:
            errors.append("Temperature must be between 0 and 2")
    
    if errors:
        raise ValueError(f"Validation errors: {', '.join(errors)}")
    
    return client.responses.create(**params)
```

---

*This completes the OpenAI Responses API documentation reorganization. All files are now structured for clear, focused LLM comprehension and easy navigation.* 