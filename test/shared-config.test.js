/**
 * Shared Config 单元测试
 */

const {
  getDefaultSkillsDir,
  DISCUSSION_MODES,
  MODERATOR_STYLES,
  DEFAULTS,
  validateConfig,
  exponentialBackoff
} = require('../shared-config.js');

describe('Shared Config', () => {
  test('讨论模式定义完整', () => {
    expect(DISCUSSION_MODES).toHaveProperty('exploratory');
    expect(DISCUSSION_MODES).toHaveProperty('adversarial');
    expect(DISCUSSION_MODES).toHaveProperty('decision');
    
    expect(DISCUSSION_MODES.exploratory).toHaveProperty('name');
    expect(DISCUSSION_MODES.exploratory).toHaveProperty('instruction');
  });

  test('主持人风格定义完整', () => {
    expect(MODERATOR_STYLES).toHaveProperty('balanced');
    expect(MODERATOR_STYLES).toHaveProperty('provocative');
    expect(MODERATOR_STYLES).toHaveProperty('synthesizing');
    
    expect(MODERATOR_STYLES.balanced).toHaveProperty('name');
    expect(MODERATOR_STYLES.balanced).toHaveProperty('style');
    expect(MODERATOR_STYLES.balanced).toHaveProperty('questions');
  });

  test('默认值合理', () => {
    expect(DEFAULTS.rounds).toBe(10);
    expect(DEFAULTS.mode).toBe('adversarial');
    expect(DEFAULTS.contextWindowSize).toBeGreaterThan(0);
    expect(DEFAULTS.summarizeEveryNRounds).toBeGreaterThan(0);
    expect(DEFAULTS.apiRetryAttempts).toBeGreaterThan(0);
  });

  test('验证配置 - 有效配置', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }, { name: 'B' }]
    })).not.toThrow();
  });

  test('验证配置 - 空话题', () => {
    expect(() => validateConfig({
      topic: '',
      participants: [{ name: 'A' }, { name: 'B' }]
    })).toThrow('话题(topic)不能为空');
  });

  test('验证配置 - 话题为空字符串', () => {
    expect(() => validateConfig({
      topic: '   ',
      participants: [{ name: 'A' }, { name: 'B' }]
    })).toThrow('话题(topic)不能为空');
  });

  test('验证配置 - 参与者不足', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }]
    })).toThrow('至少需要2位参与者');
  });

  test('验证配置 - 参与者为空数组', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: []
    })).toThrow('至少需要2位参与者');
  });

  test('验证配置 - 无效模式', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }, { name: 'B' }],
      mode: 'invalid_mode'
    })).toThrow('不支持的讨论模式');
  });

  test('验证配置 - 无效轮次', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }, { name: 'B' }],
      rounds: -1
    })).toThrow('轮次(rounds)必须是正整数');
  });

  test('验证配置 - 零轮次', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }, { name: 'B' }],
      rounds: 0
    })).toThrow('轮次(rounds)必须是正整数');
  });

  test('验证配置 - 小数轮次', () => {
    expect(() => validateConfig({
      topic: '测试话题',
      participants: [{ name: 'A' }, { name: 'B' }],
      rounds: 5.5
    })).toThrow('轮次(rounds)必须是正整数');
  });

  test('getDefaultSkillsDir - 返回路径', () => {
    const dir = getDefaultSkillsDir();
    expect(typeof dir).toBe('string');
    expect(dir).toContain('.openclaw');
    expect(dir).toContain('skills');
  });

  test('指数退避 - 延迟递增', async () => {
    const delays = [];
    const originalSetTimeout = global.setTimeout;
    
    // Mock setTimeout来捕获延迟
    global.setTimeout = (fn, delay) => {
      delays.push(delay);
      if (fn) fn();
      return 1;
    };
    
    await exponentialBackoff(0, 1000);
    await exponentialBackoff(1, 1000);
    await exponentialBackoff(2, 1000);
    
    global.setTimeout = originalSetTimeout;
    
    // 延迟应该递增 (约1000, 2000, 4000，加上随机数)
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays[2]).toBeGreaterThan(delays[1]);
  });
});
