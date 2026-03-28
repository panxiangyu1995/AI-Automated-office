## 1. Preparation
- [x] 1.1 Confirm dependency stories are complete
- [x] 1.2 Confirm FR, NFR, ARCH, and UX mapping
- [x] 1.3 Confirm this story still matches the agent-runtime-rebaseline sequence

## 2. Implementation
- [x] 2.1 Create backend retrieval service
  - Created knowledge_retrieval.rs with KnowledgeRetrievalService
  - Implemented KnowledgeSourceRef, RetrievalRequest, RetrievalResult types
  - Implemented RetrievalCache with TTL support
- [x] 2.2 Replace mockRetrieve with real async retrieval
  - Added retrieveKnowledge and retrieveKnowledgeCached Tauri commands
  - Updated knowledgeRetrieval.ts with Tauri backend integration
  - Falls back to mock on error or when Tauri unavailable
- [x] 2.3 Enforce scope filters for tenant, department, and session
  - Implemented filter_sources_by_scope function
  - Supports Global, Tenant, Department, User, Session scopes
- [x] 2.4 Inject retrieval results into planner, runtime, and tool context
  - Added formatKnowledgeForPlanner, formatKnowledgeForRuntime, formatKnowledgeForTool
  - Backend formatting commands: format_knowledge_for_planner, format_knowledge_for_runtime, format_knowledge_for_tool
- [x] 2.5 Add caching, timeout, and degradation behavior
  - Implemented RetrievalCache with max_entries=100, default_ttl=300s
  - Added timeout handling (default 30s)
  - degrade_result returns partial results on failure

## 3. Verification
- [x] 3.1 Unit and integration tests updated
  - Added tests for filter_sources_by_scope, sort_sources_by_priority, RetrievalCache
- [x] 3.2 Lint and build pass
  - npm run lint: passed
  - npm run build: passed
  - npm run tauri build: passed (MSI and NSIS bundles created)
- [x] 3.3 Acceptance criteria verified against real runtime behavior

## 4. Documentation
- [x] 4.1 Update progress.txt
- [x] 4.2 Update task.json passes when done