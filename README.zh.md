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
- **背景壁纸** — 上传任意图片作为壁纸，在视口比例的编辑器中拖动平移、滚轮缩放。
- **视频壁纸** — 上传视频作为动态壁纸：静音循环播放、刷新不丢失（落盘持久化 + HTTP 流式播放，支持 Range seek）；自动截取一帧用于预览、主题色提取与位置编辑参考。
- **位置编辑器** — 图片与视频共用同一套编辑器：拖动平移、滚轮缩放、一键重置；图片与视频的位置状态各自独立保存，互不覆盖。
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
- **强制界面明暗** — 无论主题色明暗如何，都能强制生成亮色/暗色整套令牌；「自动」下配色与字体方向由主题色明度驱动（深色 → 浅字，浅色 → 深字），未选主题色时按壁纸画面亮度判断。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 更新日志

### v0.2.8

- **修复：产出物 / 高亮内容的透明度与模糊度刷新即丢** — 配置结构在插件两半边各声明一份，node 半边（按自己的结构净化后落盘）一直没跟上 `producedOpacity` 与 `blurs.produced`：滑块当次有效（内存里是对的），`writeConfig` 落盘时却把这两个字段静默丢掉，刷新自然回到默认值。现已在宿主侧补齐：`PartBlurs` / `ThemeConfig` / `ProfileAppearance` 结构与默认值，以及两处净化表（整份配置 + 档案快照）。
- **档案快照同样会丢这两个值** — 保存的档案一直没带产出物参数，套用档案会把产出物滑块悄悄重置回默认；档案、六套预设与昼夜切换现在都完整携带。
- **新增「两半边结构漂移」守护** — 宿主净化配置时，对任何「只在一侧声明过」的字段打一次警告日志（`ignoring unknown config field "blurs.xxx"`），让这类不同步在宿主日志里当场暴露，而不是静默吞掉一个设置项。
- **导入配置后界面状态补齐** — 导入 JSON 时此前只刷新背景与配色，档案列表、壁纸轮换池、昼夜调度与明暗分段控件仍显示导入前的旧值；现在导入会一并同步这部分元状态。

### v0.2.7

- **新增「产出物 / 高亮内容」滑块** — 对话里的代码块（含语言顶栏）、行内 `code` 高亮芯片与产出物 chip 现在共用一支透明度 + 模糊度滑块。透明度是这些表面**自身背景色的 alpha**：100% 与宿主原样逐色一致，下调时淡出的就是它原本那块颜色，而不是在旧背景上再叠一层新色（此前代码块外层仍不透明，滑块只是在原色上混入插件调色板颜色，模糊也因此看不见效果）；模糊度用 `backdrop-filter` 给同一层表面加磨砂。文档预览里不在 `.md-code-block` 内、只靠 `--shiki-background` 上色的代码块也一并覆盖。
- **新增 better-sidebar 工作台滑块** — 通过 `[data-dsh-bottom-panel]` 与 `[data-sidebar-right-panel]` 为 dsh-better-sidebar 的底部工作台面板提供独立的透明度（`panelOpacity`）与模糊度（`blurs.panel`）；面板表面按插件调色板重新着色，并新增强度更高的可复用规则（面板令牌重映射 + 面板模糊）。未安装该插件时该行不显示，滑块无副作用。
- **弹出层模糊归位** — 新增 `POPOVER_BLUR_RULE`：「卡片」模糊滑块现在同时落到下拉菜单 / 弹出层这类弹出表面，不再只影响对话框内的面板。
- **宿主支持收敛** — 只面向 **DSH 0.1.5-rc.2**（已在该版本上验证）：`engines.dsh` 与 `dsh.compatibility.dshReleases` 只声明这一项，README 删除旧的 8 版本矩阵；`panelOpacity` 进入档案 / 导出导入 / 昼夜切换的完整链路。
- **六套预设同步新参数** — 工作台透明度随预设给出（毛玻璃 0.85 / 暗夜紫 0.8 / 暖阳 0.75 等），产出物滑块默认 100%（即宿主原样）。

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
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 支持

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## 许可

MIT
