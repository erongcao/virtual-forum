/**
 * 论点追踪器
 * Argument Tracker for Virtual Forum
 */

class ArgumentTracker {
  constructor() {
    this.arguments = [];
    this.scores = {};
    this.relationships = [];
  }

  /**
   * 添加论点
   */
  addArgument(participant, content, type, round) {
    const argument = {
      id: this.arguments.length + 1,
      participant,
      content,
      type, // 'statement' | 'challenge' | 'rebuttal' | 'question' | 'answer'
      round,
      timestamp: Date.now(),
      rebuttals: [],
      isRebutted: false,
      points: 0
    };
    
    this.arguments.push(argument);
    
    // 初始化分数
    if (!this.scores[participant]) {
      this.scores[participant] = { total: 0, points: 0, rebuttals: 0, rebutted: 0 };
    }
    
    return argument;
  }

  /**
   * 添加反驳
   */
  addRebuttal(rebutter, targetArgumentId, content) {
    const target = this.arguments.find(a => a.id === targetArgumentId);
    if (!target) return null;
    
    const rebuttal = {
      id: this.arguments.length + 1,
      participant: rebutter,
      content,
      type: 'rebuttal',
      round: target.round,
      timestamp: Date.now(),
      target: targetArgumentId,
      points: 0
    };
    
    this.arguments.push(rebutral);
    target.rebuttals.push(rebutral.id);
    target.isRebutted = true;
    
    // 计分
    this.awardPoints(rebutter, 'rebuttal_success', 3);
    this.awardPoints(target.participant, 'rebutted', -1);
    
    return rebuttal;
  }

  /**
   * 奖励分数
   */
  awardPoints(participant, action, points) {
    if (!this.scores[participant]) {
      this.scores[participant] = { total: 0, points: 0, rebuttals: 0, rebutted: 0 };
    }
    
    this.scores[participant].total += points;
    this.scores[participant].points += points;
    
    if (action === 'rebuttal_success') {
      this.scores[participant].rebuttals++;
    } else if (action === 'rebutted') {
      this.scores[participant].rebutted++;
    }
  }

  /**
   * 获取参与者的论点
   */
  getParticipantArguments(participant) {
    return this.arguments.filter(a => a.participant === participant);
  }

  /**
   * 获取论点关系图
   */
  getArgumentGraph() {
    return this.arguments.map(a => ({
      id: a.id,
      participant: a.participant,
      type: a.type,
      content: a.content.slice(0, 100),
      isRebutted: a.isRebutted,
      rebuttals: a.rebuttals.length
    }));
  }

  /**
   * 获取分数榜
   */
  getLeaderboard() {
    return Object.entries(this.scores)
      .map(([name, data]) => ({
        name,
        ...data
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * 生成追踪报告
   */
  generateReport() {
    const leaderboard = this.getLeaderboard();
    const graph = this.getArgumentGraph();
    
    let report = '## 论点追踪报告\n\n';
    
    report += '### 🏆 积分榜\n';
    report += '| 参与者 | 总分 | 有效论点 | 成功反驳 | 被反驳 |\n';
    report += '|--------|------|---------|---------|-------|\n';
    
    for (const entry of leaderboard) {
      report += `| ${entry.name} | ${entry.total} | ${entry.points} | ${entry.rebuttals} | ${entry.rebutted} |\n`;
    }
    
    report += '\n### 📊 论点关系\n';
    report += '| # | 参与者 | 类型 | 被反驳 | 反驳数 |\n';
    report += '|---|--------|------|---------|-------|\n';
    
    for (const arg of graph) {
      report += `| ${arg.id} | ${arg.participant} | ${arg.type} | ${arg.isRebutted ? '❌' : '✅'} | ${arg.rebuttals} |\n`;
    }
    
    return report;
  }

  /**
   * 重置追踪器
   */
  reset() {
    this.arguments = [];
    this.scores = {};
    this.relationships = [];
  }
}

module.exports = ArgumentTracker;
