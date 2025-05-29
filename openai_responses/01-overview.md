# OpenAI Responses API - Overview

## Introduction

OpenAI's most advanced interface for generating model responses. The Responses API supports text and image inputs, and text outputs. It enables you to create stateful interactions with the model, using the output of previous responses as input. Extend the model's capabilities with built-in tools for file search, web search, computer use, and more. Allow the model access to external systems and data using function calling.

## Key Capabilities

### 🔤 Input Types
- **Text Inputs**: Plain text prompts and instructions
- **Image Inputs**: Visual content analysis and understanding
- **File Inputs**: Document processing and analysis
- **Multimodal**: Combined text and image inputs

### 📤 Output Types
- **Text Outputs**: Natural language responses
- **Structured JSON**: Validated JSON schema outputs
- **Tool Results**: Outputs from built-in tools and functions

### 🔧 Built-in Tools
- **Web Search**: Real-time web search capabilities
- **File Search**: Search through uploaded documents
- **Computer Use**: Interact with computer interfaces
- **Function Calling**: Execute custom code and integrations

### 💬 Conversation Features
- **Stateful Conversations**: Multi-turn interactions with context
- **Background Processing**: Asynchronous response generation
- **Streaming**: Real-time response streaming
- **Response Chaining**: Use previous responses as input

## Core Concepts

### Response Objects
Each API call returns a Response object that contains:
- **ID**: Unique identifier for the response
- **Status**: Current state (completed, failed, in_progress, etc.)
- **Output**: Array of generated content items
- **Usage**: Token consumption details
- **Metadata**: Additional context and information

### Model Selection
Choose from various models optimized for different use cases:
- **GPT-4o**: Advanced reasoning and multimodal capabilities
- **O3**: Latest reasoning model with enhanced capabilities
- **Model-specific features**: Some features are only available with certain models

### Request Parameters
Key parameters that control response generation:
- **Temperature**: Controls randomness (0-2)
- **Max Output Tokens**: Limits response length
- **Tool Choice**: Specifies which tools the model can use
- **Instructions**: System-level guidance for the model

## Related Guides

The Responses API integrates with several OpenAI concepts and features:

- **Quickstart**: Getting started with basic API usage
- **Text inputs and outputs**: Working with text-based interactions
- **Image inputs**: Processing and analyzing visual content
- **Structured Outputs**: Generating validated JSON responses
- **Function calling**: Integrating custom tools and external systems
- **Conversation state**: Managing multi-turn conversations
- **Extend the models with tools**: Using built-in capabilities

## API Base URL

```
https://api.openai.com/v1/responses
```

## Authentication

All requests require proper API authentication using your OpenAI API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

## Getting Started

1. **Choose your model**: Select an appropriate model for your use case
2. **Prepare your input**: Format text, images, or files as needed
3. **Configure parameters**: Set temperature, tools, and other options
4. **Make the request**: Send your request to the API
5. **Process the response**: Handle the returned Response object

For detailed implementation examples, see [08-examples.md](08-examples.md).

---

*Next: [02-endpoints.md](02-endpoints.md) - Complete API endpoint reference* 