# 更新日志 Changelog

所有项目的显著变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [3.5.0] - 2026-04-12

### 🎉 新增

#### 博弈论增强模式 (Game Theory Mode)
- 新增 `GameTheorySubagentArena` 类，支持博弈论参数
- 支持折扣因子(δ)配置，模拟参与者耐心程度
- 支持BATNA（外部选项），影响让步决策
- 贝叶斯信念更新，根据行为更新类型判断
- 实时策略提示注入到系统prompt

#### Token节省优化
- 新增 `ContextManager` 上下文管理器
- 实现滑动窗口机制，只保留最近N轮对话
- 实现摘要压缩，每M轮生成历史摘要
- **效果**: 100轮辩论从100K tokens降至30K tokens（节省70%）

#### 工程化改进
- 新增 `package.json`，规范项目配置
- 新增 `shared-config.js`，消除代码重复（DRY原则）
- 新增完整的单元测试套件（17个测试用例）
- 支持暂停/恢复辩论

### 🔧 修复

#### P0 级别 Bug（严重）
- **rebutral拼写错误** - `argument-tracker.js` 第59行
  - 问题: `rebutral` 应为 `rebuttal`，导致反驳功能完全崩溃
  - 修复: 修正变量名，添加回归测试
  
- **index.js参数截断** - `launchGameTheoryArena` 函数
  - 问题: `priorBeliefs` 被截断为 `p`，V3.5模式初始化失败
  - 修复: 完整参数解构和传递
  
- **v3/game-theory-arena.js缺失**
  - 问题: 文件不存在，require报错
  - 修复: 完整实现博弈论增强引擎

#### P1 级别 Bug（重要）
- **硬编码路径** - `subagent-arena.js` 和 `forum-engine.js`
  - 问题: 硬编码 `/Users/caoyirong`，其他用户无法运行
  - 修复: 使用 `shared-config.js` 动态检测 HOME 目录
  
- **Token爆炸** - 每轮传递完整历史
  - 问题: 50轮辩论消耗100-500元Token
  - 修复: `ContextManager` 滑动窗口 + 摘要压缩

#### P2 级别 Bug（一般）
- **output-formatter.js截断** - `formatReport` 方法
  - 问题: 统计数据部分代码被截断
  - 修复: 补全表格生成逻辑，新增 `formatDecision` 方法
  
- **代码重复** - 模式定义多处重复
  - 问题: `DISCUSSION_MODES` 和 `MODERATOR_STYLES` 在多个文件中重复定义
  - 修复: 抽取到 `shared-config.js`

### ♻️ 重构

- `subagent-arena.js` - 集成ContextManager，支持指数退避重试
- `forum-engine.js` - 使用shared-config，移除硬编码
- `index.js` - 修复参数传递，优化错误处理

### ✅ 测试

- 新增 `test/argument-tracker.test.js` - 论点追踪器测试
- 新增 `test/context-manager.test.js` - 上下文管理器测试
- 新增 `test/shared-config.test.js` - 共享配置测试
- 新增 `test/run.js` - 测试运行入口
- 所有17个测试用例通过

### 📚 文档

- 重写 `README.md`，添加v3.5特性说明
- 新增 `CHANGELOG.md`（本文件）
- 新增 `USAGE.md` 使用指南（计划中）

---

## [3.0.0] - 2026-04-XX

### 新增
- 博弈论核心算法实现（v3目录）
- 纳什均衡求解
- 贝叶斯博弈支持
- 重复博弈分析

---

## [2.0.0] - 2026-03-XX

### 新增
- 子代理交锋模式
- OpenClaw集成
- 论点追踪器
- 多种输出格式

---

## [1.0.0] - 2026-02-XX

### 新增
- 基础模拟模式
- 三种讨论模式（探索性/对抗性/决策型）
- 主持人风格系统
- 基础分数计算

---

## 版本说明

- **x.y.z** 格式
  - **x** (主版本): 重大架构变更，不兼容的API修改
  - **y** (次版本): 新功能，向下兼容
  - **z** (补丁版本): Bug修复，向下兼容

### 版本对应关系

| 版本 | 特性 | 状态 |
|------|------|------|
| v1.0 | 基础模拟模式 | ✅ 稳定 |
| v2.0 | 子代理交锋模式 | ✅ 稳定 |
| v3.0 | 博弈论算法核心 | ✅ 稳定 |
| v3.5 | 博弈论增强集成 | ✅ 当前版本 |
| v4.0 | 流式输出、多数据源 | 🚧 规划中 |
