# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 版本" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 月下载量" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="支持的 DSH 版本：0.1.5-rc.2" src="https://img.shields.io/badge/DSH-0.1.5--rc.2-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="插件生态：GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/%E6%8F%92%E4%BB%B6%E7%94%9F%E6%80%81-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

[English](README.md) | 中文

一个 **DeepSeek Harness** 外观插件：自定义主题色、背景壁纸（图片 / 视频 / 算法动态生成），以及逐表面的透明度与模糊度控制。当前版本面向 **DSH 0.1.5-rc.2**。

---

## 截图

<p align="center">
  <img src="example_img/image.png" alt="自定义主页" width="720">
  <br/>
  <em>自定义主页 · 壁纸与主题色同时生效</em>
</p>

<p align="center">
  <img src="example_img/image-2.png" alt="主题色选择器" width="720">
  <br/>
  <em>主题色选择器 · PS 风格色轮 + 精确 HSL/RGB 输入</em>
</p>

<p align="center">
  <img src="example_img/image-3.png" alt="分部位透明度与模糊度" width="720">
  <br/>
  <em>分部位透明度与模糊度 · 主背景、侧边栏、卡片、设置面板</em>
</p>

<p align="center">
  <img src="example_img/image-4.png" alt="背景编辑器" width="720">
  <br/>
  <em>背景编辑器 · 图片/视频壁纸支持拖动平移与滚轮缩放</em>
</p>

<p align="center">
  <img src="example_img/image-6.png" alt="动态生成背景" width="720">
  <br/>
  <em>动态生成背景 · 网格渐变 / Shader / 几何图案预设</em>
</p>

<p align="center">
  <img src="example_img/image-9.png" alt="几何背景 低多边形模式" width="720">
  <br/>
  <em>动态生成背景 · 几何 低多边形模式预览</em>
</p>

<p align="center">
  <img src="example_img/image-10.png" alt="配置导出导入" width="720">
  <br/>
  <em>配置的导出和导入进行分享</em>
</p>

## 功能特性

- **PS 风格色轮** — 在色相环上选取色相，在内嵌方形中调整饱和度与明度，实时生成 30+ 个 CSS 设计令牌。
- **精确 HSL / RGB 输入** — 通过数值精确输入颜色，与色轮实时双向同步。
- **智能取色** — 一键从壁纸提取主题色：采样可见区域、量化像素、剔除灰色/近黑/近白，选出现量最大的鲜亮色。视频壁纸自动截帧参与取色。纯客户端完成。
- **吸管取色** — 在壁纸上悬停预览颜色，点击即可选为主题色。
- **背景壁纸** — 上传任意图片作为壁纸，在视口比例的编辑器中拖动平移、滚轮缩放（触屏上单指拖动、双指捏合缩放）。
- **视频壁纸** — 上传视频作为动态壁纸：静音循环播放、刷新不丢失（落盘持久化 + HTTP 流式播放，支持 Range seek）；自动截取一帧用于预览、主题色提取与位置编辑参考。
- **位置编辑器** — 图片与视频共用同一套编辑器：拖动平移、滚轮或双指缩放、一键重置；图片与视频的位置状态各自独立保存，互不覆盖。
- **布局模式** — 适应 / 填充 / 拉伸 / 平铺 / 居中五种排布，图片与视频通用；「适应」模式下编辑器提交的构图在窗口缩放、跨屏移动后保持一致。
- **动态生成背景** — 支持网格渐变、Shader、几何图案，可调节扩散范围、色彩强度并锁定种子。
- **分部位界面透明度** — 主背景、侧边栏、卡片面板（含对话框周围的选项框/菜单）、输入框与控件（发送框、Cordis 插件面板）、设置面板、对话文本框、轨迹页、better-sidebar 工作台、产出物/高亮内容各自独立滑块。
- **分部位界面模糊度** — 每个界面部位可独立调整毛玻璃 `backdrop-filter` 模糊（0–60 px），并通过宿主的稳定选择器为发送框、Cordis 面板与弹出层提供真实背景模糊。
- **产出物 / 高亮内容** — 对话正文里的代码块（含语言顶栏）、行内 `code` 高亮芯片与产出物 chip 共用一支滑块：透明度只**调制这些表面原本的背景色**（不会在旧背景上再叠一层新色），模糊度给同一层表面加磨砂，壁纸从内容后方透出来。
- **better-sidebar 工作台** — 安装 dsh-better-sidebar 时出现独立滑块（`panelOpacity` / `blurs.panel`），接管其底部工作台面板与原生右侧栏的表面令牌；未安装该插件时该行不显示，滑块无副作用。
- **对话视图卡片** — 消息列表自动包裹为半透明卡片，轨迹页可整页调节透明度与模糊，让壁纸从内容后方透出来。
- **主题导出 / 导入** — 一键导出为自包含的 `dsh-any-theme.json`（配置 + 壁纸，视频以 data URL 内嵌），可随时导入还原。
- **外观预设与配置档案** — 六套一键预设（默认 / 毛玻璃 / 极简白 / 暗夜紫 / 赛博 / 暖阳），外加自定义命名档案：随时保存当前观感、随时套回，删除有二次确认保护。
- **壁纸轮换** — 把多张图片加入轮换池（缩略图选择器），按随机或顺序、每次刷新 / 每天 / 每周的频率自动更换；切换时服务端把所选图片复制进当前壁纸槽，导出/导入与取色管线完全不用改。
- **昼夜自动切换** — 指定日间与夜间两套配置，按固定时段或跟随系统深色模式自动切换。
- **自定义字体** — 上传一个 ttf / otf / woff / woff2 字体文件（上限 100 MB），通过 `@font-face` 应用到整个界面的文字；可随时停用或移除。字体按原始字节流式上传并持久化到插件数据目录，代码块仍保持等宽字体。
- **分组文字描边** — 沿用界面页那九个「透明度 / 模糊」分组，为每个分组单独加 `-webkit-text-stroke` 描边：粗细 0–4 px（0 = 关闭），颜色支持自动反色 / 灰 / 黑 / 白 / 主题色 / 自定义。代码块、`inline code` 与图标自动豁免，多色语法不会糊成一团。
- **强制界面明暗** — 无论主题色明暗如何，都能强制生成亮色/暗色整套令牌；「自动」下配色与字体方向由主题色明度驱动（深色 → 浅字，浅色 → 深字），未选主题色时按壁纸画面亮度判断。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 更新日志

### v0.2.9

- **修复：初次安装时透明度与模糊度滑块「要手动拖一次才生效」** —— 根因不是默认值，而是应用链路有两道门槛：① `applyCustomTokensNow()` 遇到没有调色板的情况直接 return，而**没选主题色且没强制明暗**时 `paletteTokens()` 正是返回 null，于是四个透明度滑块的 alpha 变量从头到尾没被写过；② `applyWp()` 外面还有一层 `rHasColor() || rBgDark() !== null || ...` 的门，初次安装全部落空，连 apply 都没调用。现在透明度无条件应用，没有自有调色板时回落去读宿主已解析的表面 token（`readHostOpacityTokens()`，与工作台面板 opacity 的宿主回落同源）——滑块只提供 alpha，配色仍由宿主皮肤决定。
- **默认值改为中档** —— 各分组透明度默认 0.5、模糊默认 30px（滑块量程 0–60px 的一半），初次安装即可看到滑块生效，不再是「看起来没反应」。**只影响首次安装**：已有 `theme-config.json` 的用户不受任何影响。壁纸本身的透明度（`wallpaperOpacity`）保持 100%，否则首次上传的壁纸会被直接压暗一半。服务端 `DEFAULT_CONFIG` 同步更新——两侧不同步正是 v0.2.8 静默丢字段的原因。
- **首次安装即落盘并强制重读一次** —— `read` RPC 检测到 `theme-config.json` 不存在时立刻把默认值写盘并返回 `firstRun`；客户端收到后 `persistConfig()` 写入浏览器侧的完整默认集，再 `loadPersisted()` 重读一次并 `applyWp()`，确保界面是从磁盘上真实存在的配置渲染出来的。
- **手机端背景位置调整适配** —— 背景编辑器此前只认鼠标，触屏设备上壁纸既拖不动也缩放不了。现在单指拖动画面、双指捏合缩放，且**捏合起手时手指下方的画面会始终钉在手指上**——所以「双指一边拖动一边缩放」由同一条关系式自然得出，不需要额外分支。触摸事件以 `passive: false` 原生挂载是有意为之：React 在根节点注册的 `touchmove` 是被动的，`preventDefault()` 在那里形同空操作，页面会在弹窗背后跟着滚动、浏览器还会把整个视口一起缩放；容器同时声明 `touch-action: none`，从声明式一侧兜住同样的行为。双指抬起其中一指时会以仍按住的那根手指重新建立平移基准，画面不会再按原偏移量弹回去。
- **新增「字体」设置页** — 设置面板在「界面」之后多出一页，收纳两组新能力：自定义字体与分组文字描边。
- **自定义字体** — 上传 ttf / otf / woff / woff2 文件应用到整个界面。文件以原始字节 POST 到 `/dsh-any-background/font/upload`（不走 RPC base64，上限 100 MB），服务端按魔数嗅探真实容器格式并据此命名落盘，再由 `/dsh-any-background/font` 提供 `@font-face` 源；宿主的基础字体令牌 `--dsw-font-family` 被收敛为 `'DAnyFont', <宿主原字体栈>`，代码块等宽字体不受影响。支持停用（保留文件）与移除（删除文件），上传失败会回滚到原有字体。字体文件与壁纸一样是本机资源，不进配置档案与导出包。
- **分组文字描边** — 九个界面分组各自独立的描边粗细（0–4 px，0.5 步进，0 = 关闭）与颜色；颜色存的是**预设键**而非解析后的色值：「自动」按字体明暗取反色（浅字配深描边），「主题色」跟随当前主色，二者都会随主题自动重算。代码块、行内 `code`、图标与 placeholder 显式豁免，多色语法着色不会糊。
- **已知取舍** — `-webkit-text-stroke` 在部分单行省略号容器边缘可能有 1px 级裁切；多行容器正常。

### v0.2.8

- **修复：产出物 / 高亮内容的透明度与模糊度刷新即丢** — 配置结构在插件两半边各声明一份，node 半边（按自己的结构净化后落盘）一直没跟上 `producedOpacity` 与 `blurs.produced`：滑块当次有效（内存里是对的），`writeConfig` 落盘时却把这两个字段静默丢掉，刷新自然回到默认值。现已在宿主侧补齐：`PartBlurs` / `ThemeConfig` / `ProfileAppearance` 结构与默认值，以及两处净化表（整份配置 + 档案快照）。
- **档案快照同样会丢这两个值** — 保存的档案一直没带产出物参数，套用档案会把产出物滑块悄悄重置回默认；档案、六套预设与昼夜切换现在都完整携带。
- **新增「两半边结构漂移」守护** — 宿主净化配置时，对任何「只在一侧声明过」的字段打一次警告日志（`ignoring unknown config field "blurs.xxx"`），让这类不同步在宿主日志里当场暴露，而不是静默吞掉一个设置项。
- **导入配置后界面状态补齐** — 导入 JSON 时此前只刷新背景与配色，档案列表、壁纸轮换池、昼夜调度与明暗分段控件仍显示导入前的旧值；现在导入会一并同步这部分元状态。

## 安装

### 方式一：npm 安装（推荐）

```sh
# 已发布到 npm registry
dsh plugin --profile web add dsh-any-background

# 或直接安装 GitHub 仓库
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

然后启动：

```sh
dsh web
```

插件会出现在设置面板的 **“主题”** 分类中。

### 方式二：npx（无需全局安装）

```sh
npx @deepseek-ai/dsh plugin --profile web add dsh-any-background
npx @deepseek-ai/dsh web
```

### 方式三：本地构建（开发）

`lib/` 目录已提交，安装后无需构建。修改 `src/` 后重新构建：

```sh
git clone https://github.com/Tkingxiao/dsh-any-background.git
cd dsh-any-background
pnpm install
pnpm run bundle
pnpm dsh plugin --profile web add "dsh-any-background"
pnpm dsh web
```

## 兼容性

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) 0.1.5-rc.2** — 当前版本只面向 `0.1.5-rc.2`（已在该版本上验证）；`package.json` 的 `engines.dsh` 与 `dsh.compatibility.dshReleases` 也只声明这一项。
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness 安卓启动器（免 ROOT、免 Termux）。其包内 dsh 同为 `0.1.5-rc.2`，即本插件的目标版本，故兼容；移动端界面由 `dsh-web-mobile` 提供。
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 支持

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## 许可

MIT
