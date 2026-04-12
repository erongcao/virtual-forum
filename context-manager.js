/**
 * 上下文管理器
 * Context Manager for Virtual Forum
 * 
 * 解决Token爆炸问题：
 * 1. 滑动窗口：只保留最近N轮对话
 * 2. 摘要压缩：每N轮生成摘要，替代原始对话
 * 3. 独立上下文：为每位参与者维护独立的上下文摘要
 */

const DEFAULT_WINDOW_SIZE = 5;
const DEFAULT_SUMMARIZE_EVERY = 5;

class ContextManager {
  constructor(options = {}) {
    this.windowSize = options.windowSize || DEFAULT_WINDOW_SIZE;
    this.summarizeEvery = options.summarizeEvery || DEFAULT_SUMMARIZE_EVERY;
    
    this.fullHistory = []; // 完整历史（用于最终报告）
    this.recentHistory = []; // 最近N轮（用于上下文）
    this.summaries = []; // 摘要列表
    this.participantContexts = {}; // 每位参与者的独立上下文
  }

  /**
   * 添加一轮对话
   */
  addRound(roundData) {
    this.fullHistory.push(roundData);
    this.recentHistory.push(roundData);
    
    // 维护滑动窗口
    if (this.recentHistory.length > this.windowSize) {
      this.recentHistory.shift();
    }
    
    // 更新参与者上下文
    if (roundData.speaker) {
      if (!this.participantContexts[roundData.speaker]) {
        this.participantContexts[roundData.speaker] = [];
      }
      this.participantContexts[roundData.speaker].push(roundData);
      
      // 限制每位参与者的历史长度
      if (this.participantContexts[roundData.speaker].length > this.windowSize * 2) {
        this.participantContexts[roundData.speaker].shift();
      }
    }
  }

  /**
   * 检查是否需要生成摘要
   */
  needsSummarization() {
    return this.fullHistory.length > 0 && 
           this.fullHistory.length % this.summarizeEvery === 0 &&
           this.fullHistory.length > this.summaries.length * this.summarizeEvery;
  }

  /**
   * 获取需要摘要的文本
   */
  getTextForSummarization() {
    const startIdx = this.summaries.length * this.summarizeEvery;
    const endIdx = this.fullHistory.length;
    
    return this.fullHistory
      .slice(startIdx, endIdx)
      .map(h => `${h.speaker}: ${h.content}`)
      .join('\n\n');
  }

  /**
   * 添加摘要
   */
  addSummary(summary, upToRound) {
    this.summaries.push({
      round: upToRound,
      content: summary,
      timestamp: Date.now()
    });
  }

  /**
   * 获取某位参与者的上下文
   * 策略：摘要 + 该参与者的完整历史 + 其他人的最近发言
   */
  getContextForParticipant(participantName) {
    const parts = [];
    
    // 1. 添加摘要（如果有）
    if (this.summaries.length > 0) {
      parts.push('## 此前讨论的摘要');
      for (const summary of this.summaries) {
        parts.push(`【第1-${summary.round}轮】${summary.content}`);
      }
      parts.push('');
    }
    
    // 2. 添加该参与者的完整上下文
    const participantHistory = this.participantContexts[participantName] || [];
    if (participantHistory.length > 0) {
      parts.push('## 你此前的发言');
      for (const h of participantHistory.slice(-5)) {
        parts.push(`第${h.round}轮: ${h.content.slice(0, 200)}...`);
      }
      parts.push('');
    }
    
    // 3. 添加其他人的最近发言
    const othersRecent = this.recentHistory.filter(h => h.speaker !== participantName);
    if (othersRecent.length > 0) {
      parts.push('## 对方的最近发言');
      for (const h of othersRecent) {
        parts.push(`${h.speaker} (第${h.round}轮): ${h.content.slice(0, 200)}...`);
      }
    }
    
    return parts.join('\n');
  }

  /**
   * 获取标准上下文（所有参与者通用）
   */
  getStandardContext() {
    const parts = [];
    
    // 1. 摘要
    if (this.summaries.length > 0) {
      parts.push('## 讨论摘要');
      for (const summary of this.summaries) {
        parts.push(summary.content);
      }
      parts.push('');
    }
    
    // 2. 最近对话
    if (this.recentHistory.length > 0) {
      parts.push('## 最近对话');
      for (const h of this.recentHistory) {
        parts.push(`${h.speaker}: ${h.content.slice(0, 150)}...`);
      }
    }
    
    return parts.join('\n');
  }

  /**
   * 估算Token节省
   */
  getTokenEstimate() {
    const fullLength = this.fullHistory.length;
    const windowSize = this.recentHistory.length;
    const summaryCount = this.summaries.length;
    
    // 假设平均每轮1000 tokens，摘要每条约200 tokens
    const fullTokens = fullLength * 1000;
    const currentTokens = (windowSize * 1000) + (summaryCount * 200);
    const savings = fullTokens - currentTokens;
    
    return {
      fullRounds: fullLength,
      windowSize: windowSize,
      summaryCount: summaryCount,
      estimatedSavings: savings > 0 ? `${Math.round(savings / 1000)}K tokens` : '0',
      savingsPercent: fullTokens > 0 ? Math.round((savings / fullTokens) * 100) : 0
    };
  }

  /**
   * 重置
   */
  reset() {
    this.fullHistory = [];
    this.recentHistory = [];
    this.summaries = [];
    this.participantContexts = {};
  }
}

module.exports = ContextManager;
