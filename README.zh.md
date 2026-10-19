# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 版本" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 月下载量" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="支持的 DSH 版本：0.2.0-rc.1 ~ 0.2.1-rc.2 及其上" src="https://img.shields.io/badge/DSH-0.2.0--rc.1%20~%200.2.1--rc.2%2B-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="插件生态：GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/%E6%8F%92%E4%BB%B6%E7%94%9F%E6%80%81-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

[English](README.md) | 中文

一个 **DeepSeek Harness** 外观插件：自定义主题色、背景壁纸（图片 / 视频 / 算法动态生成），以及逐表面的透明度与模糊度控制。兼容 **DSH `0.2.0-rc.1` 直至 `0.2.1-rc.2`，其上所有版本一并放行**（官方右侧栏「主题」卡片等界面按宿主是否提供右侧栏注册表扩展点自动启用，缺失时静默跳过）。

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
- **分部位界面透明度** — 主背景、侧边栏、卡片面板（含对话框周围的选项框/菜单）、输入框与控件（发送框、Cordis 插件面板）、设置面板、对话文本框、轨迹页、右方侧边栏（或 bettersidebar）、产出物/高亮内容、顶栏选项（Agent Team 面板、后台任务列表与会话头部下拉菜单），以及标题栏（会话顶部那条标题行 + 视图页签）各自独立滑块。
- **分部位界面模糊度** — 每个界面部位可独立调整毛玻璃 `backdrop-filter` 模糊（0–60 px），并通过宿主的稳定选择器为发送框、Cordis 面板与弹出层提供真实背景模糊。滑块就是该表面的磨砂量，**0 就是没有磨砂**——包括盖掉宿主默认的 `--dsw-menu-backdrop-filter: blur(40px) saturate(150%)`。0.3.7 曾把 0 解释成「保留宿主自己的磨砂」，结果滑块的下端反而是最糊的一端（0 = 宿主的 40px，1 = 1px），「把模糊关掉」根本够不着；现在 0 就是 0，而各部件的**默认值仍是 30px**，所以全新安装照旧是磨砂的，只有明确拖到 0 才会清掉。
- **左侧栏 + 它上方的标题条带** — 桌面壳（Windows）上，「侧栏」这对滑块现在同时驱动侧栏列，以及那条压在侧栏正上方的窗口标题条带分段。宿主把整条条带画成一个全宽的盒子（`.frame::before`），而宿主自己就把侧栏列宽发在帧元素上（`--dsh-windows-sidebar-width`）；插件就按这个宽度切开条带：`::before` 被裁到该宽度右侧（继续保留「标题栏」卡片的材质、模糊与拖拽区），新增的 `::after` 用 `--dsh-any-op-sidebar`——也就是侧栏列本身用的那份颜色——画出左侧那段，并按侧栏模糊的根级镜像上霜。于是一对滑块管住侧栏与它上方那一条，拖动或折叠侧栏时切口跟着移动（宽度 `0px` 时整条条带重新归「标题栏」）。这个切分是有意的（issue #29 第 3 条）：左段本就是侧栏列自己的表面，标题栏滑块不该够到它。
- **产出物 / 高亮内容** — 对话正文里的代码块（含语言顶栏）、行内 `code` 高亮芯片与产出物 chip 共用一支滑块：透明度只**调制这些表面原本的背景色**（不会在旧背景上再叠一层新色），模糊度给同一层表面加磨砂，壁纸从内容后方透出来。
- **右方侧边栏 / bettersidebar 表面** — 同一对滑块（`panelOpacity` / `blurs.panel`）按宿主环境自动切换目标：未安装 dsh-better-sidebar 时叫「右方侧边栏」，驱动官方右侧栏的表面令牌与毛玻璃模糊（范围内每个 release 均适用）；安装了 dsh-better-sidebar 时改叫「bettersidebar」，接管其底部工作台面板（官方右侧栏同样生效）。该行现在始终显示。
- **顶栏选项** — 会话头部的下拉浮层获得了独立的透明度 + 模糊滑块：Agent Team 面板、后台任务列表、「用其它应用打开」与「会话日志」菜单、子代理血缘树。由于这些浮层被 portal 到 `<body>`（与头部 DOM 断开），且 0.1.7 把「用其它应用打开」改成 portal、把会话行菜单改成动态槽位，插件改为在运行时监听稳定的 `conversation.session.header*` 槽位锚点来标记当前展开的浮层，不再依赖类名形状。浮层算不算头部的判据是「portal 到了 `<body>`，**或者**就在这些锚点里面」——「会话日志」的 `…` 菜单属于后一种（`session-log-export/HeaderAction.tsx` 渲染它的 `Menu` 时不带 `portal`），而在 0.3.9 之前能碰到它的只有一条按 `_denseList` 类名匹配的脆弱分支。
- **标题栏（会话标题行）** — 会话顶部那条标题 / 操作 / 视图页签行终于有了自己的一对滑块。宿主自身不给它任何底色（中心列的底色直接透上来），所以壁纸一起来，标题与页签就直接压在图上、和周围被蒙住的表面割裂。现在它按「区块淡色」作画，配方与对话文本框那张卡一致：材质取插件主背景面的颜色、按本部件自己的透明度上色，读起来是压在列上的一条带，而不是叠上去的第二层颜色；模糊落在行前的一块 `::before` 垫层上（配合 `isolation:isolate`——它是层叠上下文，但**不是** backdrop root；0.3.8 之前霜直接压在行身上，而行一旦带上 `backdrop-filter` 就成了 backdrop root，恰恰把挂在行里的那些浮层的磨砂压成一片平色）；而这道霜仍然把行变成层叠上下文，所以行同时带上补偿性的 `z-index:10`——行内挂出的浮层（直到 `0.2.1-alpha.1` 的后台任务列表、每个 release 上都可能就地的日程任务菜单与「会话日志」`…` 菜单）本来用 `z-index:100`，否则会被关在行里、压到对话之下。10 高于它会重叠到的列内部件（输入位 9、回到底部 8），又远低于所有页面级表面（100 / 1000 / 1100），因此打开菜单时这一条的颜色和模糊都不会变；`z-index` 无需 `position`——该行本是 flex 子项，`z-index` 天然生效，而垫层要用的 `position:relative` 只在模糊非 0、且宿主把这一行留在 static 时才以内联方式写入。详见 v0.3.7 / v0.3.9。Windows 上它驱动的条带与侧栏分段（见上一条）；模态打开时条带会跟着宿主蒙版自行变暗（宿主蒙版故意停在标题区下方）；生成出来的那一段只负责绘制——`pointer-events:none` 且不声明 app-region——因此不会吞掉本该给原生标题栏菜单的点击（issue #29）。它还画在控件之下（`z-index:-1`），并自带墨色（`--dsh-any-caption-ink`）：即使侧栏透明度很低、条带发浅，开合按钮与「应用 / 编辑」菜单也清楚可读；而当条带的明暗与主题方向冲突时，由「标题条带文字」裁定谁获胜——「自动」沿用条带推导，「跟随主题」完全不写覆盖（回到宿主的标签墨色，即 0.3.7 及之前），「始终白色 / 始终黑色」直接钉死（issue #30）。这一行是**运行时认领**的：插件从 `conversation.session.header*` 槽位锚点向上找到最近的那个 `<header>` 再打上自己的类（与卡片、帧同款做法），不猜哈希类名、也不依赖宿主把槽位摆在哪个层级；`0.1.7-alpha.1` 之前宿主把槽位裸挂在会话根上、没有这一行元素，那种宿主上插件什么都不会认领，部件自然无效果。桌面壳（Windows）上这一对滑块同时驱动窗口标题条带——**但左侧栏正上方的那一段除外**，那一段归「侧栏」这对滑块管（见下条）；原生最小化/最大化/关闭那块改由取色探针报 `transparent`，让 Windows 不画自己的背景，露出的正是条带本身。空会话时宿主把该行标为 `headerBlank`（一条只留 padding 的占位），插件跳过认领。
- **侧边栏「主题」页面（双模式）** — 同一套五页（色彩 / 界面 / 字体 / 背景 / 配置）注册到两处：未安装 dsh-better-sidebar 时，通过官方右侧栏的公开扩展点（`sidebarRightTabs` + `sidebar.right.pane.tab`）在**官方侧边栏**的引导页挂一张「主题」卡片，点开即五页；安装了 dsh-better-sidebar 时，改为在它的侧边栏注册同名页面，官方引导页上的卡片自动撤下，避免重复。两处（加设置面板共三处）共用同一套页面代码与同一份状态，改一处处处同步；外壳按面板宽度自适应，窄面板收紧内边距并回到单列。宿主没有右侧栏扩展点时静默不注册，不影响任何其它功能。
- **对话视图卡片** — 消息列表自动包裹为半透明卡片，轨迹页可整页调节透明度与模糊，让壁纸从内容后方透出来。
- **主题导出 / 导入** — 一键导出为自包含的 `dsh-any-theme.json`（配置 + 壁纸，视频以 data URL 内嵌），可随时导入还原。
- **外观预设与配置档案** — 六套一键预设（默认 / 毛玻璃 / 极简白 / 暗夜紫 / 赛博 / 暖阳），外加自定义命名档案：随时保存当前观感、随时套回，删除有二次确认保护。
- **壁纸轮换** — 把多张图片加入轮换池（缩略图选择器），按随机或顺序、每次刷新 / 每天 / 每周的频率自动更换；切换时服务端把所选图片复制进当前壁纸槽，导出/导入与取色管线完全不用改。
- **昼夜自动切换** — 指定日间与夜间两套配置，按固定时段或跟随系统深色模式自动切换。
- **自定义字体** — 上传一个 ttf / otf / woff / woff2 字体文件（上限 100 MB），通过 `@font-face` 应用到整个界面的文字；可随时停用或移除。字体按原始字节流式上传并持久化到插件数据目录，代码块仍保持等宽字体。
- **分组文字描边** — 沿用界面页的分组（现为十一组，含顶栏选项与标题栏），为每个分组单独加 `-webkit-text-stroke` 描边：粗细 0–4 px（0 = 关闭），颜色支持自动反色 / 灰 / 黑 / 白 / 主题色 / 自定义。代码块、`inline code`、图标，以及宿主那类 `background-clip: text` 的流光文字（「深度求索中」状态行与轮次过程行）自动豁免——多色语法不会糊成一团，渐变文字也不会被描边压成一坨纯色。
- **强制界面明暗** — 无论主题色明暗如何，都能强制生成亮色/暗色整套令牌；「自动」下配色与字体方向由主题色明度驱动（深色 → 浅字，浅色 → 深字），未选主题色时按壁纸画面亮度判断。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 更新日志（只保留最近两个版本）

### v0.3.9（issue #30：条带墨色改由用户裁定；顶栏那对滑块重新管住所有头部浮层）

- **「标题条带文字」现在是一个选项（issue #30）。** 0.3.8 让条带墨色跟随它实际被画在什么上，这修好了「白色开合按钮在亮条带上消失」——但也让暗色主题下、侧栏半透明压在亮壁纸上时，原生菜单条（「应用 / 编辑」）变成黑色，因为那一段条带确实是亮的。同一个场景，两份反馈要的是相反的赢家，所以这个取舍交给用户：「标题栏」卡片新增「标题条带文字」——**自动**保持 0.3.8 的推导；**跟随主题**完全不发射覆盖（菜单条与侧栏 fixed 在条带上的控件读宿主自己的标签令牌，即 0.3.7 及之前的样子）；**始终白色 / 始终黑色**钉死。这个键同样补进了宿主半侧的白名单（#28 的教训是：只有一侧认识的键会在写盘时被静默丢弃），`npm test` 会把「落盘 → 重读」跑一遍，并断言未知值塌回 `auto`。
- **就地的头部浮层现在会被认领，而且认领不再等一帧。** `header-tag.ts` 过去只接受父节点是 `<body>` 的浮层，而 `session-log-export/HeaderAction.tsx` 的那个 `…` 菜单**不带 `portal`**，就地挂在 `[data-slot="conversation.session.header.utilities"]` 里，于是永远拿不到标记；唯一还在给它上色的，是顶栏组的 `[role="menu"][class*="_denseList"]:not([class*="_portal"])` 分支——宿主一旦不再标 `dense`（或者新增一个非 dense 的头部浮层）这条分支就失效，而在此之前那块面板一直跟着「卡片」滑块走，尽管它就悬在标题行上。认领条件现在是「portal 到 `<body>`，**或者**是头部某个槽位锚点的后代」：模态依旧绝不认领，输入位自己的就地列表也继续归卡片组。观察者的一次性 flush 也从 `requestAnimationFrame` 挪到了微任务队列——这才是「还是没生效」的另一半原因：**排下去的那一帧在窗口不绘制时根本不会跑**（后台标签页、被遮住或最小化的桌面窗口、后台的 Electron 表面），于是标记永远落不下，面板就一直保持着卡片组给它的样子。在真实 `dsh web` 里量过：页面不绘制时，一个打开的头部菜单无限期保持未标记；改成微任务后，同一个菜单在下一个微任务就被标记上了。微任务同样能把一批变更合并成一次（`MutationObserver` 的回调本就按批投递），却完全不依赖合成器；而且它落在浮层挂载的那一帧里，打开面板时不再有一帧的「卡片样式」闪动。
- **「标题栏」这一行的霜不再吞掉子层的模糊。** `backdrop-filter` 让标题行同时成为层叠上下文和 BACKDROP ROOT，于是挂在行内的就地浮层能采到的背景只剩这一行自己画的东西——一片平色——恰恰是这条从行上垂下来的面板，模糊滑块看起来完全失效。现在霜改走 `::before` 垫层（配 `isolation:isolate`：是层叠上下文，但**不是** backdrop root），也就是本插件给帧、输入位胶囊和各个部件列一直使用的配方；行继续保留补偿性的 `z-index:10`，而垫层需要的 `position:relative` 只在模糊非 0、且宿主把行留在 static 时才以内联方式写入。在真实 `dsh web` 里（配置档直接 link 本工作树，用界面页上真正的「顶栏选项」滑块驱动）：就地的 `…` 菜单与 portal 出去的「更多打开方式」菜单，在透明度 100 / 模糊 4 时都是 `rgba(243,247,252,1)`，在透明度 8 / 模糊 44 时都是 `rgba(243,247,252,0.08)` + `blur(44px)`。再用「跑真实插件代码 + 宿主安装产物 CSS」的浏览器复测：行的 `backdrop-filter: none`、其 `::before` 报告滑块的模糊值，而所有头部浮层形状（portal 的 dense `MenuSurface`、就地的 dense、就地的非 dense、无 role 的后台任务表面、子代理血缘树）都取「顶栏选项」的底色与磨砂，不再落到卡片组。
- **全新安装下界面透明度滑块不再是死的。** `readHostOpacityTokens()` 采的是 `getComputedStyle(:root)`，而 `design-platform.css` 把这一整套表面令牌声明在 `body { … }` 块里，自定义属性只会向下继承——于是没有选定主题色时每次读取都是空，`applyCustomTokensNow` 走 `surfaces === null` 那条出口，侧栏 / 卡片 / 输入框 / 顶栏选项的 alpha 从头到尾没被写出来。现在改从 `body` 采样，按宿主代次（它自己的深色标记 + 平台属性）缓存，并且读取时把插件自己那份 `body{}` 令牌表临时关掉——否则第二次采样拿回来的是插件自己刚写进去的字面量，表面颜色会冻结在第一次采到的那个值上，不再跟随宿主。
- **菜单模糊滑块拉到 0，现在就是没有磨砂。** 0.3.7 加过一个 `<html>` 类门控（`dab-card-frost` / `dab-header-frost`），让停在 0 的滑块不去抹宿主自己的 `--dsw-menu-backdrop-filter: blur(40px) saturate(150%)`（元素自身声明恒胜继承，所以未门控的 `var(--x, none)` 确实会清掉它）。事后看这个取舍是错的：它把滑块的**下端变成了最糊的一端**（0 → 宿主的 40px，1 → 1px），于是「把模糊度关掉」根本够不到，用户恰恰在那个位置上觉得控件是死的。现在这个 frost 令牌在每个取值上都被声明，0 时由 `none` 兜底胜出，门控机制整体删除。不会有人因此丢掉宿主观感：每个部件的默认值都是 30px，全新安装依旧是磨砂的，只有明确拖到 0 才会清掉。
- **版本表不动。** 上面这些形状都对着安装产物里的 `0.2.0-rc.1`、`0.2.1-alpha.3`、`0.2.1-rc.2` 三个构建复核过：两个 utilities 控件、`MenuSurface` 的 `data-menu-material` + `.material` 绘制层、菜单令牌集合三处一致，`0.2.1` 适配层的事实继续成立。


### v0.3.8（issue #28/#29 与桌面端侧栏：「标题栏」设置能落盘了，条带不再吞点击，模态蒙版够到标题区，侧栏重新是一个面）

- **「标题栏」的三项设置现在重启后还在。** 宿主半侧在写盘前会按白名单归一化（`normalizeConfig` → `theme-config.json`），而它那份配置形状一直没学会这张卡的三把键：`blurs.headerBar` 回落到 30px、`strokes.headerBar` 回落到 0 宽、`headerBarOpacity` 在写盘时被整条丢掉——浏览器半侧读回时又用自己的默认值回填（`clamp01(undefined,.5) → 50%`），于是看起来"保存成功、刷新即还原"。保存 Profile 的归一化器有同一个洞，还额外丢了 `blurs.header`。现在三把键都补进了宿主的 `PartBlurs`、`DEFAULT_CONFIG`、`STROKE_GROUPS`、两个归一化器和 `ProfileAppearance`；`npm test` 会用一个临时 `$DSH_HOME` 启起真正的宿主半侧，把「落盘 → 重读 → Profile」整条往返跑一遍，并断言不再出现 `ignoring unknown config field` 警告。
- **条带左段不再吞掉点击。** Chromium 按绘制顺序收集 `-webkit-app-region` 区域，0.3.7 给生成出来的那一段（`::after`）加的 drag 标注盖过了原生标题栏菜单为自己的按钮打出的 `no-drag` 洞——左上角导航点不动，而拖动窗口仍正常。这一段现在只负责绘制：`pointer-events:none`，并且完全不再声明 app-region；整条条带的拖拽区仍由宿主自己的 `.frame::before` 提供。
- **模态蒙版现在也能盖住标题条带。** 宿主的蒙版故意从标题栏下方开始（`--dsh-frame-chrome-top` = 标题栏高度），为的是保住原生拖拽条；结果壁纸一开，顶部 40px 就成了一条亮带。条带是本插件自己的绘制，所以模态存在时它自己变暗——`[data-windows-titlebar]:has([role="dialog"][aria-modal="true"])`，用的是宿主自己的 `--dsw-alias-bg-mask-1`，不改变任何交互。浏览器实测：关闭时 `box-shadow: none` → 打开时 inset 蒙版 → 关闭后恢复 none。
- **压在这条条带上的侧栏开合按钮重新看得见了，也不再被自身涂盖。** 同一个控件上叠了两个问题：其一，0.3.7 画的条带左段是一个定位盒子，在树序上**排在侧栏列之后**，而侧栏一开模糊就会成为层叠上下文——于是宿主固定在条带上的那个按钮被我们自己的板子冲淡；其二，按钮的墨色来自 `--dsw-alias-label-secondary`，插件是按**选定的主题色**把它翻成白色的，可条带显示的是该调色板在**侧栏透明度**下叠在壁纸上的结果：22% 不透明度压在明亮壁纸上，条带是浅色，白字就消失了（这次桌面端反馈的现象）。现在这一段以 `z-index:-1` 绘制——高于壁纸、低于所有控件；同时条带按它**实际被画在什么上**推导自己的墨色：不透明度约 85% 以上由表面色说了算（跟随调色板方向），低于此值由壁纸明暗判定说了算。结果发布为 `--dsh-any-caption-ink`，并带一个折叠态变体（用宿主自己的 `data-sidebar-collapsed` 标记切换——侧栏折叠后整条条带交还「标题栏」卡片），应用到原生标题栏菜单宿主，以及侧栏自己固定在条带上的控件（开合按钮，折叠时的新建会话按钮）。其它任何地方都不重新上色，且全程只是绘制层面。
- **条带是「两个主人」，这是设计。** 左侧栏上方那一段归「侧栏」这一对滑块（同一份材质、同一份模糊镜像）；侧栏宽度右侧全部归「标题栏」。所以移动标题栏滑块只会改变右段（issue #29 第 3 条）——分界就是宿主发布的 `--dsh-windows-sidebar-width`，拖动或折叠侧栏时它自己会跟着走。
- **侧栏重新读作「一个表面」，它的顶部与下方不再分层。** `--dsw-specific-sidebar-fill` 是宿主以**不透明**发布的主题令牌，而侧栏这个盒子里有三个元素各自声明了 `background:var(--dsw-specific-sidebar-fill)` 互相叠涂：`AppFrame` 的 `.sidebarCol`（网格列）、其内 `SidebarRoot` 的 `.root`（外壳本身）、以及工作区树那条 `.fade`（24px 渐变到底色）。底色不透明时叠几层看不出来，一交给「侧栏」透明度滑块就不是了；桌面端尤其明显——侧栏上方那条标题带是本插件自己的板子，用同一个变量、同一个不透明度只画一次，于是条带一个浓度、下面的列另一个浓度（就是这次桌面端反馈的分层）。现在这个令牌在列的**后代**上被重新声明为 `transparent`（`SIDEBAR_ONE_LAYER_RULE`），让最外层那个盒子成为唯一的绘制者——这也是宿主自己在 macOS 上的选择，`SidebarRoot.module.css` 正是为此把 `.root` 的底色清空。用宿主安装产物搭的 mock 实测：修前列 0.22 叠 `.root` 0.22（≈0.39）对 0.22 的条带；修后处处都是同一个 0.22。绑定用的是 CSS-Module 的类名形状（`[class*="_sidebarCol"]`，`0.2.0-rc.1` / `0.2.1-alpha.3` / `0.2.1-rc.2` 三处一致），所以哪个构建改了名，就只是回到未改动的宿主样子。
- **插件安装对话框里的「npm 源」面板保持宿主的不透明度。** `<fieldset data-install-registry>` 被 `createPortal` 到 `document.body`，是一个 `position:fixed; z-index:1100` 的面板，底色取自 `--dsw-alias-bg-layer-2`（面板自身与它的开关）和 `--dsw-alias-bg-layer-3`（展开态开关、手填地址的输入框）——这些都是「卡片」滑块全局接管的令牌，于是这块面板跟着卡片滑块一起变透明；而宿主写在那条规则上的注释恰恰相反：这层之所以不透明，是为了"让源选择表单控件压在对话框上仍然可读"。它因此并入 `applyExemptDefaults` 已经在维护的那组豁免（确认对话框、会话行菜单）：保持当前主题色、把 alpha 钉在 1，不撤模糊也不改字色，其它一律不动；钉的值同样要覆盖其子树，因为自定义属性只会向下传播，选项就在里面。
- **`0.2.1` 整条线合成一个渠道，并逐构建点名。** `0.2.1-alpha.3` 把后台任务列表改画到共享的 `MenuSurface` 上——表面根没有 `role`，底色与磨砂落到了它的 `.material` 子层——所以运行时标记器现在也会认领 body 级的 `[data-menu-material]` 表面，顶栏选择器组同步加了对应分支；更早那种自己上色的 `<ul class*="_menu">` 形状继续匹配。从 `alpha.3` 到 `rc.2` 逐 tag 核对：适配层发言的文件一个都没动（`design-platform.css`、`MenuSurface`、`MenuGroup`、`AppFrame`、`ConversationRoot`、`TaskMenu`、`preload-windows`、五个头部槽位）。`SidebarRight.module.css` 只给面板外层加了 `overflow:clip`（fixed 浮动子节点仍会逃逸），插件页重构过但三个列表锚点都在。于是 `0.2.1-alpha` 与 `0.2.1-rc` 合为一个 `0.2.1` 渠道，覆盖 `alpha.1`…`rc.2`，每个构建一条 `SUPPORTED_RELEASES` 行（均为 `exact`），`engines`/peer/`dsh.compatibility` 逐一点名，事实目录改名为 `v0-2-1`。

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) `0.2.0-rc.1` ~ `0.2.1-alpha.2`，其上所有版本一并放行** — `engines.dsh`、受门禁的 `@deepseek-ai/dsh-*` `peerDependencies` 与 `dsh.compatibility.dsh` 先逐一列出本插件核对过的构建（`0.2.0-rc.1`、`0.2.0-rc.2`、`0.2.1-alpha.1`、`0.2.1-alpha.2`），再以不设上界的 `>=0.2.0-rc.1` 收尾，让其后每一个 release 都能加载。不设上界是有意选的：宿主强制的正是这份 peer 列表——范围没写到的版本会在导入任何模块之前被整行禁用——一条写到头的范围等于在一款还能正常工作的插件前面砌墙。没见过的 release 会取最近的一份事实，并在日志里写清它离 `exact` 有多远；一份过期事实最坏的代价是某个滑块不再淡出宿主已经搬走的那个表面，而一道失败关闭的版本检查代价是整个插件。`dsh.compatibility.dshReleases` 记录哪些构建被核对过、怎么核对的：列表里的每个 release 都是按 tag 逐包比对其事实目录核实的。这道门禁也意味着安装或更新插件后仍需重启 `dsh web`——检查发生在 profile 组装时，而不是插件更新时——但不设上界的总括，正让已经升到更新宿主的机器不再需要先等插件发版（或手工授予精确版本豁免 `dsh plugin allow-version`）。宿主版本在运行时由 Node 半侧解析，依赖特定宿主版本渠道的功能（右侧栏面板模糊、官方侧栏「主题」卡片）只在对应宿主结构存在时启用，其余功能在整个范围内表现一致。**`0.1.5` / `0.1.6` / `0.1.7` 这一档已移出兼容范围**：那些事实目录断言的东西已经没有再被核对，而一张没人核对的表比没有表更糟；范围从 `0.2.0-rc.1` 起步，意味着更旧的宿主会在组装期被明确拒绝，而不是被一份错的适配事实悄悄改版式。
- **版本适配隔离**：release 由 Node 半侧从进程自身那份 `@deepseek-ai/dsh/package.json` 读出（客户端上下文不暴露版本；`ctx.profileContext.installAnchor` 指不到时退回启动器的磁盘布局），经 `read` RPC 下发后只由前置适配层路由——`src/host-compat/` 负责探测与渠道归类，`src/client/host-compat/versions/` 下**每个事实集合一个目录**（`v0-2-0-rc-1` / `v0-2-0-rc-2` / `v0-2-1` / `unknown`），各自描述该版本的面板力学、头部槽位键、插件页形状，以及菜单的底色与磨砂落在哪一层。目录按它覆盖的事实命名，不按版本号的形状：`0.2.0-rc.1` 与 `0.2.0-rc.2` 同属一个预发布渠道，但 rc.2 改了吸顶菜单分组标题取色的令牌，于是这条补丁行上并着两个目录，较新的那个按开启它的那个构建命名。**事实没变的更新版本不新开目录，而是并入那份仍然成立的事实目录**——整条 `0.2.1` 线（`alpha.1` … `rc.2`）正因如此都坐在 `v0-2-1` 里，每个核对过的构建各占一条 `SUPPORTED_RELEASES` 行，判定都是 `exact` 而不是 `line`。底码只向适配层提问（引导页表面归谁、模糊挂在哪一层、菜单该重写哪些令牌），不比较版本字符串。同一补丁行内的其它构建（`0.2.1-rc.3` 之于核对基准 `rc.2`）用该行的档位；整条补丁行都不在已核对范围内才收边取最近的一档并写日志——`0.2.1-rc.2` 之上的每一个 release 如今就是靠这一档加载的。只有解析不到 release 时归入 `unknown`，回退到按 DOM 形状探测（`:has()` 双臂）而不是猜一个版本；适配新宿主 = 新增一个版本目录并在注册表登记。
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness 安卓启动器（免 ROOT、免 Termux）。其包内 dsh 为 `0.1.5-rc.2`，自 v0.3.7 起**低于本插件的兼容下界**：peer 门禁会在组装期拒绝它，所以插件在那上面根本不加载，而不是拿 0.2.x 的事实去改版那个壳。
## 权限、副作用与边界

- **接入形态**：官方 Profile Bundle——`package.json` 声明 `dsh.bundle.patch: ./cordis.patch.yml`（loader 插入层），仓库提交可直接使用的预构建运行时制品（`lib/index.js`、`lib/client.js`），无安装脚本、无 postinstall、无 native 二进制、安装时不执行任何构建。
- **文件系统**：服务端仅在 `<dsh 主目录>/.dsh-any-background-data/` 内读写（配置 JSON、壁纸、轮换池、视频、字体），不触碰该目录之外的任何路径；配置写入为原子写（临时文件 + rename）。这些文件落在真实磁盘上，**不受 generation 恢复影响，也不会被其回滚**——清除它们即彻底重置插件。
- **网络**：仅在用户主动粘贴 http/https 图片或视频网址并点击「应用」时发起一次出站请求下载该资源；除此之外无遥测、无外部服务调用。
- **Shell / native**：无。不使用 `child_process`、不加载 native 模块、不运行动态下载的二进制。
- **HTTP 面**：仅在本机 dsh web 服务下注册 `/dsh-any-background/{video,wallpaper,font}`（GET/HEAD 流式服务）与对应 `*/upload`（POST，上限 100 MB）及专用 RPC 通道 `/dsh-any-background`；无新增对外监听端口。
- **是否需要重启**：首次安装后需（重新）启动 `dsh web` 加载客户端 bundle；此后的设置变更实时生效、自动落盘。更换插件版本后需重启以加载新的 `lib/client.js`。
- **测试与验证**：`pnpm run typecheck`（tsc 全量类型检查）与 `pnpm run bundle`（tsdown 产出 `lib/`）；无自动化单测，接口行为以手动验证为准。
- **已知限制**：依赖宿主 DOM 结构的稳定标记（如 `[data-sidebar-right-panel]`、`[data-dsh-bottom-panel]`）与 CSS 令牌名，宿主大版本重构样式层时选择器可能失效（表现为相关滑块不再作用于对应表面，不影响稳定性）；版本相关的那部分选择器集中在对应的版本目录里，宿主改版通常只需改那一份；`-webkit-text-stroke` 在部分单行省略号容器边缘约有 1px 裁切。

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## 许可

MIT
