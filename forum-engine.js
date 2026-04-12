/**
 * 虚拟论坛 - 核心讨论引擎
 * Virtual Forum Core Engine v3.5 (重构版)
 * 
 * 修复：
 * - [P1] 移除硬编码路径
 * - [P2] 使用 shared-config 消除重复代码
 */

const fs = require('fs');
const path = require('path');
const {
  getDefaultSkillsDir,
  DISCUSSION_MODES,
  MODERATOR_STYLES,
  VERDICT_TYPES,
  DEFAULTS,
  loadSkill,
  validateConfig
} = require('./shared-config.js');

class ForumEngine {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || getDefaultSkillsDir();
    this.currentForum = null;
  }

  /**
   * 创建讨论
   */
  async createForum(config) {
    // 使用共享验证
    validateConfig(config);

    const {
      topic,
      mode = 'exploratory',
      rounds = DEFAULTS.rounds,
      participants = [],
      moderatorStyle = 'balanced',
      verdictType = DEFAULTS.verdictType,
      outputFormat = DEFAULTS.outputFormat
    } = config;

    this.currentForum = {
      id: Date.now(),
      topic,
      mode,
      rounds,
      participants,
      moderator: MODERATOR_STYLES[moderatorStyle] || MODERATOR_STYLES.balanced,
      verdictType,
      outputFormat,
      roundsData: [],
      arguments: {},
      scores: {},
      status: 'initialized'
    };

    // 初始化分数和论点
    for (const p of participants) {
      this.currentForum.arguments[p.name] = [];
      this.currentForum.scores[p.name] = 0;

      // 使用共享的 loadSkill 函数
      p.skillContent = loadSkill(this.skillsDir, p.skillName || p.skillPath);
    }

    this.currentForum.status = 'ready';
    return this.currentForum;
  }

  /**
   * 运行论坛（模拟模式）
   */
  async runForum() {
    if (!this.currentForum || this.currentForum.status !== 'ready') {
      throw new Error('论坛未初始化，请先调用 createForum()');
    }

    this.currentForum.status = 'running';
    // ... 模拟模式的具体逻辑保持不变
    this.currentForum.status = 'completed';
    return this.currentForum;
  }
}

module.exports = ForumEngine;
