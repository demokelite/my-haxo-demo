# 从 Peapix 拉取必应每日壁纸，裁成博客封面尺寸
#
# 为什么要下原图再裁，而不是直接用接口给的 thumbUrl：
#   fullUrl (1920) 约 780 KB，太大，直接当封面会拖慢页面
#   thumbUrl (640) 只有 85 KB，但只有 640 宽，高分屏上会发虚
#   所以取中间的：下 1920 的，居中裁成 800x500，约 60~90 KB，
#   和站点原有的 cover-01 ~ cover-05 尺寸完全一致。
#
# ⚠️ 用法（在项目根目录执行）：
#     powershell -ExecutionPolicy Bypass -File tools/fetch-covers.ps1
#
# ⚠️ 版权提醒：Peapix 页面底部写着 "The images are provided for wallpaper use only."
#    必应壁纸本身多来自 Getty 等图库。用作个人博客封面属于超出"壁纸用途"的范畴，
#    属于灰色地带。接口会返回 copyright 字段，作者信息已记入 docs/photo-credits.md。
#    如果在意，可以换回 Unsplash（授权明确允许免费使用）。

param(
  [int]$Count = 12,                              # 拉几张
  [int]$Width = 800,                             # 输出宽度
  [int]$Height = 500,                            # 输出高度
  [int]$Quality = 82,                            # JPEG 质量
  [string]$Country = 'cn',                       # 必应地区
  [int]$StartIndex = 6                           # 从 cover-06 开始编号（01~05 是原有封面）
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'source\img\photos'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }

Write-Host "拉取 $Count 条（地区 $Country）..." -ForegroundColor Cyan
$url = "https://peapix.com/bing/feed?country=$Country&n=$Count"
$json = Invoke-RestMethod -Uri $url -TimeoutSec 30
if (-not $json) { throw "接口没返回数据" }
Write-Host "  返回 $($json.Count) 条`n"

# JPEG 编码器（用来指定压缩质量）
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$encParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

$index = $StartIndex
$made = @()
foreach ($item in $json) {
  $name = "cover-{0:D2}-bing-{1}.jpg" -f $index, ($item.date -replace '-', '')
  $dest = Join-Path $outDir $name

  if (Test-Path $dest) {
    Write-Host ("  跳过（已存在） {0}" -f $name) -ForegroundColor DarkGray
    $index++
    continue
  }

  $tmp = Join-Path $env:TEMP "peapix-$index.jpg"
  try {
    Invoke-WebRequest -Uri $item.fullUrl -OutFile $tmp -TimeoutSec 60 -UseBasicParsing
  } catch {
    Write-Host ("  ✗ 下载失败 {0} — {1}" -f $item.title, $_.Exception.Message) -ForegroundColor Red
    continue
  }

  try {
    $src = [System.Drawing.Image]::FromFile($tmp)
    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # 等比缩放到"填满"目标尺寸，再居中裁剪 —— 不能直接拉伸，会变形
    $scale = [Math]::Max($Width / $src.Width, $Height / $src.Height)
    $dw = [int][Math]::Ceiling($src.Width * $scale)
    $dh = [int][Math]::Ceiling($src.Height * $scale)
    $dx = [int](($Width - $dw) / 2)
    $dy = [int](($Height - $dh) / 2)
    $g.DrawImage($src, $dx, $dy, $dw, $dh)
    $g.Dispose()
    $src.Dispose()

    $bmp.Save($dest, $jpegCodec, $encParams)
    $bmp.Dispose()

    $size = (Get-Item $dest).Length
    Write-Host ("  ✓ {0,-30} {1,7:N0} B   {2}" -f $name, $size, $item.title)
    $made += [PSCustomObject]@{
      文件 = $name; 标题 = $item.title; 版权 = $item.copyright
      日期 = $item.date; 页面 = $item.pageUrl
    }
    $index++
  } catch {
    Write-Host ("  ✗ 处理失败 {0} — {1}" -f $item.title, $_.Exception.Message) -ForegroundColor Red
  } finally {
    Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "`n完成：新增 $($made.Count) 张`n" -ForegroundColor Green

if ($made.Count) {
  Write-Host "把下面这些加进 _config.anzhiyu.yml 的 default_cover：" -ForegroundColor Yellow
  $made | ForEach-Object { Write-Host ("  - /img/photos/{0}" -f $_.文件) }
  Write-Host "`n版权信息（建议同步到 docs/photo-credits.md）：" -ForegroundColor Yellow
  $made | ForEach-Object { Write-Host ("  {0}`n    {1}   {2}" -f $_.文件, $_.标题, $_.版权) }
}
