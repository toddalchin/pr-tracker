# Model Context Protocol (MCP) Integration

## Overview

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide tools and context to Large Language Models. The Responses API now supports **Remote MCP servers**, allowing you to connect models to tools hosted anywhere on the internet with just a few lines of code.

**Key Benefits:**
- **Standardized Integration**: Connect to any MCP-compliant server
- **Ecosystem Access**: Use tools from major platforms (Shopify, Stripe, Twilio, etc.)
- **Simple Implementation**: Just provide a URL and authentication
- **Security Controls**: Built-in approval systems and data protection

## Basic MCP Integration

### Simple Connection

```python
from openai import OpenAI

client = OpenAI()

response = client.responses.create(
    model="gpt-4.1",
    tools=[{
        "type": "mcp",
        "server_label": "deepwiki",
        "server_url": "https://mcp.deepwiki.com/mcp",
        "require_approval": "never"
    }],
    input="What transport protocols are supported in the 2025-03-26 version of the MCP spec?"
)

print(response.output_text)
```

```bash
curl https://api.openai.com/v1/responses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4.1",
    "tools": [{
      "type": "mcp",
      "server_label": "deepwiki",
      "server_url": "https://mcp.deepwiki.com/mcp",
      "require_approval": "never"
    }],
    "input": "What transport protocols are supported in the 2025-03-26 version of the MCP spec?"
  }'
```

## Popular MCP Servers

### E-commerce & Payments

#### Shopify
```python
{
    "type": "mcp",
    "server_label": "shopify",
    "server_url": "https://pitchskin.com/api/mcp"
}
# Example: "Add the Blemish Toner Pads to my cart"
```

#### Stripe
```python
{
    "type": "mcp",
    "server_label": "stripe",
    "server_url": "https://mcp.stripe.com",
    "headers": {
        "Authorization": "Bearer sk_live_..."
    }
}
# Example: "Generate a payment link for $210"
```

#### Square
```python
{
    "type": "mcp",
    "server_label": "square",
    "server_url": "https://developer.squareup.com/mcp",
    "headers": {
        "Authorization": "Bearer sq0atp-..."
    }
}
```

#### PayPal
```python
{
    "type": "mcp",
    "server_label": "paypal",
    "server_url": "https://developer.paypal.com/mcp",
    "headers": {
        "Authorization": "Bearer A21AA..."
    }
}
```

### Communication & CRM

#### Twilio
```python
{
    "type": "mcp",
    "server_label": "twilio",
    "server_url": "https://<function-domain>.twil.io/mcp",
    "headers": {
        "x-twilio-signature": "..."
    }
}
# Example: "Get latest soccer news and text summary to +1 555 555 5555"
```

#### Intercom
```python
{
    "type": "mcp",
    "server_label": "intercom",
    "server_url": "https://developers.intercom.com/mcp",
    "headers": {
        "Authorization": "Bearer dG9rZW46..."
    }
}
```

#### HubSpot
```python
{
    "type": "mcp",
    "server_label": "hubspot",
    "server_url": "https://developers.hubspot.com/mcp",
    "headers": {
        "Authorization": "Bearer pat-na1-..."
    }
}
```

### Infrastructure & Development

#### Cloudflare
```python
{
    "type": "mcp",
    "server_label": "cloudflare",
    "server_url": "https://developers.cloudflare.com/mcp",
    "headers": {
        "Authorization": "Bearer ..."
    }
}
```

#### Pipedream
```python
{
    "type": "mcp",
    "server_label": "pipedream",
    "server_url": "https://pipedream.com/mcp"
}
```

#### Zapier
```python
{
    "type": "mcp",
    "server_label": "zapier",
    "server_url": "https://zapier.com/mcp",
    "headers": {
        "Authorization": "Bearer ..."
    }
}
```

### Data & Analytics

#### Plaid
```python
{
    "type": "mcp",
    "server_label": "plaid",
    "server_url": "https://plaid.com/mcp",
    "headers": {
        "Authorization": "Bearer access-sandbox-..."
    }
}
```

#### DeepWiki
```python
{
    "type": "mcp",
    "server_label": "deepwiki",
    "server_url": "https://mcp.deepwiki.com/mcp"
}
# Example: "Give me 5 facts about modelcontextprotocol/python-sdk"
```

## Advanced Configuration

### Tool Filtering

Limit which tools are imported from an MCP server to reduce costs and latency:

```python
{
    "type": "mcp",
    "server_label": "deepwiki",
    "server_url": "https://mcp.deepwiki.com/mcp",
    "allowed_tools": ["ask_question"],  # Only import specific tools
    "require_approval": "never"
}
```

### Authentication Methods

Most MCP servers require authentication. The most common patterns:

```python
# API Key Authentication
{
    "type": "mcp",
    "server_label": "stripe",
    "server_url": "https://mcp.stripe.com",
    "headers": {
        "Authorization": "Bearer sk_live_..."
    }
}

# Custom Header Authentication
{
    "type": "mcp",
    "server_label": "twilio",
    "server_url": "https://<domain>.twil.io/mcp",
    "headers": {
        "x-twilio-signature": "computed_signature",
        "x-api-key": "your_api_key"
    }
}

# Multiple Headers
{
    "type": "mcp",
    "server_label": "custom",
    "server_url": "https://api.example.com/mcp",
    "headers": {
        "Authorization": "Bearer token",
        "X-API-Version": "2025-01-01",
        "X-Client-ID": "your_client_id"
    }
}
```

**Security Note**: Headers are not stored or visible in response objects for security.

## Approval Controls

### Approval Levels

```python
# Always require approval (default)
"require_approval": "always"

# Never require approval (for trusted servers)
"require_approval": "never"

# Selective approval - specific tools
"require_approval": {
    "never": {
        "tool_names": ["safe_read_operation", "get_info"]
    }
}
```

### Handling Approval Requests

When approval is required, you'll receive an `mcp_approval_request`:

```json
{
    "id": "mcpr_123",
    "type": "mcp_approval_request",
    "server_label": "stripe",
    "name": "create_payment_link",
    "arguments": "{\"amount\": 2000, \"currency\": \"usd\"}"
}
```

Respond with approval:

```python
client.responses.create(
    model="gpt-4.1",
    tools=[/* your MCP tools */],
    previous_response_id="resp_456",
    input=[{
        "type": "mcp_approval_response",
        "approve": True,  # or False to deny
        "approval_request_id": "mcpr_123"
    }]
)
```

## How MCP Integration Works

### Step 1: Tool Discovery

When you attach an MCP server, the API automatically:

1. Connects to the MCP server
2. Retrieves available tools list
3. Creates an `mcp_list_tools` output item

```json
{
    "type": "mcp_list_tools",
    "server_label": "deepwiki", 
    "tools": [{
        "name": "ask_question",
        "input_schema": {
            "type": "object",
            "properties": {
                "repoName": {"type": "string"},
                "question": {"type": "string"}
            }
        }
    }]
}
```

### Step 2: Tool Execution

When the model calls an MCP tool:

1. API validates the tool call
2. Makes request to remote MCP server
3. Returns result in `mcp_call` output item

```json
{
    "type": "mcp_call",
    "server_label": "deepwiki",
    "name": "ask_question", 
    "arguments": "{\"repoName\":\"...\",\"question\":\"...\"}",
    "output": "The MCP spec supports stdio and Streamable HTTP...",
    "error": null
}
```

## Complete Examples

### E-commerce Integration

```python
# Multi-tool e-commerce workflow
response = client.responses.create(
    model="gpt-4.1",
    tools=[
        {"type": "web_search_preview"},
        {
            "type": "mcp",
            "server_label": "shopify",
            "server_url": "https://store.example.com/api/mcp"
        },
        {
            "type": "mcp", 
            "server_label": "stripe",
            "server_url": "https://mcp.stripe.com",
            "headers": {"Authorization": "Bearer sk_live_..."}
        }
    ],
    input="Search for trending skincare products, add the top rated one to cart, and create a payment link"
)
```

### Data Analysis Workflow

```python
# Research and analysis with multiple MCP servers
response = client.responses.create(
    model="o3",
    tools=[
        {
            "type": "mcp",
            "server_label": "deepwiki", 
            "server_url": "https://mcp.deepwiki.com/mcp"
        },
        {
            "type": "code_interpreter",
            "container": {"type": "auto"}
        },
        {
            "type": "mcp",
            "server_label": "plaid",
            "server_url": "https://plaid.com/mcp",
            "headers": {"Authorization": "Bearer access-..."}
        }
    ],
    input="Research the latest fintech trends from GitHub repos, analyze transaction patterns, and create a summary report"
)
```

### Communication Automation

```python
# Automated communication workflow
response = client.responses.create(
    model="gpt-4.1",
    tools=[
        {"type": "web_search"},
        {
            "type": "mcp",
            "server_label": "twilio",
            "server_url": "https://<domain>.twil.io/mcp",
            "headers": {"x-twilio-signature": "..."}
        },
        {
            "type": "mcp",
            "server_label": "hubspot", 
            "server_url": "https://developers.hubspot.com/mcp",
            "headers": {"Authorization": "Bearer pat-..."}
        }
    ],
    input="Find latest tech news, update our CRM with key insights, and send SMS alerts to our team"
)
```

## Security & Best Practices

### Security Considerations

1. **Trust Verification**: Only connect to official MCP servers hosted by service providers
2. **Data Review**: Carefully review what data is being shared with MCP servers
3. **Approval Systems**: Use approval controls for sensitive operations
4. **Logging**: Monitor and log all MCP interactions
5. **Reporting**: Report malicious servers to `security@openai.com`

### Best Practices

1. **Start with Approvals**: Begin with `"require_approval": "always"` 
2. **Filter Tools**: Use `allowed_tools` to limit exposed functionality
3. **Monitor Usage**: Track MCP calls for debugging and optimization
4. **Test Connections**: Verify MCP server connectivity before production
5. **Handle Errors**: Implement proper error handling for failed MCP calls

### Enterprise Considerations

- **Zero Data Retention**: MCP calls respect ZDR settings
- **Data Residency**: Data sent to MCP servers follows their policies, not OpenAI's
- **Compliance**: Ensure MCP servers meet your compliance requirements
- **Audit Trails**: Maintain logs of all MCP server interactions

## Troubleshooting

### Common Issues

**424 Error (Failed Dependency)**
```bash
# Issue: MCP server not accessible from OpenAI's servers
# Solution: Ensure server is publicly accessible via HTTPS
```

**Authentication Failures**
```bash
# Issue: Invalid credentials in headers
# Solution: Verify API keys and authentication format
```

**Tool Not Found**
```bash
# Issue: Requested tool not available on MCP server
# Solution: Check tool names and use allowed_tools filter
```

### Development vs Production

**Development**: Use tunneling services for local testing
- ngrok: `ngrok http 3000`
- Cloudflare Tunnel: `cloudflared tunnel`
- LocalTunnel: `npx localtunnel --port 3000`

**Production**: Deploy MCP servers to cloud infrastructure
- Render.com (lightweight option)
- Azure/AWS/GCP (enterprise options)
- Cloudflare Workers (edge deployment)

## Pricing

- **No Additional Fees**: MCP integration has no extra charges
- **Token-Based Billing**: You pay only for tokens used in tool definitions and calls
- **Efficient Tool Filtering**: Use `allowed_tools` to minimize token usage
- **Caching Benefits**: Keep `mcp_list_tools` items in context for optimization

---

*For more information on implementing your own MCP server, see [Cloudflare's MCP guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) and the [OpenAI API Cookbook MCP guide](https://platform.openai.com/docs/guides/mcp).* 