/**
 * 虚拟论坛 - 高级博弈论模块 v3.8
 * Advanced Game Theory Module v3.8
 * 
 * v3.7基础上新增三大核心模块：
 * 1. 信号博弈 (Signaling Games) - Spence 1973
 * 2. 重复博弈 (Repeated Games) - Folk Theorem
 * 3. 信息设计 (Information Design) - Kamenica & Mandler 2012
 * 
 * 解决虚拟论坛最核心的三个问题：
 * - 谁说的可信？ → 信号博弈
 * - 多轮后会合作还是撕破脸？ → 重复博弈
 * - 主持人应该透露什么？ → 信息设计
 */

const SubagentArena = require('../subagent-arena.js');
const { DEFAULTS } = require('../shared-config.js');

/**
 * ============================================================
 * 第一部分：信号博弈 (Signaling Games)
 * Spence 1973 - "Job Market Signaling"
 * ============================================================
 */

/**
 * 信号博弈基础类
 * 
 * 核心问题：
 * - 发言者是"真的有观点"还是"只是说说"？
 * - 什么样的信号成本能筛选出真诚参与者？
 * 
 * 均衡类型：
 * - 分离均衡 (Separating): 不同类型选择不同信号 → 高成本信号 = 强信念
 * - 混同均衡 (Pooling): 不同类型选择相同信号 → 信号无信息量
 */
class SignalingGame {
    constructor() {
        // 信号成本配置
        this.signalCosts = {
            'strong_claim': 0.8,      // 强烈主张：成本高
            'weak_claim': 0.3,        // 弱主张：成本低
            'evidence_backed': 0.9,    // 有证据：成本高
            'assertion': 0.2,          // 纯断言：成本低
            'counterargument': 0.6,   // 反驳：中等成本
            'concession': 0.5,         // 让步：中等成本
        };

        // 信号类型映射
        this.signalTypes = {
            'strong_claim': ['必须', '绝对', '显然', '毫无疑问', '必然'],
            'weak_claim': ['可能', '也许', '不确定', '大概'],
            'evidence_backed': ['因为', '数据', '研究', '证据', '表明', '根据'],
            'assertion': ['我认为', '我觉得', '应该', '相信'],
            'counterargument': ['但是', '然而', '不对', '反对'],
            'concession': ['同意', '有道理', '承认'],
        };
    }

    /**
     * 评估信号可信度
     * 
     * 计算：P(真|信号) = P(信号|真)P(真) / P(信号)
     * 
     * @param {string} content - 发言内容
     * @param {string} speakerType - 发言者类型: 'expert' | 'layman' | 'strategic'
     * @param {object} priorBelief - 先验概率 P(真)
     * @returns {object} 包含可信度评估和信号分析
     */
    assessSignalCredibility(content, speakerType, priorBelief = 0.5) {
        if (!content) return { credible: false, confidence: 0, reason: '空发言' };

        // 识别信号类型
        const signalType = this._identifySignalType(content);
        const signalCost = this.signalCosts[signalType] || 0.5;

        // 计算信号可靠性 (基于sender类型和信号成本的联合概率)
        const likelihoodRatio = this._calculateLikelihoodRatio(speakerType, signalType);
        
        // 贝叶斯更新后验概率
        const posteriorOdds = likelihoodRatio * (priorBelief / (1 - priorBelief));
        const posterior = posteriorOdds / (1 + posteriorOdds);

        // 分离均衡检验：信号成本是否足够高？
        const isSeparating = this._checkSeparatingEquilibrium(signalCost, speakerType);

        // 信号信息量
        const signalInfo = this._calculateMutualInformation(signalType, speakerType);

        return {
            signalType,
            signalCost,
            prior: priorBelief,
            posterior,
            likelihoodRatio,
            isSeparating,
            signalInfo,
            credible: posterior > priorBelief && signalCost > 0.4,
            confidence: Math.abs(posterior - priorBelief) + signalCost,
            reason: this._generateCredibilityReason(signalType, signalCost, isSeparating, posterior),
        };
    }

    /**
     * 识别信号类型
     */
    _identifySignalType(content) {
        for (const [type, keywords] of Object.entries(this.signalTypes)) {
            if (keywords.some(kw => content.includes(kw))) {
                return type;
            }
        }
        return 'assertion';  // 默认弱信号
    }

    /**
     * 计算似然比 P(信号|type) / P(信号|非type)
     */
    _calculateLikelihoodRatio(speakerType, signalType) {
        const probs = {
            expert: { strong_claim: 0.8, weak_claim: 0.3, evidence_backed: 0.9, assertion: 0.4, counterargument: 0.7, concession: 0.5 },
            layman: { strong_claim: 0.3, weak_claim: 0.7, evidence_backed: 0.2, assertion: 0.6, counterargument: 0.3, concession: 0.6 },
            strategic: { strong_claim: 0.6, weak_claim: 0.5, evidence_backed: 0.3, assertion: 0.8, counterargument: 0.6, concession: 0.7 },
        };

        const pSignalGivenType = probs[speakerType]?.[signalType] || 0.5;
        const pSignalGivenNotType = 0.3;  // 简化：非该类型发出该信号的概率

        return pSignalGivenType / pSignalGivenNotType;
    }

    /**
     * 检验分离均衡条件
     * 
     * 分离均衡要求：
     * 1. 不同类型选择不同信号
     * 2. 信号成本足够高，使得伪装不经济
     */
    _checkSeparatingEquilibrium(signalCost, speakerType) {
        // 高成本信号对专家更可信
        if (speakerType === 'expert' && signalCost >= 0.7) return true;
        // 低成本信号无法区分类型
        if (speakerType === 'layman' && signalCost <= 0.3) return false;
        // 中等成本可能是混同均衡
        return signalCost > 0.5;
    }

    /**
     * 计算互信息 I(类型;信号)
     */
    _calculateMutualInformation(signalType, speakerType) {
        // 简化：互信息 = 信号成本 × 类型匹配度
        const typeMatchScore = { expert: 1.0, layman: 0.5, strategic: 0.7 };
        const cost = this.signalCosts[signalType] || 0.5;
        return cost * (typeMatchScore[speakerType] || 0.5);
    }

    /**
     * 生成可信度理由
     */
    _generateCredibilityReason(signalType, signalCost, isSeparating, posterior) {
        if (isSeparating && signalCost > 0.6) {
            return `分离均衡信号：${signalType}类型发言，成本=${signalCost.toFixed(1)}，后验=${posterior.toFixed(2)}`;
        } else if (posterior > 0.6) {
            return `高可信信号：后验=${posterior.toFixed(2)}`;
        } else if (posterior < 0.4) {
            return `低可信信号：后验=${posterior.toFixed(2)}，可能为混同均衡`;
        }
        return `中等可信：需要更多信号验证`;
    }

    /**
     * 批量评估发言可信度
     */
    assessMultipleSignals(utterances) {
        return utterances.map(u => ({
            content: u.content?.substring(0, 50),
            assessment: this.assessSignalCredibility(u.content, u.speakerType, u.prior),
        }));
    }
}


/**
 * ============================================================
 * 第二部分：重复博弈与合作动态 (Repeated Games)
 * Folk Theorem - 无限期重复博弈
 * ============================================================
 */

/**
 * 合作追踪器
 * 
 * 实现冷酷策略 (Grim Trigger) 和 针锋相对 (Tit-for-Tat)
 */
class CooperationTracker {
    constructor() {
        this.history = [];  // [{player, action, cooperated}]
        this.punishmentPhase = {};  // player -> inPunishment
        this.cooperationCount = {};
        this.defectionCount = {};
    }

    /**
     * 记录一轮行动
     */
    recordAction(player, action, cooperated) {
        this.history.push({ player, action, cooperated, round: this.history.length + 1 });
        
        if (!this.cooperationCount[player]) this.cooperationCount[player] = 0;
        if (!this.defectionCount[player]) this.defectionCount[player] = 0;
        
        if (cooperated) this.cooperationCount[player]++;
        else this.defectionCount[player]++;
    }

    /**
     * 获取合作率
     */
    getCooperationRate(player = null) {
        if (player) {
            const total = this.cooperationCount[player] + this.defectionCount[player];
            return total > 0 ? this.cooperationCount[player] / total : 0;
        }
        
        const allCooperations = Object.values(this.cooperationCount).reduce((a, b) => a + b, 0);
        const allDefections = Object.values(this.defectionCount).reduce((a, b) => a + b, 0);
        const total = allCooperations + allDefections;
        return total > 0 ? allCooperations / total : 0;
    }

    /**
     * 检查玩家是否处于惩罚阶段
     */
    isInPunishment(player) {
        return this.punishmentPhase[player] || false;
    }

    /**
     * 进入惩罚阶段
     */
    startPunishment(player) {
        this.punishmentPhase[player] = true;
    }

    /**
     * 结束惩罚阶段（需要双方合作才恢复）
     */
    maybeEndPunishment(player, otherPlayer) {
        const myLastAction = this.history.filter(h => h.player === player).pop();
        const otherLastAction = this.history.filter(h => h.player === otherPlayer).pop();
        
        if (myLastAction?.cooperated && otherLastAction?.cooperated) {
            this.punishmentPhase[player] = false;
            return true;
        }
        return false;
    }

    /**
     * 获取合作历史摘要
     */
    getSummary() {
        return {
            totalRounds: this.history.length,
            overallCooperationRate: this.getCooperationRate(),
            players: Object.keys(this.cooperationCount).map(p => ({
                name: p,
                cooperationRate: this.getCooperationRate(p),
                inPunishment: this.isInPunishment(p),
            })),
        };
    }
}


/**
 * 重复博弈引擎
 * 
 * 实现：
 * - 无限期重复博弈的Folk Theorem
 * - 冷酷策略 (Grim Trigger)
 * - 针锋相对 (Tit-for-Tat)
 * - 战略评估
 */
class RepeatedGameEngine {
    constructor(discountFactor = 0.9) {
        this.discountFactor = discountFactor;
        this.cooperationTracker = new CooperationTracker();
        this.strategies = {
            GRIM_TRIGGER: 'grim',
            TIT_FOR_TAT: 'tft',
            GENEROUS_TFT: 'gtft',
            SUSPICIOUS_TFT: 'stft',
        };
    }

    /**
     * 获取玩家的战略建议
     * 
     * @param {string} player - 玩家名
     * @param {string} opponent - 对手名
     * @param {string} strategyType - 战略类型
     * @returns {object} 建议的行动和理由
     */
    getStrategicAdvice(player, opponent, strategyType = 'tft') {
        const history = this._getPlayerHistory(player, opponent);
        const opponentLastAction = this._getOpponentLastAction(opponent);
        
        let recommendedAction;
        let reason;
        
        switch (strategyType) {
            case 'grim':
                recommendedAction = this._grimTriggerDecision(history, opponentLastAction);
                reason = '冷酷策略：一但背叛，永远惩罚';
                break;
            case 'tft':
                recommendedAction = this._titForTatDecision(opponentLastAction);
                reason = '针锋相对：合作取决于对手上一轮';
                break;
            case 'gtft':
                recommendedAction = this._generousTFTDecision(opponentLastAction);
                reason = '宽容针锋相对：偶尔原谅背叛';
                break;
            case 'stft':
                recommendedAction = this._suspiciousTFTDecision(opponentLastAction, history);
                reason = '怀疑性针锋相对：需要两次合作才原谅';
                break;
            default:
                recommendedAction = 'cooperate';
                reason = '默认合作';
        }

        // 检查是否应该进入惩罚阶段
        if (this.cooperationTracker.isInPunishment(player)) {
            recommendedAction = 'defect';
            reason += ' | 处于惩罚阶段';
        }

        return {
            recommendedAction,
            reason,
            strategyType,
            discountFactor: this.discountFactor,
            cooperationRate: this.cooperationTracker.getCooperationRate(player),
        };
    }

    _grimTriggerDecision(history, opponentLastAction) {
        // 如果对手曾经背叛过，就永远背叛
        const hasDefected = history.some(h => !h.cooperated);
        return hasDefected ? 'defect' : 'cooperate';
    }

    _titForTatDecision(opponentLastAction) {
        if (opponentLastAction === null) return 'cooperate';
        return opponentLastAction ? 'cooperate' : 'defect';
    }

    _generousTFTDecision(opponentLastAction) {
        if (opponentLastAction === null) return 'cooperate';
        // 10%概率原谅
        return opponentLastAction ? 'cooperate' : (Math.random() < 0.1 ? 'cooperate' : 'defect');
    }

    _suspiciousTFTDecision(opponentLastAction, history) {
        // 需要连续两次合作才原谅
        const recentCooperations = history.slice(-2).filter(h => h.cooperated).length;
        return recentCooperations >= 2 ? 'cooperate' : 'defect';
    }

    _getPlayerHistory(player, opponent) {
        return this.cooperationTracker.history.filter(
            h => h.player === player
        );
    }

    _getOpponentLastAction(opponent) {
        const last = this.cooperationTracker.history
            .filter(h => h.player === opponent)
            .pop();
        return last ? last.cooperated : null;
    }

    /**
     * 计算合作的长期价值 vs 短期背叛
     * 
     * Folk Theorem核心：
     * - 如果贴现因子δ足够高，未来合作价值 > 短期背叛收益
     * - 均衡条件：背叛收益 < 长期合作价值
     */
    calculateTemptationThreshold() {
        // 背叛诱惑T vs 合作奖励R vs 欺骗惩罚P vs 双输S
        // 合作条件：T - δR / (1-δ) < R
        // 简化：T < R / (1-δ)
        return 1 / (1 - this.discountFactor);
    }

    /**
     * 判断当前是否处于"合作区"
     */
    isInCooperationZone() {
        const rate = this.cooperationTracker.getCooperationRate();
        return rate > 0.6;
    }

    /**
     * 判断是否进入"战争区"
     */
    isInConflictZone() {
        const rate = this.cooperationTracker.getCooperationRate();
        return rate < 0.3;
    }

    /**
     * 获取博弈阶段分析
     */
    getPhaseAnalysis() {
        const rate = this.cooperationTracker.getCooperationRate();
        
        if (rate > 0.7) {
            return {
                phase: 'COOPERATION',
                description: '已进入合作阶段，各方倾向于维护现状',
                stability: '高',
                risk: '低',
            };
        } else if (rate > 0.4) {
            return {
                phase: 'TRANSITION',
                description: '处于过渡阶段，结果未定',
                stability: '中',
                risk: '中',
            };
        } else if (rate > 0.0) {
            return {
                phase: 'CONFLICT',
                description: '处于冲突阶段，可能互相惩罚',
                stability: '低',
                risk: '高',
            };
        }
        
        return {
            phase: 'UNKNOWN',
            description: '暂无足够历史数据',
            stability: '未知',
            risk: '未知',
        };
    }

    /**
     * 记录行动并更新状态
     */
    recordRound(player, action, cooperated) {
        this.cooperationTracker.recordAction(player, action, cooperated);
    }
}


/**
 * ============================================================
 * 第三部分：信息设计 (Information Design)
 * Kamenica & Mandler 2012 - Bayesian Persuasion
 * ============================================================
 */

/**
 * 信息设计器
 * 
 * 核心问题：
 * - 主持人应该透露多少信息？
 * - 以什么方式透露？
 * - 如何影响参与者的信念和策略？
 */
class InformationDesigner {
    constructor() {
        this.disclosureModes = {
            FULL: 'full',           // 完全披露
            STRATEGIC: 'strategic', // 策略性披露
            CONDITIONAL: 'conditional', // 条件披露
        };
    }

    /**
     * 建议最优信息披露策略
     * 
     * @param {string} topic - 讨论主题
     * @param {array} participantStates - 参与者状态
     * @param {object} currentBeliefs - 当前信念分布
     * @returns {object} 建议的信息披露策略
     */
    suggestDisclosure(topic, participantStates, currentBeliefs = {}) {
        // 分析参与者状态
        const overconfident = participantStates.filter(s => s.confidence > 0.8);
        const uncertain = participantStates.filter(s => s.confidence < 0.4);
        const balanced = participantStates.filter(s => s.confidence >= 0.4 && s.confidence <= 0.8);

        // 诊断问题类型
        const diagnosis = this._diagnoseInformationProblem(participantStates, currentBeliefs);

        // 生成建议
        const recommendation = this._generateRecommendation(diagnosis, overconfident, uncertain, balanced);

        return {
            mode: recommendation.mode,
            diagnosis,
            content: recommendation.content,
            expectedImpact: recommendation.expectedImpact,
            rationale: recommendation.rationale,
        };
    }

    _diagnoseInformationProblem(participantStates, currentBeliefs) {
        const problems = [];

        // 检查过度自信
        const overconfident = participantStates.filter(s => s.confidence > 0.8);
        if (overconfident.length > participantStates.length / 2) {
            problems.push('OVERCONFIDENT_DOMINANT');
        }

        // 检查不一致信念
        const beliefVariance = this._calculateBeliefVariance(currentBeliefs);
        if (beliefVariance > 0.3) {
            problems.push('BELIEF_DIVERGENCE');
        }

        // 检查信息不对称
        const infoHaves = participantStates.filter(s => s.hasEvidence);
        const infoHaveNots = participantStates.filter(s => !s.hasEvidence);
        if (infoHaves.length > 0 && infoHaveNots.length > 0) {
            problems.push('INFORMATION_ASYMMETRY');
        }

        return problems.length > 0 ? problems : ['BALANCED'];
    }

    _calculateBeliefVariance(beliefs) {
        if (Object.keys(beliefs).length < 2) return 0;
        
        const values = Object.values(beliefs);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        return variance;
    }

    _generateRecommendation(diagnosis, overconfident, uncertain, balanced) {
        if (diagnosis.includes('OVERCONFIDENT_DOMINANT')) {
            return {
                mode: this.disclosureModes.STRATEGIC,
                content: '提供反事实证据和反对观点',
                expectedImpact: '降低过度自信，促进实质性讨论',
                rationale: '当多数人过度自信时，策略性披露反对方观点可以平衡讨论',
            };
        }

        if (diagnosis.includes('BELIEF_DIVERGENCE')) {
            return {
                mode: this.disclosureModes.STRATEGIC,
                content: '提供"共同知识"和事实基础',
                expectedImpact: '减少信念分歧，促进共识',
                rationale: '信念分歧大时，聚焦共同事实可以降低对立',
            };
        }

        if (diagnosis.includes('INFORMATION_ASYMMETRY')) {
            return {
                mode: this.disclosureModes.CONDITIONAL,
                content: '要求信息优势方披露来源，允许追问',
                expectedImpact: '减少信息不对称，提高论据质量',
                rationale: '信息不对称会破坏讨论公平性，需要结构性调整',
            };
        }

        return {
            mode: this.disclosureModes.FULL,
            content: '全面披露所有相关信息',
            expectedImpact: '维持现状，促进开放讨论',
            rationale: '当前状态平衡，无需干预',
        };
    }

    /**
     * 计算最优信号设计
     * 
     * 给定要实现的行动，选择最优的信息结构
     */
    optimalSignalDesign(targetAction, priorBelief, payoffFunction) {
        // 简化的信号设计计算
        // 目标：选择信息结构最大化期望效用
        
        const possibleSignals = ['strong_positive', 'weak_positive', 'neutral', 'weak_negative', 'strong_negative'];
        let bestSignal = 'neutral';
        let bestUtility = -Infinity;

        for (const signal of possibleSignals) {
            const posterior = this._updateBeliefGivenSignal(priorBelief, signal);
            const expectedUtility = payoffFunction(posterior, targetAction);
            
            if (expectedUtility > bestUtility) {
                bestUtility = expectedUtility;
                bestSignal = signal;
            }
        }

        return {
            recommendedSignal: bestSignal,
            expectedUtility: bestUtility,
            posteriorBelief: this._updateBeliefGivenSignal(priorBelief, bestSignal),
        };
    }

    _updateBeliefGivenSignal(prior, signal) {
        // 简化的贝叶斯更新
        const signalStrengths = {
            'strong_positive': 0.8,
            'weak_positive': 0.6,
            'neutral': 0.5,
            'weak_negative': 0.4,
            'strong_negative': 0.2,
        };
        
        const strength = signalStrengths[signal] || 0.5;
        return (prior + strength) / 2;
    }
}


/**
 * ============================================================
 * 第四部分：整合博弈论竞技场 (Advanced Game Theory Arena)
 * ============================================================
 */

class AdvancedGameTheoryArena extends SubagentArena {
    constructor(skillsDir = null) {
        super(skillsDir);
        
        // 初始化各模块
        this.signalingGame = new SignalingGame();
        this.repeatedGame = new RepeatedGameEngine();
        this.informationDesigner = new InformationDesigner();
        
        // 状态
        this.gameState = null;
        this.argumentPool = [];  // 论据池
    }

    /**
     * 初始化高级博弈论竞技场
     */
    async initArenaWithAdvancedGameTheory(config) {
        await super.initArena(config);

        const {
            topic,
            participants,
            discountFactors = {},
            signals = {},
        } = config;

        this.gameState = {
            topic,
            round: 0,
            participants: participants.map(p => ({
                name: p.name,
                skillName: p.skillName,
                discountFactor: discountFactors[p.name] || 0.9,
                speakerType: signals[p.name] || 'strategic',
                confidence: 0.5,
                hasEvidence: false,
                beliefs: {},
            })),
        };

        console.log('🎲 高级博弈论参数已初始化:');
        console.log(`  主题: ${topic}`);
        console.log(`  参与者: ${participants.map(p => p.name).join(', ')}`);
        console.log(`  模块: 信号博弈 | 重复博弈 | 信息设计`);

        return this.arena;
    }

    /**
     * 评估发言可信度（信号博弈）
     */
    assessArgumentCredibility(speakerName, content) {
        const participant = this.gameState.participants.find(p => p.name === speakerName);
        if (!participant) return null;

        const prior = participant.beliefs[speakerName] || 0.5;
        const assessment = this.signalingGame.assessSignalCredibility(
            content,
            participant.speakerType,
            prior
        );

        // 更新信念
        participant.beliefs[speakerName] = assessment.posterior;
        participant.confidence = assessment.confidence;
        participant.hasEvidence = assessment.signalType.includes('evidence');

        return assessment;
    }

    /**
     * 获取策略建议（重复博弈）
     */
    getStrategicAdvice(playerName, opponentName) {
        return this.repeatedGame.getStrategicAdvice(playerName, opponentName);
    }

    /**
     * 建议信息披露策略（信息设计）
     */
    suggestInformationDisclosure() {
        const states = this.gameState.participants.map(p => ({
            name: p.name,
            confidence: p.confidence,
            hasEvidence: p.hasEvidence,
        }));

        const beliefs = {};
        this.gameState.participants.forEach(p => {
            beliefs[p.name] = p.confidence;
        });

        return this.informationDesigner.suggestDisclosure(
            this.gameState.topic,
            states,
            beliefs
        );
    }

    /**
     * 记录一轮讨论
     */
    recordRound(roundData) {
        this.gameState.round++;
        const { speaker, content, action, cooperated } = roundData;

        // 记录合作历史
        this.repeatedGame.recordRound(speaker, action, cooperated);

        // 评估可信度
        const credibility = this.assessArgumentCredibility(speaker, content);

        // 更新论据池
        this.argumentPool.push({
            round: this.gameState.round,
            speaker,
            content,
            credibility,
            action,
            cooperated,
        });
    }

    /**
     * 生成综合博弈论报告
     */
    generateAdvancedGameTheoryReport() {
        if (!this.gameState) return '高级博弈论状态未初始化';

        let report = '🎲 高级博弈论分析报告\n';
        report += '═══════════════════════════════════════════\n\n';

        // 1. 信号博弈分析
        report += '📡 信号博弈分析:\n';
        report += '───────────────────────────────────────────\n';
        const credibleArgs = this.argumentPool.filter(a => a.credibility?. credible);
        const incredibleArgs = this.argumentPool.filter(a => a.credibility && !a.credibility.credible);
        
        report += `  总发言数: ${this.argumentPool.length}\n`;
        report += `  高可信信号: ${credibleArgs.length}\n`;
        report += `  低可信信号: ${incredibleArgs.length}\n`;
        
        if (credibleArgs.length > 0) {
            const avgCredibility = credibleArgs.reduce((a, b) => a + b.credibility.confidence, 0) / credibleArgs.length;
            report += `  平均可信度: ${avgCredibility.toFixed(2)}\n`;
        }
        report += '\n';

        // 2. 重复博弈/合作动态
        report += '🤝 合作动态分析:\n';
        report += '───────────────────────────────────────────\n';
        const phaseAnalysis = this.repeatedGame.getPhaseAnalysis();
        report += `  当前阶段: ${phaseAnalysis.phase}\n`;
        report += `  描述: ${phaseAnalysis.description}\n`;
        report += `  稳定性: ${phaseAnalysis.stability}\n`;
        report += `  风险: ${phaseAnalysis.risk}\n`;
        report += `  全局合作率: ${(this.repeatedGame.cooperationTracker.getCooperationRate() * 100).toFixed(0)}%\n\n`;

        // 3. 信息设计建议
        report += '📢 信息披露建议:\n';
        report += '───────────────────────────────────────────\n';
        const disclosure = this.suggestInformationDisclosure();
        report += `  建议模式: ${disclosure.mode}\n`;
        report += `  内容: ${disclosure.content}\n`;
        report += `  预期影响: ${disclosure.expectedImpact}\n`;
        report += `  理论依据: ${disclosure.rationale}\n\n`;

        // 4. 各参与者状态
        report += '👤 参与者状态:\n';
        report += '───────────────────────────────────────────\n';
        for (const p of this.gameState.participants) {
            const advice = this.getStrategicAdvice(p.name, this.gameState.participants.find(op => op.name !== p.name)?.name);
            report += `  【${p.name}】\n`;
            report += `    类型: ${p.speakerType}\n`;
            report += `    置信度: ${(p.confidence * 100).toFixed(0)}%\n`;
            report += `    有证据: ${p.hasEvidence ? '是' : '否'}\n`;
            report += `    策略建议: ${advice.reason}\n`;
            report += `    合作率: ${(this.repeatedGame.cooperationTracker.getCooperationRate(p.name) * 100).toFixed(0)}%\n`;
        }

        return report;
    }

    /**
     * 获取摘要评分
     */
    getSummaryScore() {
        const signalScore = this.argumentPool.length > 0
            ? (this.argumentPool.filter(a => a.credibility?. credible).length / this.argumentPool.length) * 100
            : 50;

        const cooperationRate = this.repeatedGame.cooperationTracker.getCooperationRate() * 100;
        const phaseAnalysis = this.repeatedGame.getPhaseAnalysis();

        return {
            signalQuality: signalScore.toFixed(0),
            cooperationLevel: cooperationRate.toFixed(0),
            discussionPhase: phaseAnalysis.phase,
            overallHealth: this._calculateOverallHealth(signalScore, cooperationRate),
        };
    }

    _calculateOverallHealth(signalScore, cooperationRate) {
        return ((signalScore * 0.4) + (cooperationRate * 0.6)).toFixed(0);
    }
}


module.exports = {
    SignalingGame,
    CooperationTracker,
    RepeatedGameEngine,
    InformationDesigner,
    AdvancedGameTheoryArena,
};