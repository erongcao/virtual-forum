/**
 * 测试运行入口
 * 使用 Node.js 内置的 assert 模块（无需额外依赖）
 */

const assert = require('assert');

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } catch (err) {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    console.log(`  ${colors.red}${err.message}${colors.reset}`);
    failed++;
  }
}

console.log(`${colors.cyan}🧪 虚拟论坛 V3.5 测试套件${colors.reset}\n`);

// 测试 ArgumentTracker
console.log(`${colors.yellow}ArgumentTracker 测试${colors.reset}`);
const ArgumentTracker = require('../argument-tracker.js');

test('添加论点', () => {
  const tracker = new ArgumentTracker();
  const arg = tracker.addArgument('巴菲特', '价值投资', 'statement', 1);
  assert.strictEqual(arg.participant, '巴菲特');
  assert.strictEqual(tracker.arguments.length, 1);
});

test('添加反驳 - P0 Bug修复验证', () => {
  const tracker = new ArgumentTracker();
  const arg = tracker.addArgument('马斯克', '电动车是未来', 'statement', 1);
  const rebuttal = tracker.addRebuttal('巴菲特', arg.id, '传统能源仍有价值');
  assert.notStrictEqual(rebuttal, null);
  assert.strictEqual(rebuttal.type, 'rebuttal');
  assert.strictEqual(arg.isRebutted, true);
});

test('分数计算', () => {
  const tracker = new ArgumentTracker();
  const arg = tracker.addArgument('A', '论点1', 'statement', 1);
  tracker.addRebuttal('B', arg.id, '反驳1');
  assert.strictEqual(tracker.scores['B'].total, 3);
  assert.strictEqual(tracker.scores['A'].total, -1);
});

test('统计摘要', () => {
  const tracker = new ArgumentTracker();
  tracker.addArgument('A', '论点1', 'statement', 1);
  tracker.addArgument('B', '论点2', 'statement', 1);
  const summary = tracker.getSummary();
  assert.strictEqual(summary.totalArguments, 2);
  assert.strictEqual(summary.totalRebuttals, 0);
});

// 测试 ContextManager
console.log(`\n${colors.yellow}ContextManager 测试${colors.reset}`);
const ContextManager = require('../context-manager.js');

test('滑动窗口', () => {
  const cm = new ContextManager({ windowSize: 3 });
  for (let i = 1; i <= 5; i++) {
    cm.addRound({ round: i, speaker: 'A', content: `内容${i}`, type: 'statement' });
  }
  assert.strictEqual(cm.currentWindow.length, 3);
  assert.strictEqual(cm.fullHistory.length, 5);
});

test('摘要触发', () => {
  const cm = new ContextManager({ summarizeEvery: 2 });
  cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
  assert.strictEqual(cm.needsSummarization(), false);
  
  cm.addRound({ round: 2, speaker: 'B', content: '内容2', type: 'statement' });
  assert.strictEqual(cm.needsSummarization(), true);
});

test('Token节省估算', () => {
  const cm = new ContextManager({ windowSize: 3 });
  for (let i = 1; i <= 10; i++) {
    cm.addRound({ 
      round: i, 
      speaker: 'A', 
      content: '这是一段测试内容'.repeat(10),
      type: 'statement' 
    });
  }
  const est = cm.getTokenEstimate();
  assert(est.fullTokens > 0);
  assert(est.windowTokens > 0);
  assert(est.savings.includes('%'));
});

// 测试 Shared Config
console.log(`\n${colors.yellow}Shared Config 测试${colors.reset}`);
const { validateConfig, DISCUSSION_MODES } = require('../shared-config.js');

test('配置验证 - 有效配置', () => {
  assert.doesNotThrow(() => validateConfig({
    topic: '测试',
    participants: [{ name: 'A' }, { name: 'B' }]
  }));
});

test('配置验证 - 空话题', () => {
  assert.throws(() => validateConfig({
    topic: '',
    participants: [{ name: 'A' }, { name: 'B' }]
  }), /话题.*不能为空/);
});

test('配置验证 - 参与者不足', () => {
  assert.throws(() => validateConfig({
    topic: '测试',
    participants: [{ name: 'A' }]
  }), /至少.*2位参与者/);
});

test('讨论模式定义完整', () => {
  assert(DISCUSSION_MODES.exploratory);
  assert(DISCUSSION_MODES.adversarial);
  assert(DISCUSSION_MODES.decision);
});

// 测试 OutputFormatter
console.log(`\n${colors.yellow}OutputFormatter 测试${colors.reset}`);
const OutputFormatter = require('../output-formatter.js');

test('格式化对话', () => {
  const formatter = new OutputFormatter();
  const forum = {
    topic: '测试话题',
    mode: 'adversarial',
    rounds: 2,
    participants: [{ name: 'A' }, { name: 'B' }],
    roundsData: [
      { number: 1, speeches: [{ speaker: 'A', content: '观点1' }] }
    ],
    scores: { A: 5, B: 3 }
  };
  const output = formatter.format(forum, 'dialogue');
  assert(output.includes('测试话题'));
  assert(output.includes('A'));
});

test('格式化报告 - 补全验证', () => {
  const formatter = new OutputFormatter();
  const forum = {
    topic: '测试话题',
    mode: 'adversarial',
    rounds: 2,
    participants: [{ name: 'A' }, { name: 'B' }],
    arguments: { A: [{ type: 'statement', content: '论点1' }] },
    scores: { A: 5, B: 3 },
    roundsData: []
  };
  const output = formatter.format(forum, 'report');
  assert(output.includes('# 🎭 虚拟论坛讨论报告'));
  assert(output.includes('## 📊 统计数据')); // P2 Fix验证
});

// 总结
console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
console.log(`总计: ${passed + failed} 个测试`);
console.log(`${colors.green}通过: ${passed}${colors.reset}`);
console.log(`${colors.red}失败: ${failed}${colors.reset}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`\n${colors.green}✅ 所有测试通过！${colors.reset}`);
}
