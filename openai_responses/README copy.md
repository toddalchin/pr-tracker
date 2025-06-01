# OpenAI Responses API Documentation

This directory contains comprehensive documentation for the OpenAI Responses API, organized into focused, modular files for better navigation and LLM comprehension.

## 📚 Documentation Structure

### Core API Reference
- **[01-overview.md](01-overview.md)** - API overview, introduction, and key concepts
- **[02-endpoints.md](02-endpoints.md)** - Complete reference for all API endpoints
- **[03-request-parameters.md](03-request-parameters.md)** - Detailed parameter documentation
- **[04-response-objects.md](04-response-objects.md)** - Response object schemas and structures

### Advanced Features
- **[05-streaming.md](05-streaming.md)** - Streaming responses and server-sent events
- **[06-tools-and-functions.md](06-tools-and-functions.md)** - Built-in tools, MCP servers, and function calling
- **[07-conversation-state.md](07-conversation-state.md)** - Multi-turn conversations and state management

### Examples and Integration
- **[08-examples.md](08-examples.md)** - Code examples and use cases
- **[09-error-handling.md](09-error-handling.md)** - Error codes and troubleshooting

### Specialized Tools & Features
- **[10-files-api-integration.md](10-files-api-integration.md)** - File upload, management, and search integration
- **[11-computer-use-implementation.md](11-computer-use-implementation.md)** - Desktop automation and computer control
- **[12-multi-agent-orchestration.md](12-multi-agent-orchestration.md)** - Agent coordination patterns and communication
- **[13-production-deployment.md](13-production-deployment.md)** - Scaling, monitoring, and production deployment
- **[14-compatible-models.md](14-compatible-models.md)** - Model compatibility and feature support
- **[15-mcp-integration.md](15-mcp-integration.md)** - Model Context Protocol and remote server integration
- **[16-background-processing.md](16-background-processing.md)** - Async background mode and long-running tasks
- **[17-reasoning-features.md](17-reasoning-features.md)** - Reasoning summaries and encrypted reasoning items

## 🎯 Key Features Covered

### Core API Features
- **Text and Image Inputs**: Support for multimodal inputs
- **Structured Outputs**: JSON schema validation and structured responses
- **Tool Integration**: Built-in tools (web search, file search, computer use, MCP servers, Code Interpreter, image generation)
- **Function Calling**: Custom function definitions and execution
- **Streaming**: Real-time response streaming with server-sent events
- **Conversation State**: Multi-turn conversations and context management
- **Background Processing**: Asynchronous response generation for long-running tasks
- **Reasoning Features**: Summaries and encrypted reasoning items for o-series models

### Latest Tool Additions (May 2025)
- **🔗 Remote MCP Server Support**: Connect to any Model Context Protocol server (Shopify, Stripe, Twilio, etc.)
- **🎨 Image Generation**: Built-in gpt-image-1 model with streaming previews and multi-turn edits
- **🐍 Code Interpreter**: Python execution environment for data analysis, math, coding, and image understanding
- **📄 Enhanced File Search**: Support for reasoning models with multi-vector store search and attribute filtering
- **⏳ Background Mode**: Asynchronous task execution for complex, long-running operations
- **🧠 Reasoning Summaries**: Natural language summaries of model's internal chain-of-thought
- **🔐 Encrypted Reasoning Items**: ZDR-compatible reasoning token reuse across requests

### Multi-Agent Capabilities
- **File Management**: Upload, organize, and search through documents
- **Desktop Automation**: Computer control and interface automation
- **Agent Orchestration**: Coordination patterns and communication strategies
- **Production Deployment**: Scaling, monitoring, and enterprise-grade implementation

## 🚀 Quick Start

### For Basic API Usage
1. **Basic Usage**: Start with [01-overview.md](01-overview.md) for concepts
2. **API Reference**: Check [02-endpoints.md](02-endpoints.md) for endpoint details
3. **Examples**: See [08-examples.md](08-examples.md) for implementation patterns
4. **Advanced Features**: Explore streaming and tools documentation

### For Latest Features (May 2025)
1. **MCP Integration**: Begin with [15-mcp-integration.md](15-mcp-integration.md) for remote server connections
2. **Background Tasks**: Review [16-background-processing.md](16-background-processing.md) for async operations
3. **Reasoning Features**: Study [17-reasoning-features.md](17-reasoning-features.md) for o-series model capabilities
4. **Enhanced Tools**: Check updated [06-tools-and-functions.md](06-tools-and-functions.md) for Code Interpreter and image generation

### For Multi-Agent Systems
1. **File Integration**: Begin with [10-files-api-integration.md](10-files-api-integration.md) for document management
2. **Computer Automation**: Review [11-computer-use-implementation.md](11-computer-use-implementation.md) for desktop control
3. **Agent Coordination**: Study [12-multi-agent-orchestration.md](12-multi-agent-orchestration.md) for orchestration patterns
4. **Production Ready**: Implement [13-production-deployment.md](13-production-deployment.md) for scaling and monitoring

## 📈 What's New (Latest Updates)

### May 2025 - Major Feature Release
- **Remote MCP Server Support**: Connect to internet-hosted MCP servers with a few lines of code
- **Image Generation Tool**: Generate and edit images with streaming previews using gpt-image-1
- **Code Interpreter Tool**: Python execution environment for complex problem solving
- **Background Mode**: Handle long-running tasks asynchronously with polling and streaming support
- **Reasoning Summaries**: Get natural language explanations of o-series model reasoning
- **Encrypted Reasoning Items**: Enterprise-grade reasoning token management for ZDR customers

### Model Support
- **GPT-4o series**: Full feature support including all new tools
- **GPT-4.1 series**: Complete compatibility with MCP, Code Interpreter, and background mode
- **OpenAI o-series** (o1, o3, o3-mini, o4-mini): Enhanced reasoning with tool calling in chain-of-thought
- **Image Generation**: Only supported on o3 from the reasoning model series

## 📖 Original Source

This documentation is reorganized from the comprehensive OpenAI Responses API documentation for improved clarity and LLM interaction. Each file focuses on a specific aspect of the API to enable targeted reference and understanding.

---

*Last updated: May 2025 - Includes latest MCP, Code Interpreter, Image Generation, Background Mode, and Reasoning Features* 