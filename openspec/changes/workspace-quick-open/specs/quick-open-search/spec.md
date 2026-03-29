## ADDED Requirements

### Requirement: Search provider interface
The system SHALL define a SearchProvider interface that each resource type implements.

```typescript
interface SearchProvider {
  type: SearchResultType
  search(query: string, options: SearchOptions): Promise<SearchResult[]>
  icon: ComponentType
}
```

#### Scenario: Provider returns results
- **WHEN** provider's search method is called with valid query
- **THEN** provider SHALL return array of matching SearchResult objects

#### Scenario: Provider handles errors
- **WHEN** provider encounters an error during search
- **THEN** provider SHALL return empty array
- **AND** log error for debugging

### Requirement: Project search provider
The system SHALL provide a search provider for projects.

#### Scenario: Search projects by name
- **WHEN** user searches for "budget"
- **THEN** system returns all projects with "budget" in name
- **AND** project is in current workspace or user has access to

#### Scenario: Search projects by description
- **WHEN** user searches for project description keywords
- **THEN** system returns matching projects

### Requirement: Document search provider
The system SHALL provide a search provider for documents (单据).

#### Scenario: Search documents
- **WHEN** user searches for document title
- **THEN** system returns matching documents within accessible workspaces

### Requirement: Template search provider
The system SHALL provide a search provider for templates.

#### Scenario: Search templates
- **WHEN** user searches for template name
- **THEN** system returns all templates with matching name

### Requirement: Knowledge search provider
The system SHALL provide a search provider for knowledge base entries.

#### Scenario: Search knowledge entries
- **WHEN** user searches for knowledge title or tags
- **THEN** system returns matching knowledge entries

### Requirement: User search provider
The system SHALL provide a search provider for users/collaborators.

#### Scenario: Search users
- **WHEN** user searches for username
- **THEN** system returns matching users in current tenant
- **AND** excludes deactivated users

### Requirement: Search aggregation
The system SHALL aggregate results from all providers and return unified results.

#### Scenario: Aggregate multiple provider results
- **WHEN** search query is executed
- **THEN** system queries all registered providers in parallel
- **AND** aggregates results into single array
- **AND** returns up to 50 total results (5 per type)

### Requirement: Search permission filtering
Each provider SHALL filter results based on user's access permissions.

#### Scenario: Filter by workspace access
- **WHEN** provider returns results
- **THEN** provider SHALL filter out resources user cannot access
- **AND** only return resources within accessible workspaces
