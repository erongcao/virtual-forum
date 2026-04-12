/**
 * 虚拟论坛 - 主入口 (v3.5 博弈论增强版)
 * Virtual Forum Main Entry
 */

const ForumEngine = require('./forum-engine.js');
const ArgumentTracker = require('./argument-tracker.js');
const OutputFormatter = require('./output-formatter.js');
const SubagentArena = require('./subagent-arena.js');
const GameTheorySubagentArena = require('./v3/game-theory-arena.js');
const ContextManager = require('./context-manager.js');

class VirtualForum {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir;
    this.engine = new ForumEngine(skillsDir);
    this.tracker = new ArgumentTracker();
    this.formatter = new OutputFormatter();
    this.arena = null;
  }

  /**
   * 创建并运行论坛（模拟模式）
   */
  async createDiscussion(config) {
    const forum = await this.engine.createForum(config);
    await this.engine.runForum();
    this.trackArguments(forum);
    const output = this.formatter.format(forum, config.outputFormat || 'dialogue');
    return { forum, tracker: this.tracker, output };
  }

  /**
   * 🚀 启动标准子代理辩论模式（v2.0）
   */
  async launchArena(config) {
    const {
      topic, mode = 'adversarial', rounds = 10,
      participants = [], moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett', moderatorStyle = 'provocative',
      outputFormat = 'dialogue'
    } = config;

    this.arena = new SubagentArena(this.skillsDir);
    await this.arena.initArena({ topic, mode, rounds, participants, moderatorName, moderatorSkill, moderatorStyle });
    const result = await this.arena.runDebate();
    const output = this.arena.formatOutput(outputFormat);
    return { arena: result, output };
  }

  /**
   * 🎲 启动博弈论增强的子代理辩论模式（v3.5）
   * [P0 FIX] 修复参数截断问题 (p → priorBeliefs)
   */
  async launchGameTheoryArena(config) {
    const {
      topic, mode = 'adversarial', rounds = 10,
      participants = [], moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett', moderatorStyle = 'provocative',
      outputFormat = 'dialogue',
      discountFactors, outsideOptions, totalValue = 100,
      types, priorBeliefs, reputationTypes // [P0 FIX] 完整参数
    } = config;

    this.arena = new GameTheorySubagentArena(this.skillsDir);
    await this.arena.initArenaWithGameTheory({
      topic, mode, rounds, participants,
      moderatorName, moderatorSkill, moderatorStyle,
      discountFactors, outsideOptions, totalValue,
      types, priorBeliefs, reputationTypes // [P0 FIX] 完整传参
    });

    const result = await this.arena.runDebate();
    const output = this.arena.formatOutput(outputFormat);

    // 附加博弈论报告
    const gameTheoryReport = this.arena.getGameTheoryReport();

    return { arena: result, output, gameTheoryReport };
  }

  /**
   * 追踪论点
   */
  trackArguments(forum) {
    if (!forum || !forum.arguments) return;
    for (const [name, args] of Object.entries(forum.arguments)) {
      for (const arg of args) {
        this.tracker.addArgument(name, arg.text || arg.content || '', arg.type || 'statement', arg.round || 0);
      }
    }
  }
}

module.exports = VirtualForum;
