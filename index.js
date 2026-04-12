/**
 * 虚拟论坛 - 主入口 (v3.5 博弈论增强版)
 * Virtual Forum Main Entry
 * 
 * 版本历史：
 * - v1.0: 基础模拟模式
 * - v2.0: 子代理交锋模式
 * - v3.5: 博弈论增强模式
 */

const ForumEngine = require('./forum-engine.js');
const ArgumentTracker = require('./argument-tracker.js');
const OutputFormatter = require('./output-formatter.js');
const SubagentArena = require('./subagent-arena.js');
const GameTheorySubagentArena = require('./v3/game-theory-arena.js');

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
   */
  async launchGameTheoryArena(config) {
    const {
      topic, mode = 'adversarial', rounds = 10,
      participants = [], moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett', moderatorStyle = 'provocative',
      outputFormat = 'dialogue',
      discountFactors, outsideOptions, totalValue = 100,
      types, priorBeliefs, reputationTypes
    } = config;

    this.arena = new GameTheorySubagentArena(this.skillsDir);
    await this.arena.initArenaWithGameTheory({
      topic, mode, rounds, participants, moderatorName, moderatorSkill, moderatorStyle,
      discountFactors, outsideOptions, totalValue, types, priorBeliefs, reputationTypes
    });

    const result = await this.arena.runDebate();
    const output = this.arena.formatOutput(outputFormat);
    const gameTheoryReport = this.arena.generateGameTheoryReport();

    return {
      arena: result, output, gameTheoryReport,
      strategyAdvice: this.arena.strategyAdvice,
      equilibriumTracking: this.arena.equilibriumTracking
    };
  }

  /**
   * 快速创建论坛（模拟模式）
   */
  async quickForum(topic, participants, options = {}) {
    return this.createDiscussion({
      topic,
      participants: participants.map(name => ({ name })),
      mode: options.mode || 'exploratory',
      rounds: options.rounds || 10,
      moderatorStyle: options.moderatorStyle || 'balanced',
      verdictType: options.verdictType || 'points',
      outputFormat: options.outputFormat || 'dialogue'
    });
  }

  /**
   * 快速启动标准子代理辩论
   */
  async quickArena(topic, participants, options = {}) {
    const skillMap = {
      '纽森': 'gavin-newsom', '特朗普': 'donald-trump',
      '巴菲特': 'warren-buffett', '芒格': 'charlie-munger',
      '马斯克': 'elon-musk', '拜登': 'joe-biden', '哈里斯': 'kamala-harris'
    };
    
    const participantsConfig = participants.map(name => ({
      name,
      skillName: skillMap[name] || name.toLowerCase().replace(/\s+/g, '-')
    }));

    return this.launchArena({
      topic, mode: options.mode || 'adversarial', rounds: options.rounds || 10,
      participants: participantsConfig,
      moderatorName: options.moderatorName || '巴菲特',
      moderatorSkill: options.moderatorSkill || 'warren-buffett',
      moderatorStyle: options.moderatorStyle || 'provocative',
      outputFormat: options.outputFormat || 'dialogue'
    });
  }

  /**
   * 快速启动博弈论增强子代理辩论
   */
  async quickGameTheoryArena(topic, participants, options = {}) {
    const skillMap = {
      '纽森': 'gavin-newsom', '特朗普': 'donald-trump',
      '巴菲特': 'warren-buffett', '芒格': 'charlie-munger',
      '马斯克': 'elon-musk', '拜登': 'joe-biden', '哈里斯': 'kamala-harris'
    };
    
    const participantsConfig = participants.map(name => ({
      name,
      skillName: skillMap[name] || name.toLowerCase().replace(/\s+/g, '-')
    }));

    const discountFactors = options.discountFactors || {};
    participants.forEach(p => {
      if (!discountFactors[p]) {
        if (p.includes('巴菲特')) discountFactors[p] = 0.95;
        else if (p.includes('马斯克')) discountFactors[p] = 0.85;
        else if (p.includes('特朗普')) discountFactors[p] = 0.8;
        else discountFactors[p] = 0.9;
      }
    });

    return this.launchGameTheoryArena({
      topic, mode: options.mode || 'adversarial', rounds: options.rounds || 10,
      participants: participantsConfig,
      moderatorName: options.moderatorName || '巴菲特',
      moderatorSkill: options.moderatorSkill || 'warren-buffett',
      moderatorStyle: options.moderatorStyle || 'provocative',
      outputFormat: options.outputFormat || 'dialogue',
      discountFactors, outsideOptions: options.outsideOptions,
      totalValue: options.totalValue || 100, types: options.types,
      priorBeliefs: options.priorBeliefs, reputationTypes: options.reputationTypes
    });
  }

  trackArguments(forum) {
    this.tracker.reset();
    for (const [name, args] of Object.entries(forum.arguments)) {
      for (const arg of args) {
        this.tracker.addArgument(name, arg.text, arg.type, arg.round);
      }
    }
  }
}

// CLI 入口
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎭 虚拟论坛 Virtual Forum v3.5

用法:
  node index.js <话题> <参与者1> <参与者2> [...选项]

选项:
  --subagent           启用标准子代理模式 (v2.0)
  --game-theory, --gt  启用博弈论增强模式 (v3.5)
  --mode <type>        exploratory | adversarial | decision
  --rounds <n>         10 | 20 | 50
  --moderator <style>  balanced | provocative | synthesizing
  --format <type>      dialogue | report | decision | json

示例:
  # 博弈论增强模式（推荐）
  node index.js "马斯克收购Twitter" 马斯克 巴菲特 --gt --rounds 10
  
  # 标准子代理模式
  node index.js "美国是否退出联合国" 纽森 特朗普 --subagent

  # 模拟模式
  node index.js "话题" 参与者1 参与者2
`);
    return;
  }
  
  const useGameTheory = args.includes('--game-theory') || args.includes('--gt');
  const useSubagent = args.includes('--subagent') || useGameTheory;
  
  const optionIndex = args.findIndex(a => a.startsWith('--'));
  const topic = args[0] || '当前市场该激进还是保守？';
  
  const participantEnd = optionIndex === -1 ? args.length : optionIndex;
  const participants = args.slice(1, participantEnd).length > 0 
    ? args.slice(1, participantEnd) 
    : ['巴菲特', '芒格'];
  
  const options = {};
  for (let i = optionIndex; i < args.length; i++) {
    if (args[i] === '--mode' && args[i+1]) options.mode = args[++i];
    if (args[i] === '--rounds' && args[i+1]) options.rounds = parseInt(args[++i]);
    if (args[i] === '--moderator' && args[i+1]) options.moderatorStyle = args[++i];
    if (args[i] === '--format' && args[i+1]) options.outputFormat = args[++i];
  }
  
  const forum = new VirtualForum();
  
  console.log(`
🎭 虚拟论坛 v3.5 启动中...
话题: ${topic}
参与者: ${participants.join(', ')}
模式: ${useGameTheory ? '博弈论增强 (v3.5)' : useSubagent ? '子代理 (v2.0)' : '模拟'}
轮次: ${options.rounds || 10}
`);
  
  const run = useGameTheory 
    ? forum.quickGameTheoryArena(topic, participants, options)
    : useSubagent 
    ? forum.quickArena(topic, participants, options)
    : forum.quickForum(topic, participants, options);
  
  run.then(result => {
    console.log('\n' + result.output);
    if (result.gameTheoryReport) {
      console.log('\n🎲 博弈论分析:\n' + result.gameTheoryReport);
    }
  }).catch(err => {
    console.error('错误:', err.message);
  });
}

module.exports = VirtualForum;
