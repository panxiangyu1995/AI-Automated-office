# researcher 工作日志

## 2026-04-16 R1 差距验证

完成G1-G20共20项差距验证。详细结果见research-r1-gap/findings.md。

### 关键发现
- 仍存在CRITICAL: G2(CSP), G3(知识库), G5(前端零测试)
- 部分修复: G1(JWT env优先但仍有fallback), G4(RBAC框架有但使用不全)
- 已修复: G6(同步冲突), G7(大文件), G8(部门路由), G18(错误边界)
- 额外发现: lib.rs:169硬编码OpenRouter API密钥

## 2026-04-16 R2 循环预研（大文件拆分+Rust警告+Updater）

### G7 大文件拆分
- 分析了10个>1200行前端文件的结构
- 通用模式：Types(40-50%) → Constants → ID Gen → Factory → Core Logic → Serialization → Formatting
- 关键发现：3个Pilot文件结构相似可提取pilotUtils，3个Writeback文件相似可提取writebackUtils
- ProductStory.tsx的4个Workbench子组件应独立文件
- 拆分优先级：ProductStory > financePilot > MCPServiceConfig > editorTemplateWriteback > 其余

### G14 Rust警告
- 总计366个警告：unused import 224(61%), unused variable 102(28%), mutable 34(9%)
- cargo fix可自动修复大部分unused import
- unused variable需前缀_命名

### G12 Updater
- 需要Ed25519密钥对：tauri signer generate
- 当前pubkey为空，endpoints指向example.com
- 临时方案：移除updater配置避免空pubkey警告
