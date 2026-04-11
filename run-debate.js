/**
 * 运行子代理辩论
 */

const VirtualForum = require('./index.js');

async function main() {
  const forum = new VirtualForum();
  
  console.log('🚀 启动子代理辩论...\n');
  console.log('📌 话题: 美国是否应该退出联合国？');
  console.log('👥 参与者: 纽森 vs 特朗普');
  console.log('🎙️ 主持人: 巴菲特 (犀利风格)');
  console.log('🔄 轮次: 10');
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const result = await forum.quickArena(
      '美国是否应该退出联合国？',
      ['纽森', '特朗普'],
      {
        mode: 'adversarial',
        rounds: 10,
        moderatorStyle: 'provocative',
        moderatorName: '巴菲特',
        moderatorSkill: 'warren-buffett',
        outputFormat: 'dialogue'
      }
    );

    console.log('\n' + result.output);
    
    // 保存结果
    const fs = require('fs');
    const outputPath = '/Users/caoyirong/obsidian/macairm2/虚拟论坛/2026-04-12-纽森vs特朗普-美国是否应该退出联合国-子代理版.md';
    fs.writeFileSync(outputPath, result.output);
    console.log(`\n✅ 结果已保存到 Obsidian`);
    
  } catch (err) {
    console.error('❌ 错误:', err.message);
    console.error(err.stack);
  }
  
  process.exit(0);
}

main();
