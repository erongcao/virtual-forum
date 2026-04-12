/**
 * ArgumentTracker 单元测试
 */

const ArgumentTracker = require('../argument-tracker.js');

describe('ArgumentTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new ArgumentTracker();
  });

  test('添加论点', () => {
    const arg = tracker.addArgument('巴菲特', '价值投资是最好的策略', 'statement', 1);
    
    expect(arg.id).toBe(1);
    expect(arg.participant).toBe('巴菲特');
    expect(arg.content).toBe('价值投资是最好的策略');
    expect(arg.type).toBe('statement');
    expect(tracker.arguments.length).toBe(1);
  });

  test('添加论点 - 输入验证', () => {
    expect(() => tracker.addArgument(null, '内容')).toThrow('participant 不能为空');
    expect(() => tracker.addArgument('巴菲特', null)).toThrow('content 不能为空');
    expect(() => tracker.addArgument('', '内容')).toThrow('participant 不能为空');
  });

  test('添加反驳 - [P0 Bug修复验证]', () => {
    // 先添加一个论点
    const arg = tracker.addArgument('马斯克', '电动车是未来', 'statement', 1);
    
    // 添加反驳（之前rebutral拼写错误会导致失败）
    const rebuttal = tracker.addRebuttal('巴菲特', arg.id, '传统能源仍有价值');
    
    expect(rebuttal).not.toBeNull();
    expect(rebuttal.type).toBe('rebuttal');
    expect(rebuttal.target).toBe(arg.id);
    expect(arg.rebuttals.length).toBe(1);
    expect(arg.isRebutted).toBe(true);
  });

  test('添加反驳 - 目标不存在', () => {
    const result = tracker.addRebuttal('巴菲特', 999, '内容');
    expect(result).toBeNull();
  });

  test('分数计算', () => {
    const arg = tracker.addArgument('A', '论点1', 'statement', 1);
    tracker.addRebuttal('B', arg.id, '反驳1');
    
    const scores = tracker.scores;
    expect(scores['B'].total).toBe(3); // 成功反驳 +3
    expect(scores['B'].rebuttals).toBe(1);
    expect(scores['A'].total).toBe(-1); // 被反驳 -1
    expect(scores['A'].rebutted).toBe(1);
  });

  test('排行榜', () => {
    tracker.addArgument('A', '论点1', 'statement', 1);
    tracker.addArgument('B', '论点2', 'statement', 1);
    
    const arg = tracker.addArgument('A', '论点3', 'statement', 2);
    tracker.addRebuttal('B', arg.id, '反驳');
    
    const leaderboard = tracker.getLeaderboard();
    expect(leaderboard[0].name).toBe('B'); // B有3分
    expect(leaderboard[1].name).toBe('A'); // A有-1分
  });

  test('统计摘要', () => {
    const arg1 = tracker.addArgument('A', '论点1', 'statement', 1);
    tracker.addArgument('A', '论点2', 'statement', 1);
    tracker.addRebuttal('B', arg1.id, '反驳');
    
    const summary = tracker.getSummary();
    expect(summary.totalArguments).toBe(3);
    expect(summary.totalRebuttals).toBe(1);
    expect(summary.unrebuttedStatements).toBe(1);
    expect(summary.winner).toBe('B');
  });

  test('重置', () => {
    tracker.addArgument('A', '论点', 'statement', 1);
    tracker.reset();
    
    expect(tracker.arguments.length).toBe(0);
    expect(Object.keys(tracker.scores).length).toBe(0);
  });
});
