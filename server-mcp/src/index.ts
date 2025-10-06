#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Define tools
const tools = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file to read',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_directory',
    description: 'List the contents of a directory',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the directory to list',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_web',
    description: 'Search the web for information',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 5,
        },
      },
      required: ['query'],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'ai-analytics-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'read_file': {
        const { path } = args as { path: string };
        const content = await fs.readFile(path, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'list_directory': {
        const { path } = args as { path: string };
        const items = await fs.readdir(path, { withFileTypes: true });
        const result = items.map((item) => ({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'search_web': {
        const { query, max_results = 5 } = args as { query: string; max_results?: number };

        // Mock web search implementation
        // In a real implementation, this would call a search API
        const mockResults = [
          { title: `Result 1 for: ${query}`, url: 'https://example.com/1', snippet: 'First result snippet' },
          { title: `Result 2 for: ${query}`, url: 'https://example.com/2', snippet: 'Second result snippet' },
          { title: `Result 3 for: ${query}`, url: 'https://example.com/3', snippet: 'Third result snippet' },
        ].slice(0, max_results);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockResults, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('AI Analytics MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});