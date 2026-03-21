# 认知状态重建设计

## 一、认知状态概述

### 1.1 设计理念

认知状态重建是记忆架构的**核心创新**，借鉴 brain-mcp-cli 的类人脑记忆设计。它不仅存储"发生了什么"，更重要的是保存"当时在想什么"，实现真正的认知连续性。

**核心理念：**
> 记忆不是数据的简单存储，而是认知状态的完整重建。当Agent恢复工作时，它应该能够"回到"之前的思考状态，而不是从零开始。

### 1.2 认知状态组成

```
┌─────────────────────────────────────────────────────────────────┐
│                    认知状态组成                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              思考阶段 (Thinking Stage)                    │   │
│  │                                                          │   │
│  │  exploring    → 探索阶段：收集信息，提出问题              │   │
│  │  crystallizing → 结晶阶段：形成初步理解和假设             │   │
│  │  refining     → 精炼阶段：验证假设，深化理解              │   │
│  │  executing    → 执行阶段：实施决策，验证结果              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              开放问题 (Open Questions)                    │   │
│  │                                                          │   │
│  │  当前正在追踪的未解决问题列表                             │   │
│  │  每个问题包含：问题内容、提出时间、相关上下文             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              决策历史 (Decisions)                         │   │
│  │                                                          │   │
│  │  已做出的重要决策列表                                     │   │
│  │  每个决策包含：决策内容、理由、时间、影响范围             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              情感基调 (Emotional Tone)                    │   │
│  │                                                          │   │
│  │  analytical   → 分析型：逻辑推理，数据驱动                │   │
│  │  enthusiastic → 热情型：积极尝试，快速迭代                │   │
│  │  cautious     → 谨慎型：小心验证，风险规避                │   │
│  │  frustrated   → 挫败型：遇到障碍，需要帮助                │   │
│  │  neutral      → 中性：常规处理，无特殊情绪                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              认知模式 (Cognitive Pattern)                 │   │
│  │                                                          │   │
│  │  deep-dive    → 深度探索：聚焦单一主题                    │   │
│  │  exploratory  → 广泛探索：多主题并行                      │   │
│  │  systematic   → 系统化：结构化方法                        │   │
│  │  creative     → 创造性：非传统方法                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、思考阶段模型

### 2.1 阶段定义

```typescript
/**
 * 思考阶段枚举
 */
type ThinkingStage = 'exploring' | 'crystallizing' | 'refining' | 'executing';

/**
 * 思考阶段定义
 */
const THINKING_STAGES: Record<ThinkingStage, StageDefinition> = {
  exploring: {
    name: '探索阶段',
    description: '收集信息，提出问题，建立上下文',
    characteristics: [
      '大量提问',
      '广泛搜索',
      '信息收集',
      '建立基础理解'
    ],
    indicators: [
      '频繁使用搜索工具',
      '提出多个问题',
      '阅读大量文档',
      '尚未形成明确方向'
    ],
    transitions: {
      next: 'crystallizing',
      conditions: ['信息收集完成', '形成初步假设', '问题范围缩小']
    }
  },
  
  crystallizing: {
    name: '结晶阶段',
    description: '形成初步理解和假设，开始聚焦',
    characteristics: [
      '形成假设',
      '识别关键概念',
      '建立心智模型',
      '聚焦问题核心'
    ],
    indicators: [
      '开始提出解决方案',
      '识别关键约束',
      '形成设计思路',
      '减少搜索频率'
    ],
    transitions: {
      next: 'refining',
      prev: 'exploring',
      conditions: ['假设形成', '方向确定', '核心问题识别']
    }
  },
  
  refining: {
    name: '精炼阶段',
    description: '验证假设，深化理解，完善方案',
    characteristics: [
      '验证假设',
      '处理边缘情况',
      '优化方案',
      '解决细节问题'
    ],
    indicators: [
      '测试和验证',
      '处理异常情况',
      '优化性能',
      '完善实现细节'
    ],
    transitions: {
      next: 'executing',
      prev: 'crystallizing',
      conditions: ['方案验证通过', '细节完善', '准备实施']
    }
  },
  
  executing: {
    name: '执行阶段',
    description: '实施决策，验证结果，完成任务',
    characteristics: [
      '执行决策',
      '实施变更',
      '验证结果',
      '文档记录'
    ],
    indicators: [
      '代码编写',
      '配置修改',
      '测试运行',
      '结果验证'
    ],
    transitions: {
      prev: 'refining',
      conditions: ['任务完成', '结果验证', '可能返回探索']
    }
  }
};
```

### 2.2 阶段检测算法

```typescript
/**
 * 思考阶段检测器
 */
export class ThinkingStageDetector {
  private sessionMessages: Message[];
  private toolCallHistory: ToolCall[];
  
  constructor(sessionMessages: Message[], toolCallHistory: ToolCall[]) {
    this.sessionMessages = sessionMessages;
    this.toolCallHistory = toolCallHistory;
  }
  
  /**
   * 检测当前思考阶段
   */
  detect(): ThinkingStage {
    const signals = this.extractSignals();
    const scores = this.calculateStageScores(signals);
    
    // 返回得分最高的阶段
    return this.getTopStage(scores);
  }
  
  /**
   * 提取信号
   */
  private extractSignals(): StageSignals {
    const recentMessages = this.sessionMessages.slice(-10);
    const recentTools = this.toolCallHistory.slice(-20);
    
    return {
      // 搜索相关
      searchCount: recentTools.filter(t => t.name.includes('search')).length,
      readCount: recentTools.filter(t => t.name === 'Read').length,
      
      // 写入相关
      writeCount: recentTools.filter(t => t.name === 'Write' || t.name === 'Edit').length,
      
      // 问题相关
      questionCount: recentMessages.filter(m => m.content.includes('?')).length,
      
      // 决策相关
      decisionKeywords: this.countKeywords(recentMessages, ['决定', '选择', '采用', '使用']),
      
      // 验证相关
      testKeywords: this.countKeywords(recentMessages, ['测试', '验证', '检查', '确认']),
      
      // 执行相关
      executionKeywords: this.countKeywords(recentMessages, ['执行', '实施', '完成', '实现'])
    };
  }
  
  /**
   * 计算阶段得分
   */
  private calculateStageScores(signals: StageSignals): Record<ThinkingStage, number> {
    const scores: Record<ThinkingStage, number> = {
      exploring: 0,
      crystallizing: 0,
      refining: 0,
      executing: 0
    };
    
    // 探索阶段信号
    scores.exploring = 
      signals.searchCount * 2 +
      signals.readCount * 1.5 +
      signals.questionCount * 2;
    
    // 结晶阶段信号
    scores.crystallizing = 
      signals.decisionKeywords * 3 +
      signals.readCount * 0.5 +
      (signals.questionCount > 0 ? -1 : 0);
    
    // 精炼阶段信号
    scores.refining = 
      signals.testKeywords * 3 +
      signals.writeCount * 1 +
      signals.decisionKeywords * 1;
    
    // 执行阶段信号
    scores.executing = 
      signals.executionKeywords * 3 +
      signals.writeCount * 2 +
      (signals.searchCount > 0 ? -2 : 0);
    
    return scores;
  }
  
  /**
   * 获取最高得分阶段
   */
  private getTopStage(scores: Record<ThinkingStage, number>): ThinkingStage {
    let topStage: ThinkingStage = 'exploring';
    let topScore = scores.exploring;
    
    for (const [stage, score] of Object.entries(scores)) {
      if (score > topScore) {
        topScore = score;
        topStage = stage as ThinkingStage;
      }
    }
    
    return topStage;
  }
  
  /**
   * 统计关键词出现次数
   */
  private countKeywords(messages: Message[], keywords: string[]): number {
    let count = 0;
    for (const message of messages) {
      for (const keyword of keywords) {
        if (message.content.includes(keyword)) {
          count++;
        }
      }
    }
    return count;
  }
}

interface StageSignals {
  searchCount: number;
  readCount: number;
  writeCount: number;
  questionCount: number;
  decisionKeywords: number;
  testKeywords: number;
  executionKeywords: number;
}
```

---

## 三、领域状态管理

### 3.1 领域状态模型

```typescript
/**
 * 领域状态
 * 每个部门/领域维护独立的认知状态
 */
interface DomainState {
  // 标识
  tenant_id: string;
  user_id: string;
  domain: string;              // 领域标识（如：hr, sales, finance）
  
  // 认知状态
  thinking_stage: ThinkingStage;
  emotional_tone: EmotionalTone;
  cognitive_pattern: CognitivePattern;
  
  // 内容聚合
  open_questions: OpenQuestion[];
  decisions: Decision[];
  concepts: Concept[];
  key_insights: Insight[];
  
  // 统计
  session_count: number;
  breakthrough_count: number;
  significant_count: number;
  
  // 关联
  connected_domains: string[];
  
  // 时间戳
  last_active: string;
  created_at: string;
  updated_at: string;
}

/**
 * 开放问题
 */
interface OpenQuestion {
  id: string;
  content: string;
  created_at: string;
  source_session: string;
  status: 'open' | 'resolved' | 'abandoned';
  resolved_at?: string;
  resolution?: string;
  related_questions: string[];
}

/**
 * 决策
 */
interface Decision {
  id: string;
  content: string;
  rationale: string;
  created_at: string;
  source_session: string;
  impact: 'high' | 'medium' | 'low';
  reversible: boolean;
  related_decisions: string[];
}

/**
 * 概念
 */
interface Concept {
  name: string;
  definition: string;
  first_seen: string;
  last_referenced: string;
  reference_count: number;
  related_concepts: string[];
}

/**
 * 洞察
 */
interface Insight {
  id: string;
  content: string;
  importance: Importance;
  created_at: string;
  source_session: string;
  validated: boolean;
}
```

### 3.2 领域状态管理器

```typescript
/**
 * 领域状态管理器
 */
export class DomainStateManager {
  private db: DatabaseSync;
  private cache: Map<string, DomainState> = new Map();
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 获取领域状态
   */
  getDomainState(
    tenantId: string,
    userId: string,
    domain: string
  ): DomainState | null {
    const cacheKey = `${tenantId}:${userId}:${domain}`;
    
    // 检查缓存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 从数据库加载
    const stmt = this.db.prepare(`
      SELECT * FROM domain_states
      WHERE tenant_id = ? AND user_id = ? AND domain = ?
    `);
    
    const row = stmt.get(tenantId, userId, domain) as any;
    
    if (!row) {
      return null;
    }
    
    const state = this.mapRowToDomainState(row);
    this.cache.set(cacheKey, state);
    
    return state;
  }
  
  /**
   * 创建或更新领域状态
   */
  upsertDomainState(state: DomainStateInput): void {
    const existing = this.getDomainState(
      state.tenant_id,
      state.user_id,
      state.domain
    );
    
    if (existing) {
      this.updateDomainState(existing, state);
    } else {
      this.createDomainState(state);
    }
    
    // 清除缓存
    const cacheKey = `${state.tenant_id}:${state.user_id}:${state.domain}`;
    this.cache.delete(cacheKey);
  }
  
  /**
   * 更新领域状态
   */
  private updateDomainState(existing: DomainState, update: DomainStateInput): void {
    const stmt = this.db.prepare(`
      UPDATE domain_states SET
        thinking_stage = ?,
        emotional_tone = ?,
        cognitive_pattern = ?,
        open_questions = ?,
        decisions = ?,
        concepts = ?,
        key_insights = ?,
        session_count = session_count + 1,
        breakthrough_count = breakthrough_count + ?,
        significant_count = significant_count + ?,
        connected_domains = ?,
        last_active = ?,
        updated_at = ?
      WHERE tenant_id = ? AND user_id = ? AND domain = ?
    `);
    
    const now = new Date();
    
    stmt.run(
      update.thinking_stage || existing.thinking_stage,
      update.emotional_tone || existing.emotional_tone,
      update.cognitive_pattern || existing.cognitive_pattern,
      JSON.stringify(this.mergeArrays(
        existing.open_questions,
        update.open_questions || []
      )),
      JSON.stringify(this.mergeArrays(
        existing.decisions,
        update.decisions || []
      )),
      JSON.stringify(this.mergeArrays(
        existing.concepts,
        update.concepts || []
      )),
      JSON.stringify(this.mergeArrays(
        existing.key_insights,
        update.key_insights || []
      )),
      update.importance === 'breakthrough' ? 1 : 0,
      update.importance === 'significant' ? 1 : 0,
      JSON.stringify(this.mergeArrays(
        existing.connected_domains,
        update.connected_domains || []
      )),
      now.toISOString(),
      now.toISOString(),
      existing.tenant_id,
      existing.user_id,
      existing.domain
    );
  }
  
  /**
   * 合并数组（去重）
   */
  private mergeArrays<T extends { id?: string }>(
    existing: T[],
    newItems: T[]
  ): T[] {
    const merged = [...existing];
    
    for (const item of newItems) {
      // 如果有ID，检查是否已存在
      if ('id' in item && item.id) {
        const existingIndex = merged.findIndex(e => 
          'id' in e && e.id === item.id
        );
        if (existingIndex >= 0) {
          merged[existingIndex] = item;
          continue;
        }
      }
      merged.push(item);
    }
    
    // 限制数量
    return merged.slice(-50);  // 保留最近50条
  }
}
```

---

## 四、认知状态重建

### 4.1 tunnel_state 工具

借鉴 brain-mcp-cli 的核心工具，实现认知状态重建：

```typescript
/**
 * tunnel_state 工具
 * 重建指定领域的认知状态
 */
export class TunnelStateTool implements Tool {
  name = 'tunnel_state';
  description = '重建指定领域的认知状态，恢复思考上下文';
  
  parameters = {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: '目标领域标识（如：hr, sales, finance）'
      },
      depth: {
        type: 'number',
        description: '重建深度（1-5），默认3',
        default: 3
      },
      include_history: {
        type: 'boolean',
        description: '是否包含历史演变',
        default: false
      }
    },
    required: ['domain']
  };
  
  private domainStateManager: DomainStateManager;
  private summaryManager: SummaryManager;
  
  constructor(
    domainStateManager: DomainStateManager,
    summaryManager: SummaryManager
  ) {
    this.domainStateManager = domainStateManager;
    this.summaryManager = summaryManager;
  }
  
  /**
   * 执行工具
   */
  async execute(params: TunnelStateParams, context: ToolContext): Promise<ToolResult> {
    const { domain, depth = 3, include_history = false } = params;
    const { tenantId, userId } = context;
    
    // 1. 获取领域状态
    const domainState = this.domainStateManager.getDomainState(
      tenantId,
      userId,
      domain
    );
    
    if (!domainState) {
      return {
        success: false,
        error: `未找到领域 ${domain} 的认知状态`
      };
    }
    
    // 2. 构建认知状态文本
    const stateText = this.buildStateText(domainState, depth);
    
    // 3. 可选：添加历史演变
    let historyText = '';
    if (include_history) {
      historyText = await this.buildHistoryText(tenantId, userId, domain);
    }
    
    // 4. 计算上下文切换成本
    const switchingCost = this.calculateSwitchingCost(
      context.currentDomain,
      domain
    );
    
    return {
      success: true,
      output: {
        domain,
        cognitive_state: stateText,
        history: historyText || undefined,
        switching_cost: switchingCost,
        last_active: domainState.last_active
      }
    };
  }
  
  /**
   * 构建状态文本
   */
  private buildStateText(state: DomainState, depth: number): string {
    const lines: string[] = [];
    
    lines.push(`## ${state.domain} 领域认知状态`);
    lines.push('');
    
    // 思考阶段
    lines.push(`**思考阶段**: ${this.formatThinkingStage(state.thinking_stage)}`);
    lines.push('');
    
    // 开放问题
    if (state.open_questions.length > 0 && depth >= 2) {
      lines.push('### 开放问题');
      const questions = state.open_questions
        .filter(q => q.status === 'open')
        .slice(0, depth * 2);
      for (const q of questions) {
        lines.push(`- ${q.content}`);
      }
      lines.push('');
    }
    
    // 决策历史
    if (state.decisions.length > 0 && depth >= 2) {
      lines.push('### 已做决策');
      const decisions = state.decisions.slice(-depth);
      for (const d of decisions) {
        lines.push(`- ${d.content}`);
        if (depth >= 4) {
          lines.push(`  理由: ${d.rationale}`);
        }
      }
      lines.push('');
    }
    
    // 关键概念
    if (state.concepts.length > 0 && depth >= 3) {
      lines.push('### 核心概念');
      const concepts = state.concepts
        .sort((a, b) => b.reference_count - a.reference_count)
        .slice(0, depth);
      for (const c of concepts) {
        lines.push(`- **${c.name}**: ${c.definition}`);
      }
      lines.push('');
    }
    
    // 关键洞察
    if (state.key_insights.length > 0 && depth >= 3) {
      lines.push('### 关键洞察');
      const insights = state.key_insights.slice(-depth);
      for (const i of insights) {
        lines.push(`- ${i.content}`);
      }
      lines.push('');
    }
    
    // 统计
    lines.push('### 统计');
    lines.push(`- 会话数: ${state.session_count}`);
    lines.push(`- 突破数: ${state.breakthrough_count}`);
    lines.push(`- 重要发现: ${state.significant_count}`);
    
    return lines.join('\n');
  }
  
  /**
   * 格式化思考阶段
   */
  private formatThinkingStage(stage: ThinkingStage): string {
    const stageNames: Record<ThinkingStage, string> = {
      exploring: '🔍 探索阶段',
      crystallizing: '💎 结晶阶段',
      refining: '🔧 精炼阶段',
      executing: '🚀 执行阶段'
    };
    return stageNames[stage];
  }
  
  /**
   * 计算上下文切换成本
   */
  private calculateSwitchingCost(
    currentDomain: string | null,
    targetDomain: string
  ): SwitchingCost {
    if (!currentDomain || currentDomain === targetDomain) {
      return {
        level: 'none',
        description: '无需切换',
        estimated_tokens: 0
      };
    }
    
    // 检查领域关联度
    const relatedDomains = this.getRelatedDomains(currentDomain);
    
    if (relatedDomains.includes(targetDomain)) {
      return {
        level: 'low',
        description: '相关领域，切换成本较低',
        estimated_tokens: 200
      };
    }
    
    return {
      level: 'high',
      description: '不相关领域，需要完全重建上下文',
      estimated_tokens: 500
    };
  }
}

interface TunnelStateParams {
  domain: string;
  depth?: number;
  include_history?: boolean;
}

interface SwitchingCost {
  level: 'none' | 'low' | 'high';
  description: string;
  estimated_tokens: number;
}
```

### 4.2 thinking_trajectory 工具

```typescript
/**
 * thinking_trajectory 工具
 * 追踪主题/概念的思维演变轨迹
 */
export class ThinkingTrajectoryTool implements Tool {
  name = 'thinking_trajectory';
  description = '追踪特定主题的思维演变轨迹';
  
  parameters = {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '要追踪的主题或概念'
      },
      time_range: {
        type: 'string',
        description: '时间范围（如：7d, 30d, all）',
        default: '30d'
      }
    },
    required: ['topic']
  };
  
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 执行工具
   */
  async execute(params: TrajectoryParams, context: ToolContext): Promise<ToolResult> {
    const { topic, time_range = '30d' } = params;
    
    // 1. 搜索相关会话
    const sessions = await this.findRelatedSessions(
      context.tenantId,
      topic,
      time_range
    );
    
    // 2. 提取思维轨迹
    const trajectory = this.extractTrajectory(sessions, topic);
    
    // 3. 构建输出
    const output = this.buildTrajectoryOutput(trajectory, topic);
    
    return {
      success: true,
      output
    };
  }
  
  /**
   * 查找相关会话
   */
  private async findRelatedSessions(
    tenantId: string,
    topic: string,
    timeRange: string
  ): Promise<SessionWithSummary[]> {
    const timeCondition = this.buildTimeCondition(timeRange);
    
    const sql = `
      SELECT 
        s.session_key,
        s.title,
        s.created_at,
        s.thinking_stage,
        s.importance,
        su.summary,
        su.key_insights,
        su.decisions,
        su.open_questions
      FROM sessions s
      LEFT JOIN summaries su ON s.session_key = su.session_key
      WHERE s.tenant_id = ?
        AND ${timeCondition}
        AND (
          s.title LIKE ? OR
          su.summary LIKE ? OR
          su.key_insights LIKE ? OR
          su.decisions LIKE ?
        )
      ORDER BY s.created_at_epoch ASC
    `;
    
    const likePattern = `%${topic}%`;
    const stmt = this.db.prepare(sql);
    
    return stmt.all(
      tenantId,
      likePattern,
      likePattern,
      likePattern,
      likePattern
    ) as SessionWithSummary[];
  }
  
  /**
   * 提取思维轨迹
   */
  private extractTrajectory(
    sessions: SessionWithSummary[],
    topic: string
  ): ThinkingTrajectory {
    const stages: StageTransition[] = [];
    const milestones: Milestone[] = [];
    
    let prevStage: ThinkingStage | null = null;
    
    for (const session of sessions) {
      const currentStage = session.thinking_stage as ThinkingStage;
      
      // 记录阶段转换
      if (currentStage && currentStage !== prevStage) {
        stages.push({
          date: session.created_at,
          from_stage: prevStage,
          to_stage: currentStage,
          session_key: session.session_key
        });
        prevStage = currentStage;
      }
      
      // 记录里程碑
      if (session.importance === 'breakthrough' || session.importance === 'significant') {
        milestones.push({
          date: session.created_at,
          session_key: session.session_key,
          summary: session.summary || session.title || '无摘要',
          decisions: session.decisions ? JSON.parse(session.decisions) : [],
          questions: session.open_questions ? JSON.parse(session.open_questions) : []
        });
      }
    }
    
    return {
      topic,
      sessions: sessions.length,
      stages,
      milestones,
      current_stage: prevStage || 'exploring'
    };
  }
  
  /**
   * 构建输出
   */
  private buildTrajectoryOutput(trajectory: ThinkingTrajectory, topic: string): string {
    const lines: string[] = [];
    
    lines.push(`## "${topic}" 思维演变轨迹`);
    lines.push('');
    
    // 概览
    lines.push(`**相关会话**: ${trajectory.sessions} 个`);
    lines.push(`**当前阶段**: ${this.formatStage(trajectory.current_stage)}`);
    lines.push('');
    
    // 阶段演变
    if (trajectory.stages.length > 0) {
      lines.push('### 阶段演变');
      for (const stage of trajectory.stages) {
        const from = stage.from_stage ? `${this.formatStage(stage.from_stage)} → ` : '';
        lines.push(`- ${stage.date}: ${from}${this.formatStage(stage.to_stage)}`);
      }
      lines.push('');
    }
    
    // 里程碑
    if (trajectory.milestones.length > 0) {
      lines.push('### 关键里程碑');
      for (const m of trajectory.milestones) {
        lines.push(`#### ${m.date}`);
        lines.push(m.summary);
        if (m.decisions.length > 0) {
          lines.push('**决策**:');
          for (const d of m.decisions) {
            lines.push(`- ${d}`);
          }
        }
        lines.push('');
      }
    }
    
    return lines.join('\n');
  }
  
  private formatStage(stage: ThinkingStage): string {
    const names: Record<ThinkingStage, string> = {
      exploring: '探索',
      crystallizing: '结晶',
      refining: '精炼',
      executing: '执行'
    };
    return names[stage];
  }
}

interface ThinkingTrajectory {
  topic: string;
  sessions: number;
  stages: StageTransition[];
  milestones: Milestone[];
  current_stage: ThinkingStage;
}
```

---

## 五、上下文切换成本

### 5.1 切换成本模型

```typescript
/**
 * 上下文切换成本计算器
 */
export class SwitchingCostCalculator {
  private domainStateManager: DomainStateManager;
  
  constructor(domainStateManager: DomainStateManager) {
    this.domainStateManager = domainStateManager;
  }
  
  /**
   * 计算切换成本
   */
  calculate(
    tenantId: string,
    userId: string,
    fromDomain: string | null,
    toDomain: string
  ): SwitchingCostResult {
    // 无需切换
    if (fromDomain === toDomain) {
      return {
        level: 'none',
        cost: 0,
        description: '同一领域，无需切换',
        recommendations: []
      };
    }
    
    // 获取目标领域状态
    const targetState = this.domainStateManager.getDomainState(
      tenantId,
      userId,
      toDomain
    );
    
    // 目标领域不存在
    if (!targetState) {
      return {
        level: 'high',
        cost: 100,
        description: '目标领域无历史状态，需要从零开始',
        recommendations: ['建议先进行领域探索']
      };
    }
    
    // 计算时间衰减
    const timeSinceActive = this.getTimeSinceActive(targetState.last_active);
    const timeDecay = this.calculateTimeDecay(timeSinceActive);
    
    // 计算领域关联度
    const relatedness = this.calculateRelatedness(fromDomain, toDomain);
    
    // 计算总成本
    const baseCost = 50;
    const cost = Math.round(baseCost * timeDecay * (1 - relatedness));
    
    // 确定级别
    let level: 'low' | 'medium' | 'high';
    if (cost < 30) {
      level = 'low';
    } else if (cost < 60) {
      level = 'medium';
    } else {
      level = 'high';
    }
    
    return {
      level,
      cost,
      description: this.generateDescription(level, timeSinceActive, relatedness),
      recommendations: this.generateRecommendations(level, targetState),
      estimated_recovery_tokens: this.estimateRecoveryTokens(targetState)
    };
  }
  
  /**
   * 计算时间衰减因子
   */
  private calculateTimeDecay(hoursSinceActive: number): number {
    // 指数衰减，半衰期24小时
    const halfLife = 24;
    return Math.pow(0.5, hoursSinceActive / halfLife);
  }
  
  /**
   * 计算领域关联度
   */
  private calculateRelatedness(fromDomain: string | null, toDomain: string): number {
    if (!fromDomain) return 0;
    
    // 预定义的领域关联矩阵
    const relatednessMatrix: Record<string, Record<string, number>> = {
      'hr': { 'finance': 0.3, 'admin': 0.4 },
      'finance': { 'hr': 0.3, 'admin': 0.5, 'sales': 0.4 },
      'sales': { 'finance': 0.4, 'marketing': 0.6 },
      'admin': { 'hr': 0.4, 'finance': 0.5 }
    };
    
    return relatednessMatrix[fromDomain]?.[toDomain] || 0;
  }
  
  /**
   * 估算恢复所需Token
   */
  private estimateRecoveryTokens(state: DomainState): number {
    let tokens = 100;  // 基础开销
    
    // 开放问题
    tokens += state.open_questions.length * 20;
    
    // 决策
    tokens += state.decisions.length * 30;
    
    // 概念
    tokens += state.concepts.length * 15;
    
    // 洞察
    tokens += state.key_insights.length * 25;
    
    return tokens;
  }
  
  private getTimeSinceActive(lastActive: string): number {
    const last = new Date(lastActive).getTime();
    const now = Date.now();
    return (now - last) / (1000 * 60 * 60);  // 小时
  }
  
  private generateDescription(
    level: 'low' | 'medium' | 'high',
    hoursSinceActive: number,
    relatedness: number
  ): string {
    const timeDesc = hoursSinceActive < 1 
      ? '刚刚活跃' 
      : hoursSinceActive < 24 
        ? `${Math.round(hoursSinceActive)}小时前活跃`
        : `${Math.round(hoursSinceActive / 24)}天前活跃`;
    
    const relatedDesc = relatedness > 0.3 
      ? '相关领域' 
      : '不相关领域';
    
    return `${timeDesc}，${relatedDesc}，切换成本${level === 'low' ? '较低' : level === 'medium' ? '中等' : '较高'}`;
  }
  
  private generateRecommendations(
    level: 'low' | 'medium' | 'high',
    state: DomainState
  ): string[] {
    const recommendations: string[] = [];
    
    if (level === 'high') {
      recommendations.push('建议使用 tunnel_state 工具重建认知状态');
    }
    
    if (state.open_questions.filter(q => q.status === 'open').length > 3) {
      recommendations.push('存在多个开放问题，建议先回顾');
    }
    
    return recommendations;
  }
}

interface SwitchingCostResult {
  level: 'none' | 'low' | 'medium' | 'high';
  cost: number;          // 0-100
  description: string;
  recommendations: string[];
  estimated_recovery_tokens?: number;
}
```

---

## 六、认知状态持久化

### 6.1 状态快照

```typescript
/**
 * 认知状态快照管理器
 */
export class CognitiveSnapshotManager {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 创建快照
   */
  createSnapshot(
    tenantId: string,
    userId: string,
    domain: string,
    sessionKey: string
  ): void {
    const state = this.captureCurrentState(tenantId, userId, domain, sessionKey);
    
    const stmt = this.db.prepare(`
      INSERT INTO cognitive_snapshots (
        tenant_id, user_id, domain, session_key,
        thinking_stage, emotional_tone, cognitive_pattern,
        open_questions, decisions, concepts, key_insights,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    
    stmt.run(
      tenantId,
      userId,
      domain,
      sessionKey,
      state.thinking_stage,
      state.emotional_tone,
      state.cognitive_pattern,
      JSON.stringify(state.open_questions),
      JSON.stringify(state.decisions),
      JSON.stringify(state.concepts),
      JSON.stringify(state.key_insights),
      now.toISOString()
    );
  }
  
  /**
   * 捕获当前状态
   */
  private captureCurrentState(
    tenantId: string,
    userId: string,
    domain: string,
    sessionKey: string
  ): CapturedState {
    // 从会话摘要中提取
    const summaryStmt = this.db.prepare(`
      SELECT * FROM summaries WHERE session_key = ?
    `);
    const summary = summaryStmt.get(sessionKey) as any;
    
    // 从消息中检测
    const messagesStmt = this.db.prepare(`
      SELECT * FROM messages WHERE session_key = ? ORDER BY created_at_epoch DESC LIMIT 20
    `);
    const messages = messagesStmt.all(sessionKey) as any[];
    
    // 检测思考阶段
    const detector = new ThinkingStageDetector(messages, []);
    const thinking_stage = detector.detect();
    
    return {
      thinking_stage,
      emotional_tone: summary?.emotional_tone || 'neutral',
      cognitive_pattern: summary?.cognitive_pattern || 'systematic',
      open_questions: summary?.open_questions ? JSON.parse(summary.open_questions) : [],
      decisions: summary?.decisions ? JSON.parse(summary.decisions) : [],
      concepts: summary?.concepts ? JSON.parse(summary.concepts) : [],
      key_insights: summary?.key_insights ? JSON.parse(summary.key_insights) : []
    };
  }
  
  /**
   * 恢复快照
   */
  restoreSnapshot(snapshotId: number): CapturedState | null {
    const stmt = this.db.prepare(`
      SELECT * FROM cognitive_snapshots WHERE id = ?
    `);
    
    const row = stmt.get(snapshotId) as any;
    
    if (!row) return null;
    
    return {
      thinking_stage: row.thinking_stage,
      emotional_tone: row.emotional_tone,
      cognitive_pattern: row.cognitive_pattern,
      open_questions: JSON.parse(row.open_questions),
      decisions: JSON.parse(row.decisions),
      concepts: JSON.parse(row.concepts),
      key_insights: JSON.parse(row.key_insights)
    };
  }
}
```

---

## 七、认知状态可视化

### 7.1 状态报告生成

```typescript
/**
 * 认知状态报告生成器
 */
export class CognitiveStateReporter {
  private domainStateManager: DomainStateManager;
  
  constructor(domainStateManager: DomainStateManager) {
    this.domainStateManager = domainStateManager;
  }
  
  /**
   * 生成用户认知状态报告
   */
  generateReport(
    tenantId: string,
    userId: string
  ): CognitiveStateReport {
    // 获取所有领域状态
    const domains = this.getAllDomainStates(tenantId, userId);
    
    return {
      summary: this.generateSummary(domains),
      domains: domains.map(d => this.formatDomainReport(d)),
      recommendations: this.generateRecommendations(domains),
      statistics: this.calculateStatistics(domains)
    };
  }
  
  /**
   * 生成摘要
   */
  private generateSummary(domains: DomainState[]): string {
    const activeDomains = domains.filter(d => {
      const hoursSinceActive = this.getHoursSinceActive(d.last_active);
      return hoursSinceActive < 24;
    });
    
    const exploringCount = domains.filter(d => d.thinking_stage === 'exploring').length;
    const executingCount = domains.filter(d => d.thinking_stage === 'executing').length;
    
    return `共 ${domains.length} 个活跃领域，${activeDomains.length} 个在过去24小时内活跃。` +
           `${exploringCount} 个处于探索阶段，${executingCount} 个处于执行阶段。`;
  }
  
  /**
   * 格式化领域报告
   */
  private formatDomainReport(state: DomainState): DomainReport {
    const hoursSinceActive = this.getHoursSinceActive(state.last_active);
    
    return {
      domain: state.domain,
      status: hoursSinceActive < 1 ? 'active' : hoursSinceActive < 24 ? 'recent' : 'dormant',
      thinking_stage: state.thinking_stage,
      open_questions_count: state.open_questions.filter(q => q.status === 'open').length,
      decisions_count: state.decisions.length,
      breakthrough_count: state.breakthrough_count,
      last_active: state.last_active,
      summary: this.generateDomainSummary(state)
    };
  }
  
  /**
   * 生成领域摘要
   */
  private generateDomainSummary(state: DomainState): string {
    const parts: string[] = [];
    
    parts.push(`思考阶段: ${this.formatStage(state.thinking_stage)}`);
    
    if (state.open_questions.length > 0) {
      parts.push(`${state.open_questions.filter(q => q.status === 'open').length} 个开放问题`);
    }
    
    if (state.decisions.length > 0) {
      parts.push(`${state.decisions.length} 个已做决策`);
    }
    
    return parts.join('，');
  }
  
  private getHoursSinceActive(lastActive: string): number {
    return (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
  }
  
  private formatStage(stage: ThinkingStage): string {
    const names: Record<ThinkingStage, string> = {
      exploring: '探索',
      crystallizing: '结晶',
      refining: '精炼',
      executing: '执行'
    };
    return names[stage];
  }
}

interface CognitiveStateReport {
  summary: string;
  domains: DomainReport[];
  recommendations: string[];
  statistics: {
    total_domains: number;
    active_domains: number;
    total_sessions: number;
    total_breakthroughs: number;
  };
}

interface DomainReport {
  domain: string;
  status: 'active' | 'recent' | 'dormant';
  thinking_stage: ThinkingStage;
  open_questions_count: number;
  decisions_count: number;
  breakthrough_count: number;
  last_active: string;
  summary: string;
}
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
