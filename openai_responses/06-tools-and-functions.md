# OpenAI Responses API - Tools and Functions

## Overview

The Responses API supports multiple categories of tools to extend the model's capabilities:

1. **Built-in Tools**: Provided by OpenAI (web search, file search, computer use, **Code Interpreter**, **image generation**)
2. **Remote MCP Servers**: Connect to third-party Model Context Protocol servers
3. **Function Calls**: Custom tools you define and implement

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

### File Search (Enhanced - May 2025)

Searches through uploaded documents and files with enhanced capabilities for reasoning models.

```json
{
  "tools": [{"type": "file_search"}]
}
```

**New Capabilities (May 2025):**
- **Reasoning Model Support**: Works with o-series models (o1, o3, o3-mini, o4-mini)
- **Multi-Vector Store Search**: Search across up to two vector stores simultaneously
- **Attribute Filtering with Arrays**: Enhanced filtering capabilities
- **Document Chunk Retrieval**: Pull relevant chunks based on user queries

**Enhanced Configuration:**
```json
{
  "tools": [{
    "type": "file_search",
    "file_search": {
      "max_num_results": 20,
      "vector_store_ids": ["vs_123", "vs_456"]
    }
  }]
}
```

**Requirements:**
- Files must be uploaded via the Files API first
- Files should be associated with vector stores
- For reasoning models, ensures relevant context is pulled into reasoning process

### Code Interpreter (NEW - May 2025)

Allows models to write and run Python code in a sandboxed environment.

```json
{
  "tools": [{
    "type": "code_interpreter",
    "container": {"type": "auto"}
  }]
}
```

**Capabilities:**
- **Data Analysis**: Process and analyze complex datasets
- **Mathematical Problem Solving**: Solve complex equations and calculations
- **Code Execution**: Write and run Python iteratively until success
- **Image Understanding**: Deep image analysis and processing (especially for o3/o4-mini)
- **File Generation**: Create CSV files, plots, graphs, and other outputs
- **Image Processing**: Crop, zoom, rotate, and manipulate images

**Container Management:**
```json
// Auto mode - creates or reuses containers automatically
{
  "type": "code_interpreter",
  "container": {
    "type": "auto",
    "files": ["file-1", "file-2"]
  }
}

// Explicit mode - use a specific container
{
  "type": "code_interpreter", 
  "container": "cntr_abc123"
}
```

**Enhanced with Reasoning Models:**
- **o3 and o4-mini** use Code Interpreter within their chain-of-thought
- Improved benchmark performance on Humanity's Last Exam
- "Thinking with images" - deep visual intelligence through code

**Pricing:** $0.03 per container creation

### Image Generation (NEW - May 2025)

Generate images using the latest gpt-image-1 model.

```json
{
  "tools": [{
    "type": "image_generation"
  }]
}
```

**Capabilities:**
- **Real-time Streaming**: See image previews as they're generated
- **Multi-turn Edits**: Iteratively refine images with follow-up prompts
- **High Quality**: Uses the latest gpt-image-1 model
- **Integration**: Works seamlessly with other Responses API tools

**Model Support:**
- **Available on**: All GPT-4o series, GPT-4.1 series
- **Reasoning Models**: Only supported on **o3** (not o1, o3-mini, or o4-mini)

**Pricing:**
- $5.00/1M text input tokens
- $10.00/1M image input tokens
- $40.00/1M image output tokens
- 75% off cached input tokens

**Example Usage:**
```json
{
  "model": "o3",
  "input": "Create a futuristic cityscape at sunset, then make it more cyberpunk",
  "tools": [{"type": "image_generation"}]
}
```

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

## Remote MCP Server Support (NEW - May 2025)

Connect to third-party Model Context Protocol servers hosted anywhere on the internet.

### Basic MCP Integration

```json
{
  "tools": [{
    "type": "mcp",
    "server_label": "shopify",
    "server_url": "https://pitchskin.com/api/mcp",
    "require_approval": "never"
  }]
}
```

### Popular MCP Servers

**E-commerce & Payments:**
- **Shopify**: `https://shopify.dev/mcp`
- **Stripe**: `https://mcp.stripe.com`
- **Square**: `https://developer.squareup.com/mcp`
- **PayPal**: `https://developer.paypal.com/mcp`

**Communication & CRM:**
- **Twilio**: `https://<function-domain>.twil.io/mcp`
- **Intercom**: `https://developers.intercom.com/mcp`
- **HubSpot**: `https://developers.hubspot.com/mcp`

**Infrastructure & Development:**
- **Cloudflare**: `https://developers.cloudflare.com/mcp`
- **Pipedream**: `https://pipedream.com/mcp`
- **Zapier**: `https://zapier.com/mcp`

**Data & Analytics:**
- **Plaid**: `https://plaid.com/mcp`
- **DeepWiki**: `https://mcp.deepwiki.com/mcp`

### Authentication

Most MCP servers require authentication via headers:

```json
{
  "type": "mcp",
  "server_label": "stripe",
  "server_url": "https://mcp.stripe.com",
  "headers": {
    "Authorization": "Bearer sk_test_..."
  }
}
```

### Tool Filtering

Limit which tools are imported from an MCP server:

```json
{
  "type": "mcp",
  "server_label": "deepwiki",
  "server_url": "https://mcp.deepwiki.com/mcp",
  "allowed_tools": ["ask_question", "read_wiki_structure"]
}
```

### Approval Controls

Control when the model can call MCP tools:

```json
// Always require approval
"require_approval": "always"

// Never require approval (for trusted servers)
"require_approval": "never"

// Selective approval
"require_approval": {
  "never": {
    "tool_names": ["safe_tool_1", "safe_tool_2"]
  }
}
```

### How MCP Works

1. **Tool Discovery**: API fetches available tools from MCP server
2. **Model Selection**: Model chooses appropriate tools for the task
3. **Tool Execution**: API calls MCP server with model's arguments
4. **Result Integration**: Tool output is integrated into model's response

**Important Security Notes:**
- Only connect to trusted MCP servers
- Review data sharing carefully
- Use approvals for sensitive operations
- MCP servers are subject to their own terms and conditions
- Report malicious servers to `security@openai.com`

**Pricing:** No additional cost - you're billed only for output tokens from the API

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