# Layer 1 Core Tools Implementation Tasks

## 1. Project Setup

- [ ] 1.1 Create `src-tauri/src/agent/tools/core/` directory structure
- [ ] 1.2 Add required dependencies (reqwest for HTTP, Playwright for browser)
- [ ] 1.3 Configure Cargo.toml with new dependencies
- [ ] 1.4 Create module entry point `core/mod.rs`

## 2. Filesystem Tools Implementation

- [ ] 2.1 Implement `register_core_tools()` in `core/mod.rs`
- [ ] 2.2 Implement `file_read` tool with directory restriction
- [ ] 2.3 Implement `file_write` tool with directory restriction
- [ ] 2.4 Implement `file_edit` tool with pattern replacement
- [ ] 2.5 Implement `dir_list` tool with pattern filtering
- [ ] 2.6 Add path traversal prevention
- [ ] 2.7 Add file size limit enforcement
- [ ] 2.8 Write unit tests for filesystem tools

## 3. Shell Tools Implementation

- [ ] 3.1 Define command whitelist (grep, find, ls, cat, echo, wc, sort, uniq, head, tail)
- [ ] 3.2 Implement `sandbox_execute` tool with whitelist validation
- [ ] 3.3 Implement `pattern_search` tool with regex support
- [ ] 3.4 Add argument validation for command injection prevention
- [ ] 3.5 Write unit tests for shell tools

## 4. Web Tools Implementation

- [ ] 4.1 Define WebSearchProvider trait
- [ ] 4.2 Implement Brave Search provider
- [ ] 4.3 Implement Google (Gemini) Search provider
- [ ] 4.4 Implement Perplexity Search provider
- [ ] 4.5 Implement Tavily Search provider
- [ ] 4.6 Implement `web_search` tool with provider selection
- [ ] 4.7 Implement `web_fetch` tool with content extraction
- [ ] 4.8 Implement `http_request` tool (extend existing)
- [ ] 4.9 Add allowed domains configuration
- [ ] 4.10 Write unit tests for web tools

## 5. Browser Tools Implementation

- [ ] 5.1 Setup Playwright integration
- [ ] 5.2 Implement browser status/start/stop functions
- [ ] 5.3 Implement tab management (open, close, focus, list)
- [ ] 5.4 Implement `browser_interact` action=status
- [ ] 5.5 Implement `browser_interact` action=start/stop
- [ ] 5.6 Implement `browser_interact` action=open/focus/close/tabs
- [ ] 5.7 Implement `browser_interact` action=navigate
- [ ] 5.8 Implement `browser_interact` action=snapshot (aria/ai format)
- [ ] 5.9 Implement `browser_interact` action=screenshot
- [ ] 5.10 Implement `browser_interact` action=act (click, type, press, hover, etc.)
- [ ] 5.11 Write unit tests for browser tools

## 6. Document Tools Implementation

- [ ] 6.1 Implement `document_parse` for text files
- [ ] 6.2 Implement `document_parse` for PDF files
- [ ] 6.3 Implement `document_convert` for Markdown to HTML
- [ ] 6.4 Add format validation
- [ ] 6.5 Write unit tests for document tools

## 7. Integration

- [ ] 7.1 Register all tools in ToolRegistry
- [ ] 7.2 Add tool descriptors with metadata
- [ ] 7.3 Configure permissions for sensitive tools
- [ ] 7.4 Integration testing
- [ ] 7.5 Update existing http_request tool descriptor

## 8. Documentation

- [ ] 8.1 Update architecture docs with new tools
- [ ] 8.2 Add tool usage examples to wiki
- [ ] 8.3 Update OpenSpec specs with implementation notes
