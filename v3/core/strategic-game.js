/**
 * 战略式博弈 (Strategic Game)
 * 基于 Osborne & Rubinstein 第2章 / Bonanno 第2,6章
 * 
 * 支持：纯策略纳什均衡、混合策略均衡、占优策略求解
 */

class StrategicGame {
  constructor(config) {
    this.players = config.players; // ['巴菲特', '马斯克']
    this.strategies = config.strategies; // { '巴菲特': ['合作', '对抗'], ... }
    this.payoffMatrix = config.payoffMatrix; // { '合作-激进': [3, 5], ... }
  }

  /**
   * 迭代剔除严格劣策略 (IESDS)
   * Bonanno 第2.5节 / Osborne 第4章
   */
  iteratedEliminationOfStrictlyDominatedStrategies() {
    let remainingStrategies = { ...this.strategies };
    let eliminated = [];
    let changed = true;

    while (changed) {
      changed = false;
      
      for (const player of this.players) {
        const playerStrategies = remainingStrategies[player];
        const otherPlayers = this.players.filter(p => p !== player);
        
        for (let i = 0; i < playerStrategies.length; i++) {
          const si = playerStrategies[i];
          
          // 检查是否被其他策略严格占优
          for (let j = 0; j < playerStrategies.length; j++) {
            if (i === j) continue;
            const sj = playerStrategies[j];
            
            if (this.isStrictlyDominated(player, si, sj, remainingStrategies)) {
              remainingStrategies[player] = playerStrategies.filter(s => s !== si);
              eliminated.push({ player, strategy: si, dominatedBy: sj });
              changed = true;
              break;
            }
          }
        }
      }
    }

    return { remainingStrategies, eliminated };
  }

  /**
   * 检查策略si是否被sj严格占优
   */
  isStrictlyDominated(player, si, sj, remainingStrategies) {
    const otherPlayers = this.players.filter(p => p !== player);
    const otherStrategies = otherPlayers.map(p => remainingStrategies[p]);
    
    // 生成所有其他玩家的策略组合
    const combinations = this.cartesianProduct(otherStrategies);
    
    let strictlyDominated = true;
    let strictlyBetter = false;
    
    for (const combo of combinations) {
      const strategyProfileSi = this.buildProfile(player, si, otherPlayers, combo);
      const strategyProfileSj = this.buildProfile(player, sj, otherPlayers, combo);
      
      const payoffSi = this.getPayoff(strategyProfileSi, player);
      const payoffSj = this.getPayoff(strategyProfileSj, player);
      
      if (payoffSj <= payoffSi) {
        strictlyDominated = false;
        break;
      }
      if (payoffSj > payoffSi) {
        strictlyBetter = true;
      }
    }
    
    return strictlyDominated && strictlyBetter;
  }

  /**
   * 寻找纯策略纳什均衡
   * Osborne 第2.3节 / Bonanno 第2.6节
   */
  findPureStrategyNashEquilibrium() {
    const equilibria = [];
    const strategyProfiles = this.generateAllStrategyProfiles();
    
    for (const profile of strategyProfiles) {
      if (this.isNashEquilibrium(profile)) {
        equilibria.push({
          profile,
          payoffs: this.players.map(p => this.getPayoff(profile, p))
        });
      }
    }
    
    return equilibria;
  }

  /**
   * 检查是否为纳什均衡
   */
  isNashEquilibrium(profile) {
    for (const player of this.players) {
      const currentStrategy = profile[player];
      const currentPayoff = this.getPayoff(profile, player);
      
      // 检查是否存在有利偏离
      for (const alternativeStrategy of this.strategies[player]) {
        if (alternativeStrategy === currentStrategy) continue;
        
        const deviatedProfile = { ...profile, [player]: alternativeStrategy };
        const deviatedPayoff = this.getPayoff(deviatedProfile, player);
        
        if (deviatedPayoff > currentPayoff) {
          return false; // 存在有利偏离，不是均衡
        }
      }
    }
    return true;
  }

  /**
   * 寻找混合策略纳什均衡 (2人博弈)
   * Bonanno 第6.3节
   */
  findMixedStrategyNashEquilibrium() {
    if (this.players.length !== 2) {
      throw new Error('混合策略均衡目前仅支持2人博弈');
    }
    
    const [player1, player2] = this.players;
    const strategies1 = this.strategies[player1];
    const strategies2 = this.strategies[player2];
    
    // 使用支撑集法求解
    const equilibria = [];
    
    // 尝试所有可能的支撑集组合
    for (let support1 of this.getAllSubsets(strategies1)) {
      for (let support2 of this.getAllSubsets(strategies2)) {
        if (support1.length === 0 || support2.length === 0) continue;
        
        const equilibrium = this.solveForSupport(support1, support2, player1, player2);
        if (equilibrium) {
          equilibria.push(equilibrium);
        }
      }
    }
    
    return equilibria;
  }

  /**
   * 对给定支撑集求解混合策略均衡
   */
  solveForSupport(support1, support2, player1, player2) {
    // 简化为线性方程组求解
    // 实际实现需要更复杂的数值方法
    
    // 检查无差异条件
    const expectedPayoffs1 = {};
    const expectedPayoffs2 = {};
    
    // 这里使用简化的迭代法
    let mixed1 = this.uniformMixture(support1);
    let mixed2 = this.uniformMixture(support2);
    
    // 迭代收敛到均衡
    for (let iter = 0; iter < 1000; iter++) {
      const newMixed1 = this.bestResponse(player1, mixed2, support1);
      const newMixed2 = this.bestResponse(player2, mixed1, support2);
      
      if (this.mixturesEqual(mixed1, newMixed1) && this.mixturesEqual(mixed2, newMixed2)) {
        return {
          [player1]: mixed1,
          [player2]: mixed2,
          expectedPayoffs: {
            [player1]: this.expectedPayoff(player1, mixed1, mixed2),
            [player2]: this.expectedPayoff(player2, mixed2, mixed1)
          }
        };
      }
      
      mixed1 = newMixed1;
      mixed2 = newMixed2;
    }
    
    return null;
  }

  /**
   * 计算最佳反应
   */
  bestResponse(player, opponentMixture, support) {
    const bestStrategies = [];
    let maxPayoff = -Infinity;
    
    for (const strategy of support) {
      const payoff = this.expectedPayoffAgainstMixture(player, strategy, opponentMixture);
      if (payoff > maxPayoff + 1e-9) {
        maxPayoff = payoff;
        bestStrategies = [strategy];
      } else if (Math.abs(payoff - maxPayoff) < 1e-9) {
        bestStrategies.push(strategy);
      }
    }
    
    // 在最佳反应中均匀混合
    const prob = 1 / bestStrategies.length;
    const mixture = {};
    for (const s of support) {
      mixture[s] = bestStrategies.includes(s) ? prob : 0;
    }
    return mixture;
  }

  /**
   * 生成所有策略组合
   */
  generateAllStrategyProfiles() {
    const strategyArrays = this.players.map(p => this.strategies[p]);
    const combinations = this.cartesianProduct(strategyArrays);
    
    return combinations.map(combo => {
      const profile = {};
      this.players.forEach((p, i) => profile[p] = combo[i]);
      return profile;
    });
  }

  /**
   * 获取收益
   */
  getPayoff(profile, player) {
    const key = this.players.map(p => profile[p]).join('-');
    const payoffs = this.payoffMatrix[key];
    const playerIndex = this.players.indexOf(player);
    return payoffs[playerIndex];
  }

  /**
   * 计算期望收益
   */
  expectedPayoff(player, myMixture, opponentMixture) {
    let expected = 0;
    
    for (const [myStrategy, myProb] of Object.entries(myMixture)) {
      if (myProb === 0) continue;
      
      for (const [oppStrategy, oppProb] of Object.entries(opponentMixture)) {
        if (oppProb === 0) continue;
        
        const profile = { [player]: myStrategy };
        const opponent = this.players.find(p => p !== player);
        profile[opponent] = oppStrategy;
        
        expected += myProb * oppProb * this.getPayoff(profile, player);
      }
    }
    
    return expected;
  }

  // 辅助方法
  cartesianProduct(arrays) {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map(a => [a]);
    
    const result = [];
    const [first, ...rest] = arrays;
    const restProduct = this.cartesianProduct(rest);
    
    for (const item of first) {
      for (const combo of restProduct) {
        result.push([item, ...combo]);
      }
    }
    return result;
  }

  buildProfile(player, strategy, otherPlayers, otherStrategies) {
    const profile = { [player]: strategy };
    otherPlayers.forEach((p, i) => profile[p] = otherStrategies[i]);
    return profile;
  }

  getAllSubsets(array) {
    const subsets = [[]];
    for (const item of array) {
      const newSubsets = subsets.map(s => [...s, item]);
      subsets.push(...newSubsets);
    }
    return subsets;
  }

  uniformMixture(strategies) {
    const prob = 1 / strategies.length;
    const mixture = {};
    strategies.forEach(s => mixture[s] = prob);
    return mixture;
  }

  mixturesEqual(m1, m2, epsilon = 1e-6) {
    const keys = new Set([...Object.keys(m1), ...Object.keys(m2)]);
    for (const k of keys) {
      if (Math.abs((m1[k] || 0) - (m2[k] || 0)) > epsilon) return false;
    }
    return true;
  }
}

module.exports = StrategicGame;
