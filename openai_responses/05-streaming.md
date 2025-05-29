# OpenAI Responses API - Streaming

## Overview

When you create a Response with `stream` set to `true`, the server will emit server-sent events to the client as the Response is generated. This enables real-time streaming of the model's output as it's being produced.

## Enable Streaming

Set the `stream` parameter to `true` in your request:

```json
{
  "model": "gpt-4o",
  "input": "Write a story about a dragon",
  "stream": true
}
```

## Server-Sent Events Format

All streaming events follow this format:
```
data: {"type": "event_type", ...event_data}

```

Each event contains:
- `type`: The event type (e.g., "response.created")
- `sequence_number`: Sequential number for ordering events
- Additional event-specific properties

---

## Response Lifecycle Events

### `response.created`
Emitted when a response is initially created.

**Properties:**
- `response`: The response object that was created
- `sequence_number`: Event sequence number
- `type`: Always "response.created"

```json
{
  "type": "response.created",
  "response": {
    "id": "resp_67ccfcdd16748190a91872c75d38539e09e4d4aac714747c",
    "object": "response",
    "created_at": 1741487325,
    "status": "in_progress",
    "model": "gpt-4o-2024-08-06",
    "output": [],
    "usage": null
  },
  "sequence_number": 1
}
```

### `response.queued`
Emitted when a response is queued and waiting to be processed.

```json
{
  "type": "response.queued",
  "response": {
    "id": "res_123",
    "status": "queued",
    "created_at": "2021-01-01T00:00:00Z"
  },
  "sequence_number": 1
}
```

### `response.in_progress`
Emitted when the response generation is actively in progress.

```json
{
  "type": "response.in_progress",
  "response": {
    "id": "resp_67ccfcdd16748190a91872c75d38539e09e4d4aac714747c",
    "status": "in_progress",
    "model": "gpt-4o-2024-08-06"
  },
  "sequence_number": 2
}
```

### `response.completed`
Emitted when the model response is complete.

```json
{
  "type": "response.completed",
  "response": {
    "id": "resp_123",
    "status": "completed",
    "output": [
      {
        "id": "msg_123",
        "type": "message",
        "role": "assistant",
        "content": [
          {
            "type": "output_text",
            "text": "Complete story text...",
            "annotations": []
          }
        ]
      }
    ],
    "usage": {
      "input_tokens": 12,
      "output_tokens": 85,
      "total_tokens": 97
    }
  },
  "sequence_number": 15
}
```

### `response.failed`
Emitted when a response fails.

```json
{
  "type": "response.failed",
  "response": {
    "id": "resp_123",
    "status": "failed",
    "error": {
      "code": "server_error",
      "message": "The model failed to generate a response."
    }
  },
  "sequence_number": 5
}
```

### `response.incomplete`
Emitted when a response finishes as incomplete.

```json
{
  "type": "response.incomplete",
  "response": {
    "id": "resp_123",
    "status": "incomplete",
    "incomplete_details": {
      "reason": "max_tokens"
    }
  },
  "sequence_number": 10
}
```

---

## Output Item Events

### `response.output_item.added`
Emitted when a new output item is added.

**Properties:**
- `item`: The output item that was added
- `output_index`: Index of the output item
- `sequence_number`: Event sequence number

```json
{
  "type": "response.output_item.added",
  "output_index": 0,
  "item": {
    "id": "msg_123",
    "status": "in_progress",
    "type": "message",
    "role": "assistant",
    "content": []
  },
  "sequence_number": 3
}
```

### `response.output_item.done`
Emitted when an output item is marked done.

```json
{
  "type": "response.output_item.done",
  "output_index": 0,
  "item": {
    "id": "msg_123",
    "status": "completed",
    "type": "message",
    "role": "assistant",
    "content": [
      {
        "type": "output_text",
        "text": "Complete text content...",
        "annotations": []
      }
    ]
  },
  "sequence_number": 12
}
```

---

## Content Part Events

### `response.content_part.added`
Emitted when a new content part is added.

**Properties:**
- `content_index`: Index of the content part
- `item_id`: ID of the output item
- `output_index`: Index of the output item
- `part`: The content part that was added

```json
{
  "type": "response.content_part.added",
  "item_id": "msg_123",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "output_text",
    "text": "",
    "annotations": []
  },
  "sequence_number": 4
}
```

### `response.content_part.done`
Emitted when a content part is done.

```json
{
  "type": "response.content_part.done",
  "item_id": "msg_123",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "output_text",
    "text": "Final complete text content",
    "annotations": []
  },
  "sequence_number": 11
}
```

---

## Text Streaming Events

### `response.output_text.delta`
Emitted when there is an additional text delta (the most common streaming event).

**Properties:**
- `content_index`: Index of the content part
- `delta`: The text delta that was added
- `item_id`: ID of the output item
- `output_index`: Index of the output item

```json
{
  "type": "response.output_text.delta",
  "item_id": "msg_123",
  "output_index": 0,
  "content_index": 0,
  "delta": "Once upon a time",
  "sequence_number": 5
}
```

### `response.output_text.done`
Emitted when text content is finalized.

```json
{
  "type": "response.output_text.done",
  "item_id": "msg_123",
  "output_index": 0,
  "content_index": 0,
  "text": "Complete final text of the story...",
  "sequence_number": 10
}
```

### `response.output_text.annotation.added`
Emitted when a text annotation is added.

```json
{
  "type": "response.output_text.annotation.added",
  "item_id": "msg_abc123",
  "output_index": 0,
  "content_index": 0,
  "annotation_index": 0,
  "annotation": {
    "type": "file_citation",
    "index": 390,
    "file_id": "file-4wDz5b167pAf72nx1h9eiN",
    "filename": "dragons.pdf"
  },
  "sequence_number": 8
}
```

---

## Tool Call Events

### Web Search Events

#### `response.web_search_call.in_progress`
```json
{
  "type": "response.web_search_call.in_progress",
  "output_index": 0,
  "item_id": "ws_123",
  "sequence_number": 3
}
```

#### `response.web_search_call.searching`
```json
{
  "type": "response.web_search_call.searching", 
  "output_index": 0,
  "item_id": "ws_123",
  "sequence_number": 4
}
```

#### `response.web_search_call.completed`
```json
{
  "type": "response.web_search_call.completed",
  "output_index": 0,
  "item_id": "ws_123",
  "sequence_number": 6
}
```

### File Search Events

#### `response.file_search_call.in_progress`
```json
{
  "type": "response.file_search_call.in_progress",
  "output_index": 0,
  "item_id": "fs_123",
  "sequence_number": 3
}
```

#### `response.file_search_call.searching`
```json
{
  "type": "response.file_search_call.searching",
  "output_index": 0,
  "item_id": "fs_123",
  "sequence_number": 4
}
```

#### `response.file_search_call.completed`
```json
{
  "type": "response.file_search_call.completed",
  "output_index": 0,
  "item_id": "fs_123",
  "sequence_number": 6
}
```

---

## Function Call Events

### `response.function_call_arguments.delta`
Emitted when there is a partial function-call arguments delta.

```json
{
  "type": "response.function_call_arguments.delta",
  "item_id": "item-abc",
  "output_index": 0,
  "delta": "{ \"arg\":",
  "sequence_number": 5
}
```

### `response.function_call_arguments.done`
Emitted when function-call arguments are finalized.

```json
{
  "type": "response.function_call_arguments.done",
  "item_id": "item-abc",
  "output_index": 0,
  "arguments": "{ \"arg\": 123 }",
  "sequence_number": 7
}
```

---

## Reasoning Events (O-series Models)

### `response.reasoning.delta`
Emitted when there is a delta to the reasoning content.

```json
{
  "type": "response.reasoning.delta",
  "item_id": "item-abc",
  "output_index": 0,
  "content_index": 0,
  "delta": {
    "text": "Let me think about this..."
  },
  "sequence_number": 4
}
```

### `response.reasoning.done`
Emitted when the reasoning content is finalized.

```json
{
  "type": "response.reasoning.done",
  "item_id": "item-abc",
  "output_index": 0,
  "content_index": 0,
  "text": "Complete reasoning process...",
  "sequence_number": 8
}
```

### `response.reasoning_summary_part.added`
Emitted when a new reasoning summary part is added.

```json
{
  "type": "response.reasoning_summary_part.added",
  "item_id": "rs_6806bfca0b2481918a5748308061a2600d3ce51bdffd5476",
  "output_index": 0,
  "summary_index": 0,
  "part": {
    "type": "summary_text",
    "text": ""
  },
  "sequence_number": 6
}
```

### `response.reasoning_summary_text.delta`
Emitted when a delta is added to a reasoning summary text.

```json
{
  "type": "response.reasoning_summary_text.delta",
  "item_id": "rs_6806bfca0b2481918a5748308061a2600d3ce51bdffd5476",
  "output_index": 0,
  "summary_index": 0,
  "delta": "The user asked about...",
  "sequence_number": 7
}
```

---

## Refusal Events

### `response.refusal.delta`
Emitted when there is a partial refusal text.

```json
{
  "type": "response.refusal.delta",
  "item_id": "msg_123",
  "output_index": 0,
  "content_index": 0,
  "delta": "I can't help with that because...",
  "sequence_number": 5
}
```

### `response.refusal.done`
Emitted when refusal text is finalized.

```json
{
  "type": "response.refusal.done",
  "item_id": "item-abc",
  "output_index": 0,
  "content_index": 0,
  "refusal": "I cannot provide information on that topic.",
  "sequence_number": 7
}
```

---

## Error Events

### `error`
Emitted when an error occurs during streaming.

```json
{
  "type": "error",
  "code": "ERR_SOMETHING",
  "message": "Something went wrong",
  "param": null,
  "sequence_number": 5
}
```

---

## Client Implementation

### JavaScript Example

```javascript
const response = await fetch('https://api.openai.com/v1/responses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    input: 'Tell me a story',
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      
      if (data.type === 'response.output_text.delta') {
        process.stdout.write(data.delta);
      } else if (data.type === 'response.completed') {
        console.log('\n✅ Response completed');
      }
    }
  }
}
```

### Python Example

```python
import openai
import json

client = openai.OpenAI()

stream = client.responses.create(
    model="gpt-4o",
    input="Tell me a story",
    stream=True
)

for chunk in stream:
    if chunk.type == "response.output_text.delta":
        print(chunk.delta, end="", flush=True)
    elif chunk.type == "response.completed":
        print("\n✅ Response completed")
```

---

## Best Practices

### 1. Handle All Event Types
Always handle unexpected event types gracefully:

```javascript
switch (event.type) {
  case 'response.output_text.delta':
    appendText(event.delta);
    break;
  case 'response.completed':
    markCompleted();
    break;
  case 'error':
    handleError(event);
    break;
  default:
    console.log('Unknown event type:', event.type);
}
```

### 2. Use Sequence Numbers
Use sequence numbers to ensure proper ordering:

```javascript
const events = [];
events.push(event);
events.sort((a, b) => a.sequence_number - b.sequence_number);
```

### 3. Buffer Partial Content
Buffer deltas before displaying:

```javascript
let buffer = '';
if (event.type === 'response.output_text.delta') {
  buffer += event.delta;
  // Update UI with buffer content
}
```

### 4. Handle Disconnections
Implement reconnection logic:

```javascript
stream.addEventListener('error', () => {
  setTimeout(reconnect, 1000);
});
```

---

*Next: [06-tools-and-functions.md](06-tools-and-functions.md) - Built-in tools and function calling* 