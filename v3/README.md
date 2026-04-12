# 虚拟论坛 v3.5 - 博弈论增强版

基于 Osborne & Rubinstein《博弈论教程》和 Bonanno《Game Theory》实现的博弈论辩论引擎。

## 核心特性

### 1. 自动博弈识别
- 自动分析话题，识别经典博弈模式（囚徒困境、懦夫博弈、猎鹿博弈等）
- 多维度分析：合作性、信息完全性、动态性、重复性
- 智能推荐博弈模型和求解方法

### 2. 多层博弈求解
- **战略式博弈**：纳什均衡（纯策略/混合策略）、IESDS
- **贝叶斯博弈**：不完全信息、信念更新、信号传递
- **扩展式博弈**：子博弈完美均衡、逆向归纳（待实现）

### 3. 实时博弈论分析
- 每轮辩论的均衡分析
- 信念系统更新（不完全信息博弈）
- 策略建议和偏离检测

### 4. 经典博弈库
- 囚徒困境（Prisoner's Dilemma）
- 懦夫博弈（Chicken Game）
- 猎鹿博弈（Stag Hunt）
- 零和博弈（Zero-Sum）
- 信号博弈（Signaling）
- 讨价还价博弈（Bargaining）

## 文件结构

```
v3/
├── core/
│   ├── strategic-game.js      # 战略式博弈（纳什均衡）
│   ├── bayesian-game.js       # 贝叶斯博弈（不完全信息）
│   ├── game-recognizer.js     # 博弈识别器
│   └── game-theory-engine.js  # 主引擎
├── example-usage.js           # 使用示例
└── README.md                  # 本文档
```

## 使用方法

```javascript
const GameTheoryDebateEngine = require('./core/game-theory-engine');

// 创建引擎
const engine = new GameTheoryDebateEngine({
  maxRounds: 10,
  enableBeliefUpdate: true,
  showEquilibriumAnalysis: true
});

// 初始化辩论
const init = await engine.initializeDebate(
  '中美贸易战应该合作还是对抗',
  ['特朗普', '中方代表']
);

console.log('识别结果:', init.analysis);

// 执行辩论轮次
for (let round = 1; round <= 5; round++) {
  const actions = {
    '特朗普': '对抗',
    '中方代表': '合作'
  };
  
  const result = await engine.executeRound(round, actions);
  console.log(`第${round}轮分析:`, result);
}

// 生成最终报告
const report = engine.generateFinalReport();
console.log('最终报告:', report);
```

## 理论依据

### 战略式博弈
- **纳什均衡**：Osborne 第2.3节 / Bonanno 第2.6节
- **混合策略**：Bonanno 第6章
- **IESDS**：Osborne 第4章 / Bonanna 第2.5节

### 不完全信息博弈
- **Harsanyi转换**：Osborne 第2章 / Bonanno 第16章
- **贝叶斯更新**：Bonanno 第9.3节
- **完美贝叶斯均衡**：Bonanno 第13章

### 动态博弈
- **扩展式博弈**：Bonanna 第3-4章
- **子博弈完美均衡**：Osborne 第6章
- **逆向归纳**：Bonanna 第3.2节

## 待实现功能

- [ ] 扩展式博弈树表示
- [ ] 子博弈完美均衡求解
- [ ] 序贯均衡（Sequential Equilibrium）
- [ ] 颤抖手完美均衡
- [ ] 合作博弈解概念（核心、夏普利值）
- [ ] 重复博弈与民间定理
- [ ] 演化稳定策略（ESS）

## 版本历史

- v3.5: 博弈论增强版（当前）
  - 实现战略式博弈求解
  - 实现贝叶斯博弈和信念更新
  - 自动博弈识别

- v2.0: 子代理交锋版
- v1.0: 基础模拟版
