# AI-Automated-office Architecture Diagrams

Source: `architecture.md`

## 1) Layered System Architecture

```mermaid
graph TB
    U[User]

    subgraph L1
        Tauri[Tauri Shell]
        ReactUI[React UI]
        Workbench[Workbench]
    end

    subgraph L2
        Runtime[Agent Runtime]
        Planner[Planner]
        LLM[LLM Adapter]
        Tools[Tool System]
        Memory[Memory Manager]
        TemplateRT[Template Runtime]
    end

    subgraph L3
        PluginMgr[Plugin Manager]
        Registry[Plugin Registry]
        BizPlugins[Department Plugins]
    end

    subgraph L4
        SQLite[SQLite]
        Sync[Sync Engine]
        Conflict[Conflict Resolver]
        Checkpoint[Checkpoint]
    end

    subgraph L5
        Auth[Auth]
        Tenant[Tenant]
        CloudSync[Cloud Sync API]
        Storage[Object Storage]
    end

    subgraph L6
        RBAC[RBAC]
        Encrypt[Encryption]
        Audit[Audit]
        Boundary[Plugin Error Boundary]
    end

    U --> Tauri
    Tauri --> ReactUI
    ReactUI --> Workbench
    Workbench --> Runtime
    Runtime --> Planner
    Runtime --> LLM
    Runtime --> Tools
    Runtime --> Memory
    Runtime --> TemplateRT

    Tools --> PluginMgr
    PluginMgr --> Registry
    Registry --> BizPlugins
    Memory --> SQLite
    TemplateRT --> SQLite
    SQLite --> Sync
    Sync --> Conflict
    Sync --> CloudSync
    SQLite --> Checkpoint
    CloudSync --> Auth
    CloudSync --> Tenant
    CloudSync --> Storage
    RBAC --> Runtime
    Encrypt --> SQLite
    Audit --> Runtime
    Boundary --> BizPlugins
```

## 2) Agent Runtime Execution Flow

```mermaid
flowchart LR
    Intent[User Intent]
    Context[Context Assembly\nUser / Tenant / Department / Page]
    Plan[Planning & Tool Selection]
    Gate[Permission Gate]
    Exec[Tool Execution\nCore / MCP / Plugin]
    Render[Dynamic UI Host\nTemplate/Form/Editor]
    Confirm[Human Confirmation\nfor sensitive actions]
    Persist[Memory + Audit Persist]
    Result[Result to User]

    Intent --> Context --> Plan --> Gate --> Exec --> Render --> Persist --> Result
    Gate --> Confirm --> Exec
```

## 3) Plugin Integration Boundary

```mermaid
flowchart TB
    subgraph PlatformCore[Platform Core]
        PM[Plugin Manager]
        Bus[Event Bus]
        API[Extension API]
    end

    subgraph PluginA[Department Plugin A]
        ATools[Tools]
        AViews[Views / Templates]
    end

    subgraph PluginB[Department Plugin B]
        BTools[Tools]
        BViews[Views / Templates]
    end

    PM --> PluginA
    PM --> PluginB
    PluginA --> API
    PluginB --> API
    PluginA <--> Bus
    PluginB <--> Bus
```

## 4) Deployment Architecture (Desktop + Cloud)

```mermaid
flowchart LR
    subgraph Client[Enterprise Desktop Client]
        App[Tauri App]
        Core[Rust Agent Core]
        FE[React UI]
        LocalDB[(SQLite)]
    end

    subgraph Cloud[Cloud Backend]
        APIGW[API Service]
        TenantSvc[Tenant Service]
        AuthSvc[Auth Service]
        SyncSvc[Sync Service]
        ObjStore[(Object Storage)]
        CloudDB[(PostgreSQL)]
    end

    App --> FE
    App --> Core
    Core --> LocalDB
    Core <-->|TLS 1.3| APIGW
    APIGW --> TenantSvc
    APIGW --> AuthSvc
    APIGW --> SyncSvc
    SyncSvc --> CloudDB
    SyncSvc --> ObjStore
```

## 5) Local-first Data Sync Flow

```mermaid
sequenceDiagram
    participant User as User
    participant UI as React UI
    participant Core as Agent Core
    participant Local as SQLite
    participant Sync as Sync Engine
    participant Cloud as Cloud API

    User->>UI: Submit operation
    UI->>Core: Command / Intent
    Core->>Local: Write transaction
    Local-->>Core: Commit success
    Core-->>UI: Immediate success (<100ms target)
    Core->>Sync: Queue incremental change
    Sync->>Cloud: Push delta
    Cloud-->>Sync: Ack / conflict response
    Sync->>Core: Apply conflict strategy
    Core->>Local: Finalize state
```

## 6) Permission & Safety Control Path

```mermaid
flowchart LR
    Req[User Request] --> Ctx[Context Assembly]
    Ctx --> R1[Role-level RBAC]
    R1 --> R2[Department Scope Check]
    R2 --> R3[Field-level Permission]
    R3 --> Risk[Risk Classifier]
    Risk -->|Sensitive| Confirm[Human Confirmation]
    Risk -->|Normal| Exec[Tool Execution]
    Confirm --> Exec
    Exec --> Log[Audit Log + Trace]
```

## 7) C4 Context Diagram

```mermaid
graph TB
    User[Enterprise User]
    Admin[System Admin]
    System[AI-Automated-office Platform]

    LLMProvider[LLM Providers: OpenAI-compatible and Domestic Providers]
    MCP[MCP Services]
    CloudAPI[Cloud Backend APIs]
    ObjStorage[Object Storage]

    User -->|Use for daily work| System
    Admin -->|Configure tenant / permissions / plugins| System

    System -->|Model inference requests| LLMProvider
    System -->|Tool capability extension| MCP
    System -->|Auth / sync / tenant APIs| CloudAPI
    CloudAPI --> ObjStorage
```

## 8) C4 Container Diagram

```mermaid
graph LR
    subgraph DesktopClient
        UI[React UI Container]
        Agent[Agent Core Container]
        PluginHost[Plugin Host Container]
        LocalStore[Local SQLite]
    end

    subgraph CloudBackend
        AuthC[Auth Container]
        TenantC[Tenant Container]
        SyncC[Sync Container]
        Pg[PostgreSQL]
        OSS[Object Storage]
    end

    UI --> Agent
    UI --> PluginHost
    Agent --> LocalStore
    PluginHost --> Agent
    Agent --> SyncC
    SyncC --> Agent
    SyncC --> Pg
    SyncC --> OSS
    Agent --> AuthC
    AuthC --> Agent
    Agent --> TenantC
    TenantC --> Agent
```

## 9) Agent Four-Layer Mapping

```mermaid
graph TB
    subgraph P
        P1[UI Input]
        P2[Plugin Events]
        P3[Multimodal Input]
        P4[Permission Check]
    end

    subgraph D
        D1[Prompt Builder]
        D2[Context Manager]
        D3[Planner]
        D4[LLM Adapter]
    end

    subgraph E
        E1[Tool Router]
        E2[Core Tools]
        E3[MCP Tools]
        E4[Plugin Tools]
        E5[Retry Loop Guard]
    end

    subgraph M
        M1[Session Memory]
        M2[Enterprise Knowledge]
        M3[Graph Memory]
        M4[Compressor Retrieval]
    end

    P --> D --> E --> M
    M --> D
```

## 10) Module-to-Requirement Mapping (High Level)

```mermaid
flowchart LR
    subgraph Req[Requirement Groups]
        R_UI[UI & Desktop Experience\nFR1-FR8+]
        R_AGENT[Agent Core & Tooling\nFR9-FR19 / FR400+]
        R_PLUGIN[Department Plugin System\nFR20-FR26+]
        R_AUTH[Auth / Permission / Tenant\nFR27-FR37+]
        R_SYNC[Local-first Sync & Storage\nFR38-FR43+]
        R_MSG[Unified Messaging / Ops\nFR44+]
        R_EDITOR[Editor & Dynamic Template\nFR1213-FR1302]
    end

    subgraph Mod[Architecture Modules]
        M_P[Presentation Layer]
        M_A[Agent Core Layer]
        M_PL[Plugin Layer]
        M_D[Data Layer]
        M_C[Cloud Layer]
        M_X[Cross-cutting Security]
    end

    R_UI --> M_P
    R_AGENT --> M_A
    R_PLUGIN --> M_PL
    R_AUTH --> M_X
    R_SYNC --> M_D
    R_SYNC --> M_C
    R_MSG --> M_A
    R_MSG --> M_C
    R_EDITOR --> M_P
    R_EDITOR --> M_A
    R_EDITOR --> M_PL
```
