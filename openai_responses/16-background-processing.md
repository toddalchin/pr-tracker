# Background Processing Mode

## Overview

Background mode enables asynchronous execution of long-running tasks on reasoning models like o3 and o1-pro. This feature allows you to handle complex problems that take several minutes to solve without worrying about timeouts or connectivity issues.

**Key Benefits:**
- **Asynchronous Execution**: Kick off tasks and poll for completion
- **Reliability**: No timeouts or connection drops for long tasks
- **Flexibility**: Stream results when ready or poll periodically
- **Scalability**: Handle multiple background tasks simultaneously

## Basic Background Usage

### Starting a Background Task

```python
from openai import OpenAI

client = OpenAI()

# Start a background task
response = client.responses.create(
    model="o3",
    input="Write a very long novel about otters in space.",
    background=True
)

print(f"Task started with status: {response.status}")
print(f"Response ID: {response.id}")
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "o3",
    "input": "Write a very long novel about otters in space.",
    "background": true
  }'
```

### Background Task with High Reasoning Effort

```python
# For complex reasoning tasks
response = client.responses.create(
    model="o3",
    input="Solve this complex mathematical proof step by step.",
    reasoning={"effort": "high"},
    background=True
)
```

## Polling for Completion

### Basic Polling Pattern

```python
import time
from openai import OpenAI

client = OpenAI()

# Start background task
response = client.responses.create(
    model="o3",
    input="Write an extremely long story.",
    background=True
)

# Poll for completion
while response.status in {"queued", "in_progress"}:
    print(f"Current status: {response.status}")
    time.sleep(2)  # Wait 2 seconds
    response = client.responses.retrieve(response.id)

print(f"Final status: {response.status}")
if response.status == "completed":
    print(f"Output:\n{response.output_text}")
```

```bash
# Check status of background response
curl https://api.openai.com/v1/responses/resp_123 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Advanced Polling with Error Handling

```python
def poll_background_task(client, response_id, poll_interval=5, max_wait_time=3600):
    """
    Poll a background task with timeout and error handling
    """
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        try:
            response = client.responses.retrieve(response_id)
            
            if response.status == "completed":
                return response
            elif response.status == "failed":
                print(f"Task failed: {response.error}")
                return response
            elif response.status == "cancelled":
                print("Task was cancelled")
                return response
            elif response.status in {"queued", "in_progress"}:
                print(f"Status: {response.status}, waiting...")
                time.sleep(poll_interval)
            else:
                print(f"Unknown status: {response.status}")
                break
                
        except Exception as e:
            print(f"Error polling task: {e}")
            time.sleep(poll_interval)
    
    print("Timeout reached")
    return None

# Usage
response = poll_background_task(client, "resp_123")
```

## Response Status Values

| Status | Description |
|--------|-------------|
| `queued` | Task is waiting to start |
| `in_progress` | Task is actively running |
| `completed` | Task finished successfully |
| `failed` | Task encountered an error |
| `cancelled` | Task was manually cancelled |

## Background Streaming

### Starting with Streaming

Combine background mode with streaming to get partial results immediately:

```python
# Start background task with streaming
stream = client.responses.create(
    model="o3",
    input="Write a very long novel about otters in space.",
    background=True,
    stream=True
)

cursor = None
for event in stream:
    print(f"Event: {event.type}")
    if hasattr(event, 'sequence_number'):
        cursor = event.sequence_number
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "o3",
    "input": "Write a very long novel about otters in space.",
    "background": true,
    "stream": true
  }'
```

### Resuming Streaming

If the connection drops, resume streaming from where you left off:

```python
# Resume streaming from cursor position
def resume_streaming(client, response_id, cursor=None):
    """Resume streaming from a specific position"""
    params = {"stream": True}
    if cursor:
        params["starting_after"] = cursor
    
    # Note: SDK support for resuming streams is coming soon
    # For now, use direct API calls
    
    url = f"https://api.openai.com/v1/responses/{response_id}"
    if cursor:
        url += f"?stream=true&starting_after={cursor}"
    else:
        url += "?stream=true"
    
    # Make streaming request with your HTTP client
    return make_streaming_request(url)

# Usage
stream = resume_streaming(client, "resp_123", cursor=42)
```

## Cancelling Background Tasks

### Basic Cancellation

```python
# Cancel a running background task
cancelled_response = client.responses.cancel("resp_123")
print(f"Status after cancellation: {cancelled_response.status}")
```

```bash
curl -X POST https://api.openai.com/v1/responses/resp_123/cancel \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Cancellation with Cleanup

```python
def cancel_with_cleanup(client, response_id):
    """Cancel a task and handle cleanup"""
    try:
        response = client.responses.cancel(response_id)
        
        if response.status == "cancelled":
            print("Task successfully cancelled")
            # Perform any necessary cleanup
            cleanup_resources(response_id)
        else:
            print(f"Cancellation resulted in status: {response.status}")
            
        return response
        
    except Exception as e:
        print(f"Error cancelling task: {e}")
        return None

def cleanup_resources(response_id):
    """Cleanup any associated resources"""
    # Example: Remove temporary files, close connections, etc.
    print(f"Cleaning up resources for {response_id}")
```

## Background Mode with Tools

### Complex Tool Workflows

Background mode works with all tools including MCP servers and Code Interpreter:

```python
# Complex analysis task with multiple tools
response = client.responses.create(
    model="o3",
    input="Analyze the latest market trends, create detailed visualizations, and generate a comprehensive report",
    tools=[
        {"type": "web_search"},
        {"type": "code_interpreter", "container": {"type": "auto"}},
        {
            "type": "mcp",
            "server_label": "financial_data",
            "server_url": "https://api.example.com/mcp",
            "headers": {"Authorization": "Bearer token"}
        }
    ],
    background=True,
    reasoning={"effort": "high"}
)
```

### Long-Running Data Analysis

```python
# Data processing with Code Interpreter
response = client.responses.create(
    model="o3",
    input="Process this large dataset, perform statistical analysis, and create detailed visualizations",
    tools=[{
        "type": "code_interpreter",
        "container": {
            "type": "auto",
            "files": ["large_dataset.csv", "metadata.json"]
        }
    }],
    background=True
)
```

## Enterprise Use Cases

### Batch Processing

```python
def process_batch(client, tasks):
    """Process multiple tasks in background"""
    background_tasks = []
    
    for task in tasks:
        response = client.responses.create(
            model="o3",
            input=task["prompt"],
            tools=task.get("tools", []),
            background=True
        )
        background_tasks.append({
            "id": response.id,
            "task": task,
            "status": response.status
        })
    
    return background_tasks

def monitor_batch(client, background_tasks):
    """Monitor and collect results from batch processing"""
    completed = []
    
    while len(completed) < len(background_tasks):
        for task in background_tasks:
            if task["id"] not in [c["id"] for c in completed]:
                response = client.responses.retrieve(task["id"])
                
                if response.status in {"completed", "failed", "cancelled"}:
                    completed.append({
                        "id": task["id"],
                        "status": response.status,
                        "result": response.output_text if response.status == "completed" else None,
                        "error": response.error if response.status == "failed" else None
                    })
        
        time.sleep(5)  # Check every 5 seconds
    
    return completed

# Usage
tasks = [
    {"prompt": "Analyze financial report 1", "tools": [{"type": "web_search"}]},
    {"prompt": "Generate market summary 2", "tools": [{"type": "code_interpreter"}]},
    {"prompt": "Create customer analysis 3", "tools": []}
]

batch_tasks = process_batch(client, tasks)
results = monitor_batch(client, batch_tasks)
```

### Report Generation

```python
# Long-form report generation
def generate_comprehensive_report(client, data_sources):
    """Generate a comprehensive report from multiple data sources"""
    
    response = client.responses.create(
        model="o3",
        input=f"""
        Generate a comprehensive business intelligence report using these data sources: {data_sources}
        
        The report should include:
        1. Executive summary
        2. Market analysis with current trends
        3. Competitive landscape
        4. Financial projections
        5. Risk assessment
        6. Strategic recommendations
        
        Use web search for current market data, code interpreter for data analysis,
        and create detailed visualizations.
        """,
        tools=[
            {"type": "web_search"},
            {"type": "code_interpreter", "container": {"type": "auto"}},
            {"type": "file_search"}
        ],
        background=True,
        reasoning={"effort": "high"}
    )
    
    return response

# Monitor report generation
report_task = generate_comprehensive_report(client, ["sales_data.csv", "market_research.pdf"])
```

## Performance Optimization

### Efficient Resource Usage

```python
# Optimize for long-running tasks
response = client.responses.create(
    model="o3",
    input="Complex reasoning task that takes time",
    background=True,
    reasoning={
        "effort": "high",
        "summary": "auto"  # Get reasoning summaries
    },
    include=["reasoning.encrypted_content"]  # For ZDR customers
)
```

### Task Prioritization

```python
class BackgroundTaskManager:
    def __init__(self, client):
        self.client = client
        self.tasks = {}
        self.priorities = {"high": [], "medium": [], "low": []}
    
    def submit_task(self, prompt, priority="medium", **kwargs):
        """Submit a task with priority"""
        response = self.client.responses.create(
            model="o3",
            input=prompt,
            background=True,
            **kwargs
        )
        
        task_info = {
            "id": response.id,
            "priority": priority,
            "submitted_at": time.time(),
            "status": response.status
        }
        
        self.tasks[response.id] = task_info
        self.priorities[priority].append(response.id)
        
        return response.id
    
    def get_status_summary(self):
        """Get summary of all tasks"""
        summary = {"completed": 0, "in_progress": 0, "queued": 0, "failed": 0}
        
        for task_id in self.tasks:
            response = self.client.responses.retrieve(task_id)
            summary[response.status] = summary.get(response.status, 0) + 1
        
        return summary
```

## Best Practices

### 1. Appropriate Use Cases

Use background mode for:
- **Long-form content generation** (novels, reports, documentation)
- **Complex reasoning tasks** (mathematical proofs, analysis)
- **Multi-step workflows** with multiple tools
- **Batch processing** of multiple items
- **Resource-intensive analysis** with large datasets

### 2. Polling Strategy

```python
def adaptive_polling(client, response_id):
    """Adaptive polling with increasing intervals"""
    intervals = [1, 2, 5, 10, 30, 60]  # seconds
    interval_index = 0
    
    while True:
        response = client.responses.retrieve(response_id)
        
        if response.status not in {"queued", "in_progress"}:
            return response
        
        # Increase polling interval over time
        interval = intervals[min(interval_index, len(intervals) - 1)]
        time.sleep(interval)
        interval_index += 1
```

### 3. Error Handling

```python
def robust_background_execution(client, **kwargs):
    """Execute background task with comprehensive error handling"""
    try:
        response = client.responses.create(background=True, **kwargs)
        
        while response.status in {"queued", "in_progress"}:
            time.sleep(5)
            try:
                response = client.responses.retrieve(response.id)
            except Exception as e:
                print(f"Error retrieving status: {e}")
                continue
        
        if response.status == "completed":
            return response.output_text
        elif response.status == "failed":
            print(f"Task failed: {response.error}")
            return None
        elif response.status == "cancelled":
            print("Task was cancelled")
            return None
            
    except Exception as e:
        print(f"Error starting background task: {e}")
        return None
```

## Limitations

1. **Storage Requirement**: Background mode requires `store=true`
2. **Cancellation Scope**: Only background responses can be cancelled
3. **Model Support**: Best performance with o3, o1-pro, and other reasoning models
4. **Streaming Resume**: SDK support for resuming streams is coming soon

## Pricing

- **Same as Regular Requests**: Background mode has no additional charges
- **Efficient for Long Tasks**: Reduces connection overhead for complex operations
- **Token Optimization**: Reasoning tokens are preserved across tool calls

---

*Next: [17-reasoning-features.md](17-reasoning-features.md) - Reasoning summaries and encrypted reasoning items* 