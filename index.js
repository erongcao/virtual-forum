/**
 * 虚拟论坛 - 主入口
 * Virtual Forum Main Entry
 */

const ForumEngine = require('./forum-engine.js');
const ArgumentTracker = require('./argument-tracker.js');
const OutputFormatter = require('./output-formatter.js');
const SubagentArena = require('./subagent-arena.js');

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
    // 1. 创建论坛
    const forum = await this.engine.createForum(config);
    
    // 2. 运行论坛
    await this.engine.runForum();
    
    // 3. 追踪论点
    this.trackArguments(forum);
    
    // 4. 格式化输出
    const output = this.formatter.format(forum, config.outputFormat || 'dialogue');
    
    return {
      forum,
      tracker: this.tracker,
      output
    };
  }

  /**
   * 🚀 启动子代理辩论模式（真正AI交锋）
   */
  async launchArena(config) {
    const {
      topic,
      mode = 'adversarial',
      rounds = 10,
      participants = [],  // [{name, skillName}]
      moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett',
      moderatorStyle = 'provocative',
      outputFormat = 'dialogue'
    } = config;

    // 初始化竞技场
    this.arena = new SubagentArena(this.skillsDir);
    await this.arena.initArena({
      topic,
      mode,
      rounds,
      participants,
      moderatorName,
      moderatorSkill,
      moderatorStyle
    });

    // 运行辩论
    const result = await this.arena.runDebate();

    // 格式化输出
    const output = this.arena.formatOutput(outputFormat);

    return {
      arena: result,
      output
    };
  }

  /**
   * 追踪论点
   */
  trackArguments(forum) {
    this.tracker.reset();
    
    for (const [name, args] of Object.entries(forum.arguments)) {
      for (const arg of args) {
        this.tracker.addArgument(name, arg.text, arg.type, arg.round);
      }
    }
  }

  /**
   * 快速创建论坛（简化配置）
   */
  async quickForum(topic, participants, options = {}) {
    const config = {
      topic,
      participants: participants.map(name => ({ name })),
      mode: options.mode || 'exploratory',
      rounds: options.rounds || 10,
      moderatorStyle: options.moderatorStyle || 'balanced',
      verdictType: options.verdictType || 'points',
      outputFormat: options.outputFormat || 'dialogue'
    };
    
    return this.createDiscussion(config);
  }

  /**
   * 快速启动子代理辩论
   */
  async quickArena(topic, participants, options = {}) {
    // 转换格式
    const participantsConfig = participants.map(name => {
      // 从名字推断skill名称
      const skillMap = {
        '纽森': 'gavin-newsom',
        '特朗普': 'donald-trump',
        '巴菲特': 'warren-buffett',
        '芒格': 'charlie-munger',
        '马斯克': 'elon-musk',
        '拜登': 'joe-biden',
        '哈里斯': 'kamala-harris'
      };
      return {
        name,
        skillName: skillMap[name] || name.toLowerCase().replace(/\s+/g, '-')
      };
    });

    return this.launchArena({
      topic,
      mode: options.mode || 'adversarial',
      rounds: options.rounds || 10,
      participants: participantsConfig,
      moderatorName: options.moderatorName || '巴菲特',
      moderatorSkill: options.moderatorSkill || 'warren-buffett',
      moderatorStyle: options.moderatorStyle || 'provocative',
      outputFormat: options.outputFormat || 'dialogue'
    });
  }
}

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 解析参数
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎭 虚拟论坛 Virtual Forum

用法:
  node index.js <话题> <参与者1> <参与者2> [...]

子代理模式选项:
  --mode <exploratory|adversarial|decision>
  --rounds <10|20|50>
  --moderator <balanced|provocative|synthesizing>
  --format <dialogue|report|decision|json>
  --subagent  (启用子代理模式)

示例:
  # 基本用法（模拟模式）
  node index.js "话题" 参与者1 参与者2

  # 子代理模式
  node index.js "美国是否退出联合国" 纽森 特朗普 --subagent --rounds 10

  # 指定主持人风格
  node index.js "话题" 参与者1 参与者2 --subagent --moderator provocative
`);
    return;
  }
  
  // 检查是否启用子代理模式
  const useSubagent = args.includes('--subagent');
  const optionIndex = args.findIndex(a => a.startsWith('--'));
  const topic = args[0] || '当前市场该激进还是保守？';
  
  // 解析参与者
  const participantEnd = optionIndex === -1 ? args.length : optionIndex;
  const participants = args.slice(1, participantEnd).length > 0 
    ? args.slice(1, participantEnd) 
    : ['巴菲特', '芒格'];
  
  // 解析选项
  const options = {};
  for (let i = optionIndex; i < args.length; i++) {
    if (args[i] === '--mode' && args[i+1]) options.mode = args[++i];
    if (args[i] === '--rounds' && args[i+1]) options.rounds = parseInt(args[++i]);
    if (args[i] === '--moderator' && args[i+1]) options.moderatorStyle = args[++i];
    if (args[i] === '--format' && args[i+1]) options.outputFormat = args[++i];
    if (args[i] === '--verdict' && args[i+1]) options.verdictType = args[++i];
  }
  
  // 运行
  const forum = new VirtualForum();
  
  console.log(`
🎭 虚拟论坛启动中...
话题: ${topic}
参与者: ${participants.join(', ')}
模式: ${useSubagent ? '子代理 (真正AI交锋)' : '模拟'}
轮次: ${options.rounds || 10}
`);
  
  if (useSubagent) {
    forum.quickArena(topic, participants, options)
      .then(result => {
        console.log('\n' + result.output);
      })
      .catch(err => {
        console.error('错误:', err.message);
        console.error(err.stack);
      });
  } else {
    forum.quickForum(topic, participants, options)
      .then(result => {
        console.log('\n' + result.output);
        console.log('\n📊 论点追踪:\n' + result.tracker.generateReport());
      })
      .catch(err => {
        console.error('错误:', err.message);
      });
  }
}

module.exports = VirtualForum;
