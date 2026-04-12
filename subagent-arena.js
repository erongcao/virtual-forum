/**
 * 虚拟论坛 - 子代理交锋引擎
 * Subagent Arena v3.5 (重构版)
 * 
 * 修复：
 * - [P1] 移除硬编码路径 /Users/caoyirong
 * - [P1] 增加输入验证和错误处理
 * - [P1] 集成 ContextManager 解决上下文膨胀
 * - [P2] 使用 shared-config 消除重复代码
 * 改进：
 * - 支持指数退避重试
 * - 支持流式进度回调
 * - 支持中途暂停/恢复
 */

const path = require('path');
const fs = require('fs');
const {
  getDefaultSkillsDir,
  DISCUSSION_MODES,
  MODERATOR_STYLES,
  DEFAULTS,
  loadSkill,
  validateConfig,
  exponentialBackoff
} = require('./shared-config.js');
const ContextManager = require('./context-manager.js');

class SubagentArena {
  constructor(skillsDir = null) {
    this.skillsDir = skillsDir || getDefaultSkillsDir();
    this.arena = null;
    this.debaterSessions = {};
    this.contextManager = null;
    this.isPaused = false;
    this.onRoundComplete = null; // 进度回调钩子
  }

  /**
   * 加载Skill内容（使用共享函数）
   */
  async loadSkill(skillName) {
    return loadSkill(this.skillsDir, skillName);
  }

  /**
   * 初始化竞技场
   */
  async initArena(config) {
    // [P1 FIX] 输入验证
    validateConfig(config);

    const {
      topic,
      mode = DEFAULTS.mode,
      rounds = DEFAULTS.rounds,
      participants = [],
      moderatorName = DEFAULTS.moderatorName,
      moderatorSkill = DEFAULTS.moderatorSkill,
      moderatorStyle = DEFAULTS.moderatorStyle,
      contextWindowSize,
      summarizeEveryNRounds
    } = config;

    // 初始化上下文管理器
    this.contextManager = new ContextManager({
      windowSize: contextWindowSize || DEFAULTS.contextWindowSize,
      summarizeEvery: summarizeEveryNRounds || DEFAULTS.summarizeEveryNRounds
    });

    this.arena = {
      id: Date.now(),
      topic,
      mode,
      rounds,
      participants: [...participants],
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
    let loadFailures = 0;
    for (const p of participants) {
      p.skillContent = await this.loadSkill(p.skillName);
      if (p.skillContent) {
        console.log(` ✓ ${p.name}`);
      } else {
        console.warn(` ✗ ${p.name} (Skill 加载失败，将使用空背景)`);
        loadFailures++;
      }
    }

    if (loadFailures === participants.length) {
      console.warn('⚠️ 所有参与者的 Skill 都加载失败，辩论质量可能很低');
    }

    if (moderatorSkill) {
      this.arena.moderatorSkillContent = await this.loadSkill(moderatorSkill);
      if (this.arena.moderatorSkillContent) {
        console.log(` ✓ 主持人 ${moderatorName}`);
      } else {
        console.warn(` ✗ 主持人 ${moderatorName} (Skill 加载失败)`);
      }
    }

    this.arena.status = 'ready';
    return this.arena;
  }

  /**
   * 构建辩论者系统提示（使用共享模式定义）
   */
  buildDebaterSystemPrompt(participant) {
    const modeConfig = DISCUSSION_MODES[this.arena.mode] || DISCUSSION_MODES.adversarial;

    return `你是${participant.name}。

背景资料：
${participant.skillContent || '（无可用背景）'}

讨论话题：${this.arena.topic}

讨论模式：${modeConfig.instruction}

你的任务：
1. 用第一人称表达你的观点
2. 体现你的性格、思维方式和表达风格
3. 可以向对方提问或质疑
4. 必要时引用具体数据或案例
5. 每次发言控制在${DEFAULTS.minResponseLength}-${DEFAULTS.maxResponseLength}字

重要：
- 保持角色一致性
- 不要重复已经说过的观点
- 针对对方最新发言做出回应`;
  }

  /**
   * 运行辩论（带重试和进度回调）
   */
  async runDebate() {
    if (!this.arena || this.arena.status !== 'ready') {
      throw new Error('竞技场未初始化，请先调用 initArena()');
    }

    this.arena.status = 'running';
    console.log(`\n🎭 辩论开始: ${this.arena.topic}`);
    console.log(` 模式: ${DISCUSSION_MODES[this.arena.mode]?.name || this.arena.mode}`);
    console.log(` 轮次: ${this.arena.rounds}\n`);

    for (let round = 1; round <= this.arena.rounds; round++) {
      // 检查暂停
      while (this.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`--- 第 ${round}/${this.arena.rounds} 轮 ---`);

      for (const participant of this.arena.participants) {
        // 获取压缩后的上下文（而非完整历史）
        const context = this.contextManager.getContextForParticipant(participant.name);

        let response = null;
        // [P1 FIX] 指数退避重试
        for (let attempt = 0; attempt < DEFAULTS.apiRetryAttempts; attempt++) {
          try {
            response = await this.getDebaterResponse(participant, context);
            break;
          } catch (e) {
            console.warn(` ⚠️ ${participant.name} 第 ${attempt + 1} 次调用失败: ${e.message}`);
            if (attempt < DEFAULTS.apiRetryAttempts - 1) {
              await exponentialBackoff(attempt);
            } else {
              console.error(` ❌ ${participant.name} 调用彻底失败，跳过本轮`);
              response = `（${participant.name} 本轮未能发言）`;
            }
          }
        }

        // 记录到上下文管理器
        this.contextManager.addRound({
          round,
          speaker: participant.name,
          content: response,
          type: 'statement'
        });

        this.arena.debateHistory.push({
          round,
          speaker: participant.name,
          content: response,
          timestamp: Date.now()
        });
      }

      // 检查是否需要生成摘要（节省 Token）
      if (this.contextManager.needsSummarization()) {
        console.log(` 📝 生成历史摘要（节省 Token）...`);
        const textToSummarize = this.contextManager.getTextForSummarization();
        try {
          const summary = await this.generateSummary(textToSummarize);
          this.contextManager.addSummary(summary, round);
        } catch (e) {
          console.warn(` ⚠️ 摘要生成失败: ${e.message}`);
        }
      }

      // 进度回调
      if (typeof this.onRoundComplete === 'function') {
        this.onRoundComplete(round, this.arena.debateHistory.slice(-this.arena.participants.length));
      }

      // Token 使用估算
      const tokenEst = this.contextManager.getTokenEstimate();
      console.log(` 💰 Token 节省: ${tokenEst.savings}`);
    }

    this.arena.status = 'completed';
    console.log(`\n✅ 辩论结束`);
    return this.arena;
  }

  /**
   * 获取辩论者回复（子代理调用 - 需要对接实际 API）
   * @abstract 子类或调用者需要实现具体的 API 调用
   */
  async getDebaterResponse(participant, context) {
    // 这里是子代理调用的占位符
    // 实际使用时需要对接 OpenClaw 的 sessions_spawn / sessions_send
    throw new Error('getDebaterResponse 需要在子类中实现或通过依赖注入提供');
  }

  /**
   * 生成摘要（需要对接实际 API）
   * @abstract
   */
  async generateSummary(text) {
    throw new Error('generateSummary 需要在子类中实现或通过依赖注入提供');
  }

  /**
   * 暂停辩论
   */
  pause() {
    this.isPaused = true;
    console.log('⏸️ 辩论已暂停');
  }

  /**
   * 恢复辩论
   */
  resume() {
    this.isPaused = false;
    console.log('▶️ 辩论已恢复');
  }

  /**
   * 格式化输出
   */
  formatOutput(formatType = 'dialogue') {
    if (!this.arena) return '';

    switch (formatType) {
      case 'dialogue':
        return this.arena.debateHistory
          .map(h => `【${h.speaker}】(第${h.round}轮)\n${h.content}`)
          .join('\n\n---\n\n');
      case 'json':
        return JSON.stringify(this.arena, null, 2);
      default:
        return this.arena.debateHistory
          .map(h => `${h.speaker}: ${h.content}`)
          .join('\n\n');
    }
  }
}

module.exports = SubagentArena;
