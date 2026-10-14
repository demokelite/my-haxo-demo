# 配图来源

站点里的照片全部来自 **Unsplash**（经 [Lorem Picsum](https://picsum.photos/) 分发），
适用 [Unsplash License](https://unsplash.com/license)：可免费用于商业和非商业用途，无需署名。
这里保留出处是出于礼貌，也方便日后溯源。

图片都**存了本地副本**（`source/img/photos/`），不依赖外部图床，避免国内访问慢或外链失效。

## 挑选过程

从 Picsum 的 290 张可用照片里均匀抽样 60 张，拼成带编号的联系表，
再让支持图像的模型按「深色主题、白字压在图上、气质要安静」的标准筛选。
筛选时它明确指出了几张不协调的（高饱和亮绿、大片白墙、纯黑白细节过密），已剔除。
相册那一册的说明文字也是它按画面内容写的，没有使用「美丽的风景」这类空话。

## 清单

| 文件 | 用途 | 作者 | 原图 |
| --- | --- | --- | --- |
| `cover-01-mist-mountain.jpg` | 文章默认封面 | Radio Pink | [picsum #121](System.Object[]) |
| `cover-02-mist-path.jpg` | 文章默认封面 | Orlova Maria | [picsum #229](System.Object[]) |
| `cover-03-sea-rocks.jpg` | 文章默认封面 | Angelina Odemchuk | [picsum #179](System.Object[]) |
| `cover-04-river-dusk.jpg` | 文章默认封面 | Rick Waalders | [picsum #125](System.Object[]) |
| `bg-01-railway.jpg` | 文章隧道卡底图 / 关注偏好卡底图 | Francisco Casero | [picsum #233](System.Object[]) |
| `bg-02-misty-coast.jpg` | 地图卡亮色底图 / 音乐卡底图 / 相册顶部背景 | Christopher Sardegna | [picsum #44](System.Object[]) |
| `bg-03-frost-field.jpg` | 地图卡暗色底图 | Andre Koch | [picsum #187](System.Object[]) |
| `bg-04-anchor-wall.jpg` | 生涯卡配图 | Rodrigo Melo | [picsum #32](System.Object[]) |
| `album-01-foggy-beach.jpg` | 相册封面 + 相册第 1 张 | Tina Rataj | [picsum #100](https://unsplash.com/photos/pwaaqfoMibI) |
| `album-02-tunnel-light.jpg` | 相册第 2 张 | Vladimir Kramer | [picsum #137](https://unsplash.com/photos/xzZtV9ED5Bs) |
| `album-03-phone-desk.jpg` | 相册第 3 张 | Thom | [picsum #160](https://unsplash.com/photos/Zdcq3iKly6g) |
| `album-04-dune-tracks.jpg` | 相册第 4 张 | Dyaa Eldin Moustafa | [picsum #196](https://unsplash.com/photos/mR_HR8NZwg8) |
| `album-05-purple-bloom.jpg` | 相册第 5 张 | Steven Spassov | [picsum #152](https://unsplash.com/photos/tVIqMgGlAG0) |
| `album-06-snow-path.jpg` | 相册第 6 张 | Sylwia Bartyzel | [picsum #241](https://unsplash.com/photos/1Cg7BQXp024) |

## 授权说明

Unsplash License 允许免费使用、修改、分发，包括商业用途，且不强制署名。
唯一禁止的是「把照片原样聚合成一个图片服务」——本站是个人博客配图，属于正常使用。

想换成自己的照片，把 `source/img/photos/` 下的文件替换掉、**保持文件名不变**，配置不用动。
## 一个例外

`cover-05-mascaloona.jpg` 不是 Unsplash 来的，它是**从作者自己上传的原图压缩出来的**：

| 文件 | 来源 | 尺寸 | 体积 |
| --- | --- | --- | --- |
| `img/mine/mascaloona-bliss.jpg` | 作者上传 | 1920x1080 | 335,642 bytes |
| `img/photos/cover-05-mascaloona.jpg` | 上者裁切压缩 | 800x500 | 56,870 bytes |

原图保留着给 404 页当全屏背景（那里需要高分辨率），
文章封面改用小图 —— 封面只显示约 500x250，用 1920x1080 是浪费带宽。
一来一回省下 279 KB。

---

## 必应每日壁纸（cover-06 ~ cover-12）

这 7 张不是 Unsplash 来的，是用 [`tools/fetch-covers.ps1`](../tools/fetch-covers.ps1)
从 [Peapix 接口](https://peapix.com/api) 拉的必应每日壁纸，下 1920 原图后居中裁成 800x500。

| 文件 | 画面 | 版权 |
| --- | --- | --- |
| `cover-06-bing-20261014.jpg` | 侏罗纪时期的菊石化石 | © J Nemchinova/Getty Image |
| `cover-07-bing-20261013.jpg` | 普利特维采湖群国家公园，克罗地亚 | © Jan Wlodarczyk/Alam |
| `cover-08-bing-20261012.jpg` | 曼布尔斯码头，斯旺西，威尔士 | © Helen Hotson/Shutterstock |
| `cover-09-bing-20261011.jpg` | 格莱德溪磨坊，巴布科克州立公园，美国 | © dszc/Getty Image |
| `cover-10-bing-20261010.jpg` | 蒙特雷湾上空的双冠鸬鹚，加州，美国 | © Hiroya Minakuchi/Minden Picture |
| `cover-11-bing-20261009.jpg` | 桑吉奈尔群岛景观，科西嘉岛，法国 | © Francesco Riccardo Iacomino/Getty Image |
| `cover-12-bing-20261008.jpg` | 印度洋马约特岛，一只呈防御姿态的章鱼 | © Gabriel Barathieu/Minden Picture |

### ⚠️ 这 7 张的授权和上面那批不一样

**Peapix 页面底部写着：**

> The images are provided for **wallpaper use only**.

必应壁纸本身多来自 Getty、Shutterstock 这类图库。**用作博客封面属于超出「壁纸用途」的范畴，是灰色地带** —— 和 Unsplash 那种「明确允许免费使用」不是一回事。

这一点在选择时应该知情。如果在意，有两个办法：

1. **换回 Unsplash** —— 授权明确，只是可选图少一些
2. **只留着看，不发布** —— 把这几张从 `default_cover` 里去掉即可

作者信息已经记在上面，万一要署名可以直接用。

### 想再加几张

改 [`tools/fetch-covers.ps1`](../tools/fetch-covers.ps1) 的参数再跑一次：

```powershell
powershell -ExecutionPolicy Bypass -File tools/fetch-covers.ps1 -Count 20 -StartIndex 13
```

脚本会**接着现有编号往下排**，不会覆盖已有的。跑完把输出里的路径复制进
`_config.anzhiyu.yml` 的 `default_cover` 就行（脚本会把该贴的内容打印出来）。

地区可以用 `-Country` 换（`cn` / `us` / `jp` / `de` / `fr` / `gb` 等），不同地区当天的图不一样。

> **踩过的坑**：`.ps1` 文件必须存成**带 BOM 的 UTF-8**。
> Windows PowerShell 5.1 在无 BOM 时按 GBK 读，中文全变乱码、脚本直接语法错误。
> 用 `pwsh` 7 没这个问题，但脚本要给别人用就不能假设对方是 7。

---

## 关于页的三张配图（后来换的）

原来这三张卡片用的是凑数的图，2026-10-14 换掉了：

| 文件 | 用在哪张卡 | 原来是什么 | 作者 | 原图 |
| --- | --- | --- | --- | --- |
| `about-personality.jpg` | 性格（INFJ-A） | **404 页的背景图**（浅灰像素恐龙） | Dorothy Lin | [unsplash](https://unsplash.com/photos/OokBLPrkCNk) |
| `about-like.jpg` | 关注偏好（数码科技） | 工业铁轨照，和「数码」对不上 | Vadim Sherbakov | [unsplash](https://unsplash.com/photos/Hi9GSwWkCJk) |
| `about-location.jpg` | 所在地（中国，承德） | 结霜草地特写，和地点无关 | Romain Briaux | [unsplash](https://unsplash.com/photos/yD3PXDV7Sjc) |

三张都是 **Unsplash 授权**（经 Picsum 分发），和站里其它照片同一套许可，可免费使用。

选图过程：从 Picsum 的 200 张里均匀抽 40 张拼成带编号的联系表，
交给支持图像的模型按「和卡片内容贴不贴、气质安不安静」筛的。
它当时明确说了两件事，都记下来：

- **所在地那张是退而求其次** —— 40 张里没有明确的中国地标，它选了张雾中山谷，
  读起来像中国山水，但**不是真的承德**。想换成实拍的话需要自己拍或者找有授权的图。
- **关注偏好那张也不是代码界面**，只是深灰的桌面俯拍（显示器、键盘、鼠标、眼镜），
  在这 40 张里是最接近「数码」主题的。

另外两处**看着不对但其实是误判**，一并记下免得以后再查一遍：

- 页面中间那块「Hello there!」大色块**不是图片**，是主题 CSS 画的三个圆加文字
- 关于页底部那个动漫少女插画**不是页面配图**，是右下角的 Live2D 看板娘