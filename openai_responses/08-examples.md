# OpenAI Responses API - Examples

## Basic Text Generation

### Simple Request

```javascript
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Tell me a three sentence bedtime story about a unicorn."
});

console.log(response.output_text);
```

**Python:**
```python
import openai

client = openai.OpenAI()

response = client.responses.create(
    model="gpt-4o",
    input="Tell me a three sentence bedtime story about a unicorn."
)

print(response.output_text)
```

### With Instructions

```javascript
const response = await openai.responses.create({
  model: "gpt-4o", 
  input: "Explain quantum computing",
  instructions: "You are a science teacher. Explain complex topics simply for middle school students.",
  temperature: 0.7,
  max_output_tokens: 500
});
```

---

## Image Analysis

### Analyze an Image

```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: [
    {
      type: "text",
      text: "What do you see in this image? Describe it in detail."
    },
    {
      type: "image_url",
      image_url: {
        url: "https://example.com/photo.jpg"
      }
    }
  ]
});

console.log(response.output_text);
```

### Multiple Images Comparison

```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: [
    {
      type: "text", 
      text: "Compare these two images and tell me the differences:"
    },
    {
      type: "image_url",
      image_url: { url: "https://example.com/image1.jpg" }
    },
    {
      type: "image_url", 
      image_url: { url: "https://example.com/image2.jpg" }
    }
  ]
});
```

---

## Structured Output

### JSON Schema Response

```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Extract the key information from this product description: 'Apple iPhone 15 Pro, 128GB, Blue Titanium, $999'",
  text: {
    format: {
      type: "json_object",
      json_schema: {
        type: "object",
        properties: {
          brand: { type: "string" },
          model: { type: "string" },
          storage: { type: "string" },
          color: { type: "string" },
          price: { type: "number" }
        },
        required: ["brand", "model", "price"]
      }
    }
  }
});

const data = JSON.parse(response.output_text);
console.log(data);
// Output: { brand: "Apple", model: "iPhone 15 Pro", storage: "128GB", color: "Blue Titanium", price: 999 }
```

### Complex Data Extraction

```python
response = client.responses.create(
    model="gpt-4o",
    input="Analyze this customer feedback and categorize it: 'The product arrived late and the packaging was damaged, but the quality is excellent and customer service was very helpful.'",
    text={
        "format": {
            "type": "json_object", 
            "json_schema": {
                "type": "object",
                "properties": {
                    "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
                    "categories": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "issues": {
                        "type": "array", 
                        "items": {
                            "type": "object",
                            "properties": {
                                "category": {"type": "string"},
                                "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                                "description": {"type": "string"}
                            }
                        }
                    },
                    "positives": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["sentiment", "categories"]
            }
        }
    }
)
```

---

## Web Search Integration

### Current Information Lookup

```javascript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "What are the latest developments in artificial intelligence this week?",
  tools: [{ type: "web_search" }],
  tool_choice: "auto"
});

console.log(response.output_text);
```

### Fact Checking

```python
response = client.responses.create(
    model="gpt-4o",
    input="Verify this claim and provide sources: 'Electric vehicles now make up 30% of new car sales in Norway'",
    tools=[{"type": "web_search"}],
    include=["web_search_call.results"]
)

print(response.output_text)
# Check response.output for search results
```

---

## Function Calling

### Weather Function

```javascript
// Define the function
const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City and state, e.g. San Francisco, CA"
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "Temperature unit"
          }
        },
        required: ["location"]
      }
    }
  }
];

// Initial request
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "What's the weather like in New York?",
  tools: tools,
  tool_choice: "auto"
});

// Check if function was called
if (response.output[0].type === "function_call") {
  const functionCall = response.output[0];
  const args = JSON.parse(functionCall.function.arguments);
  
  // Execute the function (implement this part)
  const weatherData = await getWeatherData(args.location, args.unit);
  
  // Provide result back to model
  const finalResponse = await openai.responses.create({
    model: "gpt-4o",
    input: [
      {
        type: "function_result",
        function_call_id: functionCall.id,
        result: weatherData
      }
    ],
    previous_response_id: response.id
  });
  
  console.log(finalResponse.output_text);
}
```

### Database Query Function

```python
import json

def execute_sql_query(query, params=None):
    # Your database implementation here
    # Return results as dictionary
    pass

tools = [
    {
        "type": "function",
        "function": {
            "name": "query_database",
            "description": "Execute SQL queries on the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "SQL query to execute"
                    },
                    "description": {
                        "type": "string", 
                        "description": "Human-readable description of what this query does"
                    }
                },
                "required": ["query"]
            }
        }
    }
]

response = client.responses.create(
    model="gpt-4o",
    input="How many orders were placed last month?",
    tools=tools
)

if response.output[0].type == "function_call":
    func_call = response.output[0]
    args = json.loads(func_call.function.arguments)
    
    # Execute the query
    results = execute_sql_query(args["query"])
    
    # Return results
    final_response = client.responses.create(
        model="gpt-4o",
        input=[
            {
                "type": "function_result",
                "function_call_id": func_call.id,
                "result": results
            }
        ],
        previous_response_id=response.id
    )
    
    print(final_response.output_text)
```

---

## Streaming Responses

### Basic Streaming

```javascript
const stream = await openai.responses.create({
  model: "gpt-4o",
  input: "Write a short story about a robot learning to paint",
  stream: true
});

for await (const chunk of stream) {
  if (chunk.type === "response.output_text.delta") {
    process.stdout.write(chunk.delta);
  } else if (chunk.type === "response.completed") {
    console.log("\n✅ Stream completed");
  }
}
```

### Advanced Streaming with Event Handling

```python
import json

def handle_stream_events(stream):
    buffer = ""
    
    for chunk in stream:
        if chunk.type == "response.output_text.delta":
            buffer += chunk.delta
            print(chunk.delta, end="", flush=True)
            
        elif chunk.type == "response.web_search_call.in_progress":
            print("\n🔍 Searching the web...")
            
        elif chunk.type == "response.web_search_call.completed":
            print("✅ Search completed")
            
        elif chunk.type == "response.function_call_arguments.delta":
            print(f"\n🔧 Calling function: {chunk.delta}")
            
        elif chunk.type == "response.completed":
            print("\n✅ Response completed")
            return buffer
            
        elif chunk.type == "error":
            print(f"\n❌ Error: {chunk.message}")
            break
    
    return buffer

# Usage
stream = client.responses.create(
    model="gpt-4o",
    input="Search for recent AI news and summarize the top 3 stories",
    tools=[{"type": "web_search"}],
    stream=True
)

final_text = handle_stream_events(stream)
```

---

## Multi-turn Conversations

### Customer Support Bot

```python
class SupportBot:
    def __init__(self):
        self.client = openai.OpenAI()
        self.conversation_id = None
    
    def start_conversation(self, user_message):
        response = self.client.responses.create(
            model="gpt-4o",
            input=user_message,
            instructions="You are a helpful customer support agent. Be empathetic, ask clarifying questions, and provide solutions.",
            metadata={"conversation_type": "support"}
        )
        
        self.conversation_id = response.id
        return response.output_text
    
    def continue_conversation(self, user_message):
        if not self.conversation_id:
            return self.start_conversation(user_message)
        
        response = self.client.responses.create(
            model="gpt-4o",
            input=user_message,
            previous_response_id=self.conversation_id
        )
        
        self.conversation_id = response.id
        return response.output_text

# Usage
bot = SupportBot()
print(bot.start_conversation("I can't log into my account"))
print(bot.continue_conversation("I've tried resetting my password but didn't receive an email"))
print(bot.continue_conversation("My email is john@example.com"))
```

### Educational Tutor

```javascript
class MathTutor {
  constructor() {
    this.openai = new OpenAI();
    this.currentResponseId = null;
  }
  
  async startLesson(topic) {
    const response = await this.openai.responses.create({
      model: "gpt-4o",
      input: `I want to learn about ${topic}`,
      instructions: "You are a patient math tutor. Break down complex concepts into simple steps. Always check if the student understands before moving on.",
      metadata: { conversation_type: "tutoring", subject: "mathematics" }
    });
    
    this.currentResponseId = response.id;
    return response.output_text;
  }
  
  async askQuestion(question) {
    const response = await this.openai.responses.create({
      model: "gpt-4o",
      input: question,
      previous_response_id: this.currentResponseId
    });
    
    this.currentResponseId = response.id;
    return response.output_text;
  }
  
  async requestExample() {
    return this.askQuestion("Can you give me a simple example to help me understand this better?");
  }
}

// Usage
const tutor = new MathTutor();
console.log(await tutor.startLesson("derivatives"));
console.log(await tutor.askQuestion("I don't understand what a derivative represents"));
console.log(await tutor.requestExample());
```

---

## File Search Integration

### Document Analysis

```python
# Assuming files are already uploaded via Files API
response = client.responses.create(
    model="gpt-4o",
    input="Summarize the key points from the quarterly financial report and identify any concerning trends",
    tools=[{"type": "file_search"}],
    include=["file_search_call.results"]
)

print(response.output_text)

# Access search results if included
for output_item in response.output:
    if output_item.type == "file_search_call":
        print("Files searched:", output_item.file_ids)
        if hasattr(output_item, 'results'):
            for result in output_item.results:
                print(f"Found in {result.filename}: {result.content[:200]}...")
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
    temperature=0.8
)
```

---

## Production Integration Examples

### API Endpoint with Express.js

```javascript
import express from 'express';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI();

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationId, userId } = req.body;
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: message,
      previous_response_id: conversationId,
      user: userId,
      metadata: {
        endpoint: "chat",
        timestamp: new Date().toISOString()
      }
    });
    
    res.json({
      message: response.output_text,
      conversationId: response.id,
      usage: response.usage
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: imageUrl } }
      ]
    });
    
    res.json({ analysis: response.output_text });
    
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### FastAPI Integration

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
from typing import Optional, List

app = FastAPI()
client = openai.OpenAI()

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    tokens_used: int

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        response = client.responses.create(
            model="gpt-4o",
            input=request.message,
            previous_response_id=request.conversation_id,
            temperature=request.temperature
        )
        
        return ChatResponse(
            message=response.output_text,
            conversation_id=response.id,
            tokens_used=response.usage.total_tokens
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FunctionCallRequest(BaseModel):
    message: str
    available_functions: List[dict]

@app.post("/function-call")
async def function_call_endpoint(request: FunctionCallRequest):
    try:
        response = client.responses.create(
            model="gpt-4o",
            input=request.message,
            tools=request.available_functions
        )
        
        if response.output[0].type == "function_call":
            return {
                "type": "function_call",
                "function_name": response.output[0].function.name,
                "arguments": response.output[0].function.arguments,
                "call_id": response.output[0].id
            }
        else:
            return {
                "type": "text_response", 
                "message": response.output_text
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

*Next: [09-error-handling.md](09-error-handling.md) - Error codes and troubleshooting* 