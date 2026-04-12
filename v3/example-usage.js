/**
 * 示例：使用博弈论引擎进行辩论
 * 
 * 展示如何初始化博弈、执行辩论、获取均衡分析
 */

const GameTheoryDebateEngine = require('./core/game-theory-engine');

async function runExampleDebate() {
  // 示例1：囚徒困境型辩论
  console.log('=== 示例1: 贸易战谈判 ===\n');
  
  const engine1 = new GameTheoryDebateEngine({
    maxRounds: 5,
    enableBeliefUpdate: true,
    showEquilibriumAnalysis: true
  });
  
  // 初始化
  const init1 = await engine1.initializeDebate(
    '中美贸易战应该合作还是对抗',
    ['特朗普', '中方代表']
  );
  
  console.log('博弈分析:', init1.analysis.recommendedGameType);
  console.log('\n');
  
  // 模拟5轮辩论
  const rounds1 = [
    { '特朗普': '对抗', '中方代表': '合作' },
    { '特朗普': '对抗', '中方代表': '对抗' },
    { '特朗普': '合作', '中方代表': '合作' },
    { '特朗普': '对抗', '中方代表': '合作' },
    { '特朗普': '合作', '中方代表': '合作' }
  ];
  
  for (let i = 0; i < rounds1.length; i++) {
    const result = await engine1.executeRound(i + 1, rounds1[i]);
    console.log(`第${result.round}轮:`);
    console.log('  行动:', result.actions);
    console.log('  策略分析:', result.strategyAnalysis);
    console.log('  建议:', result.recommendations.map(r => r.content).join('; '));
    console.log('');
  }
  
  // 生成最终报告
  const report1 = engine1.generateFinalReport();
  console.log('=== 最终报告 ===');
  console.log('均衡分析:', report1.equilibriumAnalysis.type);
  console.log('洞察:', report1.strategicInsights.map(i => i.content).join('\n'));
  
  console.log('\n\n');
  
  // 示例2：不完全信息博弈（信号博弈）
  console.log('=== 示例2: 收购谈判（不完全信息） ===\n');
  
  const engine2 = new GameTheoryDebateEngine({
    maxRounds: 3,
    enableBeliefUpdate: true
  });
  
  const init2 = await engine2.initializeDebate(
    'Twitter收购谈判中的类型信号',
    ['马斯克', '巴菲特']
  );
  
  console.log('博弈类型:', init2.gameType);
  console.log('初始信念:', init2.initialBeliefs);
  console.log('\n');
  
  // 模拟3轮，展示信念更新
  const rounds2 = [
    { '马斯克': '强硬', '巴菲特': '强硬' },
    { '马斯克': '妥协', '巴菲特': '强硬' },
    { '马斯克': '妥协', '巴菲特': '妥协' }
  ];
  
  for (let i = 0; i < rounds2.length; i++) {
    const result = await engine2.executeRound(i + 1, rounds2[i]);
    console.log(`第${result.round}轮:`);
    console.log('  行动:', result.actions);
    console.log('  更新后的信念:', result.beliefUpdate);
    console.log('');
  }
}

// 运行示例
if (require.main === module) {
  runExampleDebate().catch(console.error);
}

module.exports = { runExampleDebate };
