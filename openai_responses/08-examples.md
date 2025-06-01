# OpenAI Responses API - Examples and Use Cases

## Quick Start Examples

### Basic Text Generation

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4o",
    input="Write a short story about a robot learning to paint"
)

print(response.output_text)
```

```javascript
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Write a short story about a robot learning to paint"
});

console.log(response.output_text);
```

### Structured Output

```python
# Generate structured JSON output
response = client.responses.create(
    model="gpt-4o",
    input="Create a product catalog entry for a wireless headphones",
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "product_entry",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "price": {"type": "number"},
                    "features": {
                        "type": "array", 
                        "items": {"type": "string"}
                    },
                    "rating": {"type": "number", "minimum": 1, "maximum": 5}
                },
                "required": ["name", "price", "features"],
                "additionalProperties": False
            }
        }
    }
)

import json
product = json.loads(response.output_text)
print(f"Product: {product['name']} - ${product['price']}")
```

---

## NEW: MCP Integration Examples (May 2025)

### E-commerce Workflow with Shopify + Stripe

```python
# Complete e-commerce workflow using MCP servers
response = client.responses.create(
    model="gpt-4.1",
    tools=[
        {"type": "web_search_preview"},
        {
            "type": "mcp",
            "server_label": "shopify",
            "server_url": "https://store.example.com/api/mcp",
            "require_approval": "never"
        },
        {
            "type": "mcp",
            "server_label": "stripe",
            "server_url": "https://mcp.stripe.com",
            "headers": {"Authorization": "Bearer sk_live_..."},
            "require_approval": "never"
        }
    ],
    input="""
    I need to:
    1. Search for trending skincare products 
    2. Add the top-rated moisturizer to my cart
    3. Create a payment link for checkout
    """
)

print(response.output_text)
```

### Financial Analysis with Plaid + DeepWiki

```python
# Financial data analysis using multiple MCP servers
response = client.responses.create(
    model="o3",
    tools=[
        {
            "type": "mcp",
            "server_label": "plaid",
            "server_url": "https://plaid.com/mcp",
            "headers": {"Authorization": "Bearer access-sandbox-..."}
        },
        {
            "type": "mcp",
            "server_label": "deepwiki",
            "server_url": "https://mcp.deepwiki.com/mcp"
        },
        {
            "type": "code_interpreter",
            "container": {"type": "auto"}
        }
    ],
    input="""
    Research the latest fintech trends from GitHub repositories,
    analyze my transaction patterns from the last 3 months,
    and create a comprehensive financial health report with visualizations.
    """,
    reasoning={"effort": "high", "summary": "auto"}
)
```

### Communication Automation with Twilio + HubSpot

```python
# Automated communication workflow
response = client.responses.create(
    model="gpt-4.1", 
    tools=[
        {"type": "web_search"},
        {
            "type": "mcp",
            "server_label": "twilio",
            "server_url": "https://your-domain.twil.io/mcp",
            "headers": {"x-twilio-signature": "..."}
        },
        {
            "type": "mcp",
            "server_label": "hubspot",
            "server_url": "https://developers.hubspot.com/mcp",
            "headers": {"Authorization": "Bearer pat-na1-..."}
        }
    ],
    input="""
    Find the latest AI and tech news from this week,
    update our CRM with key industry insights,
    and send SMS alerts to our sales team about relevant opportunities.
    """
)
```

---

## NEW: Code Interpreter Examples (May 2025)

### Data Analysis and Visualization

```python
# Complex data analysis with Code Interpreter
response = client.responses.create(
    model="o3",  # o3 uses Code Interpreter in reasoning
    tools=[{
        "type": "code_interpreter",
        "container": {
            "type": "auto",
            "files": ["sales_data.csv", "customer_data.csv"]
        }
    }],
    input="""
    Analyze the sales and customer data to:
    1. Identify seasonal trends and patterns
    2. Segment customers by behavior and value
    3. Predict next quarter's revenue
    4. Create comprehensive visualizations
    5. Generate actionable recommendations
    """,
    reasoning={"effort": "high", "summary": "auto"}
)

# Download generated files
for item in response.output:
    if item.type == "code_interpreter_call" and item.output:
        for file_ref in item.output.get("files", []):
            # Download the file using container files API
            file_content = client.containers.files.content(
                container_id=item.container_id,
                file_id=file_ref["file_id"]
            )
            with open(f"analysis_{file_ref['filename']}", "wb") as f:
                f.write(file_content)
```

### Mathematical Problem Solving

```python
# Advanced mathematics with step-by-step reasoning
response = client.responses.create(
    model="o4-mini",  # Excellent for math with Code Interpreter
    tools=[{
        "type": "code_interpreter",
        "container": {"type": "auto"}
    }],
    instructions="""
    You are an expert mathematics tutor. For each problem:
    1. Explain the concept clearly
    2. Show step-by-step solution using code
    3. Verify your answer
    4. Create visualizations when helpful
    """,
    input="""
    Solve this system of differential equations:
    dx/dt = 2x - y
    dy/dt = x + 3y
    
    With initial conditions x(0) = 1, y(0) = 0
    Plot the solution and explain the behavior.
    """,
    reasoning={"summary": "auto"}
)
```

### Image Processing and Analysis

```python
# Advanced image analysis with o3/o4-mini "thinking with images"
response = client.responses.create(
    model="o3",  # Can use Code Interpreter for deep image understanding
    tools=[{
        "type": "code_interpreter",
        "container": {
            "type": "auto",
            "files": ["medical_scan.png", "historical_image.jpg"]
        }
    }],
    input="""
    Analyze these images in detail:
    1. Extract and enhance text from the historical image
    2. Perform detailed analysis of the medical scan
    3. Create comparison visualizations
    4. Generate detailed reports with findings
    
    Use advanced image processing techniques and provide comprehensive analysis.
    """,
    reasoning={"effort": "high", "summary": "auto"}
)
```

---

## NEW: Image Generation Examples (May 2025)

### Basic Image Generation

```python
# Generate images with the latest gpt-image-1 model
response = client.responses.create(
    model="o3",  # Only o3 supports image generation in reasoning models
    tools=[{"type": "image_generation"}],
    input="Create a futuristic cityscape at sunset with flying cars and neon lights"
)

# Access generated images
for item in response.output:
    if item.type == "image_generation_call":
        print(f"Generated image: {item.image_url}")
```

### Multi-turn Image Editing

```python
# Iterative image refinement
response1 = client.responses.create(
    model="gpt-4.1",  # GPT-4.1 series supports image generation
    tools=[{"type": "image_generation"}],
    input="Create a minimalist logo for a tech startup called 'NeuralFlow'"
)

# Continue with refinements
response2 = client.responses.create(
    model="gpt-4.1",
    tools=[{"type": "image_generation"}],
    previous_response_id=response1.id,
    input="Make the logo more modern and add a subtle gradient effect"
)

response3 = client.responses.create(
    model="gpt-4.1", 
    tools=[{"type": "image_generation"}],
    previous_response_id=response2.id,
    input="Create variations in different color schemes: blue, green, and purple"
)
```

### Streaming Image Generation

```python
# Stream image generation with real-time previews
stream = client.responses.create(
    model="gpt-4.1",
    tools=[{"type": "image_generation"}],
    input="Create a detailed fantasy landscape with mountains, forests, and magical elements",
    stream=True
)

for event in stream:
    if event.type == "response.image_generation_call.partial_image":
        print(f"Image generation progress: {event.progress}%")
        # Preview URL available: event.preview_url
    elif event.type == "response.image_generation_call.completed":
        print(f"Final image: {event.image_url}")
```

---

## NEW: Background Processing Examples (May 2025)

### Long-form Content Generation

```python
# Generate a comprehensive research report in background
response = client.responses.create(
    model="o3",
    input="""
    Write a comprehensive 10,000-word research report on:
    "The Future of Artificial Intelligence in Healthcare: 
    Opportunities, Challenges, and Ethical Considerations"
    
    Include:
    - Executive summary
    - Current state analysis
    - Emerging technologies review
    - Case studies from leading institutions
    - Regulatory landscape analysis
    - Future predictions and recommendations
    - Comprehensive bibliography
    """,
    tools=[
        {"type": "web_search"},
        {"type": "code_interpreter", "container": {"type": "auto"}}
    ],
    background=True,
    reasoning={"effort": "high", "summary": "auto"}
)

print(f"Started background task: {response.id}")

# Poll for completion
import time

while response.status in {"queued", "in_progress"}:
    print(f"Status: {response.status}")
    time.sleep(30)  # Check every 30 seconds
    response = client.responses.retrieve(response.id)

if response.status == "completed":
    print("Report completed!")
    print(f"Word count: {len(response.output_text.split())}")
```

### Batch Data Processing

```python
# Process multiple datasets in background
def process_batch_analysis(datasets):
    background_tasks = []
    
    for i, dataset in enumerate(datasets):
        response = client.responses.create(
            model="o3",
            input=f"""
            Perform comprehensive analysis on dataset {i+1}:
            1. Statistical summary and data quality assessment
            2. Identify patterns, trends, and anomalies
            3. Create detailed visualizations
            4. Generate actionable insights
            5. Provide recommendations
            """,
            tools=[{
                "type": "code_interpreter",
                "container": {
                    "type": "auto",
                    "files": [dataset]
                }
            }],
            background=True,
            reasoning={"effort": "medium", "summary": "auto"}
        )
        
        background_tasks.append({
            "id": response.id,
            "dataset": dataset,
            "status": response.status
        })
    
    return background_tasks

# Monitor batch processing
def monitor_batch(tasks):
    completed = []
    
    while len(completed) < len(tasks):
        for task in tasks:
            if task["id"] not in [c["id"] for c in completed]:
                response = client.responses.retrieve(task["id"])
                
                if response.status == "completed":
                    completed.append({
                        "id": task["id"],
                        "dataset": task["dataset"],
                        "result": response.output_text[:200] + "..."
                    })
                    print(f"✅ Completed analysis for {task['dataset']}")
                elif response.status == "failed":
                    print(f"❌ Failed analysis for {task['dataset']}")
        
        time.sleep(10)
    
    return completed

# Usage
datasets = ["sales_q1.csv", "sales_q2.csv", "sales_q3.csv", "sales_q4.csv"]
tasks = process_batch_analysis(datasets)
results = monitor_batch(tasks)
```

### Background Streaming with Resume

```python
# Start background task with streaming
stream = client.responses.create(
    model="o3",
    input="Write a detailed technical documentation for a complex software system",
    background=True,
    stream=True
)

cursor = None
try:
    for event in stream:
        print(f"Event: {event.type}")
        if hasattr(event, 'sequence_number'):
            cursor = event.sequence_number
        
        if event.type == "response.message.delta":
            print(event.delta, end="", flush=True)
            
except ConnectionError:
    print("Connection lost, resuming from cursor:", cursor)
    
    # Resume streaming (when SDK support is available)
    # For now, poll the response
    response = client.responses.retrieve(stream.response_id)
    while response.status in {"queued", "in_progress"}:
        time.sleep(5)
        response = client.responses.retrieve(stream.response_id)
    
    print("Task completed:", response.output_text)
```

---

## NEW: Reasoning Features Examples (May 2025)

### Mathematical Reasoning with Summaries

```python
# Complex mathematical reasoning with transparency
response = client.responses.create(
    model="o4-mini",
    input="""
    Prove that the sum of the first n positive integers is n(n+1)/2.
    Use multiple approaches: 
    1. Mathematical induction
    2. Direct combinatorial argument  
    3. Numerical verification for specific cases
    """,
    tools=[{
        "type": "code_interpreter",
        "container": {"type": "auto"}
    }],
    reasoning={
        "effort": "high",
        "summary": "detailed"  # Get detailed reasoning summaries
    }
)

# Analyze the reasoning process
for item in response.output:
    if item.type == "reasoning_summary":
        print(f"Reasoning Summary: {item.summary}")
        print("-" * 50)
```

### Enterprise Reasoning Context Management

```python
# ZDR-compatible reasoning workflow for enterprises
class EnterpriseAnalysisSession:
    def __init__(self, client, session_id):
        self.client = client
        self.session_id = session_id
        self.reasoning_context = []
    
    def analyze_with_context(self, query, **kwargs):
        """Perform analysis while maintaining reasoning context"""
        
        # Include previous reasoning context
        full_input = [
            *self.reasoning_context,
            {"type": "message", "content": query}
        ]
        
        response = self.client.responses.create(
            model="o3",
            input=full_input,
            store=False,  # ZDR requirement
            include=["reasoning.encrypted_content"],
            reasoning={"effort": "high", "summary": "auto"},
            **kwargs
        )
        
        # Extract and store reasoning for next request
        new_reasoning = [
            item for item in response.output 
            if item.type == "reasoning" and hasattr(item, 'encrypted_content')
        ]
        self.reasoning_context.extend(new_reasoning)
        
        return response

# Usage for complex multi-step analysis
session = EnterpriseAnalysisSession(client, "market_analysis_2025")

# Step 1: Initial market research
response1 = session.analyze_with_context(
    "Analyze the current AI/ML market landscape and identify key trends",
    tools=[{"type": "web_search"}]
)

# Step 2: Competitive analysis (builds on previous reasoning)
response2 = session.analyze_with_context(
    "Based on the market analysis, identify top 5 competitors and their strategies"
)

# Step 3: Strategic recommendations (leverages all previous reasoning)
response3 = session.analyze_with_context(
    "Given the market landscape and competitive analysis, provide strategic recommendations for a new AI startup"
)

print("Final recommendations:", response3.output_text)
```

### Reasoning Analysis and Debugging

```python
# Analyze reasoning patterns for optimization
def analyze_reasoning_session(responses):
    analysis = {
        "total_requests": len(responses),
        "reasoning_quality": [],
        "tool_usage_patterns": [],
        "performance_metrics": {}
    }
    
    for i, response in enumerate(responses):
        # Analyze reasoning summaries
        for item in response.output:
            if item.type == "reasoning_summary":
                analysis["reasoning_quality"].append({
                    "request": i + 1,
                    "summary_length": len(item.summary),
                    "complexity_indicators": [
                        word for word in ["because", "therefore", "however", "moreover"]
                        if word in item.summary.lower()
                    ]
                })
            
            elif item.type in ["code_interpreter_call", "web_search_call", "mcp_call"]:
                analysis["tool_usage_patterns"].append({
                    "request": i + 1,
                    "tool": item.type,
                    "success": not hasattr(item, 'error') or item.error is None
                })
    
    return analysis

# Run analysis session
responses = [response1, response2, response3]
reasoning_analysis = analyze_reasoning_session(responses)
print("Reasoning Analysis:", reasoning_analysis)
```

---

## Multi-Modal Examples

### Image Analysis with Text

```python
response = client.responses.create(
    model="gpt-4o",
    input=[
        {"type": "text", "text": "Analyze this image and describe what you see"},
        {"type": "image_url", "image_url": {"url": "https://example.com/image.jpg"}}
    ]
)

print(response.output_text)
```

### Document Analysis

```python
# Analyze uploaded documents
response = client.responses.create(
    model="gpt-4o",
    input=[
        {"type": "text", "text": "Summarize the key points from this document"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
    ],
    tools=[{"type": "file_search"}]
)
```

---

## Tool Integration

### Web Search with Follow-up Analysis

```python
response = client.responses.create(
    model="gpt-4o",
    input="Research the latest developments in quantum computing and provide a technical summary",
    tools=[{"type": "web_search"}]
)

print(response.output_text)
```

### File Search and Summarization

```python
# Upload files first (using Files API)
file1 = client.files.create(
    file=open("research_paper.pdf", "rb"),
    purpose="responses"
)

file2 = client.files.create(
    file=open("technical_report.pdf", "rb"), 
    purpose="responses"
)

# Search and analyze files
response = client.responses.create(
    model="gpt-4o",
    input="Compare the methodologies used in these research papers",
    tools=[{"type": "file_search"}],
    tool_resources={
        "file_search": {
            "file_ids": [file1.id, file2.id]
        }
    }
)

print(response.output_text)
```

### Computer Use Automation

```python
# Automate computer tasks (when available)
response = client.responses.create(
    model="gpt-4o",
    input="Take a screenshot, open a web browser, and navigate to the OpenAI documentation",
    tools=[{"type": "computer_use"}]
)

print(response.output_text)
```

---

## Function Calling

### Basic Function Implementation

```python
def get_weather(location, unit="fahrenheit"):
    # Simulate weather API call
    return {
        "location": location,
        "temperature": 72 if unit == "fahrenheit" else 22,
        "condition": "sunny", 
        "humidity": 45
    }

# Define function for the model
weather_function = {
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

# First request - model will call the function
response = client.responses.create(
    model="gpt-4o",
    input="What's the weather like in New York?",
    tools=[weather_function]
)

# Handle function call
for item in response.output:
    if item.type == "function_call":
        import json
        args = json.loads(item.function.arguments)
        result = get_weather(**args)
        
        # Second request with function result
        follow_up = client.responses.create(
            model="gpt-4o",
            input=[
                {
                    "type": "function_result",
                    "function_call_id": item.id,
                    "result": result
                }
            ],
            previous_response_id=response.id
        )
        
        print(follow_up.output_text)
```

### Complex Multi-Function Workflow

```python
# Email sending function
def send_email(to, subject, body):
    # Simulate email sending
    return {"status": "sent", "message_id": "msg_123"}

# Database query function  
def query_database(query):
    # Simulate database query
    return [{"name": "John Doe", "status": "active", "last_login": "2024-01-15"}]

functions = [
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Send an email",
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
    },
    {
        "type": "function", 
        "function": {
            "name": "query_database",
            "description": "Query user database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        }
    }
]

response = client.responses.create(
    model="gpt-4o",
    input="Find all active users and send them a welcome back email",
    tools=functions
)
```

---

## Streaming Examples

### Basic Streaming

```python
stream = client.responses.create(
    model="gpt-4o",
    input="Write a creative story about space exploration",
    stream=True
)

for event in stream:
    if event.type == "response.message.delta":
        print(event.delta, end="", flush=True)
```

### Advanced Streaming with Event Handling

```python
def handle_stream_events(stream):
    content = ""
    function_calls = []
    
    for event in stream:
        if event.type == "response.message.delta":
            content += event.delta
            print(event.delta, end="", flush=True)
            
        elif event.type == "response.function_call.delta":
            # Handle function call streaming
            if event.function_call_id not in [fc["id"] for fc in function_calls]:
                function_calls.append({
                    "id": event.function_call_id,
                    "name": "",
                    "arguments": ""
                })
            
            # Update function call data
            for fc in function_calls:
                if fc["id"] == event.function_call_id:
                    if hasattr(event, "name"):
                        fc["name"] += event.name or ""
                    if hasattr(event, "arguments"):
                        fc["arguments"] += event.arguments or ""
                    break
                    
        elif event.type == "response.done":
            print(f"\n✅ Response completed")
            return content, function_calls

# Usage
stream = client.responses.create(
    model="gpt-4o",
    input="Tell me about the weather and then send a summary email",
    tools=[weather_function, email_function],
    stream=True
)

content, calls = handle_stream_events(stream)
```

---

## Conversation Management

### Multi-turn Conversation

```python
class ConversationManager:
    def __init__(self):
        self.conversation_history = []
    
    def add_message(self, role, content):
        self.conversation_history.append({
            "type": "message",
            "role": role, 
            "content": content
        })
    
    def get_response(self, user_input, **kwargs):
        # Add user message
        self.add_message("user", user_input)
        
        # Get AI response
        response = client.responses.create(
            model="gpt-4o",
            input=self.conversation_history,
            **kwargs
        )
        
        # Add AI response to history
        self.add_message("assistant", response.output_text)
        
        return response

# Usage
conversation = ConversationManager()

response1 = conversation.get_response("Hello, I need help planning a trip")
print("AI:", response1.output_text)

response2 = conversation.get_response("I want to go somewhere warm in December")
print("AI:", response2.output_text)

response3 = conversation.get_response("What about Thailand? Is it good for families?")
print("AI:", response3.output_text)
```

### Conversation with Context Windows

```python
class ContextManagedConversation:
    def __init__(self, max_context_length=10):
        self.messages = []
        self.max_context_length = max_context_length
    
    def add_response(self, user_input, **kwargs):
        # Add user message
        self.messages.append({
            "type": "message",
            "role": "user",
            "content": user_input
        })
        
        # Maintain context window
        if len(self.messages) > self.max_context_length:
            self.messages = self.messages[-self.max_context_length:]
        
        # Get response
        response = client.responses.create(
            model="gpt-4o",
            input=self.messages,
            **kwargs
        )
        
        # Add AI response
        self.messages.append({
            "type": "message", 
            "role": "assistant",
            "content": response.output_text
        })
        
        return response

# Usage
managed_conversation = ContextManagedConversation(max_context_length=6)
```

---

## Background Processing

### Long-running Analysis

```javascript
// Start background task
const response = await openai.responses.create({
  model: "gpt-4o", 
  input: "Analyze this large dataset and provide detailed insights...",
  background: true,
  metadata: { task_type: "data_analysis" }
});

console.log(`Started background task: ${response.id}`);

// Check status periodically
async function checkStatus(responseId) {
  try {
    const status = await openai.responses.retrieve(responseId);
    
    if (status.status === "completed") {
      console.log("✅ Analysis completed!");
      console.log(status.output_text);
      return true;
    } else if (status.status === "failed") {
      console.log("❌ Analysis failed:", status.error);
      return true;
    } else {
      console.log(`⏳ Status: ${status.status}`);
      return false;
    }
  } catch (error) {
    console.error("Error checking status:", error);
    return true;
  }
}

// Poll for completion
const pollInterval = setInterval(async () => {
  const isComplete = await checkStatus(response.id);
  if (isComplete) {
    clearInterval(pollInterval);
  }
}, 5000);

// Cancel if needed
// await openai.responses.cancel(response.id);
```

---

## Error Handling

### Robust Request Handler

```python
import time
from openai import OpenAI
from openai.error import RateLimitError, APIError

class RobustResponseHandler:
    def __init__(self, max_retries=3):
        self.client = OpenAI()
        self.max_retries = max_retries
    
    def create_response_with_retry(self, **kwargs):
        for attempt in range(self.max_retries):
            try:
                response = self.client.responses.create(**kwargs)
                return response
                
            except RateLimitError as e:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Rate limit hit. Waiting {wait_time}s before retry {attempt + 1}")
                time.sleep(wait_time)
                
            except APIError as e:
                if e.status_code >= 500:  # Server error, retry
                    wait_time = 2 ** attempt
                    print(f"Server error. Retrying in {wait_time}s")
                    time.sleep(wait_time)
                else:  # Client error, don't retry
                    raise
                    
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise
                print(f"Unexpected error: {e}. Retrying...")
                time.sleep(1)
        
        raise Exception(f"Failed after {self.max_retries} attempts")

# Usage
handler = RobustResponseHandler()
response = handler.create_response_with_retry(
    model="gpt-4o",
    input="Generate a creative story",
    tools=[{"type": "web_search"}]
)
```

---

## Production Patterns

### Request Monitoring

```python
import time
import logging
from typing import Dict, Any

class ResponseMonitor:
    def __init__(self):
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0, 
            "failed_requests": 0,
            "total_tokens": 0,
            "average_latency": 0
        }
        self.request_logs = []
    
    def monitored_request(self, **kwargs) -> Dict[str, Any]:
        start_time = time.time()
        self.metrics["total_requests"] += 1
        
        try:
            response = client.responses.create(**kwargs)
            
            # Calculate metrics
            latency = time.time() - start_time
            self.metrics["successful_requests"] += 1
            self.metrics["total_tokens"] += response.usage.total_tokens
            
            # Update average latency
            self.metrics["average_latency"] = (
                (self.metrics["average_latency"] * (self.metrics["successful_requests"] - 1) + latency) 
                / self.metrics["successful_requests"]
            )
            
            # Log request
            log_entry = {
                "timestamp": time.time(),
                "latency": latency,
                "tokens": response.usage.total_tokens,
                "model": kwargs.get("model"),
                "status": "success"
            }
            self.request_logs.append(log_entry)
            
            return response
            
        except Exception as e:
            self.metrics["failed_requests"] += 1
            
            log_entry = {
                "timestamp": time.time(),
                "latency": time.time() - start_time,
                "error": str(e),
                "model": kwargs.get("model"),
                "status": "failed"
            }
            self.request_logs.append(log_entry)
            
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        return self.metrics.copy()

# Usage
monitor = ResponseMonitor()

response = monitor.monitored_request(
    model="gpt-4o",
    input="Analyze quarterly performance data",
    tools=[{"type": "web_search"}]
)

print("Metrics:", monitor.get_metrics())
```

### Content Filtering

```python
class ContentFilter:
    def __init__(self):
        self.sensitive_keywords = ["confidential", "internal", "secret"]
    
    def filter_input(self, input_text: str) -> str:
        """Filter sensitive content from input"""
        filtered = input_text
        for keyword in self.sensitive_keywords:
            if keyword.lower() in filtered.lower():
                filtered = filtered.replace(keyword, "[REDACTED]")
        return filtered
    
    def filter_output(self, output_text: str) -> str:
        """Filter sensitive content from output"""
        # Implement your output filtering logic
        return output_text

# Usage with filtering
content_filter = ContentFilter()

def safe_request(**kwargs):
    # Filter input
    if "input" in kwargs:
        kwargs["input"] = content_filter.filter_input(kwargs["input"])
    
    # Make request
    response = client.responses.create(**kwargs)
    
    # Filter output
    filtered_output = content_filter.filter_output(response.output_text)
    
    return {
        "filtered_output": filtered_output,
        "original_response": response
    }
```

---

*These examples demonstrate the full range of capabilities in the OpenAI Responses API, from basic text generation to complex multi-agent workflows with the latest MCP integration, Code Interpreter, image generation, background processing, and reasoning features.* 