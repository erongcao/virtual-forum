/**
 * 虚拟论坛 - 核心讨论引擎
 * Virtual Forum Core Engine v1.0
 */

const fs = require('fs');
const path = require('path');

class ForumEngine {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || path.join(process.env.HOME || '/Users/caoyirong', '.openclaw', 'skills');
    this.currentForum = null;
    
    // 讨论模式
    this.modes = {
      exploratory: 'exploratory',    // 探索性
      adversarial: 'adversarial',   // 对抗性
      decision: 'decision'          // 决策型
    };
    
    // 主持人风格
    this.moderatorStyles = {
      balanced: {
        name: '理性主持人',
        style: '客观中立，善于引导对话',
        questions: ['各位怎么看这个问题？', '有没有不同的观点？', '能否详细解释？']
      },
      provocative: {
        name: '犀利主持人',
        style: '追问到底，挑战每个观点',
        questions: ['为什么你这么认为？', '有没有相反的证据？', '你能为你的观点辩护吗？']
      },
      synthesizing: {
        name: '整合主持人',
        style: '善于归纳，推动形成共识',
        questions: ['能否总结核心观点？', '大家有没有共同点？', '能否找到折中方案？']
      }
    };
    
    // 胜负判定方式
    this.verdictTypes = {
      points: 'points',      // 点数制
      vote: 'vote',          // 投票制
      concession: 'concession', // 让步制
      consensus: 'consensus' // 共识制
    };
  }

  /**
   * 创建讨论
   */
  async createForum(config) {
    const {
      topic,
      mode = 'exploratory',
      rounds = 10,
      participants = [],  // [{name, skillPath}]
      moderatorStyle = 'balanced',
      verdictType = 'points',
      outputFormat = 'dialogue'  // dialogue | report | decision
    } = config;
    
    // 验证配置
    if (!topic) throw new Error('话题不能为空');
    if (participants.length < 2) throw new Error('至少需要2位参与者');
    
    // 初始化论坛
    this.currentForum = {
      id: Date.now(),
      topic,
      mode,
      rounds,
      participants,
      moderator: this.moderatorStyles[moderatorStyle] || this.moderatorStyles.balanced,
      verdictType,
      outputFormat,
      roundsData: [],
      arguments: {},  // {participant: [{text, type, round, points}]}
      scores: {},     // {participant: totalScore}
      status: 'initialized'
    };
    
    // 初始化分数和论点
    for (const p of participants) {
      this.currentForum.arguments[p.name] = [];
      this.currentForum.scores[p.name] = 0;
    }
    
    // 生成开场
    this.currentForum.opening = this.generateOpening();
    
    return this.currentForum;
  }

  /**
   * 生成开场白
   */
  generateOpening() {
    const { topic, participants, moderator, mode } = this.currentForum;
    
    const modeDescriptions = {
      exploratory: '探索性讨论：我们将从各自角度剖析这个问题，最终尝试得出一个综合结论。',
      adversarial: '对抗性讨论：各方将就观点展开交锋，最终分出胜负或达成共识。',
      decision: '决策型讨论：各位将分析各方案的利弊，最终给出行动建议。'
    };
    
    const participantList = participants.map(p => p.name).join('、');
    
    return {
      moderator: moderator.name,
      content: `各位好，欢迎来到今天的虚拟论坛。

我是${moderator.name}，今天的讨论由我来主持。

📌 讨论话题：${topic}

参与者：${participantList}

讨论类型：${modeDescriptions[mode]}

规则：
- 共${this.currentForum.rounds}轮
- 每轮轮流陈述观点
- 可以向其他人提问
- 主持人会在必要时追问
- 最终得出讨论结果

让我们开始！`
    };
  }

  /**
   * 执行一轮讨论
   */
  async executeRound(roundNumber) {
    if (!this.currentForum) throw new Error('请先创建论坛');
    if (roundNumber > this.currentForum.rounds) throw new Error('轮次已用完');
    
    const forum = this.currentForum;
    const round = {
      number: roundNumber,
      exchanges: [],
      summary: null
    };
    
    // 根据模式决定每轮的行为
    switch (forum.mode) {
      case 'exploratory':
        await this.executeExploratoryRound(round);
        break;
      case 'adversarial':
        await this.executeAdversarialRound(round);
        break;
      case 'decision':
        await this.executeDecisionRound(round);
        break;
    }
    
    // 主持人总结
    round.summary = this.generateRoundSummary(round);
    
    // 记录轮次
    forum.roundsData.push(round);
    
    return round;
  }

  /**
   * 执行探索性讨论的一轮
   */
  async executeExploratoryRound(round) {
    const { participants, topic } = this.currentForum;
    
    // 第一步：轮流陈述
    for (const participant of participants) {
      const statement = await this.generateStatement(participant, topic, round.number, 'opening');
      round.exchanges.push({
        speaker: participant.name,
        type: 'statement',
        content: statement.content,
        keyPoints: statement.keyPoints
      });
      
      // 记录论点
      this.recordArgument(participant.name, statement.content, 'opening', round.number);
    }
    
    // 第二步：交叉提问（随机指定）
    if (round.number > 1) {
      const [asker, answerer] = this.getRandomPair();
      const question = this.generateQuestion(asker, answerer, topic);
      const answer = await this.generateAnswer(answerer, question, topic);
      
      round.exchanges.push({
        speaker: '主持人',
        type: 'question',
        content: question
      });
      round.exchanges.push({
        speaker: answerer.name,
        type: 'answer',
        content: answer.content
      });
      
      this.recordArgument(answerer.name, answer.content, 'answer', round.number);
    }
    
    // 第三步：自由讨论（最后3轮）
    if (round.number > this.currentForum.rounds - 3) {
      for (const participant of participants) {
        const insight = await this.generateInsight(participant, topic, round.number);
        round.exchanges.push({
          speaker: participant.name,
          type: 'insight',
          content: insight.content
        });
      }
    }
  }

  /**
   * 执行对抗性讨论的一轮
   */
  async executeAdversarialRound(round) {
    const { participants, topic } = this.currentForum;
    
    if (round.number === 1) {
      // 第一轮：各自立论
      for (const participant of participants) {
        const statement = await this.generateStatement(participant, topic, 1, '立论');
        round.exchanges.push({
          speaker: participant.name,
          type: 'statement',
          content: statement.content
        });
        this.recordArgument(participant.name, statement.content, '立论', 1);
      }
    } else if (round.number === 2) {
      // 第二轮：质疑对方
      const [a, b] = participants;
      
      const challengeA = await this.generateChallenge(a, b, topic);
      const rebuttalB = await this.generateRebuttal(b, a, challengeA);
      const counterB = await this.generateChallenge(b, a, topic);
      const counterA = await this.generateRebuttal(a, b, counterB);
      
      round.exchanges.push(
        { speaker: a.name, type: 'challenge', content: challengeA },
        { speaker: b.name, type: 'rebuttal', content: rebuttalB },
        { speaker: b.name, type: 'challenge', content: counterB },
        { speaker: a.name, type: 'rebuttal', content: counterA }
      );
      
      // 计分
      this.updateScore(a.name, 1);
      this.updateScore(b.name, 1);
    } else {
      // 后续轮次：深化交锋
      const exchanges = await this.generateDeepClash(participants, topic, round.number);
      round.exchanges.push(...exchanges);
    }
  }

  /**
   * 执行决策型讨论的一轮
   */
  async executeDecisionRound(round) {
    const { participants, topic } = this.currentForum;
    
    // 每轮：分析利弊
    for (const participant of participants) {
      const analysis = await this.generateDecisionAnalysis(participant, topic);
      round.exchanges.push({
        speaker: participant.name,
        type: 'analysis',
        content: analysis.content,
        pros: analysis.pros,
        cons: analysis.cons
      });
    }
    
    // 主持人追问（偶数轮）
    if (round.number % 2 === 0) {
      const question = this.moderator.questions[0];
      round.exchanges.push({
        speaker: '主持人',
        type: 'question',
        content: question
      });
    }
  }

  /**
   * 生成陈述
   */
  async generateStatement(participant, topic, round, type) {
    // 模拟生成观点（实际应调用Skill）
    return {
      content: `[${participant.name}]关于"${topic}"的${type}观点...`,
      keyPoints: ['要点1', '要点2', '要点3']
    };
  }

  /**
   * 生成追问
   */
  generateQuestion(asker, answerer, topic) {
    return `请问${answerer.name}，您刚才的观点中，关于${topic}，最大的挑战是什么？`;
  }

  /**
   * 生成回答
   */
  async generateAnswer(participant, question, topic) {
    return {
      content: `[${participant.name}]回应：关于这个问题，我认为...`
    };
  }

  /**
   * 生成挑战
   */
  async generateChallenge(challenger, target, topic) {
    return `[${challenger.name}]挑战${target.name}]：关于${topic}，我认为你的观点存在以下漏洞...`;
  }

  /**
   * 生成反驳
   */
  async generateRebuttal(defender, challenger, challenge) {
    return {
      content: `[${defender.name}]反驳${challenger.name}]：你的挑战有一定道理，但我的论点是...`
    };
  }

  /**
   * 生成洞见
   */
  async generateInsight(participant, topic, round) {
    return {
      content: `[${participant.name}]补充观点]：经过深入思考，我认为...`
    };
  }

  /**
   * 生成深度交锋
   */
  async generateDeepClash(participants, topic, round) {
    const exchanges = [];
    const [a, b] = participants;
    
    if (round % 2 === 0) {
      const pointA = await this.generateStrongPoint(a, topic);
      exchanges.push({ speaker: a.name, type: 'argument', content: pointA });
      this.updateScore(a.name, 2);
    } else {
      const pointB = await this.generateStrongPoint(b, topic);
      exchanges.push({ speaker: b.name, type: 'argument', content: pointB });
      this.updateScore(b.name, 2);
    }
    
    return exchanges;
  }

  /**
   * 生成强论点
   */
  async generateStrongPoint(participant, topic) {
    return `[${participant.name}]核心论点]：关于${topic}，最关键的论据是...`;
  }

  /**
   * 生成决策分析
   */
  async generateDecisionAnalysis(participant, topic) {
    return {
      content: `[${participant.name}]利弊分析]：`,
      pros: ['优点1', '优点2'],
      cons: ['缺点1', '缺点2']
    };
  }

  /**
   * 生成回合总结
   */
  generateRoundSummary(round) {
    const points = round.exchanges.filter(e => e.type === 'statement' || e.type === 'argument');
    
    return {
      keyPoints: points.map(p => `${p.speaker}: ${p.content.slice(0, 50)}...`),
      participantEngagement: this.currentForum.participants.map(p => ({
        name: p.name,
        contributions: round.exchanges.filter(e => e.speaker === p.name).length
      }))
    };
  }

  /**
   * 记录论点
   */
  recordArgument(participant, content, type, round) {
    this.currentForum.arguments[participant].push({
      text: content,
      type,
      round,
      timestamp: Date.now()
    });
  }

  /**
   * 更新分数
   */
  updateScore(participant, points) {
    this.currentForum.scores[participant] = (this.currentForum.scores[participant] || 0) + points;
  }

  /**
   * 获取随机配对
   */
  getRandomPair() {
    const { participants } = this.currentForum;
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * 执行完整讨论
   */
  async runForum() {
    if (!this.currentForum) throw new Error('请先创建论坛');
    
    this.currentForum.status = 'running';
    
    for (let i = 1; i <= this.currentForum.rounds; i++) {
      await this.executeRound(i);
    }
    
    // 生成最终结果
    this.currentForum.result = this.calculateResult();
    this.currentForum.status = 'completed';
    
    return this.currentForum;
  }

  /**
   * 计算结果
   */
  calculateResult() {
    const forum = this.currentForum;
    
    switch (forum.verdictType) {
      case 'points':
        return this.calculatePointsVerdict();
      case 'vote':
        return this.calculateVoteVerdict();
      case 'concession':
        return this.calculateConcessionVerdict();
      case 'consensus':
        return this.calculateConsensusVerdict();
      default:
        return this.calculatePointsVerdict();
    }
  }

  /**
   * 点数制结果
   */
  calculatePointsVerdict() {
    const scores = this.currentForum.scores;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    return {
      type: 'points',
      winner: sorted[0][0],
      scores,
      rankings: sorted.map(([name, score], i) => ({ rank: i + 1, name, score }))
    };
  }

  /**
   * 投票制结果
   */
  calculateVoteVerdict() {
    // 简化：主持人投票给得分最高者
    const scores = this.currentForum.scores;
    const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    
    return {
      type: 'vote',
      winner,
      votes: { [winner]: 1 }
    };
  }

  /**
   * 让步制结果
   */
  calculateConcessionVerdict() {
    const scores = this.currentForum.scores;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    
    return {
      type: 'concession',
      partialWinner: sorted[0][0],
      partialLoser: sorted[1][0],
      concession: `${sorted[1][0]}承认${sorted[0][0]}在某些方面更合理`
    };
  }

  /**
   * 共识制结果
   */
  calculateConsensusVerdict() {
    return {
      type: 'consensus',
      summary: '各方达成部分共识，保留分歧',
      consensusPoints: ['共识点1', '共识点2'],
      divergencePoints: ['分歧点1', '分歧点2']
    };
  }

  /**
   * 生成报告格式输出
   */
  generateReport() {
    const forum = this.currentForum;
    
    let report = `# 虚拟论坛讨论报告\n\n`;
    report += `## 📌 话题\n${forum.topic}\n\n`;
    report += `## 👥 参与者\n`;
    for (const p of forum.participants) {
      report += `- ${p.name}\n`;
    }
    report += `\n`;
    report += `## 📊 讨论类型\n${forum.mode}\n\n`;
    report += `## 🏆 结果\n`;
    
    if (forum.result.type === 'points') {
      report += `**胜者**: ${forum.result.winner}\n\n`;
      report += `**得分**:\n`;
      for (const r of forum.result.rankings) {
        report += `- ${r.name}: ${r.score}分\n`;
      }
    }
    
    report += `\n## 📝 核心论点\n`;
    
    for (const [name, args] of Object.entries(forum.arguments)) {
      report += `### ${name}\n`;
      for (const arg of args.slice(0, 3)) {
        report += `- ${arg.text.slice(0, 100)}...\n`;
      }
      report += `\n`;
    }
    
    return report;
  }

  /**
   * 生成对话格式输出
   */
  generateDialogue() {
    const forum = this.currentForum;
    let dialogue = '';
    
    // 开场
    dialogue += `🎙️ 【主持人开场】\n${forum.opening.content}\n\n`;
    
    // 每轮
    for (const round of forum.roundsData) {
      dialogue += `\n${'═'.repeat(50)}\n`;
      dialogue += `📌 第${round.number}轮\n`;
      dialogue += `${'═'.repeat(50)}\n\n`;
      
      for (const exchange of round.exchanges) {
        const emoji = {
          statement: '💬',
          question: '❓',
          answer: '💡',
          challenge: '⚔️',
          rebuttal: '🛡️',
          argument: '📣',
          insight: '💎',
          analysis: '📊'
        }[exchange.type] || '•';
        
        dialogue += `${emoji} **${exchange.speaker}**\n${exchange.content}\n\n`;
      }
    }
    
    // 结果
    dialogue += `\n${'═'.repeat(50)}\n`;
    dialogue += `🏆 【最终结果】\n`;
    dialogue += `${'═'.repeat(50)}\n`;
    
    if (forum.result.type === 'points') {
      dialogue += `🥇 胜者: ${forum.result.winner}\n`;
      dialogue += `📊 得分: ${forum.result.scores[forum.result.winner]}\n`;
    }
    
    return dialogue;
  }
}

module.exports = ForumEngine;
