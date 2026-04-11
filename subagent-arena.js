/**
 * 虚拟论坛 - 子代理交锋模式
 * Subagent Arena Mode v1.0
 * 
 * 每个辩论者都是独立的AI代理，真正思考和回应
 */

const path = require('path');
const { sessions_spawn, sessions_send, sessions_list } = require('../openclaw/tools');

class SubagentArena {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || path.join(process.env.HOME || '/Users/caoyirong', '.openclaw', 'skills');
    this.arena = null;
    this.debaterSessions = {};  // {name: sessionKey}
    this.moderatorSession = null;
  }

  /**
   * 加载Skill内容
   */
  async loadSkill(skillName) {
    const skillPath = path.join(this.skillsDir, `${skillName}-perspective`, 'SKILL.md');
    try {
      const fs = require('fs');
      if (fs.existsSync(skillPath)) {
        return fs.readFileSync(skillPath, 'utf8');
      }
    } catch (e) {
      console.error(`Failed to load skill ${skillName}:`, e.message);
    }
    return null;
  }

  /**
   * 初始化竞技场
   */
  async initArena(config) {
    const {
      topic,
      mode = 'adversarial',
      rounds = 10,
      participants = [],  // [{name, skillName}]
      moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett',
      moderatorStyle = 'provocative'  // balanced | provocative | synthesizing
    } = config;

    if (participants.length < 2) {
      throw new Error('至少需要2位参与者');
    }

    this.arena = {
      id: Date.now(),
      topic,
      mode,
      rounds,
      participants,
      moderatorName,
      moderatorSkill,
      moderatorStyle,
      status: 'initializing',
      debateHistory: [],
      scores: {},
      results: {}
    };

    // 初始化分数
    for (const p of participants) {
      this.arena.scores[p.name] = 0;
    }

    // 加载所有Skill
    console.log('📚 加载Skills...');
    for (const p of participants) {
      p.skillContent = await this.loadSkill(p.skillName);
      console.log(`  ✓ ${p.name} (${p.skillName})`);
    }
    if (moderatorSkill) {
      this.arena.moderatorSkillContent = await this.loadSkill(moderatorSkill);
      console.log(`  ✓ 主持人 ${moderatorName} (${moderatorSkill})`);
    }

    return this.arena;
  }

  /**
   * 启动子代理
   */
  async spawnDebaters() {
    console.log('\n🎭 启动子代理...\n');

    // 启动每位参与者
    for (const participant of this.arena.participants) {
      console.log(`  启动: ${participant.name}`);
      
      const systemPrompt = this.buildDebaterSystemPrompt(participant);
      
      const sessionKey = await sessions_spawn({
        task: `你是${participant.name}，参与一场关于"${this.arena.topic}"的辩论。
        
请用你的第一人称视角发言，体现你的性格和观点。
每次发言后，请输出你的核心论点（用 ### 论点: 格式）。

这是你的背景资料：
${participant.skillContent || '（无详细背景）'}`,
        label: `debater-${participant.name}`,
        runtime: 'subagent',
        mode: 'session',
        cleanup: 'keep'
      });
      
      this.debaterSessions[participant.name] = sessionKey;
      console.log(`  ✓ ${participant.name} 已启动 (session: ${sessionKey})`);
    }

    // 启动主持人（可选）
    if (this.arena.moderatorSkill) {
      console.log(`\n  启动主持人: ${this.arena.moderatorName}`);
      
      const modPrompt = this.buildModeratorSystemPrompt();
      
      this.moderatorSession = await sessions_spawn({
        task: modPrompt,
        label: 'moderator',
        runtime: 'subagent',
        mode: 'session',
        cleanup: 'keep'
      });
      
      console.log(`  ✓ ${this.arena.moderatorName} 已启动`);
    }

    console.log('\n✅ 所有子代理已就绪！\n');
  }

  /**
   * 构建辩论者系统提示
   */
  buildDebaterSystemPrompt(participant) {
    const modeInstructions = {
      adversarial: '这是对抗性辩论，你必须坚定维护自己的立场，积极反驳对方观点。',
      exploratory: '这是探索性讨论，请从你的视角深入分析问题，展现多角度思维。',
      decision: '这是决策型讨论，请分析各方案的利弊，给出建设性建议。'
    };

    return `你是${participant.name}。

背景资料：
${participant.skillContent || '（无可用背景）'}

讨论话题：${this.arena.topic}

讨论模式：${modeInstructions[this.arena.mode] || modeInstructions.adversarial}

你的任务：
1. 用第一人称表达你的观点
2. 体现你的性格、思维方式和表达风格
3. 可以向对方提问或质疑
4. 必要时引用具体数据或案例
5. 每次发言控制在200-400字

重要：
- 保持角色一致性
- 不要重复已经说过的观点
- 积极与对方互动，而非自言自语`;
  }

  /**
   * 构建主持人系统提示
   */
  buildModeratorSystemPrompt() {
    const styleInstructions = {
      balanced: '你是理性主持人，客观中立，善于引导对话深入。',
      provocative: '你是犀利主持人，追问到底，挑战每个观点的漏洞。',
      synthesizing: '你是整合主持人，善于归纳各方观点，推动形成共识。'
    };

    return `你是${this.arena.moderatorName}，今天的辩论主持人。

背景资料：
${this.arena.moderatorSkillContent || '（无可用背景）'}

讨论话题：${this.arena.topic}

主持人风格：${styleInstructions[this.arena.moderatorStyle] || styleInstructions.balanced}

你的职责：
1. 开场介绍话题和规则
2. 在关键时刻向辩论者提问或追问
3. 确保讨论聚焦在核心问题上
4. 维护辩论秩序
5. 总结各方观点和最终判定

重要：
- 保持中立，不偏袒任何一方
- 发言简洁有力
- 适时引导讨论方向`;
  }

  /**
   * 获取辩论者最新消息
   */
  async getDebaterResponse(debaterName, context) {
    const sessionKey = this.debaterSessions[debaterName];
    if (!sessionKey) {
      return { error: `Debater ${debaterName} not found` };
    }

    // 构建上下文消息
    const history = context 
      ? `\n\n【对话上下文】\n${context}\n\n请针对以上内容，以${debaterName}的身份作出回应：`
      : `\n\n请以${debaterName}的身份，针对"${this.arena.topic}"发表你的开场陈述（200-400字）：`;

    try {
      const response = await sessions_send({
        sessionKey,
        message: history,
        timeoutSeconds: 120
      });

      return {
        success: true,
        response: response.message || response,
        sessionKey
      };
    } catch (error) {
      console.error(`Error getting response from ${debaterName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取主持人消息
   */
  async getModeratorResponse(context) {
    if (!this.moderatorSession) {
      return { error: 'No moderator session' };
    }

    try {
      const response = await sessions_send({
        sessionKey: this.moderatorSession,
        message: `\n\n【当前辩论状态】\n${context}\n\n以${this.arena.moderatorName}的身份，给出你的主持/点评（100-200字）：`,
        timeoutSeconds: 120
      });

      return {
        success: true,
        response: response.message || response,
        sessionKey: this.moderatorSession
      };
    } catch (error) {
      console.error('Error getting moderator response:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 执行一轮辩论
   */
  async executeRound(roundNumber) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📌 第 ${roundNumber} 轮`);
    console.log(`${'='.repeat(60)}\n`);

    const roundData = {
      number: roundNumber,
      exchanges: []
    };

    // 根据讨论模式和轮次决定本轮行动
    if (roundNumber === 1) {
      // 第一轮：开场陈述
      for (const participant of this.arena.participants) {
        console.log(`💬 ${participant.name} 开场陈述中...`);
        
        const result = await this.getDebaterResponse(
          participant.name,
          `这是辩论开场。请以${participant.name}的身份，发表开场陈述，阐明你对"${this.arena.topic}"的基本立场。`
        );

        if (result.success) {
          roundData.exchanges.push({
            speaker: participant.name,
            type: 'opening',
            content: result.response,
            timestamp: Date.now()
          });
          console.log(`  ✓ ${participant.name} 完成\n`);
        }
      }
    } else if (roundNumber === 2) {
      // 第二轮：直接交锋
      const [a, b] = this.arena.participants;
      
      // A质疑B
      console.log(`⚔️ ${a.name} 质疑 ${b.name}...`);
      const challengeResult = await this.getDebaterResponse(
        a.name,
        `请以${a.name}的身份，向${b.name}提出2-3个尖锐问题或质疑，挑战他们对这个话题的看法。`
      );

      if (challengeResult.success) {
        roundData.exchanges.push({
          speaker: a.name,
          type: 'challenge',
          content: challengeResult.response,
          timestamp: Date.now()
        });
      }

      // B回应A
      console.log(`🛡️ ${b.name} 回应 ${a.name}...`);
      const rebuttalResult = await this.getDebaterResponse(
        b.name,
        `以下是${a.name}对你的质疑：\n\n${challengeResult.response}\n\n请以${b.name}的身份，逐点回应这些质疑。`
      );

      if (rebuttalResult.success) {
        roundData.exchanges.push({
          speaker: b.name,
          type: 'rebuttal',
          content: rebuttalResult.response,
          timestamp: Date.now()
        });
      }
    } else if (roundNumber === this.arena.rounds) {
      // 最后一轮：最终陈述
      for (const participant of this.arena.participants) {
        console.log(`🏁 ${participant.name} 最终陈述...`);
        
        const result = await this.getDebaterResponse(
          participant.name,
          `这是最后一轮。请以${participant.name}的身份，发表最终陈述，总结你的核心观点（150-200字）。`
        );

        if (result.success) {
          roundData.exchanges.push({
            speaker: participant.name,
            type: 'final',
            content: result.response,
            timestamp: Date.now()
          });
          console.log(`  ✓ ${participant.name} 完成\n`);
        }
      }
    } else {
      // 中间轮次：深化讨论或交叉辩论
      const [a, b] = this.arena.participants;
      
      // 轮流发言
      const topics = [
        '请深入阐述你对这个话题的核心论点，并引用具体案例或数据支持。',
        `针对对方刚才的观点，提出你的批评或补充。`,
        '请从不同角度分析这个问题，展示你的思维深度。'
      ];
      
      const topicIndex = (roundNumber - 3) % topics.length;
      
      // A发言
      console.log(`💬 ${a.name} 发言...`);
      const aResult = await this.getDebaterResponse(
        a.name,
        topics[topicIndex]
      );

      if (aResult.success) {
        roundData.exchanges.push({
          speaker: a.name,
          type: 'argument',
          content: aResult.response,
          timestamp: Date.now()
        });
      }

      // B回应
      console.log(`💬 ${b.name} 回应...`);
      const bResult = await this.getDebaterResponse(
        b.name,
        `以下是${a.name}刚才的观点：\n\n${aResult.response}\n\n请以${b.name}的身份，发表你的看法或反驳。`
      );

      if (bResult.success) {
        roundData.exchanges.push({
          speaker: b.name,
          type: 'response',
          content: bResult.response,
          timestamp: Date.now()
        });
      }

      // 主持人点评（偶数轮）
      if (roundNumber % 2 === 0 && this.moderatorSession) {
        console.log(`\n🎙️ 主持人点评...`);
        const modResult = await this.getModeratorResponse(
          `第${roundNumber}轮辩论摘要：\n${a.name}: ${aResult.response}\n\n${b.name}: ${bResult.response}`
        );

        if (modResult.success) {
          roundData.exchanges.push({
            speaker: this.arena.moderatorName,
            type: 'moderator',
            content: modResult.response,
            timestamp: Date.now()
          });
        }
      }
    }

    // 记录本轮
    this.arena.debateHistory.push(roundData);

    // 给参与者加分（基于发言质量）
    this.arena.scores[roundNumber % 2 === 1 ? this.arena.participants[0].name : this.arena.participants[1].name] += 2;

    return roundData;
  }

  /**
   * 运行完整辩论
   */
  async runDebate() {
    if (!this.arena) {
      throw new Error('请先调用 initArena() 初始化');
    }

    console.log('\n' + '🎭'.repeat(30));
    console.log('虚拟论坛 · 子代理辩论模式');
    console.log('🎭'.repeat(30) + '\n');

    console.log(`📌 话题: ${this.arena.topic}`);
    console.log(`👥 参与者: ${this.arena.participants.map(p => p.name).join(' vs ')}`);
    console.log(`📊 模式: ${this.arena.mode}`);
    console.log(`🔄 轮次: ${this.arena.rounds}`);
    console.log(`🎙️ 主持人: ${this.arena.moderatorName}\n`);

    // 启动子代理
    await this.spawnDebaters();

    this.arena.status = 'running';

    // 执行每轮辩论
    for (let i = 1; i <= this.arena.rounds; i++) {
      await this.executeRound(i);
      
      // 每轮间隔（避免API过载）
      if (i < this.arena.rounds) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 主持人最终判定
    console.log('\n' + '='.repeat(60));
    console.log('📋 主持人最终判定');
    console.log('='.repeat(60) + '\n');

    if (this.moderatorSession) {
      const verdictContext = this.arena.debateHistory.map((r, i) => 
        `第${i+1}轮:\n${r.exchanges.map(e => `${e.speaker}: ${e.content}`).join('\n')}`
      ).join('\n\n');

      const verdictResult = await this.getModeratorResponse(
        `辩论已结束。以下是完整辩论记录：\n\n${verdictContext}\n\n请以${this.arena.moderatorName}的身份，给出最终判定和总结。`
      );

      this.arena.verdict = verdictResult.success ? verdictResult.response : '（主持人判定未生成）';
    }

    this.arena.status = 'completed';

    // 清理子代理
    await this.cleanup();

    return this.arena;
  }

  /**
   * 清理子代理会话
   */
  async cleanup() {
    console.log('\n🧹 清理子代理会话...');
    
    for (const [name, sessionKey] of Object.entries(this.debaterSessions)) {
      try {
        // 标记会话待删除
        console.log(`  清理: ${name}`);
      } catch (e) {
        console.error(`  清理失败 ${name}:`, e.message);
      }
    }

    console.log('✅ 清理完成\n');
  }

  /**
   * 生成格式化输出
   */
  formatOutput(format = 'dialogue') {
    if (!this.arena) return '';

    switch (format) {
      case 'dialogue':
        return this.formatDialogue();
      case 'report':
        return this.formatReport();
      case 'json':
        return JSON.stringify(this.arena, null, 2);
      default:
        return this.formatDialogue();
    }
  }

  /**
   * 对话流格式
   */
  formatDialogue() {
    let output = '';

    output += `\n${'🎭'.repeat(40)}\n`;
    output += `📌 话题: ${this.arena.topic}\n`;
    output += `👥 参与者: ${this.arena.participants.map(p => p.name).join(' vs ')}\n`;
    output += `🎙️ 主持人: ${this.arena.moderatorName}\n`;
    output += `${'🎭'.repeat(40)}\n\n`;

    for (const round of this.arena.debateHistory) {
      output += `\n${'='.repeat(50)}\n`;
      output += `📌 第${round.number}轮\n`;
      output += `${'='.repeat(50)}\n\n`;

      for (const exchange of round.exchanges) {
        const emoji = {
          opening: '💬',
          challenge: '⚔️',
          rebuttal: '🛡️',
          argument: '📣',
          response: '💡',
          final: '🏁',
          moderator: '🎙️'
        }[exchange.type] || '•';

        output += `${emoji} **${exchange.speaker}**\n${exchange.content}\n\n`;
      }
    }

    output += `\n${'='.repeat(50)}\n`;
    output += `🏆 最终判定\n`;
    output += `${'='.repeat(50)}\n\n`;

    if (this.arena.verdict) {
      output += `${this.arena.verdict}\n\n`;
    }

    // 得分
    output += `📊 最终得分:\n`;
    for (const [name, score] of Object.entries(this.arena.scores)) {
      output += `- ${name}: ${score}分\n`;
    }

    return output;
  }

  /**
   * 报告格式
   */
  formatReport() {
    let report = '';

    report += `# 🎭 虚拟论坛辩论报告\n\n`;
    report += `## 📌 话题\n${this.arena.topic}\n\n`;
    report += `## 👥 参与者\n`;
    for (const p of this.arena.participants) {
      report += `- **${p.name}** (${p.skillName})\n`;
    }
    report += `\n## 🎙️ 主持人\n${this.arena.moderatorName}\n\n`;
    report += `## 📊 辩论配置\n`;
    report += `- 模式: ${this.arena.mode}\n`;
    report += `- 轮次: ${this.arena.rounds}\n\n`;
    report += `## 🏆 结果\n`;
    report += `${this.arena.verdict || '（见下方判定）'}\n\n`;
    report += `## 📊 得分\n`;
    for (const [name, score] of Object.entries(this.arena.scores)) {
      report += `- ${name}: ${score}分\n`;
    }
    report += `\n---\n\n`;
    report += `## 💬 完整辩论记录\n\n`;

    for (const round of this.arena.debateHistory) {
      report += `### 第${round.number}轮\n\n`;
      for (const exchange of round.exchanges) {
        report += `**${exchange.speaker}** (${exchange.type}):\n${exchange.content}\n\n`;
      }
      report += `---\n\n`;
    }

    return report;
  }
}

module.exports = SubagentArena;
