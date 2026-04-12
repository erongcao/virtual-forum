# 虚拟论坛 v3.5 - 博弈论增强版 (完整版)

基于 Osborne & Rubinstein《博弈论教程》和 Bonanno《Game Theory》实现的深度博弈论辩论引擎。

## 架构概览

```
v3/
├── core/                          # 基础博弈论引擎
│   ├── strategic-game.js          # 战略式博弈 (纳什均衡)
│   ├── bayesian-game.js           # 贝叶斯博弈 (不完全信息)
│   ├── game-recognizer.js         # 博弈识别器
│   └── game-theory-engine.js      # 主引擎
│
├── advanced/                      # 深化模块 (5个方向)
│   ├── bargaining.js              # 1. 讨价还价模型
│   ├── signaling.js               # 2. 信号博弈
│   ├── repeated-games.js          # 3. 重复博弈/声誉
│   ├── mechanism-design.js        # 4. 机制设计
│   ├── evolutionary.js            # 5. 演化博弈
│   └── index.js                   # 高级模块集成
│
└── example-usage.js               # 使用示例
```

---

## 5大深化方向详解

### 1. 讨价还价模型 (Bargaining)

**理论依据**: Osborne 第7章 / Rubinstein (1982)

**核心功能**:
- **Rubinstein无限期界模型**: 交替出价，耐心决定议价能力
- **有限期界逆向归纳**: 多轮讨价还价求解
- **纳什讨价还价解**: 最大化纳什积
- **Kalai-Smorodinsky解**: 满足单调性公理

**应用场景**:
```javascript
const bargaining = new AlternatingOfferBargaining({
  discountFactors: { '马斯克': 0.95, '巴菲特': 0.9 },
  outsideOptions: { '马斯克': 30, '巴菲特': 20 },
  totalValue: 100
});

// Rubinstein均衡
const equilibrium = bargaining.calculateRubinsteinEquilibrium('马斯克', '巴菲特');
// → 马斯克份额: 67%, 巴菲特份额: 33% (更耐心者获益)

// 模拟讨价还价过程
const simulation = bargaining.simulateBargainingProcess('马斯克', '巴菲特', 5);
```

---

### 2. 信号博弈 (Signaling)

**理论依据**: Spence (1973) / Bonanno 第15章

**核心功能**:
- **完美贝叶斯均衡 (PBE)**: 策略+信念系统
- **分离均衡**: 不同类型发送不同信号，完全揭示信息
- **混同均衡**: 所有类型发送相同信号，无信息揭示
- **半分离均衡**: 部分随机化，部分揭示
- **均衡精炼**: Cho-Kreps直观标准

**应用场景**:
```javascript
const signaling = new SignalingGameAnalyzer({
  sender: '马斯克',
  receiver: '巴菲特',
  types: ['认真买家', '炒作型'],
  signals: ['支付定金', '直接谈判'],
  priorBeliefs: { '马斯克-认真买家': 0.6, '马斯克-炒作型': 0.4 }
});

// 寻找所有PBE
const equilibria = signaling.findPerfectBayesianEquilibria();
// → 分离均衡: 认真买家支付定金，炒作型直接谈判

// 实时信号分析
const analysis = signaling.analyzeObservedSignal('支付定金');
// → 后验信念: P(认真|定金) = 0.95
```

---

### 3. 重复博弈与声誉 (Repeated Games)

**理论依据**: Osborne 第8章 / Kreps-Wilson (1982)

**核心功能**:
- **触发策略**: 冷酷触发、以牙还牙、有限惩罚
- **民间定理**: 合作的可能性条件
- **Kreps-Wilson声誉模型**: 不完全信息解决连锁店悖论
- **长期关系模拟**: 信任演化、背叛事件追踪

**应用场景**:
```javascript
const repeated = new RepeatedGameAnalyzer({
  players: ['特朗普', '中方'],
  discountFactor: 0.9,
  reputationTypes: { '特朗普': { crazyProbability: 0.2 } }
});

// 分析触发策略
const strategies = repeated.analyzeTriggerStrategies();
// → 冷酷触发: δ ≥ 0.5 时可维持合作

// 声誉模型
const reputation = repeated.analyzeReputationModel('特朗普', 10);
// → 早期强硬建立声誉，后期收割收益

// 模拟长期关系
const simulation = repeated.simulateLongTermRelationship(20, strategies);
// → 合作率: 75%, 背叛事件: 第5轮、第12轮
```

---

### 4. 机制设计 (Mechanism Design)

**理论依据**: Myerson (1981) / VCG / Bonanno 第2.4节

**核心功能**:
- **拍卖机制**: 第一价格、第二价格(Vickrey)、全支付、英式、荷式
- **收益等价定理**: 验证不同拍卖的期望收益
- **VCG机制**: 激励相容+效率
- **投票机制**: 多数制、Borda计数、Condorcet方法、批准投票
- **Arrow不可能定理**: 机制设计的基本限制

**应用场景**:
```javascript
const mechanism = new MechanismDesign({
  players: ['竞标者A', '竞标者B', '竞标者C']
});

// 设计拍卖
const auction = mechanism.designAuction('Twitter', [
  { name: '马斯克', valuation: 50, maxValuation: 60 },
  { name: '巴菲特', valuation: 45, maxValuation: 55 }
]);
// → 推荐: 第二价格拍卖 (真实报价是占优策略)

// 验证收益等价
const equivalence = auction.revenueEquivalence;
// → 第一价格与第二价格期望收益等价 (在给定条件下)

// VCG机制
const vcg = mechanism.designVCGMechanism(allocations, valuations);
// → 激励相容、效率最大化
```

---

### 5. 演化博弈 (Evolutionary)

**理论依据**: Maynard Smith (1982) / Osborne 第3.4节

**核心功能**:
- **复制者动态**: 策略分布随时间的演化
- **ESS识别**: 演化稳定策略检测
- **入侵测试**: 验证ESS抵抗突变的能力
- **长期演化模拟**: 识别吸引域、路径依赖

**应用场景**:
```javascript
const evolutionary = new EvolutionaryGameDynamics({
  strategies: ['合作', '背叛'],
  payoffMatrix: {
    '合作': { '合作': 3, '背叛': 0 },
    '背叛': { '合作': 5, '背叛': 1 }
  }
});

// 运行动态
const dynamics = evolutionary.replicatorDynamics(
  { '合作': 0.5, '背叛': 0.5 },
  1000
);
// → 最终: 背叛主导 (背叛是ESS)

// 入侵测试
const invasion = evolutionary.simulateInvasion('背叛', '合作', 0.01);
// → 突变被排斥，背叛确为ESS

// 辩论演化模拟
const debateEvolution = evolutionary.simulateDebateEvolution(
  debaters, rounds, initialStrategies
);
// → 追踪策略分布变化、主导权转移
```

---

## 综合使用

### 自动工具选择

```javascript
const { AdvancedGameTheoryEngine } = require('./advanced');

const engine = new AdvancedGameTheoryEngine();

// 自动识别并应用最合适的工具
const analysis = await engine.comprehensiveAnalysis(
  '马斯克收购Twitter谈判',
  ['马斯克', '巴菲特'],
  {
    discountFactors: { '马斯克': 0.95, '巴菲特': 0.9 },
    outsideOptions: { '马斯克': 30, '巴菲特': 20 },
    types: ['高估值', '低估值'],
    reputationTypes: { '马斯克': { crazyProbability: 0.15 } }
  }
);

// 获取综合报告
const report = engine.generateDebateReport(analysis);
```

---

## 理论教材对照

| 模块 | Osborne & Rubinstein | Bonanno | 经典论文 |
|------|---------------------|---------|----------|
| 讨价还价 | 第7章 | - | Rubinstein (1982) |
| 信号博弈 | 第2章 | 第15章 | Spence (1973) |
| 重复博弈 | 第8章 | - | Kreps-Wilson (1982) |
| 机制设计 | - | 第2.4节 | Myerson (1981), VCG |
| 演化博弈 | 第3.4节 | - | Maynard Smith (1982) |

---

## 文件大小统计

| 模块 | 文件 | 大小 | 功能数 |
|------|------|------|--------|
| 基础层 | strategic-game.js | 8.6KB | 12 |
| 基础层 | bayesian-game.js | 10KB | 15 |
| 基础层 | game-recognizer.js | 10.3KB | 18 |
| 基础层 | game-theory-engine.js | 12.6KB | 20 |
| 深化层 | bargaining.js | 8.5KB | 10 |
| 深化层 | signaling.js | 10.8KB | 14 |
| 深化层 | repeated-games.js | 10.7KB | 13 |
| 深化层 | mechanism-design.js | 10KB | 12 |
| 深化层 | evolutionary.js | 11.4KB | 15 |
| 集成层 | index.js | 9.5KB | 8 |

**总计**: ~112KB, ~137个核心函数

---

## 待扩展功能

- [ ] 扩展式博弈树可视化
- [ ] 序贯均衡 (Sequential Equilibrium) 求解
- [ ] 颤抖手完美均衡
- [ ] 合作博弈解概念 (核心、夏普利值)
- [ ] 拍卖理论的更复杂变体
- [ ] 演化博弈的网络结构
- [ ] 学习模型 (虚拟行动、无悔学习)

---

**版本**: v3.5 (博弈论完整版)  
**更新**: 2026-04-12  
**理论深度**: 研究生级别博弈论
