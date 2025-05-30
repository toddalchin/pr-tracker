# OpenAI Responses API - Request Parameters

## Required Parameters

### `input` (string or array) - **Required**
Text, image, or file inputs to the model, used to generate a response.

**Examples:**
```json
// Simple text input
"input": "Explain quantum computing in simple terms"

// Array with multiple inputs
"input": [
  {"type": "text", "text": "Analyze this image:"},
  {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
]
```

**Related Documentation:**
- Text inputs and outputs
- Image inputs
- File inputs
- Conversation state
- Function calling

### `model` (string) - **Required**
Model ID used to generate the response, like `gpt-4o` or `o3`. OpenAI offers a wide range of models with different capabilities, performance characteristics, and price points.

**Examples:**
- `"gpt-4o"` - Advanced multimodal model
- `"gpt-4o-mini"` - Faster, more cost-effective option
- `"o3"` - Latest reasoning model

---

## Optional Parameters

### `background` (boolean, default: false)
Whether to run the model response in the background.

```json
"background": true
```

When set to `true`:
- Response generation runs asynchronously
- You can cancel the response using the cancel endpoint
- Useful for long-running requests

### `include` (array)
Specify additional output data to include in the model response.

**Supported values:**
- `"file_search_call.results"`: Include search results of file search tool calls
- `"message.input_image.image_url"`: Include image URLs from input messages
- `"computer_call_output.output.image_url"`: Include image URLs from computer call outputs
- `"reasoning.encrypted_content"`: Include encrypted reasoning tokens for multi-turn conversations

```json
"include": ["file_search_call.results", "reasoning.encrypted_content"]
```

### `instructions` (string)
Inserts a system (or developer) message as the first item in the model's context.

```json
"instructions": "You are a helpful assistant that explains complex topics simply."
```

**Important**: When using with `previous_response_id`, instructions from previous responses are not carried over, making it easy to swap system messages.

### `max_output_tokens` (integer)
An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.

```json
"max_output_tokens": 1000
```

### `metadata` (map)
Set of 16 key-value pairs that can be attached to an object. Useful for storing additional information in a structured format.

**Constraints:**
- Keys: Maximum 64 characters
- Values: Maximum 512 characters

```json
"metadata": {
  "user_id": "user_12345",
  "session_id": "session_abc",
  "app_version": "1.2.3"
}
```

### `parallel_tool_calls` (boolean, default: true)
Whether to allow the model to run tool calls in parallel.

```json
"parallel_tool_calls": false
```

Set to `false` to force sequential tool execution.

### `previous_response_id` (string)
The unique ID of the previous response to the model. Use this to create multi-turn conversations.

```json
"previous_response_id": "resp_67cb71b351908190a308f3859487620d"
```

See [07-conversation-state.md](07-conversation-state.md) for detailed conversation management.

### `reasoning` (object)
Configuration options for reasoning models (o-series models only).

```json
"reasoning": {
  "effort": "medium"
}
```

**Properties:**
- `effort` (string): Controls reasoning depth and quality

### `service_tier` (string, default: "auto")
Specifies the latency tier to use for processing the request.

**Options:**
- `"auto"`: Use scale tier credits if available, fallback to default
- `"default"`: Use default service tier (lower uptime SLA)
- `"flex"`: Use Flex Processing service tier

```json
"service_tier": "flex"
```

**Note**: Relevant for customers subscribed to the scale tier service.

### `store` (boolean, default: true)
Whether to store the generated model response for later retrieval via API.

```json
"store": false
```

Set to `false` if you don't need to retrieve the response later.

### `stream` (boolean, default: false)
If set to `true`, the model response data will be streamed to the client as server-sent events.

```json
"stream": true
```

See [05-streaming.md](05-streaming.md) for detailed streaming documentation.

### `temperature` (number, default: 1.0)
Sampling temperature between 0 and 2. Higher values (0.8) make output more random, lower values (0.2) make it more focused and deterministic.

```json
"temperature": 0.7
```

**Note**: Generally recommend altering either `temperature` or `top_p`, but not both.

### `text` (object)
Configuration options for text response from the model. Can be plain text or structured JSON data.

```json
"text": {
  "format": {
    "type": "json_object",
    "json_schema": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "age": {"type": "number"}
      }
    }
  }
}
```

See Structured Outputs documentation for JSON schema details.

### `tool_choice` (string or object)
How the model should select which tool(s) to use when generating a response.

**String options:**
- `"auto"`: Model decides which tools to use
- `"none"`: Don't use any tools
- `"required"`: Must use at least one tool

**Object option:**
```json
"tool_choice": {
  "type": "function",
  "function": {"name": "search_web"}
}
```

### `tools` (array)
An array of tools the model may call while generating a response.

**Two categories:**
1. **Built-in tools**: Provided by OpenAI (web search, file search, computer use)
2. **Function calls**: Custom tools you define

```json
"tools": [
  {"type": "web_search"},
  {"type": "file_search"},
  {
    "type": "function",
    "function": {
      "name": "get_weather",
      "description": "Get current weather",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {"type": "string"}
        }
      }
    }
  }
]
```

See [06-tools-and-functions.md](06-tools-and-functions.md) for comprehensive tool documentation.

### `top_p` (number, default: 1.0)
Alternative to sampling with temperature, called nucleus sampling. Considers tokens with top_p probability mass.

```json
"top_p": 0.9
```

For example, 0.1 means only tokens comprising the top 10% probability mass are considered.

### `truncation` (string, default: "disabled")
The truncation strategy to use for the model response.

**Options:**
- `"auto"`: Truncate by dropping middle items if context exceeds model's window
- `"disabled"`: Fail with 400 error if context exceeds window

```json
"truncation": "auto"
```

### `user` (string)
A stable identifier for your end-users. Used to boost cache hit rates and help OpenAI detect and prevent abuse.

```json
"user": "user_12345"
```

---

## Parameter Combinations

### Basic Text Generation
```json
{
  "model": "gpt-4o",
  "input": "Write a haiku about programming",
  "temperature": 0.8,
  "max_output_tokens": 100
}
```

### Structured Output
```json
{
  "model": "gpt-4o",
  "input": "Extract key information from this text: ...",
  "text": {
    "format": {
      "type": "json_object",
      "json_schema": {...}
    }
  }
}
```

### Multi-turn Conversation
```json
{
  "model": "gpt-4o",
  "input": "What's my favorite color?",
  "previous_response_id": "resp_previous123",
  "instructions": "Remember the user's preferences from previous conversations"
}
```

### Tool-enabled Response
```json
{
  "model": "gpt-4o",
  "input": "Search for recent news about AI and summarize",
  "tools": [{"type": "web_search"}],
  "tool_choice": "auto"
}
```

---

*Next: [04-response-objects.md](04-response-objects.md) - Response object schemas and structures* 