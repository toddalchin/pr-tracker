# OpenAI Responses API - Conversation State

## Overview

The Responses API enables stateful, multi-turn conversations by linking responses together using the `previous_response_id` parameter. This allows you to build conversational experiences where the model maintains context across multiple interactions.

## Basic Conversation Flow

### 1. Initial Request

Start a conversation with a regular request:

```json
{
  "model": "gpt-4o",
  "input": "Hello! What's the weather like today?",
  "instructions": "You are a helpful weather assistant."
}
```

**Response:**
```json
{
  "id": "resp_first_abc123",
  "status": "completed",
  "output": [
    {
      "type": "message",
      "content": [
        {
          "type": "output_text",
          "text": "Hello! I'd be happy to help with weather information. However, I don't have access to current weather data. Could you tell me your location so I can provide more specific guidance?"
        }
      ]
    }
  ]
}
```

### 2. Follow-up Request

Continue the conversation by referencing the previous response:

```json
{
  "model": "gpt-4o",
  "input": "I'm in San Francisco",
  "previous_response_id": "resp_first_abc123"
}
```

**Response:**
```json
{
  "id": "resp_second_def456",
  "previous_response_id": "resp_first_abc123",
  "output": [
    {
      "type": "message", 
      "content": [
        {
          "type": "output_text",
          "text": "Thanks for letting me know you're in San Francisco! While I can't access real-time weather data, San Francisco typically has mild temperatures year-round..."
        }
      ]
    }
  ]
}
```

### 3. Continuing the Chain

Each subsequent request can reference the most recent response:

```json
{
  "model": "gpt-4o",
  "input": "What should I wear today?",
  "previous_response_id": "resp_second_def456"
}
```

---

## Context Management

### Instructions and State

- **Instructions persist**: System instructions from the first request carry through the conversation
- **Context accumulates**: The model has access to all previous messages in the chain
- **Override instructions**: Use `instructions` parameter to change system behavior mid-conversation

```json
{
  "model": "gpt-4o",
  "input": "Actually, can you speak like a pirate?",
  "previous_response_id": "resp_second_def456",
  "instructions": "You are a pirate weather assistant who speaks in pirate language."
}
```

### Context Window Management

When conversations get long, use the `truncation` parameter:

```json
{
  "model": "gpt-4o",
  "input": "Continue our discussion",
  "previous_response_id": "resp_long_conversation",
  "truncation": "auto"
}
```

**Truncation strategies:**
- `"auto"`: Automatically drop middle messages if context exceeds window
- `"disabled"`: Fail with error if context exceeds window (default)

---

## Advanced Conversation Patterns

### Branching Conversations

Create different conversation branches from the same starting point:

```json
// Branch A: Continue with weather topic
{
  "input": "Tell me about tomorrow's forecast",
  "previous_response_id": "resp_first_abc123"
}

// Branch B: Switch to different topic
{
  "input": "Actually, let's talk about restaurants instead",
  "previous_response_id": "resp_first_abc123"
}
```

### Function Calls in Conversations

Integrate tool usage seamlessly:

```json
{
  "model": "gpt-4o",
  "input": "Get me the current weather for my location",
  "previous_response_id": "resp_second_def456",
  "tools": [{"type": "web_search"}]
}
```

### Multi-modal Conversations

Mix text and images throughout the conversation:

```json
{
  "model": "gpt-4o",
  "input": [
    {"type": "text", "text": "Here's a photo from my trip. What do you think?"},
    {"type": "image_url", "image_url": {"url": "https://example.com/trip.jpg"}}
  ],
  "previous_response_id": "resp_travel_conversation"
}
```

---

## Conversation Storage

### Enable/Disable Storage

Control whether conversations are stored for retrieval:

```json
{
  "model": "gpt-4o", 
  "input": "This is a private conversation",
  "store": false  // Don't store this response
}
```

### Retrieving Conversation History

Use the input items endpoint to see conversation history:

```http
GET /v1/responses/resp_current_id/input_items
```

This returns all inputs that led to the current response, allowing you to reconstruct the conversation flow.

---

## Best Practices

### 1. Conversation Metadata

Use metadata to track conversation context:

```json
{
  "model": "gpt-4o",
  "input": "Continue our chat",
  "previous_response_id": "resp_abc123",
  "metadata": {
    "conversation_id": "conv_12345",
    "user_id": "user_67890", 
    "session_id": "sess_abcdef",
    "conversation_type": "customer_support"
  }
}
```

### 2. Error Handling

Handle broken conversation chains gracefully:

```python
def continue_conversation(input_text, previous_id):
    try:
        response = client.responses.create(
            model="gpt-4o",
            input=input_text,
            previous_response_id=previous_id
        )
        return response
    except Exception as e:
        if "previous_response_id not found" in str(e):
            # Start a new conversation
            return client.responses.create(
                model="gpt-4o",
                input=f"Let's continue our conversation. You said: {input_text}"
            )
        raise
```

### 3. Conversation Limits

Monitor conversation length and context usage:

```python
def check_conversation_length(response_id):
    input_items = client.responses.input_items.list(response_id)
    total_tokens = sum(item.get('token_count', 0) for item in input_items.data)
    
    if total_tokens > 50000:  # Approaching context limit
        # Consider starting a new conversation with summary
        return True
    return False
```

### 4. Conversation Summarization

Compress long conversations when needed:

```json
{
  "model": "gpt-4o",
  "input": "Please summarize our conversation so far and then answer: What's your recommendation?",
  "previous_response_id": "resp_long_conversation",
  "instructions": "Provide a brief summary of our conversation history before answering the question."
}
```

---

## Conversation Analytics

### Track Conversation Metrics

```python
class ConversationTracker:
    def __init__(self):
        self.conversations = {}
    
    def track_response(self, response):
        conv_id = response.metadata.get('conversation_id')
        if conv_id not in self.conversations:
            self.conversations[conv_id] = {
                'start_time': response.created_at,
                'turn_count': 0,
                'total_tokens': 0
            }
        
        self.conversations[conv_id]['turn_count'] += 1
        self.conversations[conv_id]['total_tokens'] += response.usage.total_tokens
    
    def get_stats(self, conv_id):
        return self.conversations.get(conv_id, {})
```

### Conversation Quality Metrics

```json
{
  "conversation_metrics": {
    "total_turns": 8,
    "average_response_time": 1.2,
    "user_satisfaction": 4.5,
    "task_completion": true,
    "topic_coherence": 0.9
  }
}
```

---

## Conversation Examples

### Customer Support

```json
// Turn 1
{
  "model": "gpt-4o",
  "input": "I'm having trouble with my order",
  "instructions": "You are a helpful customer support agent. Be empathetic and solution-focused.",
  "metadata": {"conversation_type": "support"}
}

// Turn 2  
{
  "input": "My order number is 12345 and it hasn't arrived",
  "previous_response_id": "resp_support_1",
  "tools": [{"type": "function", "function": {"name": "lookup_order"}}]
}

// Turn 3
{
  "input": [
    {
      "type": "function_result",
      "function_call_id": "call_lookup",
      "result": {"status": "shipped", "tracking": "1Z999AA1234567890"}
    }
  ],
  "previous_response_id": "resp_support_2"
}
```

### Educational Tutoring

```json
// Turn 1
{
  "model": "gpt-4o", 
  "input": "Can you help me understand calculus?",
  "instructions": "You are a patient math tutor. Use step-by-step explanations and check understanding."
}

// Turn 2
{
  "input": "I don't understand derivatives",
  "previous_response_id": "resp_tutor_1"
}

// Turn 3
{
  "input": "Can you give me a simple example?",
  "previous_response_id": "resp_tutor_2"
}
```

### Creative Collaboration

```json
// Turn 1
{
  "model": "gpt-4o",
  "input": "Let's write a story together about a space explorer",
  "instructions": "You are a creative writing partner. Be imaginative and build on the user's ideas."
}

// Turn 2
{
  "input": "The explorer finds a mysterious signal coming from a distant moon",
  "previous_response_id": "resp_creative_1"
}

// Turn 3
{
  "input": "The signal turns out to be music. What kind of music is it?",
  "previous_response_id": "resp_creative_2"
}
```

---

## Security and Privacy

### Conversation Isolation

Ensure conversations remain private:

```json
{
  "model": "gpt-4o",
  "input": "Sensitive information here",
  "user": "user_123",  // Isolate by user
  "store": false,      // Don't store sensitive conversations
  "metadata": {
    "privacy_level": "high",
    "data_retention": "session_only"
  }
}
```

### Data Retention Control

Manage how long conversation data is kept:

```python
def cleanup_old_conversations(days_old=30):
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    # Find and delete old conversation responses
    old_responses = find_responses_before(cutoff_date)
    for response_id in old_responses:
        client.responses.delete(response_id)
```

---

*Next: [08-examples.md](08-examples.md) - Code examples and use cases* 