# 🎭 虚拟论坛 Virtual Forum

> 让蒸馏的人物Skill就特定话题展开有意义的对话

## 两种运行模式

### 1️⃣ 模拟模式（默认）
- 快速生成对话
- Token消耗低
- 适合测试和预览

### 2️⃣ 子代理模式（真正AI交锋）🆕
- 每个辩论者是**独立的AI代理**
- 真正思考和回应
- 完整的对话上下文
- 更真实的辩论体验

---

## 快速开始

### 命令行使用

```bash
# 基本用法（模拟模式）
node index.js "话题" 参与者1 参与者2

# 子代理模式（真正AI交锋）
node index.js "话题" 参与者1 参与者2 --subagent

# 示例
node index.js "美国是否退出联合国" 纽森 特朗普 --subagent --rounds 10

# 指定选项
node index.js "话题" 参与者1 参与者2 \
  --subagent \           # 启用子代理模式
  --rounds 20 \          # 20轮辩论
  --moderator provocative \  # 犀利主持人
  --format report        # 报告格式输出
```

### 代码使用

```javascript
const VirtualForum = require('./index.js');

const forum = new VirtualForum();

// 子代理模式
const result = await forum.quickArena(
  '美国是否应该退出联合国？',
  ['纽森', '特朗普'],
  {
    mode: 'adversarial',      // 对抗性辩论
    rounds: 10,                // 10轮
    moderatorStyle: 'provocative', // 犀利主持人
    outputFormat: 'dialogue'   // 对话流输出
  }
);

console.log(result.output);
```

---

## 子代理模式架构

```
用户请求
    ↓
launchArena()
    ↓
┌─────────────────────────────────────────────┐
│  SubagentArena                              │
│  ├── initArena()     加载Skills            │
│  ├── spawnDebaters() 启动子代理            │
│  └── runDebate()     执行辩论              │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│  子代理池                                    │
│  ├── debaters['纽森'] → sessions_spawn     │
│  ├── debaters['特朗普'] → sessions_spawn   │
│  └── moderator → sessions_spawn            │
└─────────────────────────────────────────────┘
    ↓
每轮:
  getDebaterResponse('纽森', context)  ← sessions_send
        ↓
  getDebaterResponse('特朗普', context) ← sessions_send
        ↓
  getModeratorResponse(context)         ← sessions_send
        ↓
  收集结果 → 记录到 debateHistory
```

---

## 配置选项

### 讨论模式

| 选项 | 说明 |
|------|------|
| `exploratory` | 探索性讨论，多角度剖析 |
| `adversarial` | 对抗性讨论，争辩胜负 |
| `decision` | 决策型讨论，投票表决 |

### 轮次

| 选项 | 说明 |
|------|------|
| `10` | 简短讨论，适合快速测试 |
| `20` | 标准讨论，平衡深度 |
| `50` | 深度辩论，全面剖析 |

### 主持人风格

| 选项 | 特点 |
|------|------|
| `balanced` | 客观中立，善于引导 |
| `provocative` | 追问到底，挑战观点 |
| `synthesizing` | 归纳推动，形成共识 |

### 胜负判定

| 选项 | 说明 |
|------|------|
| `points` | 点数制，统计得分 |
| `vote` | 投票制，主持人投票 |
| `concession` | 让步制，一方承认 |
| `consensus` | 共识制，达成共识 |

### 输出格式

| 选项 | 说明 |
|------|------|
| `dialogue` | 对话流，像剧本一样 |
| `report` | 报告流，总结格式 |
| `decision` | 决策流，行动建议 |
| `json` | JSON格式，程序使用 |

---

## 文件结构

```
virtual-forum/
├── index.js              # 主入口
├── forum-engine.js       # 模拟讨论引擎
├── subagent-arena.js     # 🆕 子代理交锋引擎
├── argument-tracker.js    # 论点追踪
├── output-formatter.js    # 输出格式化
├── SKILL.md             # Skill文档
└── README.md            # 本文件
```

---

## 与女娲的关系

```
女娲 ──造人──→ 人物Skill (巴菲特、芒格、纽森、特朗普...)
   │
   └──虚拟论坛 ──用人──→ 让Skill活起来辩论
                        │
                        ├── 模拟模式（快速预览）
                        └── 子代理模式（真正AI交锋）🆕
```

---

## 支持的Skill

| 人物 | Skill名称 |
|------|----------|
| 巴菲特 | warren-buffett |
| 芒格 | charlie-munger |
| 纽森 | gavin-newsom |
| 特朗普 | donald-trump |
| 马斯克 | elon-musk |
| 拜登 | joe-biden |

（其他人物Skill可自行添加）

---

## 限制与说明

### 子代理模式
- 每个辩论者都是真实的AI代理
- Token消耗较大（约100-500元/次，取决于轮次）
- 需要稳定的网络连接
- 每轮之间有2秒延迟避免API过载

### 模拟模式
- 对话是程序化生成，非真实AI思考
- Token消耗低（几毛钱/次）
- 适合测试和预览

---

**版本**: v2.0 (子代理模式)  
**更新**: 2026-04-12
