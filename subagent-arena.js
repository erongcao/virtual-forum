/**
 * 虚拟论坛 - 子代理交锋引擎
 * Subagent Arena v2.0
 * 
 * 本模块负责管理辩论状态和配置
 * 实际的子代理启动通过OpenClaw工具调用
 */

const path = require('path');
const fs = require('fs');

class SubagentArena {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || path.join(process.env.HOME || '/Users/caoyirong', '.openclaw', 'skills');
    this.arena = null;
    this.debaterSessions = {};
  }

  /**
   * 加载Skill内容
   */
  async loadSkill(skillName) {
    const skillPath = path.join(this.skillsDir, `${skillName}-perspective`, 'SKILL.md');
    try {
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
      participants = [],
      moderatorName = '巴菲特',
      moderatorSkill = 'warren-buffett',
      moderatorStyle = 'provocative'
    } = config;

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
      console.log(`  ✓ ${p.name}`);
    }
    if (moderatorSkill) {
      this.arena.moderatorSkillContent = await this.loadSkill(moderatorSkill);
      console.log(`  ✓ 主持人 ${moderatorName}`);
    }

    return this.arena;
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

讨论模式：${modeInstructions[this.arena.mode]}

你的任务：
1. 用第一人称表达你的观点
2. 体现你的性格、思维方式和表达风格
3. 可以向对方提问或质疑
4. 必要时引用具体数据或案例
5. 每次发言控制在200-400字

重要：
- 保持角色一致性
- 不要重复已经说过的观点
- 积极与对方互动`;
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

主持人风格：${styleInstructions[this.arena.moderatorStyle]}

你的职责：
1. 开场介绍话题和规则
2. 在关键时刻向辩论者提问或追问
3. 确保讨论聚焦在核心问题上
4. 维护辩论秩序
5. 总结各方观点和最终判定`;
  }

  /**
   * 获取第N轮的消息配置
   */
  getRoundConfig(roundNumber) {
    const { participants, moderatorName, moderatorStyle, topic } = this.arena;
    const [a, b] = participants;

    const config = {
      round: roundNumber,
      messages: []
    };

    if (roundNumber === 1) {
      // 开场陈述
      config.messages = [
        {
          to: a.name,
          prompt: `请以${a.name}的身份，针对"${topic}"发表开场陈述，阐明你的基本立场和核心论点（200-400字）。`,
          type: 'opening'
        },
        {
          to: b.name,
          prompt: `请以${b.name}的身份，针对"${topic}"发表开场陈述，阐明你的基本立场和核心论点（200-400字）。`,
          type: 'opening'
        }
      ];
    } else if (roundNumber === 2) {
      // 直接交锋
      config.messages = [
        {
          to: a.name,
          prompt: `请以${a.name}的身份，向${b.name}提出2-3个尖锐问题或质疑，挑战他们对这个话题的看法。`,
          type: 'challenge'
        },
        {
          to: b.name,
          prompt: `以下是${a.name}对你的质疑。请以${b.name}的身份，逐点回应这些质疑。`,
          contextFrom: a.name,
          type: 'rebuttal'
        }
      ];
    } else if (roundNumber === this.arena.rounds) {
      // 最终陈述
      config.messages = [
        {
          to: a.name,
          prompt: `这是最后一轮。请以${a.name}的身份，发表最终陈述，总结你的核心观点（150-200字）。`,
          type: 'final'
        },
        {
          to: b.name,
          prompt: `这是最后一轮。请以${b.name}的身份，发表最终陈述，总结你的核心观点（150-200字）。`,
          type: 'final'
        }
      ];
    } else {
      // 中间轮次
      const topics = [
        '请深入阐述你对这个话题的核心论点，并引用具体案例或数据支持你的观点。',
        '针对对方刚才的观点，提出你的批评、补充或反驳。',
        '请从不同角度分析这个问题，展示你的思维深度。'
      ];
      const topicIndex = (roundNumber - 3) % topics.length;

      config.messages = [
        {
          to: a.name,
          prompt: topics[topicIndex],
          type: 'argument'
        },
        {
          to: b.name,
          prompt: `以下是${a.name}刚才的观点。请以${b.name}的身份，发表你的看法或反驳。`,
          contextFrom: a.name,
          type: 'response'
        }
      ];

      // 主持人点评（偶数轮）
      if (roundNumber % 2 === 0 && this.arena.moderatorName) {
        config.messages.push({
          to: moderatorName,
          prompt: `第${roundNumber}轮辩论进行中，请以${moderatorName}的身份，给出简短点评或追问（100字以内）。`,
          type: 'moderator'
        });
      }
    }

    return config;
  }

  /**
   * 记录一轮结果
   */
  recordRound(roundNumber, exchanges) {
    const roundData = {
      number: roundNumber,
      exchanges
    };

    this.arena.debateHistory.push(roundData);
    return roundData;
  }

  /**
   * 更新分数
   */
  updateScore(participant, points) {
    this.arena.scores[participant] = (this.arena.scores[participant] || 0) + points;
  }

  /**
   * 获取最终判定提示
   */
  getVerdictPrompt() {
    let context = '辩论已结束。以下是完整辩论记录：\n\n';
    
    for (const round of this.arena.debateHistory) {
      context += `【第${round.number}轮】\n`;
      for (const exchange of round.exchanges) {
        context += `${exchange.speaker}: ${exchange.content}\n\n`;
      }
    }

    context += `\n请以${this.arena.moderatorName}的身份，给出最终判定：谁是这场辩论的胜者？为什么？`;

    return context;
  }

  /**
   * 格式化输出
   */
  formatOutput(format = 'dialogue', verdict = null) {
    if (!this.arena) return '';

    switch (format) {
      case 'dialogue':
        return this.formatDialogue(verdict);
      case 'report':
        return this.formatReport(verdict);
      case 'json':
        return JSON.stringify(this.arena, null, 2);
      default:
        return this.formatDialogue(verdict);
    }
  }

  formatDialogue(verdict) {
    let output = '';

    output += `\n${'🎭'.repeat(40)}\n`;
    output += `📌 话题: ${this.arena.topic}\n`;
    output += `👥 参与者: ${this.arena.participants.map(p => p.name).join(' vs ')}\n`;
    output += `🎙️ 主持人: ${this.arena.moderatorName}\n`;
    output += `🔄 轮次: ${this.arena.rounds}\n`;
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

    if (verdict) {
      output += `${verdict}\n\n`;
    }

    // 得分
    output += `📊 最终得分:\n`;
    for (const [name, score] of Object.entries(this.arena.scores)) {
      output += `- ${name}: ${score}分\n`;
    }

    return output;
  }

  formatReport(verdict) {
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

    if (verdict) {
      report += `## 🏆 最终判定\n${verdict}\n\n`;
    }

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
