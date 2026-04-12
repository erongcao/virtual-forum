/**
 * 共享配置模块
 * Shared Configuration Module for Virtual Forum
 * 
 * 解决代码重复问题，提供统一的配置和工具函数
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// 讨论模式定义
const DISCUSSION_MODES = {
  adversarial: {
    name: '对抗性辩论',
    instruction: '这是对抗性辩论，你必须坚定维护自己的立场，积极反驳对方观点。',
    description: '争辩 → 交锋 → 胜负/共识'
  },
  exploratory: {
    name: '探索性讨论',
    instruction: '这是探索性讨论，请从你的视角深入分析问题，展现多角度思维。',
    description: '多角度剖析 → 发展 → 结论'
  },
  decision: {
    name: '决策型讨论',
    instruction: '这是决策型讨论，请分析各方案的利弊，给出建设性建议。',
    description: '多专家投票 → 加权评分 → 行动'
  }
};

// 主持人风格定义
const MODERATOR_STYLES = {
  balanced: {
    name: '理性主持人',
    description: '客观中立，善于引导对话深入',
    instruction: '你是理性主持人，客观中立，善于引导对话深入。'
  },
  provocative: {
    name: '犀利主持人',
    description: '追问到底，挑战每个观点的漏洞',
    instruction: '你是犀利主持人，追问到底，挑战每个观点的漏洞。'
  },
  synthesizing: {
    name: '整合主持人',
    description: '善于归纳各方观点，推动形成共识',
    instruction: '你是整合主持人，善于归纳各方观点，推动形成共识。'
  }
};

// 判定方式定义
const VERDICT_TYPES = {
  points: '点数制',
  vote: '投票制',
  concession: '让步制',
  none: '无胜负'
};

// 默认配置
const DEFAULTS = {
  mode: 'adversarial',
  rounds: 10,
  moderatorName: '巴菲特',
  moderatorSkill: 'warren-buffett',
  moderatorStyle: 'provocative',
  verdictType: 'points',
  outputFormat: 'dialogue',
  minResponseLength: 200,
  maxResponseLength: 400,
  apiRetryAttempts: 3,
  contextWindowSize: 5, // 滑动窗口大小
  summarizeEveryNRounds: 5, // 每N轮生成摘要
  gameTheory: {
    totalValue: 100,
    defaultDiscountFactor: 0.9,
    defaultOutsideOption: 0,
    defaultReputationType: 'neutral'
  }
};

/**
 * 获取默认Skills目录
 * 修复硬编码路径问题
 */
function getDefaultSkillsDir() {
  // 优先级：环境变量 > HOME目录 > 当前用户目录
  const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
  
  if (!homeDir) {
    throw new Error('无法确定用户主目录，请设置 HOME 环境变量或手动指定 skillsDir');
  }
  
  return path.join(homeDir, '.openclaw', 'skills');
}

/**
 * 加载Skill内容（共享函数）
 * @param {string} skillsDir - Skills目录
 * @param {string} skillName - Skill名称
 * @returns {string|null} - Skill内容或null
 */
function loadSkill(skillsDir, skillName) {
  if (!skillsDir || !skillName) {
    console.warn('⚠️ 缺少 skillsDir 或 skillName');
    return null;
  }
  
  const skillPath = path.join(skillsDir, `${skillName}-perspective`, 'SKILL.md');
  
  try {
    if (fs.existsSync(skillPath)) {
      return fs.readFileSync(skillPath, 'utf8');
    }
    
    // 尝试其他可能的命名格式
    const alternativePath = path.join(skillsDir, `${skillName}`, 'SKILL.md');
    if (fs.existsSync(alternativePath)) {
      return fs.readFileSync(alternativePath, 'utf8');
    }
    
    console.warn(`⚠️ Skill 文件不存在: ${skillPath}`);
    return null;
  } catch (e) {
    console.error(`❌ 加载 Skill ${skillName} 失败:`, e.message);
    return null;
  }
}

/**
 * 验证配置
 * @param {object} config - 配置对象
 * @throws {Error} - 配置无效时抛出错误
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('配置必须是一个对象');
  }
  
  // 验证必需字段
  if (!config.topic || typeof config.topic !== 'string' || config.topic.trim() === '') {
    throw new Error('话题 (topic) 不能为空');
  }
  
  // 验证参与者
  if (!Array.isArray(config.participants) || config.participants.length === 0) {
    throw new Error('参与者 (participants) 必须是一个非空数组');
  }
  
  // 验证轮次
  if (config.rounds !== undefined) {
    const rounds = parseInt(config.rounds);
    if (isNaN(rounds) || rounds < 1 || rounds > 100) {
      throw new Error('轮次 (rounds) 必须是 1-100 之间的整数');
    }
  }
  
  // 验证模式
  if (config.mode && !DISCUSSION_MODES[config.mode]) {
    throw new Error(`无效的模式: ${config.mode}。可选: ${Object.keys(DISCUSSION_MODES).join(', ')}`);
  }
  
  // 验证主持人风格
  if (config.moderatorStyle && !MODERATOR_STYLES[config.moderatorStyle]) {
    throw new Error(`无效的主持人风格: ${config.moderatorStyle}。可选: ${Object.keys(MODERATOR_STYLES).join(', ')}`);
  }
  
  return true;
}

/**
 * 指数退避延迟
 * @param {number} attempt - 尝试次数（从0开始）
 * @returns {Promise<void>}
 */
async function exponentialBackoff(attempt) {
  const baseDelay = 1000; // 1秒基础延迟
  const maxDelay = 30000; // 最大30秒
  const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  console.log(`⏳ 等待 ${delay}ms 后重试...`);
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 速率限制器
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  async acquire() {
    const now = Date.now();
    
    // 清理过期请求
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // 检查是否超过限制
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`⏳ 速率限制: 等待 ${Math.ceil(waitTime / 1000)} 秒`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire(); // 递归重试
    }
    
    this.requests.push(now);
    return true;
  }
}

module.exports = {
  DISCUSSION_MODES,
  MODERATOR_STYLES,
  VERDICT_TYPES,
  DEFAULTS,
  getDefaultSkillsDir,
  loadSkill,
  validateConfig,
  exponentialBackoff,
  RateLimiter
};
