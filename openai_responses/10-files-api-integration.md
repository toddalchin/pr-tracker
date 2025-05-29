# Files API Integration

Complete guide for integrating OpenAI's Files API with the Responses API to enable agents to work with uploaded documents and files.

## Overview

The Files API allows you to upload and manage files that can be used with various OpenAI tools, particularly the file search functionality in the Responses API. This enables agents to search through and reference uploaded documents.

## Core Concepts

### File Management Lifecycle
1. **Upload** - Upload files to OpenAI's servers
2. **Index** - Files are automatically indexed for search
3. **Search** - Agents can search through file contents
4. **Reference** - Agents can cite specific parts of files
5. **Cleanup** - Remove files when no longer needed

### Supported File Types
- **Text formats**: `.txt`, `.md`, `.doc`, `.docx`
- **PDFs**: `.pdf` (most common for knowledge bases)
- **Code files**: `.py`, `.js`, `.ts`, `.java`, `.cpp`, etc.
- **Data formats**: `.csv`, `.json`, `.xml`
- **Other**: `.rtf`, `.odt`

### File Size Limits
- Maximum file size: 500 MB per file
- Maximum total storage: 100 GB per organization
- Recommended: Keep files under 50 MB for optimal search performance

## Files API Endpoints

### Upload a File

```javascript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI();

// Upload a file
const file = await openai.files.create({
  file: fs.createReadStream("knowledge-base.pdf"),
  purpose: "file-search"
});

console.log("File uploaded:", file.id);
```

### List Files

```javascript
// List all uploaded files
const files = await openai.files.list({
  purpose: "file-search"
});

console.log("Available files:", files.data);
```

### Retrieve File Information

```javascript
// Get file details
const fileInfo = await openai.files.retrieve("file-abc123");
console.log("File info:", fileInfo);
```

### Delete a File

```javascript
// Delete a file
const deletion = await openai.files.del("file-abc123");
console.log("File deleted:", deletion.deleted);
```

## Integration with Responses API

### Basic File Search Setup

```javascript
// Create a response with file search capability
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "What does the documentation say about authentication?",
  tools: [
    {
      type: "file_search",
      file_search: {
        // Optional: specify max results
        max_num_results: 10
      }
    }
  ]
});
```

### File Search with Specific Files

```javascript
// Upload files first
const file1 = await openai.files.create({
  file: fs.createReadStream("api-docs.pdf"),
  purpose: "file-search"
});

const file2 = await openai.files.create({
  file: fs.createReadStream("user-guide.pdf"),
  purpose: "file-search"
});

// Create response with specific files for search
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "How do I configure authentication in the system?",
  tools: [
    {
      type: "file_search",
      file_search: {
        file_ids: [file1.id, file2.id],
        max_num_results: 5
      }
    }
  ]
});
```

## Multi-Agent File Management

### Shared Knowledge Base Pattern

```javascript
class AgentKnowledgeBase {
  constructor(openai) {
    this.openai = openai;
    this.fileRegistry = new Map();
  }

  async uploadKnowledgeBase(files) {
    const uploadedFiles = [];
    
    for (const filePath of files) {
      const file = await this.openai.files.create({
        file: fs.createReadStream(filePath),
        purpose: "file-search"
      });
      
      this.fileRegistry.set(path.basename(filePath), file.id);
      uploadedFiles.push(file);
    }
    
    return uploadedFiles;
  }

  getFileIds(categories = []) {
    if (categories.length === 0) {
      return Array.from(this.fileRegistry.values());
    }
    
    return categories
      .map(cat => this.fileRegistry.get(cat))
      .filter(Boolean);
  }

  async createAgentResponse(agentInput, fileCategories = []) {
    const fileIds = this.getFileIds(fileCategories);
    
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: agentInput,
      tools: [
        {
          type: "file_search",
          file_search: {
            file_ids: fileIds,
            max_num_results: 10
          }
        }
      ]
    });
  }
}
```

### Agent-Specific File Collections

```javascript
class SpecializedAgent {
  constructor(openai, agentType, knowledgeFiles) {
    this.openai = openai;
    this.agentType = agentType;
    this.fileIds = [];
    this.initializeKnowledge(knowledgeFiles);
  }

  async initializeKnowledge(files) {
    for (const file of files) {
      const uploaded = await this.openai.files.create({
        file: fs.createReadStream(file.path),
        purpose: "file-search"
      });
      
      this.fileIds.push(uploaded.id);
    }
  }

  async processQuery(query) {
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: `As a ${this.agentType} agent: ${query}`,
      tools: [
        {
          type: "file_search",
          file_search: {
            file_ids: this.fileIds,
            max_num_results: 8
          }
        }
      ]
    });
  }
}

// Usage
const legalAgent = new SpecializedAgent(openai, "legal", [
  { path: "legal-policies.pdf" },
  { path: "compliance-docs.pdf" }
]);

const techAgent = new SpecializedAgent(openai, "technical", [
  { path: "api-documentation.pdf" },
  { path: "system-architecture.pdf" }
]);
```

## Advanced File Search Patterns

### Dynamic File Selection

```javascript
class IntelligentFileSelector {
  constructor(openai) {
    this.openai = openai;
    this.fileMetadata = new Map();
  }

  async registerFile(filePath, metadata) {
    const file = await this.openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "file-search"
    });
    
    this.fileMetadata.set(file.id, {
      ...metadata,
      name: path.basename(filePath),
      uploadedAt: new Date()
    });
    
    return file.id;
  }

  async selectRelevantFiles(query) {
    // Simple keyword-based selection
    const keywords = query.toLowerCase().split(' ');
    const relevantFiles = [];
    
    for (const [fileId, metadata] of this.fileMetadata) {
      const fileText = `${metadata.name} ${metadata.description || ''} ${metadata.tags?.join(' ') || ''}`.toLowerCase();
      
      const relevance = keywords.reduce((score, keyword) => {
        return score + (fileText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (relevance > 0) {
        relevantFiles.push({ fileId, relevance });
      }
    }
    
    return relevantFiles
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(f => f.fileId);
  }

  async intelligentSearch(query) {
    const relevantFileIds = await this.selectRelevantFiles(query);
    
    return await this.openai.responses.create({
      model: "gpt-4o",
      input: query,
      tools: [
        {
          type: "file_search",
          file_search: {
            file_ids: relevantFileIds,
            max_num_results: 10
          }
        }
      ]
    });
  }
}
```

### File Search Result Processing

```javascript
async function processFileSearchResults(response) {
  const searchResults = [];
  
  for (const outputItem of response.output) {
    if (outputItem.type === 'file_search_call') {
      // Access search results if included
      if (outputItem.file_search?.results) {
        for (const result of outputItem.file_search.results) {
          searchResults.push({
            fileId: result.file_id,
            filename: result.filename,
            content: result.content,
            score: result.score
          });
        }
      }
    }
  }
  
  return searchResults;
}

// Usage with include parameter
const response = await openai.responses.create({
  model: "gpt-4o",
  input: "Find information about API rate limits",
  include: ["file_search_call.results"], // Include search results
  tools: [
    {
      type: "file_search"
    }
  ]
});

const searchResults = await processFileSearchResults(response);
console.log("Search results:", searchResults);
```

## File Management Best Practices

### 1. File Organization Strategy

```javascript
class OrganizedFileManager {
  constructor(openai) {
    this.openai = openai;
    this.collections = {
      documentation: [],
      policies: [],
      procedures: [],
      reference: [],
      templates: []
    };
  }

  async uploadToCollection(collection, filePath, metadata = {}) {
    const file = await this.openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "file-search"
    });
    
    this.collections[collection].push({
      id: file.id,
      name: path.basename(filePath),
      ...metadata
    });
    
    return file.id;
  }

  getCollectionFiles(collection) {
    return this.collections[collection].map(f => f.id);
  }
}
```

### 2. File Lifecycle Management

```javascript
class FileLifecycleManager {
  constructor(openai) {
    this.openai = openai;
    this.fileUsage = new Map();
  }

  async trackFileUsage(fileId) {
    const current = this.fileUsage.get(fileId) || { uses: 0, lastUsed: null };
    this.fileUsage.set(fileId, {
      uses: current.uses + 1,
      lastUsed: new Date()
    });
  }

  async cleanupUnusedFiles(daysSinceLastUse = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastUse);
    
    for (const [fileId, usage] of this.fileUsage) {
      if (usage.lastUsed < cutoffDate) {
        try {
          await this.openai.files.del(fileId);
          this.fileUsage.delete(fileId);
          console.log(`Cleaned up unused file: ${fileId}`);
        } catch (error) {
          console.error(`Failed to delete file ${fileId}:`, error);
        }
      }
    }
  }
}
```

### 3. Error Handling and Resilience

```javascript
class ResilientFileManager {
  constructor(openai, retryAttempts = 3) {
    this.openai = openai;
    this.retryAttempts = retryAttempts;
  }

  async uploadWithRetry(filePath, purpose = "file-search") {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        return await this.openai.files.create({
          file: fs.createReadStream(filePath),
          purpose
        });
      } catch (error) {
        console.error(`Upload attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retryAttempts) {
          throw new Error(`Failed to upload file after ${this.retryAttempts} attempts`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  async safeFileSearch(query, fileIds = []) {
    try {
      return await this.openai.responses.create({
        model: "gpt-4o",
        input: query,
        tools: [
          {
            type: "file_search",
            file_search: fileIds.length > 0 ? { file_ids: fileIds } : {}
          }
        ]
      });
    } catch (error) {
      if (error.message?.includes('file not found')) {
        console.warn("Some files may have been deleted. Retrying without specific file IDs...");
        return await this.openai.responses.create({
          model: "gpt-4o",
          input: query,
          tools: [{ type: "file_search" }]
        });
      }
      throw error;
    }
  }
}
```

## Performance Optimization

### File Chunking Strategy

```javascript
// For large documents, consider splitting into logical chunks
class DocumentChunker {
  static async chunkDocument(filePath, maxChunkSize = 50 * 1024 * 1024) { // 50MB
    const fileSize = fs.statSync(filePath).size;
    
    if (fileSize <= maxChunkSize) {
      return [filePath]; // No chunking needed
    }
    
    // Implement chunking logic based on document type
    // This is a simplified example
    const chunks = [];
    const content = fs.readFileSync(filePath, 'utf8');
    const chunkCount = Math.ceil(content.length / maxChunkSize);
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * maxChunkSize;
      const end = Math.min(start + maxChunkSize, content.length);
      const chunkContent = content.slice(start, end);
      
      const chunkPath = `${filePath}.chunk${i + 1}`;
      fs.writeFileSync(chunkPath, chunkContent);
      chunks.push(chunkPath);
    }
    
    return chunks;
  }
}
```

### Caching Search Results

```javascript
class FileSearchCache {
  constructor(ttlMinutes = 60) {
    this.cache = new Map();
    this.ttl = ttlMinutes * 60 * 1000;
  }

  getCacheKey(query, fileIds) {
    return `${query}-${fileIds.sort().join(',')}`;
  }

  get(query, fileIds) {
    const key = this.getCacheKey(query, fileIds);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.response;
    }
    
    if (cached) {
      this.cache.delete(key); // Remove expired entry
    }
    
    return null;
  }

  set(query, fileIds, response) {
    const key = this.getCacheKey(query, fileIds);
    this.cache.set(key, {
      response,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}
```

## Security Considerations

### File Access Control

```javascript
class SecureFileManager {
  constructor(openai, accessControl) {
    this.openai = openai;
    this.accessControl = accessControl;
    this.filePermissions = new Map();
  }

  async uploadWithPermissions(filePath, permissions) {
    const file = await this.openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: "file-search"
    });
    
    this.filePermissions.set(file.id, permissions);
    return file;
  }

  async authorizedFileSearch(query, userId, requestedFiles = []) {
    // Filter files based on user permissions
    const authorizedFiles = requestedFiles.filter(fileId => {
      const permissions = this.filePermissions.get(fileId);
      return this.accessControl.canAccess(userId, permissions);
    });

    return await this.openai.responses.create({
      model: "gpt-4o",
      input: query,
      tools: [
        {
          type: "file_search",
          file_search: {
            file_ids: authorizedFiles
          }
        }
      ]
    });
  }
}
```

## Common Patterns and Examples

### Knowledge Base Agent

```javascript
class KnowledgeBaseAgent {
  constructor(openai) {
    this.openai = openai;
    this.fileManager = new OrganizedFileManager(openai);
  }

  async initialize() {
    // Upload knowledge base files
    await this.fileManager.uploadToCollection('documentation', './docs/api-reference.pdf');
    await this.fileManager.uploadToCollection('policies', './docs/data-policy.pdf');
    await this.fileManager.uploadToCollection('procedures', './docs/onboarding.pdf');
  }

  async answerQuestion(question, category = null) {
    const fileIds = category 
      ? this.fileManager.getCollectionFiles(category)
      : Object.values(this.fileManager.collections).flat().map(f => f.id);

    return await this.openai.responses.create({
      model: "gpt-4o",
      input: `Based on the available documentation, please answer: ${question}`,
      tools: [
        {
          type: "file_search",
          file_search: {
            file_ids: fileIds,
            max_num_results: 5
          }
        }
      ]
    });
  }
}
```

## Integration Examples

### With Express.js API

```javascript
app.post('/api/ask', async (req, res) => {
  try {
    const { question, category } = req.body;
    const response = await knowledgeAgent.answerQuestion(question, category);
    
    res.json({
      answer: response.output_text,
      sources: await processFileSearchResults(response)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### With Queue Processing

```javascript
async function processFileUploadQueue(jobs) {
  for (const job of jobs) {
    try {
      const fileId = await fileManager.uploadWithRetry(job.filePath);
      await job.onSuccess(fileId);
    } catch (error) {
      await job.onError(error);
    }
  }
}
```

---

*Next: [11-computer-use-implementation.md](11-computer-use-implementation.md) - Computer control and automation capabilities* 