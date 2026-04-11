/**
 * 虚拟论坛 - 主入口
 * Virtual Forum Main Entry
 */

const ForumEngine = require('./forum-engine.js');
const ArgumentTracker = require('./argument-tracker.js');
const OutputFormatter = require('./output-formatter.js');

class VirtualForum {
  constructor(skillsDir = null) {
    this.engine = new ForumEngine(skillsDir);
    this.tracker = new ArgumentTracker();
    this.formatter = new OutputFormatter();
  }

  /**
   * 创建并运行论坛
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
}

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // 简单解析
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎭 虚拟论坛 Virtual Forum

用法:
  node index.js <话题> <参与者1> <参与者2> [...]

示例:
  node index.js "AI对就业的影响" 马斯克 辛顿 凯恩斯

选项:
  --mode <exploratory|adversarial|decision>
  --rounds <10|20|50>
  --moderator <balanced|provocative|synthesizing>
  --format <dialogue|report|decision|json>
  --verdict <points|vote|concession|consensus>

输出所有选项:
  node index.js --help
`);
    return;
  }
  
  // 解析话题（第一个参数）
  const topic = args[0] || '当前市场该激进还是保守？';
  
  // 解析参与者（假设从第二个参数开始，到选项前）
  const optionIndex = args.findIndex(a => a.startsWith('--'));
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
模式: ${options.mode || 'exploratory'}
轮次: ${options.rounds || 10}
`);
  
  forum.quickForum(topic, participants, options)
    .then(result => {
      console.log('\n' + result.output);
      console.log('\n📊 论点追踪:\n' + result.tracker.generateReport());
    })
    .catch(err => {
      console.error('错误:', err.message);
    });
}

module.exports = VirtualForum;
