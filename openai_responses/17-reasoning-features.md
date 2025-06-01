# Reasoning Features

## Overview

OpenAI's reasoning models (o1, o3, o3-mini, o4-mini) generate internal reasoning tokens as part of their problem-solving process. The Responses API now provides two key features to work with this reasoning:

1. **Reasoning Summaries**: Natural language summaries of the model's chain-of-thought
2. **Encrypted Reasoning Items**: Secure, reusable reasoning tokens for enterprise customers

**Key Benefits:**
- **Transparency**: Understand how models arrive at conclusions
- **Debugging**: Identify reasoning patterns and potential issues
- **Optimization**: Reuse reasoning context across requests
- **Enterprise Security**: ZDR-compatible reasoning token management

## Reasoning Summaries

### Basic Usage

Get a summary of the model's internal reasoning process:

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="o4-mini",
    input="I need to solve the equation 3x + 11 = 14. Can you help me?",
    tools=[{
        "type": "code_interpreter",
        "container": {"type": "auto"}
    }],
    instructions="You are a personal math tutor. When asked a math question, run code to answer the question.",
    reasoning={"summary": "auto"}  # Enable reasoning summaries
)

# Access the reasoning summary
if hasattr(response, 'reasoning') and response.reasoning:
    for item in response.reasoning:
        if item.type == "reasoning_summary":
            print(f"Reasoning Summary: {item.summary}")
```

### Summary Types

| Summary Type | Description | Availability |
|--------------|-------------|--------------|
| `auto` | Best available summary for the model | All reasoning models |
| `detailed` | Comprehensive reasoning explanation | o4-mini, select models |
| `concise` | Brief reasoning overview | Computer use model, others |

### Configuration Options

```python
# Auto mode - best available summary
response = client.responses.create(
    model="o3",
    input="Complex reasoning task",
    reasoning={"summary": "auto"}
)

# Specific effort level with summary
response = client.responses.create(
    model="o3",
    input="Mathematical proof",
    reasoning={
        "effort": "medium",
        "summary": "auto"
    }
)

# High effort reasoning with detailed summary
response = client.responses.create(
    model="o3",
    input="Complex analysis task",
    reasoning={
        "effort": "high",
        "summary": "detailed"  # Request detailed summary if available
    }
)
```

## Streaming Reasoning Summaries

### Real-time Summary Streaming

```python
# Stream reasoning summaries as they're generated
stream = client.responses.create(
    model="o4-mini",
    input="Solve this complex problem step by step",
    reasoning={"summary": "auto"},
    stream=True
)

for event in stream:
    if event.type == "response.reasoning_summary.delta":
        print(f"Reasoning update: {event.delta}")
    elif event.type == "response.reasoning_summary.done":
        print(f"Final reasoning: {event.text}")
```

### Summary Event Types

```python
# Handle different reasoning summary events
def handle_reasoning_events(stream):
    reasoning_parts = {}
    
    for event in stream:
        if event.type == "response.reasoning_summary_part.added":
            reasoning_parts[event.index] = {"text": ""}
            
        elif event.type == "response.reasoning_summary_text.delta":
            if event.index in reasoning_parts:
                reasoning_parts[event.index]["text"] += event.delta
                
        elif event.type == "response.reasoning_summary_text.done":
            print(f"Reasoning part {event.index}: {event.text}")
            
        elif event.type == "response.reasoning_summary_part.done":
            print(f"Completed reasoning part {event.index}")

# Usage
stream = client.responses.create(
    model="o3",
    input="Multi-step reasoning problem",
    reasoning={"summary": "auto"},
    stream=True
)

handle_reasoning_events(stream)
```

## Encrypted Reasoning Items

### Overview

For customers with Zero Data Retention (ZDR), encrypted reasoning items allow reusing reasoning tokens across API requests without storing them on OpenAI's servers.

**Benefits:**
- **Enhanced Intelligence**: Reuse reasoning context between function calls
- **Reduced Costs**: Lower token usage through caching
- **Improved Performance**: Higher cache hit rates and reduced latency
- **Enterprise Security**: ZDR-compatible with client-side encryption

### Basic Usage

```python
# Generate response with encrypted reasoning
response = client.responses.create(
    model="o3",
    input="Implement a simple web server in Rust from scratch.",
    store=False,  # Required for ZDR
    include=["reasoning.encrypted_content"]  # Include encrypted reasoning
)

# The response will contain encrypted reasoning items
for item in response.output:
    if item.type == "reasoning":
        print(f"Reasoning ID: {item.id}")
        if hasattr(item, 'encrypted_content'):
            print("Encrypted reasoning content available")
```

### Multi-turn Conversations with Encrypted Reasoning

```python
# First request - generate initial reasoning
response1 = client.responses.create(
    model="o3",
    input="Start analyzing this complex dataset",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    store=False,
    include=["reasoning.encrypted_content"]
)

# Extract reasoning items for reuse
reasoning_items = [
    item for item in response1.output 
    if item.type == "reasoning" and hasattr(item, 'encrypted_content')
]

# Second request - reuse reasoning context
response2 = client.responses.create(
    model="o3",
    input=[
        # Include previous reasoning
        *reasoning_items,
        {"type": "message", "content": "Now perform statistical analysis on the results"}
    ],
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}],
    store=False,
    include=["reasoning.encrypted_content"]
)
```

### Reasoning Context Management

```python
class ReasoningContextManager:
    def __init__(self, client):
        self.client = client
        self.reasoning_context = []
    
    def add_reasoning_request(self, input_text, **kwargs):
        """Add a request and collect reasoning context"""
        response = self.client.responses.create(
            model="o3",
            input=input_text,
            store=False,
            include=["reasoning.encrypted_content"],
            **kwargs
        )
        
        # Extract and store reasoning items
        new_reasoning = [
            item for item in response.output 
            if item.type == "reasoning" and hasattr(item, 'encrypted_content')
        ]
        self.reasoning_context.extend(new_reasoning)
        
        return response
    
    def continue_with_context(self, input_text, **kwargs):
        """Continue conversation with accumulated reasoning context"""
        full_input = [
            *self.reasoning_context,  # Include all previous reasoning
            {"type": "message", "content": input_text}
        ]
        
        response = self.client.responses.create(
            model="o3",
            input=full_input,
            store=False,
            include=["reasoning.encrypted_content"],
            **kwargs
        )
        
        # Add new reasoning to context
        new_reasoning = [
            item for item in response.output 
            if item.type == "reasoning" and hasattr(item, 'encrypted_content')
        ]
        self.reasoning_context.extend(new_reasoning)
        
        return response

# Usage
context_manager = ReasoningContextManager(client)

# Build up reasoning context
response1 = context_manager.add_reasoning_request(
    "Analyze the structure of this codebase",
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}]
)

response2 = context_manager.continue_with_context(
    "Now identify potential performance bottlenecks"
)

response3 = context_manager.continue_with_context(
    "Suggest specific optimizations based on your analysis"
)
```

## Advanced Reasoning Features

### Reasoning with Tool Calls

Reasoning models can use tools within their chain-of-thought:

```python
# o3 and o4-mini can use Code Interpreter in their reasoning
response = client.responses.create(
    model="o3",
    input="Calculate the compound interest on $1000 at 5% annually for 10 years, then create a visualization",
    tools=[{
        "type": "code_interpreter",
        "container": {"type": "auto"}
    }],
    reasoning={
        "effort": "high",
        "summary": "auto"
    }
)

# The model will use Code Interpreter within its reasoning process
# This improves performance on mathematical and analytical tasks
```

### Reasoning Effort Levels

```python
# Low effort - faster, less thorough reasoning
response = client.responses.create(
    model="o3",
    input="Quick analysis of this problem",
    reasoning={
        "effort": "low",
        "summary": "auto"
    }
)

# Medium effort - balanced reasoning (default)
response = client.responses.create(
    model="o3", 
    input="Standard problem solving",
    reasoning={
        "effort": "medium",
        "summary": "auto"
    }
)

# High effort - thorough, comprehensive reasoning
response = client.responses.create(
    model="o3",
    input="Complex mathematical proof",
    reasoning={
        "effort": "high",
        "summary": "auto"
    }
)
```

## Reasoning Analysis and Debugging

### Analyzing Reasoning Patterns

```python
def analyze_reasoning_summary(response):
    """Analyze reasoning summaries for patterns"""
    reasoning_analysis = {
        "summary_count": 0,
        "key_insights": [],
        "reasoning_steps": [],
        "tool_usage": []
    }
    
    for item in response.output:
        if item.type == "reasoning_summary":
            reasoning_analysis["summary_count"] += 1
            
            # Extract key insights (example analysis)
            if "because" in item.summary.lower():
                reasoning_analysis["key_insights"].append(item.summary)
                
            # Identify reasoning steps
            if any(word in item.summary.lower() for word in ["first", "then", "next", "finally"]):
                reasoning_analysis["reasoning_steps"].append(item.summary)
                
        elif item.type in ["code_interpreter_call", "function_call", "mcp_call"]:
            reasoning_analysis["tool_usage"].append(item.type)
    
    return reasoning_analysis

# Usage
response = client.responses.create(
    model="o4-mini",
    input="Solve this multi-step problem with detailed reasoning",
    reasoning={"summary": "auto"},
    tools=[{"type": "code_interpreter", "container": {"type": "auto"}}]
)

analysis = analyze_reasoning_summary(response)
print(f"Reasoning analysis: {analysis}")
```

### Debugging Reasoning Issues

```python
def debug_reasoning_response(response):
    """Debug reasoning-related issues in responses"""
    debug_info = {
        "has_reasoning": False,
        "has_summaries": False,
        "encrypted_items": 0,
        "reasoning_errors": [],
        "summary_quality": "unknown"
    }
    
    for item in response.output:
        if item.type == "reasoning":
            debug_info["has_reasoning"] = True
            if hasattr(item, 'encrypted_content'):
                debug_info["encrypted_items"] += 1
                
        elif item.type == "reasoning_summary":
            debug_info["has_summaries"] = True
            
            # Basic quality assessment
            if len(item.summary) < 50:
                debug_info["summary_quality"] = "brief"
            elif len(item.summary) > 200:
                debug_info["summary_quality"] = "detailed"
            else:
                debug_info["summary_quality"] = "moderate"
                
        elif item.type == "error" and "reasoning" in str(item).lower():
            debug_info["reasoning_errors"].append(item)
    
    return debug_info

# Usage for debugging
response = client.responses.create(
    model="o3",
    input="Test reasoning functionality",
    reasoning={"summary": "auto"},
    store=False,
    include=["reasoning.encrypted_content"]
)

debug_info = debug_reasoning_response(response)
print(f"Debug info: {debug_info}")
```

## Enterprise Integration

### ZDR-Compatible Reasoning Workflow

```python
class EnterpriseReasoningManager:
    def __init__(self, client):
        self.client = client
        self.session_reasoning = {}
    
    def create_reasoning_session(self, session_id):
        """Create a new reasoning session"""
        self.session_reasoning[session_id] = []
    
    def add_to_session(self, session_id, input_text, **kwargs):
        """Add reasoning request to session"""
        if session_id not in self.session_reasoning:
            self.create_reasoning_session(session_id)
        
        # Include previous reasoning from session
        full_input = [
            *self.session_reasoning[session_id],
            {"type": "message", "content": input_text}
        ]
        
        response = self.client.responses.create(
            model="o3",
            input=full_input,
            store=False,  # ZDR requirement
            include=["reasoning.encrypted_content"],
            **kwargs
        )
        
        # Store encrypted reasoning for session
        new_reasoning = [
            item for item in response.output 
            if item.type == "reasoning" and hasattr(item, 'encrypted_content')
        ]
        self.session_reasoning[session_id].extend(new_reasoning)
        
        return response
    
    def get_session_summary(self, session_id):
        """Get summary of reasoning session"""
        if session_id not in self.session_reasoning:
            return None
            
        return {
            "session_id": session_id,
            "reasoning_items": len(self.session_reasoning[session_id]),
            "total_size": sum(
                len(str(item)) for item in self.session_reasoning[session_id]
            )
        }
    
    def clear_session(self, session_id):
        """Clear reasoning session data"""
        if session_id in self.session_reasoning:
            del self.session_reasoning[session_id]

# Usage
reasoning_manager = EnterpriseReasoningManager(client)

# Create and use reasoning session
reasoning_manager.create_reasoning_session("analysis_001")

response1 = reasoning_manager.add_to_session(
    "analysis_001",
    "Begin analysis of market trends",
    tools=[{"type": "web_search"}]
)

response2 = reasoning_manager.add_to_session(
    "analysis_001", 
    "Now perform quantitative analysis"
)

# Get session summary
summary = reasoning_manager.get_session_summary("analysis_001")
print(f"Session summary: {summary}")
```

## Model Compatibility

### Reasoning Summary Support

| Model | Summary Support | Best Summary Type |
|-------|----------------|-------------------|
| **o1** | ✅ Auto | `auto` |
| **o3** | ✅ Auto | `auto` |
| **o3-mini** | ✅ Auto | `auto` |
| **o4-mini** | ✅ Detailed | `detailed` |
| **Computer Use Model** | ✅ Concise | `concise` |

### Encrypted Reasoning Support

| Model | Encrypted Reasoning | ZDR Compatible |
|-------|-------------------|----------------|
| **o1** | ✅ Yes | ✅ Yes |
| **o3** | ✅ Yes | ✅ Yes |
| **o3-mini** | ✅ Yes | ✅ Yes |
| **o4-mini** | ✅ Yes | ✅ Yes |

### Tool Integration in Reasoning

| Model | Code Interpreter in Reasoning | Benchmark Improvement |
|-------|------------------------------|----------------------|
| **o3** | ✅ Yes | ✅ Humanity's Last Exam |
| **o4-mini** | ✅ Yes | ✅ Humanity's Last Exam |
| **o1** | ❌ No | - |
| **o3-mini** | ❌ No | - |

## Best Practices

### 1. Summary Configuration

```python
# Choose appropriate summary level
def get_optimal_summary_config(task_complexity, debug_mode=False):
    if debug_mode:
        return {"summary": "detailed"}  # Most information for debugging
    elif task_complexity == "high":
        return {"summary": "auto", "effort": "high"}
    else:
        return {"summary": "auto"}  # Efficient for most tasks

# Usage
config = get_optimal_summary_config("high", debug_mode=True)
response = client.responses.create(
    model="o3",
    input="Complex task",
    reasoning=config
)
```

### 2. Efficient Context Management

```python
# Manage reasoning context efficiently
def optimize_reasoning_context(reasoning_items, max_items=10):
    """Keep only the most recent reasoning items"""
    if len(reasoning_items) > max_items:
        return reasoning_items[-max_items:]
    return reasoning_items

# Usage in context manager
class OptimizedReasoningManager:
    def __init__(self, client, max_context_items=10):
        self.client = client
        self.reasoning_context = []
        self.max_context_items = max_context_items
    
    def add_request(self, input_text, **kwargs):
        # Optimize context before request
        optimized_context = optimize_reasoning_context(
            self.reasoning_context, 
            self.max_context_items
        )
        
        full_input = [
            *optimized_context,
            {"type": "message", "content": input_text}
        ]
        
        response = self.client.responses.create(
            model="o3",
            input=full_input,
            store=False,
            include=["reasoning.encrypted_content"],
            **kwargs
        )
        
        # Add new reasoning
        new_reasoning = [
            item for item in response.output 
            if item.type == "reasoning" and hasattr(item, 'encrypted_content')
        ]
        self.reasoning_context.extend(new_reasoning)
        
        return response
```

### 3. Error Handling

```python
def robust_reasoning_request(client, **kwargs):
    """Make reasoning request with error handling"""
    try:
        response = client.responses.create(**kwargs)
        
        # Verify reasoning features are working
        has_reasoning = any(
            item.type in ["reasoning", "reasoning_summary"] 
            for item in response.output
        )
        
        if not has_reasoning and kwargs.get("reasoning"):
            print("Warning: No reasoning items found in response")
        
        return response
        
    except Exception as e:
        print(f"Error in reasoning request: {e}")
        
        # Fallback without reasoning features
        fallback_kwargs = {k: v for k, v in kwargs.items() if k != "reasoning"}
        return client.responses.create(**fallback_kwargs)
```

## Pricing

- **Reasoning Summaries**: Available at no additional cost
- **Encrypted Reasoning Items**: No additional fees for ZDR customers
- **Token Efficiency**: Reusing reasoning context reduces overall token usage
- **Performance Benefits**: Improved cache hit rates lower costs

## Limitations

1. **ZDR Requirement**: Encrypted reasoning items require Zero Data Retention eligibility
2. **Model Support**: Features vary by model (see compatibility table)
3. **Context Limits**: Reasoning context counts toward token limits
4. **Summary Quality**: Summary detail varies by model capabilities

---

*This completes the core reasoning features documentation. These features enable transparency, debugging, and efficient reasoning context management for enterprise applications.* 