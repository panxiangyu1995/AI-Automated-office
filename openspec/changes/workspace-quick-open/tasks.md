# Tasks: workspace-quick-open

## 1. Quick Open UI Enhancement

- [ ] 1.1 Refactor existing Quick Open UI in AppLayout.tsx to use new QuickOpenModal component
- [ ] 1.2 Create QuickOpenModal component with search input and results list
- [ ] 1.3 Implement keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- [ ] 1.4 Add search result grouping by resource type
- [ ] 1.5 Add loading and empty states
- [ ] 1.6 Add workspace badge to results

## 2. Search Provider System

- [ ] 2.1 Define SearchProvider interface and SearchResult types
- [ ] 2.2 Create ProjectSearchProvider
- [ ] 2.3 Create DocumentSearchProvider
- [ ] 2.4 Create TemplateSearchProvider
- [ ] 2.5 Create KnowledgeSearchProvider
- [ ] 2.6 Create UserSearchProvider
- [ ] 2.7 Create SearchAggregator to combine results

## 3. Search Ranking Implementation

- [ ] 3.1 Implement match quality scoring (exact, prefix, contains)
- [ ] 3.2 Implement resource type weighting
- [ ] 3.3 Implement current workspace boost
- [ ] 3.4 Implement recency boost
- [ ] 3.5 Implement combined score calculation

## 4. Recent Access Tracking

- [ ] 4.1 Create recentAccessStore in Zustand
- [ ] 4.2 Implement trackAccess() function
- [ ] 4.3 Implement getRecentItems() function
- [ ] 4.4 Persist to localStorage with limit (20 items)
- [ ] 4.5 Integrate access tracking into workspace project/document open

## 5. Backend API Integration

- [ ] 5.1 Create search API client in src/lib/api/search.ts
- [ ] 5.2 Implement project search endpoint call
- [ ] 5.3 Implement document search endpoint call
- [ ] 5.4 Add debouncing (300ms) to search input
- [ ] 5.5 Add request cancellation for stale queries

## 6. Testing

- [ ] 6.1 Write unit tests for SearchAggregator
- [ ] 6.2 Write unit tests for ranking algorithm
- [ ] 6.3 Write unit tests for recentAccessStore
- [ ] 6.4 Test Quick Open in browser with Playwright
- [ ] 6.5 Test keyboard navigation
