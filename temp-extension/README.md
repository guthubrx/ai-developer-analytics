# AI Developer Analytics

A comprehensive VS Code/Cursor extension for AI developer analytics with dual-level routing, local Ollama support, and adaptive coaching.

## Features

### 🚀 Dual-Level AI Routing
- **Level 1**: Direct execution (manual provider selection)
- **Level 2**: Intelligent routing (automatic/delegated routing)

### 🤖 Multi-Provider Support
- **OpenAI** (GPT-5)
- **Anthropic** (Claude 4.5)
- **DeepSeek**
- **Ollama** (local/offline)

### 🖥️ Local AI Integration
- Ollama detection and model management
- Offline mode support
- Local routing decisions

### 📊 Advanced Analytics
- Cost tracking per provider
- Latency monitoring
- Token usage analytics
- Cache performance metrics
- Success rate tracking

### 🧠 AI Coaching
- Adaptive coaching based on usage patterns
- Weekly progress reports
- Code health index
- Architecture scanning

### ⚡ Hot Reload
- Full hot reload for UI and backend
- Module reloading without VS Code restart
- State preservation

### 🔐 Security & Privacy
- CSP enforcement for WebViews
- VS Code SecretStorage for API keys
- Encrypted SQLite database
- PII hashing (SHA-256)

## Architecture

```
src/
├─ ai/
│  ├─ router/              # Local + delegated routing
│  ├─ clients/             # OpenAI, Anthropic, DeepSeek, Ollama
│  ├─ cache/               # Exact + semantic + LRU caching
│  └─ metrics/             # Cost, latency, success tracking
├─ ui/
│  ├─ sidebar/             # AI Command Bar
│  ├─ dashboards/          # Ops Router · BI · Coach
│  └─ panels/              # Routing Selector · Settings · History
├─ analytics/              # SQLite AES (local)
├─ coaching/               # AI Coach + Weekly Reports
├─ architecture/           # Technical debt scanner
└─ telemetry/              # OpenTelemetry local
```

## Installation

1. Clone the repository
2. Run `npm install`
3. Run `npm run compile`
4. Install the VSIX package in VS Code

## Configuration

### AI Providers

Set up API keys in VS Code settings:
- `aiAnalytics.openaiApiKey`
- `aiAnalytics.anthropicApiKey`
- `aiAnalytics.deepseekApiKey`

### Ollama Settings
- `aiAnalytics.ollamaEnabled`: Enable/disable Ollama
- `aiAnalytics.ollamaUrl`: Ollama API URL (default: http://localhost:11434)
- `aiAnalytics.defaultOllamaModel`: Default model (phi-4, gemma, llama3, etc.)

### Routing Modes
- `direct`: Manual provider selection
- `auto-local`: Local router decisions
- `auto-ollama`: Ollama delegated routing
- `auto-gpt5`: GPT-5 delegated routing
- `auto-claude`: Claude delegated routing
- `auto-deepseek`: DeepSeek delegated routing

## Usage

### AI Command Bar

1. Open the AI Analytics sidebar
2. Enter your prompt in the multiline text area
3. Select task type and mode
4. Choose routing strategy
5. Click Execute or use provider buttons

### Dashboards

- **Ops Router**: Cost, latency, success rates, Ollama usage
- **BI Dev**: Productivity and costs by project
- **AI Coach**: Personalized advice and progress tracking

## Development

### Prerequisites
- Node.js 20+
- TypeScript 5.5+
- VS Code Extension Development

### Commands
- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch for changes
- `npm run test` - Run tests
- `npm run package` - Create VSIX package

## License

This project is licensed under the **AGPL-3.0-only** license. See [LICENSE](LICENSE) for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

Please ensure all code includes French and English comments as required by the project standards.