/**
 * 博弈论增强的子代理竞技场
 * Game-Theory Enhanced Subagent Arena (v3.5)
 * 
 * 集成v2.0子代理模式与v3.5博弈论引擎
 * 让AI辩论者基于博弈论最优策略进行辩论
 */

const SubagentArena = require('../subagent-arena');
const { AdvancedGameTheoryEngine } = require('./advanced');

class GameTheorySubagentArena extends SubagentArena {
  constructor(skillsDir = null) {
    super(skillsDir);
    this.gtEngine = new AdvancedGameTheoryEngine();
    this.gameTheoryContext = null;
    this.strategyAdvice = {};
    this.equilibriumTracking = [];
  }

  /**
   * 初始化博弈论增强竞技场
   */
  async initArenaWithGameTheory(config) {
    // 1. 初始化基础竞技场
    await this.initArena(config);
    
    // 2. 运行博弈论分析
    console.log('🎲 运行博弈论分析...');
    
    this.gameTheoryContext = await this.gtEngine.comprehensiveAnalysis(
      config.topic,
      config.participants.map(p => p.name),
      {
        discountFactors: config.discountFactors || this.inferDiscountFactors(config.participants),
        outsideOptions: config.outsideOptions || {},
        totalValue: config.totalValue || 100,
        types: config.types,
        priorBeliefs: config.priorBeliefs,
        reputationTypes: config.reputationTypes,
        horizon: config.rounds,
        auction: config.mode === 'decision',
        reputationAnalysis: config.rounds > 5
      }
    );
    
    console.log('✓ 博弈论分析完成');
    console.log(`  检测到的博弈类型: ${this.gameTheoryContext.toolsUsed.join(', ')}`);
    
    // 3. 生成策略建议（异步）
    await this.generateStrategyAdviceForAll(config.participants);
    
    return this.arena;
  }

  /**
   * 推断折现因子
   */
  inferDiscountFactors(participants) {
    const factors = {};
    for (const p of participants) {
      let delta = 0.9;
      if (p.name.includes('巴菲特')) delta = 0.95;
      else if (p.name.includes('马斯克')) delta = 0.85;
      else if (p.name.includes('特朗普')) delta = 0.8;
      factors[p.name] = delta;
    }
    return factors;
  }

  /**
   * 生成所有参与者的策略建议
   */
  async generateStrategyAdviceForAll(participants) {
    for (const p of participants) {
      this.strategyAdvice[p.name] = await this.generateStrategyAdvice(p);
    }
  }

  /**
   * 为单个参与者生成策略建议
   */
  async generateStrategyAdvice(participant) {
    const advice = {
      participant: participant.name,
      recommendations: []
    };
    
    const gt = this.gameTheoryContext;
    
    // 讨价还价建议
    if (gt.results.bargaining?.rubinstein) {
      const rubinstein = gt.results.bargaining.rubinstein;
      const isProposer = rubinstein.proposer.name === participant.name;
      const share = isProposer ? rubinstein.proposer.share : rubinstein.responder.share;
      
      advice.recommendations.push({
        type: 'bargaining',
        priority: 'high',
        content: `你的均衡份额: ${(share * 100).toFixed(1)}%`,
        action: share > 0.5 ? '开局强势' : '寻求合作妥协',
        constraint: rubinstein.constrained && rubinstein.constrainedBy.includes(participant.name)
          ? '注意：外部选项约束起作用'
          : null
      });
    }
    
    // 重复博弈建议
    if (gt.results.repeated?.triggerStrategies?.grimTrigger?.cooperationCondition?.condition) {
      const condition = gt.results.repeated.triggerStrategies.grimTrigger.cooperationCondition;
      advice.recommendations.push({
        type: 'repeated',
        priority: 'high',
        content: '采用冷酷触发策略可以维持合作',
        detail: `阈值 δ ≥ ${condition.threshold}, 当前 δ = ${condition.currentDelta.toFixed(2)}`,
        warning: '一旦背叛将永久失去合作机会'
      });
    }
    
    // 信号博弈建议
    if (gt.results.signaling?.equilibria?.separating > 0) {
      advice.recommendations.push({
        type: 'signaling',
        priority: 'medium',
        content: '存在分离均衡，可以通过信号传递真实类型',
        action: '选择高成本信号以证明高类型'
      });
    }
    
    return advice;
  }

  /**
   * 构建博弈论增强的辩论者提示
   */
  buildGameTheoryEnhancedPrompt(participant, roundNumber) {
    const basePrompt = this.buildDebaterSystemPrompt(participant);
    const advice = this.strategyAdvice[participant.name];
    
    const gameTheorySection = `

🎲 博弈论策略指导（第${roundNumber}轮）:

${advice.recommendations.map(r => `
【${r.type.toUpperCase()}】
建议: ${r.content}
行动: ${r.action || r.warning || '根据情况灵活应对'}
`).join('\n')}

当前均衡状态:
${this.describeCurrentEquilibrium()}

请记住:
1. 你的目标是最大化长期收益，不仅是当前轮次
2. 考虑对手可能的策略和反应
3. 维护你的声誉，它会影响下轮谈判力
`;
    
    return basePrompt + gameTheorySection;
  }

  /**
   * 描述当前均衡状态
   */
  describeCurrentEquilibrium() {
    const gt = this.gameTheoryContext;
    let description = '';
    
    if (gt.results.bargaining?.rubinstein) {
      const r = gt.results.bargaining.rubinstein;
      description += `- Rubinstein均衡: ${r.proposer.name}应得${(r.proposer.share * 100).toFixed(0)}%, ${r.responder.name}应得${(r.responder.share * 100).toFixed(0)}%\n`;
    }
    
    if (gt.results.repeated?.folkTheorem?.cooperationPossibility) {
      description += `- 合作可持续（满足民间定理条件）\n`;
    }
    
    return description || '- 均衡分析进行中';
  }

  /**
   * 执行一轮辩论（博弈论增强版）
   */
  async executeRoundWithGameTheory(roundNumber, debateContext) {
    // 1. 更新博弈论上下文
    this.updateGameTheoryContext(roundNumber, debateContext);
    
    // 2. 获取标准轮次配置
    const roundConfig = this.getRoundConfig(roundNumber);
    
    // 3. 为每个消息添加博弈论指导
    for (const msg of roundConfig.messages) {
      const participant = this.arena.participants.find(p => p.name === msg.to);
      if (participant) {
        msg.prompt = this.buildGameTheoryEnhancedPrompt(participant, roundNumber);
      }
    }
    
    // 4. 记录均衡状态
    this.equilibriumTracking.push({
      round: roundNumber,
      equilibrium: this.getCurrentEquilibriumState(),
      advice: this.strategyAdvice
    });
    
    return roundConfig;
  }

  /**
   * 更新博弈论上下文
   */
  updateGameTheoryContext(roundNumber, context) {
    // 根据实际辩论进展更新信念和策略建议
    if (this.gameTheoryContext.results.signaling && context.observedActions) {
      // 更新信念
      for (const [player, action] of Object.entries(context.observedActions)) {
        // 贝叶斯更新...
      }
    }
  }

  /**
   * 获取当前均衡状态
   */
  getCurrentEquilibriumState() {
    return {
      timestamp: Date.now(),
      recommendations: this.gameTheoryContext.recommendations
    };
  }

  /**
   * 生成博弈论增强的报告
   */
  generateGameTheoryReport() {
    const baseReport = this.generateReport('report');
    const gtReport = this.gtEngine.generateDebateReport(this.gameTheoryContext);
    
    return `
${baseReport}

🎲 博弈论深度分析
==================

${gtReport.summary.keyFindings.map(f => `• ${f}`).join('\n')}

策略建议回顾:
${gtReport.strategicGuidance.shortTerm.map(s => `短期: ${s.content}`).join('\n')}
${gtReport.strategicGuidance.mediumTerm.map(s => `中期: ${s.content}`).join('\n')}
${gtReport.strategicGuidance.longTerm.map(s => `长期: ${s.content}`).join('\n')}

均衡演化:
${this.equilibriumTracking.map(e => `第${e.round}轮: ${e.equilibrium.recommendations?.length || 0}条建议`).join('\n')}
`;
  }
}

module.exports = GameTheorySubagentArena;
