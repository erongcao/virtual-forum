/**
 * 输出格式化器
 * Output Formatter for Virtual Forum
 */

class OutputFormatter {
  constructor() {
    this.formats = {
      dialogue: 'dialogue',
      report: 'report',
      decision: 'decision',
      json: 'json'
    };
  }

  /**
   * 格式化论坛结果
   */
  format(forum, formatType = 'dialogue') {
    switch (formatType) {
      case 'dialogue':
        return this.formatDialogue(forum);
      case 'report':
        return this.formatReport(forum);
      case 'decision':
        return this.formatDecision(forum);
      case 'json':
        return this.formatJSON(forum);
      default:
        return this.formatDialogue(forum);
    }
  }

  /**
   * 对话流格式
   */
  formatDialogue(forum) {
    let output = '';
    
    // 开场
    output += this.formatOpening(forum.opening);
    
    // 每轮
    for (const round of forum.roundsData) {
      output += this.formatRound(round, forum.participants.length);
    }
    
    // 结果
    output += this.formatResult(forum.result);
    
    return output;
  }

  /**
   * 报告格式
   */
  formatReport(forum) {
    let report = '';
    
    report += `# 🎭 虚拟论坛讨论报告\n\n`;
    report += `---\n\n`;
    
    // 话题
    report += `## 📌 讨论话题\n${forum.topic}\n\n`;
    
    // 配置
    report += `## ⚙️ 讨论配置\n`;
    report += `- 模式: ${forum.mode}\n`;
    report += `- 轮次: ${forum.rounds}\n`;
    report += `- 主持人: ${forum.moderator.name}\n`;
    report += `- 判定方式: ${forum.verdictType}\n\n`;
    
    // 参与者
    report += `## 👥 参与者\n`;
    for (const p of forum.participants) {
      report += `- **${p.name}**\n`;
    }
    report += `\n`;
    
    // 核心论点
    report += `## 💬 核心论点\n\n`;
    for (const [name, args] of Object.entries(forum.arguments)) {
      report += `### ${name}\n`;
      const topArgs = args.filter(a => a.type === 'statement' || a.type === '立论').slice(0, 2);
      for (const arg of topArgs) {
        report += `> ${arg.text.slice(0, 150)}...\n\n`;
      }
    }
    
    // 胜负
    report += `## 🏆 结果\n`;
    report += this.formatResultText(forum.result);
    report += `\n\n`;
    
    // 统计
    report += `## 📊 统计数据\n`;
    report += `- 总论点: ${Object.values(forum.arguments).flat().length}\n`;
    report += `- 总轮次: ${forum.rounds}\n`;
    
    return report;
  }

  /**
   * 决策格式
   */
  formatDecision(forum) {
    let output = '';
    
    output += `# 🎯 决策建议\n\n`;
    output += `## 📌 问题\n${forum.topic}\n\n`;
    
    // 各方立场
    output += `## 👥 各方立场\n\n`;
    for (const [name, args] of Object.entries(forum.arguments)) {
      output += `### ${name}\n`;
      const analyses = args.filter(a => a.type === 'analysis');
      if (analyses.length > 0) {
        output += `${analyses[0].text}\n\n`;
      } else {
        output += `${args[0]?.text || '（无分析）'}\n\n`;
      }
    }
    
    // 建议行动
    output += `## ✅ 建议行动\n`;
    const rankings = forum.result.rankings || [forum.result.winner];
    for (let i = 0; i < rankings.length; i++) {
      output += `${i + 1}. 优先考虑${rankings[i].name}的方案\n`;
    }
    output += `\n`;
    
    // 风险提示
    output += `## ⚠️ 风险提示\n`;
    output += `- 本讨论结果仅供参考\n`;
    output += `- 请结合实际情况做决策\n`;
    output += `- 虚拟论坛的观点是模拟生成\n\n`;
    
    return output;
  }

  /**
   * JSON格式
   */
  formatJSON(forum) {
    return JSON.stringify({
      topic: forum.topic,
      mode: forum.mode,
      rounds: forum.rounds,
      participants: forum.participants.map(p => p.name),
      opening: forum.opening,
      arguments: forum.arguments,
      scores: forum.scores,
      result: forum.result,
      metadata: {
        createdAt: new Date(forum.id).toISOString(),
        duration: `${forum.rounds * 5}分钟（模拟）`
      }
    }, null, 2);
  }

  /**
   * 格式化开场
   */
  formatOpening(opening) {
    let output = '';
    output += `\`\`\`\n`;
    output += `🎙️ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `【主持人开场】\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `\n`;
    output += `${opening.content}\n`;
    output += `\n`;
    output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    output += `\`\`\`\n\n`;
    return output;
  }

  /**
   * 格式化一轮
   */
  formatRound(round, participantCount) {
    let output = '';
    const border = '─'.repeat(50);
    
    output += `\n📌 第${round.number}轮 ${border}\n\n`;
    
    for (const exchange of round.exchanges) {
      const emoji = this.getEmoji(exchange.type);
      const speaker = this.bold(exchange.speaker);
      
      output += `${emoji} ${speaker}\n`;
      
      // 根据类型调整格式
      if (exchange.type === 'question') {
        output += `   └─ ${exchange.content}\n\n`;
      } else if (exchange.type === 'answer') {
        output += `   └─ ${exchange.content}\n\n`;
      } else if (exchange.type === 'challenge') {
        output += `   ⚔️ ${exchange.content}\n\n`;
      } else if (exchange.type === 'rebuttal') {
        output += `   🛡️ ${exchange.content}\n\n`;
      } else {
        output += `   ${exchange.content}\n\n`;
      }
    }
    
    return output;
  }

  /**
   * 格式化结果
   */
  formatResult(result) {
    let output = '';
    const border = '═'.repeat(50);
    
    output += `\n${border}\n`;
    output += `🏆 【最终结果】\n`;
    output += `${border}\n\n`;
    output += this.formatResultText(result);
    output += `\n`;
    
    return output;
  }

  /**
   * 格式化结果文本
   */
  formatResultText(result) {
    if (result.type === 'points') {
      let text = `🥇 **胜者: ${result.winner}**\n\n`;
      text += `📊 **得分榜:**\n`;
      for (const r of result.rankings) {
        const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉';
        text += `${medal} ${r.name}: ${r.score}分\n`;
      }
      return text;
    } else if (result.type === 'vote') {
      return `🗳️ **投票结果:** ${result.winner} 胜出\n`;
    } else if (result.type === 'concession') {
      return `🤝 **让步协议:**\n${result.concession}\n`;
    } else if (result.type === 'consensus') {
      let text = `✅ **达成共识:**\n`;
      for (const point of result.consensusPoints) {
        text += `- ${point}\n`;
      }
      text += `\n⚡ **保留分歧:**\n`;
      for (const point of result.divergencePoints) {
        text += `- ${point}\n`;
      }
      return text;
    }
    return '';
  }

  /**
   * 获取表情符号
   */
  getEmoji(type) {
    const emojis = {
      statement: '💬',
      question: '❓',
      answer: '💡',
      challenge: '⚔️',
      rebuttal: '🛡️',
      argument: '📣',
      insight: '💎',
      analysis: '📊',
      opening: '🎙️',
      summary: '📋'
    };
    return emojis[type] || '•';
  }

  /**
   * 加粗
   */
  bold(text) {
    return `**${text}**`;
  }
}

module.exports = OutputFormatter;
