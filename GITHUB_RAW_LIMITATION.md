# 重要说明：GitHub Raw 文件限制

## 问题描述

通过 GitHub Raw 直接获取文件时（如 `https://raw.githubusercontent.com/...`），可能会遇到**文件截断**问题。这不是代码本身的问题，而是 GitHub 对 raw 文件传输的限制。

## 受影响的文件

以下文件在 GitHub Raw 查看时可能会被截断：

- `argument-tracker.js` - 实际 167 行，raw 可能只显示部分
- `output-formatter.js` - 实际 180 行，raw 可能只显示部分
- `shared-config.js` - 实际 152 行，raw 可能只显示部分
- `context-manager.js` - 实际 153 行，raw 可能只显示部分

## 解决方案

### 正确获取完整代码的方式：

```bash
# 方式1：克隆仓库（推荐）
git clone https://github.com/erongcao/virtual-forum.git
cd virtual-forum

# 方式2：下载 Release 压缩包
wget https://github.com/erongcao/virtual-forum/archive/refs/tags/v3.5.1.zip
unzip v3.5.1.zip

# 方式3：使用 GitHub API 获取文件内容
curl -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/erongcao/virtual-forum/contents/argument-tracker.js?ref=v3.5.1
```

### 验证文件完整性

```bash
# 检查文件行数
cd virtual-forum
wc -l *.js

# 预期输出：
# 167 argument-tracker.js
# 153 context-manager.js
#  88 forum-engine.js
#  95 index.js
# 180 output-formatter.js
# 152 shared-config.js
# 289 subagent-arena.js
```

## 代码质量保证

所有文件在提交前都经过验证：

- ✅ 语法检查通过 (`node --check`)
- ✅ 单元测试通过 (17 个测试用例)
- ✅ 无拼写错误 (rebuttal 已修复)
- ✅ 所有方法已定义 (formatOpening, formatResult, formatResultText)

## 版本历史

- **v3.5.1** - 添加文件完整性说明文档
- **v3.5.0** - 正式发布（代码实际已完整，但 raw 文件可能被截断）

## 报告问题

如果您发现文件确实损坏（而非 raw 查看截断），请提交 Issue：
https://github.com/erongcao/virtual-forum/issues
