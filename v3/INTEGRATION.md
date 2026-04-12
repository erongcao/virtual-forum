# 虚拟论坛 v3.5 集成指南

## 与 v2.0 子代理模式集成

### 使用方式

```javascript
const VirtualForum = require('./index');

const forum = new VirtualForum();

// 启用博弈论增强的子代理模式
const result = await forum.launchGameTheoryArena({
  topic: '马斯克收购Twitter谈判',
  participants: [
    { name: '马斯克', skillName: 'elon-musk' },
    { name: '巴菲特', skillName: 'warren-buffett' }
  ],
  
  // 博弈论参数
  discountFactors: { '马斯克': 0.85, '巴菲特': 0.95 },
  outsideOptions: { '马斯克': 30, '巴菲特': 20 },
  totalValue: 100,
  
  // 辩论配置
  rounds: 10,
  mode: 'adversarial',
  moderatorStyle: 'provocative'
});

// 输出包含博弈论分析的报告
console.log(result.gameTheoryReport);
```

### 集成功能

1. **自动博弈识别**: 分析话题，识别博弈类型
2. **策略建议注入**: 将博弈论建议加入AI提示
3. **均衡追踪**: 实时监控辩论是否收敛到均衡
4. **信念更新**: 不完全信息博弈中的贝叶斯更新

## 扩展模块使用

### 扩展式博弈

```javascript
const ExtensiveFormGame = require('./extensions/extensive-form');

const game = new ExtensiveFormGame({
  players: ['P1', 'P2'],
  root: rootNode
});

// 求解子博弈完美均衡
const spe = game.findSubgamePerfectEquilibrium();

// 可视化
const mermaid = game.visualize('mermaid');
```

### 序贯均衡

```javascript
const SequentialEquilibriumSolver = require('./extensions/sequential-equilibrium');

const solver = new SequentialEquilibriumSolver(game);

// 寻找序贯均衡
const se = solver.findSequentialEquilibrium();

// 应用精炼
const refined = solver.applyRefinements(se.equilibria);
```

## 完整架构

```
virtual-forum/
├── v2/                          # 原版子代理模式
├── v3/
│   ├── core/                    # 基础博弈论
│   ├── advanced/                # 5大深化方向
│   ├── extensions/              # 扩展模块
│   │   ├── extensive-form.js
│   │   ├── sequential-equilibrium.js
│   │   └── visualization.js
│   └── game-theory-arena.js     # 集成入口
├── index.js                     # 主入口
└── INTEGRATION.md               # 本文件
```

## 下一步开发

- [ ] 将 game-theory-arena 集成到 index.js
- [ ] 添加 WebSocket 实时流式输出
- [ ] 创建交互式可视化界面
- [ ] 支持更多博弈论模型
