# 虚拟论坛 Virtual Forum v3.6.1 🎭

> 让蒸馏的人物Skill就特定话题展开结构化辩论

[![Version](https://img.shields.io/badge/version-3.6.1-blue.svg)](https://github.com/erongcao/virtual-forum)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ 核心特性

### 🎯 三种辩论模式 ###

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| **探索性讨论** | 多角度剖析 → 发展 → 结论 | 复杂问题、需要综合视角 |
| **对抗性辩论** | 争辩 → 交锋 → 胜负/共识 | 决策分歧、需要明确方向 |
| **决策型讨论** | 多专家投票 → 加权评分 → 行动 | 需要拍板、有明确选项 |

## 🧠 v3.6.1 行为经济学增强版 (2026-04-12)
新增三大行为经济学理论模块nn基于经典学术著作实现：
| 理论 | 来源 | 核心功能 |
|------|------|----------|
| **前景理论** | Kahneman & Tversky (1979) | 风险决策分析、损失厌恶、框架效应 |
| **有限理性** | Simon & Jones (1999) | 满意化决策、启发式、双系统理论 |
| **助推理论** | Thaler & Sunstein (2008) | 选择架构、社会规范、默认选项 |
### 快速开始
```
javascriptnconst { BehavioralEconomicsSubagentArena } = require(x27./v3/behavioral-arenax27);
const arena = new BehavioralEconomicsSubagentArena();
await arena.initArenaWithBehavioralEconomics({topic: "气候变化政策", participants:
 [ { name: "环保主义者", position: "激进减排" }, { name: "经济学家", position: "成本效益平衡" } ], rounds: 5n});
```

### 新增文件
`v3/behavioral/` - 行为经济学模块目录
`v3/behavioral-arena.js` - 行为经济学增强竞技场
### 🚀 v3.5 重大更新

#### 1. 博弈论增强模式 (Game Theory Mode)
- **折扣因子(δ)**：影响参与者的耐心程度
- **BATNA（外部选项）**：影响让步意愿
- **贝叶斯信念更新**：根据对方行为更新判断
- **策略提示注入**：实时策略指导

#### 2. Token节省优化 (70%↓)
```javascript
const contextManager = new ContextManager({
  windowSize: 6,              // 滑动窗口
  summarizeEvery: 5           // 每5轮摘要
});
// 100轮辩论: 从100K tokens降至30K tokens
```

#### 3. 健壮性提升
- ✅ 输入验证和错误处理
- ✅ 指数退避重试机制
- ✅ 暂停/恢复支持
- ✅ 完整的单元测试

## 📦 安装

```bash
git clone https://github.com/erongcao/virtual-forum.git
cd virtual-forum
npm install  # 可选，主要用于测试
```

**要求**: Node.js >= 16.0.0

## 🚀 快速开始

### 基础用法

```javascript
const VirtualForum = require('./index.js');

const forum = new VirtualForum();

// 标准子代理辩论 (v2.0)
const result = await forum.launchArena({
  topic: 'AI是否会取代人类工作',
  participants: [
    { name: '马斯克', skillName: 'elon-musk' },
    { name: '巴菲特', skillName: 'warren-buffett' }
  ],
  rounds: 10,
  mode: 'adversarial'
});

console.log(result.output);
```

### 博弈论增强模式 (v3.5) ⭐推荐

```javascript
const result = await forum.launchGameTheoryArena({
  topic: '公司并购谈判策略',
  participants: [
    { name: '买方CEO', skillName: 'aggressive-ceo' },
    { name: '卖方CEO', skillName: 'defensive-ceo' }
  ],
  rounds: 20,
  // 博弈论参数
  discountFactors: {
    '买方CEO': 0.95,    // 有耐心，可以长期谈判
    '卖方CEO': 0.85     // 急于成交
  },
  outsideOptions: {
    '买方CEO': 30,      // BATNA: 可以找其他目标
    '卖方CEO': 10       // BATNA: 有限
  },
  totalValue: 100
});

console.log(result.output);
console.log(result.gameTheoryReport);  // 博弈论分析报告
```

## 📚 文档

- [使用指南](USAGE.md) - 详细API文档和示例
- [CHANGELOG](CHANGELOG.md) - 版本历史
- [架构说明](v3/README.md) - 博弈论引擎技术细节

## 🧪 测试

```bash
npm test
# 或
node test/run.js
```

**测试结果预览**:
```
🧪 虚拟论坛 V3.5 测试套件

ArgumentTracker 测试
✓ 添加论点
✓ 添加反驳 - P0 Bug修复验证
✓ 分数计算
✓ 统计摘要

ContextManager 测试
✓ 滑动窗口
✓ 摘要触发
✓ Token节省估算

Shared Config 测试
✓ 配置验证 - 有效配置
✓ 配置验证 - 空话题
✓ 讨论模式定义完整

OutputFormatter 测试
✓ 格式化对话
✓ 格式化报告 - 补全验证

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
总计: 17 个测试
通过: 17
失败: 0

✅ 所有测试通过！
```

## 🐛 Bug修复历史

### v3.6.1 (当前版本)

| Bug | 严重性 | 修复内容 |
|-----|--------|----------|
| **模拟模式空壳** | 🔴 高 | `forum-engine.js` `runForum()` 完整实现 |
| **ArgumentTracker断裂** | 🟠 中 | 子代理模式集成论点追踪 |
| **package.json版本** | 🟡 中 | 版本号统一为3.5.2 |

### v3.5.0 - v3.5.1

| Bug | 严重性 | 修复内容 |
|-----|--------|----------|
| **rebutral拼写错误** | 🔴 P0 | `rebuttal`修正，反驳功能恢复正常 |
| **硬编码路径** | 🟠 P1 | 移除`/Users/caoyirong`，使用动态检测 |
| **index.js参数截断** | 🔴 P0 | `p`→`priorBeliefs`，完整参数传递 |
| **v3/game-theory-arena.js缺失** | 🔴 P0 | 补全缺失文件 |
| **output-formatter.js截断** | 🟡 P2 | 补全`formatReport`方法 |

## 🏗️ 架构

```
virtual-forum/
├── index.js                 # 主入口
├── forum-engine.js          # 模拟模式引擎
├── subagent-arena.js        # 子代理交锋引擎 (v2.0)
├── argument-tracker.js      # 论点追踪器
├── output-formatter.js      # 输出格式化
├── context-manager.js       # 上下文管理 (Token优化)
├── shared-config.js         # 共享配置 (DRY)
├── package.json             # 项目配置
├── v3/
│   ├── game-theory-arena.js # 博弈论增强引擎 (v3.5)
│   └── core/                # 博弈论核心算法
└── test/                    # 单元测试
    ├── argument-tracker.test.js
    ├── context-manager.test.js
    ├── shared-config.test.js
    └── run.js
```

## 🤝 与其他Skill的集成

### 与 AI Hedge Fund Skill 结合

```javascript
// 投资委员会辩论
const result = await forum.launchGameTheoryArena({
  topic: 'NVDA估值是否合理',
  participants: [
    { name: '巴菲特', skillName: 'warren-buffett' },
    { name: '木头姐', skillName: 'cathie-wood' },
    { name: '达里奥', skillName: 'ray-dalio' }
  ],
  discountFactors: {
    '巴菲特': 0.95,    // 长期视角
    '木头姐': 0.85,    // 短期激进
    '达里奥': 0.90     // 平衡
  }
});
```

## 📝 使用场景

1. **投资决策** - 让投资大师辩论特定股票
2. **政策分析** - 模拟不同政治立场的交锋
3. **产品决策** - 让不同角色讨论产品方向
4. **学术讨论** - 模拟学术观点的辩论
5. **谈判准备** - 通过博弈论分析最优策略

## ⚠️ 诚实边界

- 虚拟论坛的观点是基于Skill中记录的思维框架**模拟**生成
- 不是真实的人物在思考
- 结果应作为参考，不是真理
- 胜负判定是游戏化的，帮助结构化思考

## 📄 许可证

MIT License

---

**版本**: v3.6.1  
**最后更新**: 2026-04-12  
**作者**: erongcao
