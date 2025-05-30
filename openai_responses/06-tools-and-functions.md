# OpenAI Responses API - Tools and Functions

## Overview

The Responses API supports two categories of tools to extend the model's capabilities:

1. **Built-in Tools**: Provided by OpenAI (web search, file search, computer use)
2. **Function Calls**: Custom tools you define and implement

## Built-in Tools

### Web Search

Enables the model to search the web for current information.

```json
{
  "tools": [{"type": "web_search"}],
  "tool_choice": "auto"
}
```

**Capabilities:**
- Real-time web search
- Current information retrieval
- News and recent events
- Fact verification

**Example Usage:**
```json
{
  "model": "gpt-4o",
  "input": "What are the latest developments in quantum computing?",
  "tools": [{"type": "web_search"}]
}
```

### File Search

Searches through uploaded documents and files.

```json
{
  "tools": [{"type": "file_search"}]
}
```

**Capabilities:**
- Document analysis
- Information extraction
- Cross-reference checking
- Content summarization

**Requirements:**
- Files must be uploaded via the Files API first
- Files should be associated with the request

### Computer Use

Interact with computer interfaces (when available).

```json
{
  "tools": [{"type": "computer_use"}]
}
```

**Capabilities:**
- Screen interaction
- Application control
- UI automation
- Visual interface analysis

---

## Function Calling (Custom Tools)

Define custom functions that the model can call to interact with external systems.

### Basic Function Definition

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City and state, e.g., San Francisco, CA"
            },
            "unit": {
              "type": "string",
              "enum": ["celsius", "fahrenheit"],
              "description": "Temperature unit"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### Parameter Schema

Function parameters follow JSON Schema format:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Always "object" for function parameters |
| `properties` | object | Define each parameter |
| `required` | array | List of required parameter names |

### Parameter Types

```json
{
  "properties": {
    "text_param": {
      "type": "string",
      "description": "A text parameter"
    },
    "number_param": {
      "type": "number",
      "description": "A numeric parameter"
    },
    "boolean_param": {
      "type": "boolean", 
      "description": "A true/false parameter"
    },
    "enum_param": {
      "type": "string",
      "enum": ["option1", "option2", "option3"],
      "description": "One of predefined options"
    },
    "array_param": {
      "type": "array",
      "items": {"type": "string"},
      "description": "An array of strings"
    },
    "object_param": {
      "type": "object",
      "properties": {
        "nested_field": {"type": "string"}
      },
      "description": "A nested object"
    }
  }
}
```

---

## Tool Choice Control

Control how the model selects tools using the `tool_choice` parameter.

### String Options

```json
// Let model decide automatically
"tool_choice": "auto"

// Don't use any tools
"tool_choice": "none" 

// Must use at least one tool
"tool_choice": "required"
```

### Specific Tool Selection

Force the model to use a specific tool:

```json
"tool_choice": {
  "type": "function",
  "function": {"name": "get_weather"}
}
```

```json
"tool_choice": {
  "type": "web_search"
}
```

---

## Parallel Tool Calls

Control whether tools can run in parallel:

```json
// Allow parallel execution (default)
"parallel_tool_calls": true

// Force sequential execution  
"parallel_tool_calls": false
```

**Parallel execution benefits:**
- Faster overall response time
- Efficient for independent operations

**Sequential execution benefits:**
- Results from one tool can influence the next
- Better for dependent operations

---

## Function Call Response Handling

When the model calls a function, you need to:

1. **Receive the function call** in the response
2. **Execute the function** with provided arguments
3. **Return the result** in a follow-up request

### Function Call in Response

```json
{
  "output": [
    {
      "type": "function_call",
      "id": "call_abc123",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"celsius\"}"
      }
    }
  ]
}
```

### Providing Function Results

Create a new request with the function result:

```json
{
  "model": "gpt-4o",
  "input": [
    {
      "type": "function_result",
      "function_call_id": "call_abc123",
      "result": {
        "temperature": 18,
        "condition": "partly cloudy",
        "humidity": 65
      }
    }
  ],
  "previous_response_id": "resp_previous_id"
}
```

---

## Common Function Examples

### API Integration

```json
{
  "name": "call_api",
  "description": "Make HTTP requests to external APIs",
  "parameters": {
    "type": "object",
    "properties": {
      "url": {"type": "string", "description": "API endpoint URL"},
      "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE"]},
      "headers": {"type": "object", "description": "HTTP headers"},
      "body": {"type": "object", "description": "Request body"}
    },
    "required": ["url", "method"]
  }
}
```

### Database Operations

```json
{
  "name": "query_database",
  "description": "Execute database queries",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {"type": "string", "description": "SQL query to execute"},
      "parameters": {"type": "array", "description": "Query parameters"}
    },
    "required": ["query"]
  }
}
```

### File Operations

```json
{
  "name": "read_file",
  "description": "Read contents of a file",
  "parameters": {
    "type": "object",
    "properties": {
      "filepath": {"type": "string", "description": "Path to the file"},
      "encoding": {"type": "string", "default": "utf-8"}
    },
    "required": ["filepath"]
  }
}
```

### Email Sending

```json
{
  "name": "send_email",
  "description": "Send an email message",
  "parameters": {
    "type": "object",
    "properties": {
      "to": {"type": "array", "items": {"type": "string"}},
      "subject": {"type": "string"},
      "body": {"type": "string"},
      "cc": {"type": "array", "items": {"type": "string"}},
      "attachments": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["to", "subject", "body"]
  }
}
```

---

## Multi-step Tool Usage

Combine multiple tools for complex workflows:

```json
{
  "model": "gpt-4o",
  "input": "Research the latest AI news and send a summary to john@example.com",
  "tools": [
    {"type": "web_search"},
    {
      "type": "function",
      "function": {
        "name": "send_email",
        "description": "Send email",
        "parameters": {
          "type": "object",
          "properties": {
            "to": {"type": "array", "items": {"type": "string"}},
            "subject": {"type": "string"},
            "body": {"type": "string"}
          },
          "required": ["to", "subject", "body"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**Typical flow:**
1. Model uses web_search to find AI news
2. Model processes and summarizes the findings
3. Model calls send_email function with the summary

---

## Tool Error Handling

Handle errors in tool execution:

```json
{
  "type": "function_result",
  "function_call_id": "call_abc123",
  "error": {
    "code": "api_error",
    "message": "External API returned 500 error",
    "details": "Service temporarily unavailable"
  }
}
```

The model will adapt its response based on the error information.

---

## Best Practices

### 1. Clear Function Descriptions

```json
{
  "name": "calculate_shipping",
  "description": "Calculate shipping cost based on weight, dimensions, and destination. Returns cost in USD and estimated delivery time.",
  "parameters": {...}
}
```

### 2. Comprehensive Parameters

Include all necessary parameters with clear descriptions:

```json
{
  "properties": {
    "weight": {
      "type": "number",
      "description": "Package weight in pounds",
      "minimum": 0.1,
      "maximum": 150
    },
    "destination": {
      "type": "string", 
      "description": "Destination zip code (US format: 12345)",
      "pattern": "^[0-9]{5}$"
    }
  }
}
```

### 3. Input Validation

Validate function arguments before execution:

```python
def validate_weather_args(args):
    location = args.get("location")
    if not location:
        return {"error": "Location is required"}
    
    unit = args.get("unit", "fahrenheit")
    if unit not in ["celsius", "fahrenheit"]:
        return {"error": "Unit must be celsius or fahrenheit"}
    
    return None  # No errors
```

### 4. Structured Return Values

Return consistent, structured data:

```json
{
  "success": true,
  "data": {
    "temperature": 72,
    "condition": "sunny",
    "humidity": 45
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 5. Security Considerations

- Validate all inputs thoroughly
- Implement proper authentication
- Use allowlists for permitted operations
- Log function calls for auditing

```python
def secure_file_read(filepath):
    # Validate path is in allowed directory
    if not filepath.startswith("/safe/directory/"):
        return {"error": "Access denied"}
    
    # Prevent directory traversal
    if ".." in filepath:
        return {"error": "Invalid path"}
    
    # Implement your secure file reading logic
    return read_file_safely(filepath)
```

---

## Tool Usage Analytics

Monitor tool usage for optimization:

```json
{
  "tool_stats": {
    "total_calls": 45,
    "successful_calls": 42,
    "failed_calls": 3,
    "average_execution_time": 1.2,
    "most_used_function": "get_weather"
  }
}
```

---

*Next: [07-conversation-state.md](07-conversation-state.md) - Multi-turn conversations and state management* 