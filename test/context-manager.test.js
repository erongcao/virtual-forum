/**
 * ContextManager 单元测试
 */

const ContextManager = require('../context-manager.js');

describe('ContextManager', () => {
  let cm;

  beforeEach(() => {
    cm = new ContextManager({ windowSize: 3, summarizeEvery: 2 });
  });

  test('添加轮次', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
    
    expect(cm.fullHistory.length).toBe(1);
    expect(cm.currentWindow.length).toBe(1);
  });

  test('滑动窗口', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
    cm.addRound({ round: 2, speaker: 'B', content: '内容2', type: 'statement' });
    cm.addRound({ round: 3, speaker: 'A', content: '内容3', type: 'statement' });
    cm.addRound({ round: 4, speaker: 'B', content: '内容4', type: 'statement' });
    
    // 窗口大小为3，应该只保留最近3轮
    expect(cm.currentWindow.length).toBe(3);
    expect(cm.currentWindow[0].round).toBe(2); // 最旧的被移除
    expect(cm.fullHistory.length).toBe(4); // 完整历史保留
  });

  test('摘要触发', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
    expect(cm.needsSummarization()).toBe(false);
    
    cm.addRound({ round: 2, speaker: 'B', content: '内容2', type: 'statement' });
    expect(cm.needsSummarization()).toBe(true); // 达到summarizeEvery=2
  });

  test('添加摘要后重置触发', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
    cm.addRound({ round: 2, speaker: 'B', content: '内容2', type: 'statement' });
    
    cm.addSummary('这是摘要', 2);
    
    cm.addRound({ round: 3, speaker: 'A', content: '内容3', type: 'statement' });
    expect(cm.needsSummarization()).toBe(false); // 还没达到下一个阈值
    
    cm.addRound({ round: 4, speaker: 'B', content: '内容4', type: 'statement' });
    expect(cm.needsSummarization()).toBe(true); // 4-2=2，达到阈值
  });

  test('获取摘要文本', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容1', type: 'statement' });
    cm.addRound({ round: 2, speaker: 'B', content: '内容2', type: 'statement' });
    
    const text = cm.getTextForSummarization();
    expect(text).toContain('[第1轮] A: 内容1');
    expect(text).toContain('[第2轮] B: 内容2');
  });

  test('参与者上下文', () => {
    cm.addRound({ round: 1, speaker: '巴菲特', content: '买苹果', type: 'statement' });
    cm.addRound({ round: 2, speaker: '马斯克', content: '买特斯拉', type: 'statement' });
    cm.addRound({ round: 3, speaker: '巴菲特', content: '长期持有', type: 'statement' });
    
    const context = cm.getContextForParticipant('巴菲特');
    expect(context).toContain('（你的发言）'); // 标记自己的发言
    expect(context).toContain('[第3轮] 巴菲特（你的发言）');
    expect(context).not.toContain('（你的发言）').toBe(false); // 确实包含标记
  });

  test('Token节省估算', () => {
    // 添加一些内容
    for (let i = 1; i <= 10; i++) {
      cm.addRound({ 
        round: i, 
        speaker: 'A', 
        content: '这是一段比较长的测试内容，用于估算token数量。'.repeat(10),
        type: 'statement' 
      });
    }
    
    const estimate = cm.getTokenEstimate();
    expect(estimate.fullTokens).toBeGreaterThan(0);
    expect(estimate.windowTokens).toBeGreaterThan(0);
    expect(estimate.savings).toContain('%');
    
    // 窗口比完整历史小，应该节省token
    expect(parseFloat(estimate.savings)).toBeGreaterThan(0);
  });

  test('重置', () => {
    cm.addRound({ round: 1, speaker: 'A', content: '内容', type: 'statement' });
    cm.addSummary('摘要', 1);
    
    cm.reset();
    
    expect(cm.fullHistory.length).toBe(0);
    expect(cm.currentWindow.length).toBe(0);
    expect(cm.summaries.length).toBe(0);
  });
});
