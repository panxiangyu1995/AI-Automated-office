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

## 2026-04-16 R1.5 循环2-3差距验证

完成G1-G24全部差距当前状态验证。详见research-c2-gap/findings.md。

### 关键变化汇总
- 修复: G4(JWT生产panic), G21(Knowledge id区分), G24(dead_code清理), G16(network基本实现)
- 大幅改善: G7(console.log 89→15), G12(Rust警告 474→21), G1(编译错误 3→1)
- 部分改善: G3(hr+finance RBAC已接入), G5(10→8大文件), G6(13→8大文件)
- 不变: G2(Knowledge注释), G8(emoji), G10(Marketplace Mock), G11(plugins), G13-G15, G17-G19, G22

### 新发现
- [BUG] webhook/service.rs:142 硬编码 whsec_default_secret
- [BUG] knowledge/smart_chunker.rs:6 引用不存在的 DocumentChunk 类型（当前唯一编译错误）

## 2026-04-16 R1.5b 重新验证循环2-3关键差距

从代码实际重新验证G2/G3/G9/G10/G11/G16/G19，结果详见research-c2-gap/findings.md。

### 验证结论
- G2: 未修复（lib.rs:401-405 5个命令仍注释）
- G3: 部分修复（hr/finance/sales/warehouse/approval已接入，service/tender/marketing未接入）
- G9: 部分修复（tauri.conf.json已移除配置，但Cargo.toml依赖残留）
- G10: 未修复（完全Mock，内存存储，无持久化）
- G11: 基本未变（仅plugins/finance/agent/config.yaml）
- G16: 基本修复（有检测+监控+事件，缺重连逻辑）
- G19: 未修复（data_sync.rs:288-289 两处.unwrap()仍在）

### 额外发现
- G20 CSP unsafe-inline 仍在：tauri.conf.json:27 style-src含unsafe-inline
