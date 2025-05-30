# OpenAI Responses API - Endpoints Reference

## Base URL
```
https://api.openai.com/v1/responses
```

## 1. Create a Model Response

**POST** `/v1/responses`

Creates a model response. Provide text or image inputs to generate text or JSON outputs. Have the model call your own custom code or use built-in tools like web search or file search to use your own data as input for the model's response.

### Request
```http
POST https://api.openai.com/v1/responses
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

### Returns
Returns a Response object containing the generated output, usage information, and metadata.

### Usage Examples
- Text generation with custom instructions
- Image analysis and description
- Web search integration
- File search within uploaded documents
- Function calling with custom tools

---

## 2. Get a Model Response

**GET** `/v1/responses/{response_id}`

Retrieves a model response with the given ID.

### Path Parameters
- **response_id** (string, required): The ID of the response to retrieve

### Query Parameters
- **include** (array, optional): Additional fields to include in the response
  - `file_search_call.results`: Include search results
  - `message.input_image.image_url`: Include image URLs
  - `computer_call_output.output.image_url`: Include computer call image URLs
  - `reasoning.encrypted_content`: Include encrypted reasoning tokens

### Request
```http
GET https://api.openai.com/v1/responses/resp_123?include=file_search_call.results
Authorization: Bearer YOUR_API_KEY
```

### Returns
The Response object matching the specified ID with any requested additional fields.

---

## 3. Delete a Model Response

**DELETE** `/v1/responses/{response_id}`

Deletes a model response with the given ID.

### Path Parameters
- **response_id** (string, required): The ID of the response to delete

### Request
```http
DELETE https://api.openai.com/v1/responses/resp_123
Authorization: Bearer YOUR_API_KEY
```

### Returns
A success message confirming deletion:
```json
{
  "id": "resp_123",
  "object": "response",
  "deleted": true
}
```

---

## 4. Cancel a Response

**POST** `/v1/responses/{response_id}/cancel`

Cancels a model response with the given ID. Only responses created with the `background` parameter set to `true` can be cancelled.

### Path Parameters
- **response_id** (string, required): The ID of the response to cancel

### Request
```http
POST https://api.openai.com/v1/responses/resp_123/cancel
Authorization: Bearer YOUR_API_KEY
```

### Returns
The updated Response object with status changed to "cancelled".

### Important Notes
- Only background responses can be cancelled
- Once cancelled, the response cannot be resumed
- Partial results may still be available

---

## 5. List Input Items

**GET** `/v1/responses/{response_id}/input_items`

Returns a list of input items for a given response.

### Path Parameters
- **response_id** (string, required): The ID of the response to retrieve input items for

### Query Parameters
- **after** (string, optional): An item ID to list items after (for pagination)
- **before** (string, optional): An item ID to list items before (for pagination)
- **include** (array, optional): Additional fields to include
- **limit** (integer, optional, default: 20): Number of objects to return (1-100)
- **order** (string, optional, default: "asc"): Sort order
  - `asc`: Ascending order
  - `desc`: Descending order

### Request
```http
GET https://api.openai.com/v1/responses/resp_123/input_items?limit=50&order=desc
Authorization: Bearer YOUR_API_KEY
```

### Returns
A list of input item objects showing the inputs used to generate the response:
```json
{
  "object": "list",
  "data": [
    {
      "id": "msg_abc123",
      "type": "message",
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Tell me a story about a unicorn."
        }
      ]
    }
  ],
  "first_id": "msg_abc123",
  "last_id": "msg_abc123",
  "has_more": false
}
```

---

## Common Response Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid parameters or request format |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Response ID doesn't exist |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal server error |

## Rate Limits

The Responses API is subject to rate limits based on your usage tier. Monitor the following headers in responses:
- `x-ratelimit-limit-requests`: Requests per minute limit
- `x-ratelimit-remaining-requests`: Remaining requests
- `x-ratelimit-reset-requests`: Time until limit resets

---

*Next: [03-request-parameters.md](03-request-parameters.md) - Detailed parameter documentation* 