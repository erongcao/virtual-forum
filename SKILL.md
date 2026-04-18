---
name: virtual-forum
description: |
  虚拟论坛：让蒸馏的人物Skill就特定话题展开讨论。两种模式：探索性（多角度剖析→发展→结论）和对抗性（争辩→交锋→胜负/共识）。可配置轮次（10/20/50轮）、主持人角色、论点追踪、胜负判定。
  触发词：「虚拟论坛」「发起讨论」「圆桌会议」「辩论」「主持讨论」「让XX YY讨论」
---

# 🎭 虚拟论坛 Virtual Forum

> "让思想碰撞，让智慧涌现。"

## 核心理念

虚拟论坛是一个**多角色讨论框架**，让蒸馏的人物Skill就特定话题展开有意义的对话。

不是简单的问答，而是**结构化的思想交锋**。

---

## 核心概念

### 两种讨论模式

| 模式 | 目标 | 适合场景 |
|------|------|---------|
| **探索性讨论** | 多角度剖析 → 发展 → 结论 | 复杂问题、需要综合视角 |
| **对抗性讨论** | 争辩 → 交锋 → 胜负/共识 | 决策分歧、需要明确方向 |
| **决策型讨论** | 多专家投票 → 加权评分 → 行动 | 需要拍板、有明确选项 |

### 可配置参数

```
轮次: 10 / 20 / 50 轮
主持人: 总主持 + 技术主持（可选）+ 魔鬼代言（可选）
参与者: 2-N 人
发言限时: 3分钟 / 5分钟 / 不限时
胜负判定: 点数制 / 投票制 / 让步制
输出格式: 对话流 / 报告流 / 决策流
```

---

## 执行流程

### Phase 1: 配置讨论

**收集用户配置**：

| 参数 | 选项 | 说明 |
|------|------|------|
| 话题 | 用户输入 | 要讨论的问题 |
| 模式 | 探索性/对抗性/决策型 | 讨论目标 |
| 轮次 | 10/20/50 | 讨论深度 |
| 参与者 | 2-N人 | 已蒸馏的Skill |
| 主持人风格 | 理性/犀利/整合 | 见下方 |
| 输出格式 | 对话流/报告流 | 结果展示 |

**主持人风格**：

| 风格 | 特点 | 适用场景 |
|------|------|---------|
| **理性主持人** | 客观中立，善于引导 | 学习型讨论 |
| **犀利主持人** | 追问到底，挑战每个观点 | 深度分析 |
| **整合主持人** | 归纳推动，形成共识 | 决策讨论 |

### Phase 2: 初始化讨论

1. **加载参与者Skill**
   - 读取每个参与者的SKILL.md
   - 提取心智模型、表达DNA、核心观点

2. **生成开场白**
   - 主持人自我介绍
   - 介绍话题和参与者
   - 说明讨论规则

3. **分配角色**（如有需要）
   - 技术主持：追问技术细节
   - 魔鬼代言：故意唱反调

### Phase 3: 执行讨论

**每轮结构**：

```
┌─────────────────────────────────────────┐
│ 第N轮                                    │
├─────────────────────────────────────────┤
│ 1️⃣ 轮流陈述   每人阐述观点 (限时)        │
│ 2️⃣ 交叉提问   可以点名某人提问           │
│ 3️⃣ 回应追问   被点名者回应              │
│ 4️⃣ 自由交锋   随机或点名辩论            │
│ 5️⃣ 回合总结   主持人简要归纳             │
└─────────────────────────────────────────┘
```

**不同模式的轮次差异**：

| 模式 | 第1-2轮 | 第3-N-2轮 | 最后2轮 |
|------|---------|-----------|---------|
| **探索性** | 开场陈述 | 深入探讨 | 综合结论 |
| **对抗性** | 立论 | 质疑反驳 | 胜负判定 |
| **决策型** | 各方立场 | 利弊分析 | 投票表决 |

### Phase 4: 追踪论点

**论点追踪表**：

```
┌──────────┬─────────┬─────────┬─────────┬─────────┐
│ 参与者   │ 核心论点 │ 被追问  │ 有效反驳│ 得分    │
├──────────┼─────────┼─────────┼─────────┼─────────┤
│ 巴菲特   │ 3个     │ 2次     │ 1次     │ +5      │
│ 芒格     │ 4个     │ 3次     │ 2次     │ +8      │
└──────────┴─────────┴─────────┴─────────┴─────────┘
```

**得分规则**：
- 提出有效论点：+2分
- 成功反驳对方：+3分
- 被有效反驳：-1分
- 回避问题：-2分

### Phase 5: 判定结果

| 判定方式 | 说明 |
|---------|------|
| **点数制** | 轮次结束统计点数，高分者胜 |
| **投票制** | 主持人/观众投票 |
| **让步制** | 一方主动承认对方更合理 |
| **无胜负** | 达成"保留分歧的共识" |

### Phase 6: 生成输出

**对话流格式**：
```
🎙️ 主持人：开场
💬 A：观点
💬 B：回应
⚔️ A vs B：交锋
📋 主持人：总结
```

**报告流格式**：
```
# 讨论报告

## 话题
...

## 参与者
...

## 核心论点
### A方
...
### B方
...

## 共识
...

## 分歧
...

## 结果
...
```

**决策流格式**：
```
# 决策建议

## 问题
...

## 方案A | 方案B | 方案C
...

## 投票结果
...

## 建议行动
1. ...
2. ...
```

---

## 使用示例

```
# 启动虚拟论坛
发起讨论：巴菲特 vs 芒格，当前市场该激进还是保守？

# 指定配置
虚拟论坛
模式：对抗性
轮次：20
参与者：巴菲特、芒格、马斯克
主持人：犀利主持人
输出：对话流

# 快速启动
让乔布斯和马斯克讨论：电动车行业未来
```

---

## 技术实现

### 核心模块

```
virtual-forum/
├── forum-engine.js       # 主讨论引擎
├── moderator.js          # 主持人逻辑
├── argument-tracker.js   # 论点追踪
├── verdict-calculator.js # 胜负判定
└── output-formatter.js   # 输出格式化
```

### 关键功能

1. **Skill加载器**：读取已蒸馏的Skill
2. **观点生成器**：基于Skill的思维框架生成观点
3. **论点追踪器**：记录每轮交锋
4. **判定引擎**：计算最终结果
5. **格式化器**：生成可读输出

---

## 与女娲的关系

女娲蒸馏人物，虚拟论坛让蒸馏的人物"活"起来。

- **女娲** → 造人：提取思维框架
- **虚拟论坛** → 用人：让框架互动

---

## 诚实边界

- 虚拟论坛的观点是基于Skill中记录的思维框架"模拟"生成
- 不是真正的人物在思考
- 结果应作为参考，不是真理
- 胜负判定是游戏化的，帮助结构化思考

## v3.6 行为经济学增强版 (2026-04-12)

基于三本经典著作实现的行为经济学模块：
- **前景理论** (Kahneman & Tversky, 1979) - 风险决策分析
- **有限理性模型** (Simon & Jones, 1999) - 认知限制与决策
- **助推理论** (Thaler & Sunstein, 2008) - 选择架构设计

### 新增核心模块

```javascript
const { BehavioralEconomicsSubagentArena } = require('./v3/behavioral-arena');

const arena = new BehavioralEconomicsSubagentArena();
await arena.initArenaWithBehavioralEconomics({
  topic: "气候变化政策",
  participants: [
    { name: "环保主义者", position: "激进减排" },
    { name: "经济学家", position: "成本效益平衡" }
  ],
  rounds: 5
});
```

---

## v3.7 博弈论增强版 (2026-04-18)

实现真正的博弈论计算，不再是"博弈论主题装饰"。基于：
- **Myerson (1991)** - Nash均衡计算公式
- **Fudenberg & Tirole (1991)** - 博弈论经典教材
- **Brown (1951)** - Fictitious Play学习动态

### 核心新增模块

```javascript
// 真正的博弈论框架
const { GameTheoryArena, GameStructure, BayesianBeliefSystem } = require('./v3/game-theory-v2');

const arena = new GameTheoryArena();
await arena.initArenaWithGameTheory({
  topic: "NVDA估值是否合理",
  participants: [
    { name: "巴菲特", skillName: "buffett" },
    { name: "木头姐", skillName: "cathie-wood" }
  ],
  discountFactors: { '巴菲特': 0.95, '木头姐': 0.85 },
  outsideOptions: { '巴菲特': 15, '木头姐': 5 }
});

// 计算Nash均衡
const eq = arena.calculateNashEquilibrium();
// 输出: { type: 'mixed', player1: {prob: 0.7}, player2: {prob: 0.6}, confidence: 0.9 }

// 获取博弈论报告
console.log(arena.getGameTheoryReport());
```

### 理论实现

#### 1. 博弈结构 (GameStructure)

显式定义支付矩阵和策略空间：
- **策略空间**: 每个参与者可选择"强硬"或"让步"
- **支付矩阵**: 博弈收益的完整映射
- **Nash均衡计算**: 2x2博弈使用解析公式，更复杂博弈使用Fictitious Play近似

#### 2. Nash均衡计算

**2x2博弈解析解** (Myerson 1991):

```
p = (d - c) / (a + d - b - c)
其中:
a = A强硬B强硬的收益
b = A强硬B让步的收益
c = A让步B强硬的收益
d = A让步B让步的收益
```

**N人博弈**: 使用Fictitious Play迭代逼近均衡

#### 3. 贝叶斯信念更新 (BayesianBeliefSystem)

真正的贝叶斯更新，非硬编码乘数：

```
P(H|E) = P(E|H) × P(H) / P(E)

// 例如：观察到攻击性行为 → 更新对手类型信念
posterior = bayesianUpdate('对手', 'aggressive')
// 返回: { prior, posterior, updateStrength }
```

### 博弈论功能

#### 均衡分析
```javascript
const eq = arena.calculateNashEquilibrium();
// { type: 'mixed', confidence: 0.95, equilibriumPayoff: 45.2 }
```

#### 策略建议
```javascript
// 基于均衡分析生成策略建议
const advice = arena.getStrategyAdvice('巴菲特');
// 返回: { shouldConcede: false, utility: 38.5, reason: '...' }
```

#### 贝叶斯预测
```javascript
const prediction = arena.beliefSystem.predict('木头姐');
// 返回: { type: 'growth', confidence: 0.78 }
```

### 对比: v3.5 vs v3.7

| 功能 | v3.5 | v3.7 |
|------|------|------|
| 折扣因子 | ✅ | ✅ |
| BATNA外部选项 | ✅ | ✅ |
| 贝叶斯更新 | ⚠️ 硬编码乘数 | ✅ 真正的贝叶斯 |
| Nash均衡 | ❌ | ✅ 解析解+Fictitious Play |
| 支付矩阵 | ⚠️ 隐式 | ✅ 显式定义 |
| 占优策略检验 | ❌ | ✅ |
| 博弈树/逆向归纳 | ❌ | 🔜 后续版本 |

### 文件结构

```
v3/
├── behavioral/               # 行为经济学模块
├── behavioral-arena.js      # v3.6 行为经济学竞技场
├── game-theory-arena.js     # v3.5 博弈论竞技场（基础版）
└── game-theory-v2.js        # v3.7 博弈论竞技场（真正实现）🆕
```

**使用建议**：
- 简单辩论使用 `SubagentArena` (v3.4)
- 博弈论分析使用 `GameTheoryArena` (v3.7) ← 推荐
- 行为经济学 + 博弈论使用 `BehavioralEconomicsSubagentArena` (v3.6)

### 行为经济学功能

#### 1. 前景理论引擎
- **价值函数**: 收益凹函数(风险厌恶) vs 损失凸函数(风险寻求)
- **概率加权**: 高估小概率，低估中高概率
- **四折模式**: 解释彩票偏好、保险购买、确定性效应
- **框架效应**: 增益框架 vs 损失框架的偏好逆转
- **损失厌恶**: λ ≈ 2.25，损失影响是收益的2.25倍

#### 2. 有限理性引擎
- **满意化决策**: 寻找足够好的方案而非最优
- **可得性启发**: 基于记忆可提取性判断概率
- **代表性启发**: 基于相似性判断，忽视基础概率
- **锚定调整**: 从初始值出发，调整不足
- **双系统理论**: 系统1(快速直觉) vs 系统2(慢速理性)
- **注意力模型**: 注意力作为稀缺资源的分配

#### 3. 助推理论引擎
- **选择架构**: 默认选项、排序效应、简化选择
- **社会规范**: 利用从众心理和社会证明
- **框架设计**: 增益/损失/社会框架的应用
- **反馈机制**: 即时反馈、社会比较、游戏化
- **承诺机制**: 软承诺到硬承诺的设计

### 辩论中的应用

#### 偏差检测
```javascript
const insights = arena.analyzeRoundBehavior(roundData);
// 检测：损失厌恶、确定性效应、可得性偏差、锚定效应等
```

#### 策略建议
```javascript
const advice = arena.generateBehavioralAdvice(agentName, {
  position: "支持",
  opponentPosition: "反对",
  topic: "议题",
  audienceProfile: { riskAverse: true }
});
```

#### 综合报告
```javascript
const report = arena.generateBehavioralReport();
// 包含：博弈论分析 + 行为经济学洞察 + 综合策略建议
```

---

## v3.8 高级博弈论版 (2026-04-18)

实现真正的信号博弈、重复博弈和信息设计，基于：
- **Spence (1973)** - 信号博弈理论
- **Folk Theorem** - 无限期重复博弈
- **Kamenica & Mandler (2012)** - 贝叶斯说服理论

解决虚拟论坛最核心的三个问题：
- 📡 **谁说的可信？** → 信号博弈
- 🤝 **多轮后会合作还是撕破脸？** → 重复博弈
- 📢 **主持人应该透露什么？** → 信息设计

### 核心新增模块

```javascript
const {
    SignalingGame,
    RepeatedGameEngine,
    InformationDesigner,
    AdvancedGameTheoryArena,
} = require('./v3/advanced-game-theory');

const arena = new AdvancedGameTheoryArena();
await arena.initArenaWithAdvancedGameTheory({
    topic: "AI监管应该严格还是宽松",
    participants: [
        { name: "巴菲特", skillName: "buffett" },
        { name: "马斯克", skillName: "musk" }
    ],
    discountFactors: { '巴菲特': 0.95, '马斯克': 0.85 },
    signals: { '巴菲特': 'expert', '马斯克': 'strategic' }
});
```

### 理论实现

#### 1. 信号博弈 (SignalingGame)

**核心问题**：发言者是"真的有观点"还是"只是说说"？

**均衡类型**：
- **分离均衡 (Separating)**: 不同类型选择不同信号 → 高成本信号 = 强信念
- **混同均衡 (Pooling)**: 不同类型选择相同信号 → 信号无信息量

**信号分类**：
| 信号类型 | 成本 | 可靠性 |
|---------|------|--------|
| strong_claim | 高 | 高（专家发出时） |
| evidence_backed | 高 | 高 |
| weak_claim | 低 | 低 |
| assertion | 低 | 低 |

**贝叶斯可信度评估**：
```javascript
const assessment = arena.assessArgumentCredibility('巴菲特', content);
// 返回: { signalType, signalCost, prior, posterior, isSeparating, credible, confidence }
```

#### 2. 重复博弈 (RepeatedGameEngine)

**核心问题**：多轮后会合作还是撕破脸？

**战略类型**：
| 战略 | 描述 | 适用场景 |
|------|------|----------|
| Grim Trigger | 一但背叛，永远惩罚 | 长期关系 |
| Tit-for-Tat | 合作取决于对手上一轮 | 中期互动 |
| Generous TFT | 偶尔原谅背叛 | 修复关系 |
| Suspicious TFT | 需要两次合作才原谅 | 高对抗 |

**Folk Theorem条件**：背叛收益 < 长期合作价值时，合作是均衡

**合作阶段检测**：
```javascript
const phase = repeatedGame.getPhaseAnalysis();
// { phase: 'COOPERATION'|'TRANSITION'|'CONFLICT', stability, risk }
```

#### 3. 信息设计 (InformationDesigner)

**核心问题**：主持人应该透露多少信息？

**披露模式**：
| 模式 | 说明 | 适用场景 |
|------|------|----------|
| FULL | 完全披露 | 状态平衡时 |
| STRATEGIC | 策略性披露 | 过度自信主导时 |
| CONDITIONAL | 条件披露 | 信息不对称时 |

**问题诊断**：
- OVERCONFIDENT_DOMINANT: 多数人过度自信
- BELIEF_DIVERGENCE: 信念分歧大
- INFORMATION_ASYMMETRY: 信息不对称

### 使用示例

```javascript
// 评估发言可信度
const credibility = arena.assessArgumentCredibility('巴菲特', 'AI风险被高估了');

// 获取策略建议
const advice = arena.getStrategicAdvice('巴菲特', '马斯克');

// 建议信息披露
const disclosure = arena.suggestInformationDisclosure();

// 综合报告
const report = arena.generateAdvancedGameTheoryReport();

// 摘要评分
const score = arena.getSummaryScore();
// { signalQuality: '75', cooperationLevel: '82', discussionPhase: 'COOPERATION', overallHealth: '79' }
```

### 对比: v3.7 vs v3.8

| 功能 | v3.7 | v3.8 |
|------|------|------|
| Nash均衡 | ✅ | ✅ |
| 贝叶斯信念更新 | ✅ | ✅ |
| **信号博弈** | ❌ | ✅ |
| **重复博弈/合作** | ❌ | ✅ |
| **信息设计** | ❌ | ✅ |
| **分离/混同均衡** | ❌ | ✅ |
| **Folk Theorem** | ❌ | ✅ |

### 文件结构

```
v3/
├── behavioral/               # 行为经济学模块
│   ├── index.js             # 主集成模块
│   ├── prospect-theory.js   # 前景理论引擎
│   ├── bounded-rationality.js # 有限理性引擎
│   └── nudge-theory.js      # 助推理论引擎
├── behavioral-arena.js      # v3.6 行为经济学竞技场
├── game-theory-arena.js     # v3.5 博弈论竞技场
├── game-theory-v2.js        # v3.7 博弈论增强版
└── advanced-game-theory.js  # v3.8 高级博弈论版 🆕
```

**使用建议**：
- 简单辩论: `SubagentArena` (v3.4)
- 博弈论分析: `GameTheoryArena` (v3.7)
- 深度辩论: `AdvancedGameTheoryArena` (v3.8) ← 推荐
- 行为经济学: `BehavioralEconomicsSubagentArena` (v3.6)

### 理论来源

1. **Kahneman, D., & Tversky, A. (1979)**. Prospect Theory: An Analysis of Decision under Risk. *Econometrica*, 47(2), 263-291.

2. **Jones, B. D. (1999)**. Bounded Rationality. *Annual Review of Political Science*, 2, 297-321.

3. **Thaler, R. H., & Sunstein, C. R. (2008)**. Nudge: Improving Decisions About Health, Wealth, and Happiness. Yale University Press.

