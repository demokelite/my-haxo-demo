---
title: 主题排版功能速览
date: 2026-10-11 20:20:00
categories:
  - 技术
tags:
  - Markdown
  - 主题
description: 安知鱼主题支持的一些富文本写法速查，写文章时可以对着抄。
---

这篇文章用来验证主题的排版能力，也当作写作时的速查表。

## 代码块

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet('Anzhiyu'));
```

## 引用

> 生活明朗，万物可爱，人间值得，未来可期。

## 表格

| 功能 | 配置项 | 默认值 |
| --- | --- | --- |
| 字数统计 | `wordcount.enable` | `true` |
| 本地搜索 | `local_search.enable` | `true` |
| 侧边栏 | `aside.enable` | `true` |
| 打字机副标题 | `subtitle.enable` | `true` |

## 列表

1. 有序列表第一项
2. 有序列表第二项
3. 有序列表第三项

- 无序列表
- 支持嵌套
  - 二级缩进

## 提示框

主题支持 note 标签，写法如下：

```markdown
{% note blue 'anzhiyu-icon-fan' modern %}
这是一条提示信息。
{% endnote %}
```

## 图片

图片会自动套用 fancybox 灯箱效果，点击可放大。
