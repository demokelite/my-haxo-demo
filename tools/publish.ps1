# 发表一篇草稿
#
# 为什么需要这个脚本：本站 _config.yml 里是 future: true，
# 意思是**未来日期的文章也会立刻发布**，起不到定时发布的作用。
# 所以草稿里那些 2026-10-21 之类的日期，一旦移到 _posts/，
# 文章会立刻上线，但显示成一周后 —— 排在列表最前面，看着很怪。
#
# 这个脚本就是把这个步骤固定下来：**发表时把日期改成当天**。
#
# 用法：
#   powershell -ExecutionPolicy Bypass -File tools/publish.ps1                 # 列出草稿
#   powershell -ExecutionPolicy Bypass -File tools/publish.ps1 -Name the-first-email
#   powershell -ExecutionPolicy Bypass -File tools/publish.ps1 -Name the-first-email -KeepDate
#
# 注意：**这个脚本不提交、不推送。** 它只改文件，提交前你自己看一眼。
#
# ⚠️ 本文件必须保存为**带 BOM 的 UTF-8**。
#    Windows PowerShell 5.1 在没有 BOM 时会按 GBK 读 .ps1，
#    中文会变成乱码并报语法错误。pwsh 7 没这个问题，但不能假设别人用的是 7。

param(
  [string]$Name,
  [switch]$KeepDate
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$draftDir = Join-Path $root 'source\_drafts'
$postDir  = Join-Path $root 'source\_posts'

function Get-FrontMatter([string]$path) {
  $text = [System.IO.File]::ReadAllText($path, [System.Text.UTF8Encoding]::new($false))
  $m = [regex]::Match($text, '(?s)^---\r?\n(.*?)\r?\n---')
  return @{ Text = $text; Matter = $(if ($m.Success) { $m.Groups[1].Value } else { '' }) }
}

function Get-Field([string]$matter, [string]$key) {
  $m = [regex]::Match($matter, ('(?m)^' + [regex]::Escape($key) + ':\s*(.+?)\s*$'))
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return ''
}

# ---------- 没给名字就列一遍 ----------
if (-not $Name) {
  $drafts = Get-ChildItem $draftDir -File -Filter *.md -ErrorAction SilentlyContinue
  if (-not $drafts) { Write-Host '草稿箱是空的。'; exit 0 }

  Write-Host ''
  Write-Host '草稿箱：' -ForegroundColor Cyan
  Write-Host ''
  $today = (Get-Date).Date
  foreach ($d in $drafts) {
    $fm = Get-FrontMatter $d.FullName
    $date = Get-Field $fm.Matter 'date'
    $title = Get-Field $fm.Matter 'title'
    $isFuture = $false
    if ($date) {
      try { $isFuture = ([datetime]::Parse(($date -replace 'T', ' '))).Date -gt $today } catch {}
    }
    $flag = if ($isFuture) { '未来日期' } else { '已到期  ' }
    Write-Host ("  {0,-34} {1,-22} {2}  {3}" -f $d.Name, $date, $flag, $title)
  }
  Write-Host ''
  Write-Host '发表：tools/publish.ps1 -Name <文件名>' -ForegroundColor Yellow
  Write-Host '（未来日期的那几篇，发表时日期会被改成当天）'
  exit 0
}

# ---------- 找到草稿 ----------
$file = $Name
if ($file -notlike '*.md') { $file = "$file.md" }
$src = Join-Path $draftDir $file

if (-not (Test-Path $src)) {
  # 支持只写一部分名字
  $cand = Get-ChildItem $draftDir -File -Filter '*.md' | Where-Object { $_.Name -like "*$Name*" }
  if ($cand.Count -eq 1) { $src = $cand[0].FullName }
  elseif ($cand.Count -gt 1) {
    Write-Host "匹配到多个，写清楚一点：" -ForegroundColor Yellow
    $cand | ForEach-Object { Write-Host ("  " + $_.Name) }
    exit 1
  } else {
    Write-Host "找不到草稿：$Name" -ForegroundColor Red
    Write-Host '运行不带参数的脚本可以列出全部草稿。'
    exit 1
  }
}

$dst = Join-Path $postDir (Split-Path $src -Leaf)
if (Test-Path $dst) {
  Write-Host "source/_posts/ 里已经有同名文件了：$(Split-Path $src -Leaf)" -ForegroundColor Red
  Write-Host '先确认那篇是不是重复的，别直接覆盖。'
  exit 1
}

# ---------- 改日期 ----------
$fm = Get-FrontMatter $src
$oldDate = Get-Field $fm.Matter 'date'
$title = Get-Field $fm.Matter 'title'
$now = Get-Date
$newDate = $now.ToString('yyyy-MM-dd HH:mm:ss')

Write-Host ''
Write-Host "标题：$title"
Write-Host "旧日期：$oldDate"

if ($KeepDate) {
  Write-Host '按 -KeepDate 保留原日期。' -ForegroundColor Yellow
} elseif ($oldDate -ne $newDate) {
  $text = $fm.Text
  $text = [regex]::Replace($text, '(?m)^date:\s*.+?$', "date: $newDate", 1)
  [System.IO.File]::WriteAllText($src, $text, [System.Text.UTF8Encoding]::new($false))
  Write-Host "新日期：$newDate" -ForegroundColor Green
} else {
  Write-Host '日期已经是现在，不用改。'
}

# ---------- 移动 ----------
Move-Item $src $dst
Write-Host ''
Write-Host "已移到 source/_posts/$(Split-Path $dst -Leaf)" -ForegroundColor Green

# ---------- 提醒 ----------
Write-Host ''
Write-Host '接下来：' -ForegroundColor Cyan
Write-Host '  1. 本地构建看一眼（hexo clean; hexo generate）'
Write-Host '  2. git add -A; git commit; git push'
Write-Host ''
Write-Host '文章地址会是：' -ForegroundColor Cyan
$yyyy = $now.ToString('yyyy'); $mm = $now.ToString('MM'); $dd = $now.ToString('dd')
$slug = (Split-Path $dst -Leaf) -replace '\.md$', ''
Write-Host "  /$yyyy/$mm/$dd/$slug/"
Write-Host ''
