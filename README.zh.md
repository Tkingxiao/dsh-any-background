# dsh-any-background

<p align="center">
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 版本" src="https://img.shields.io/npm/v/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/dsh-any-background"><img alt="npm 月下载量" src="https://img.shields.io/npm/dm/dsh-any-background?color=4d6bfe"></a>
  <a href="https://github.com/Tkingxiao/dsh-any-background/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/npm/l/dsh-any-background?color=4d6bfe"></a>
  <a href="https://www.npmjs.com/package/@deepseek-ai/dsh?activeTab=versions"><img alt="支持的 DSH 版本：0.1.5-rc.2 ~ 0.1.7-rc.1" src="https://img.shields.io/badge/DSH-0.1.5--rc.2%20~%200.1.7--rc.1-4d6bfe" /></a>
  <a href="https://github.com/topics/dsh-better-sidebar"><img alt="插件生态：GitHub topic dsh-better-sidebar" src="https://img.shields.io/badge/%E6%8F%92%E4%BB%B6%E7%94%9F%E6%80%81-topic%20dsh--better--sidebar-4d6bfe" /></a><br /><br />
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

[English](README.md) | 中文

一个 **DeepSeek Harness** 外观插件：自定义主题色、背景壁纸（图片 / 视频 / 算法动态生成），以及逐表面的透明度与模糊度控制。兼容 **DSH 0.1.5-rc.2 ~ 0.1.7-rc.1**（官方右侧栏「主题」卡片等界面按宿主是否提供右侧栏注册表扩展点自动启用，缺失时静默跳过）。

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
- **分部位界面透明度** — 主背景、侧边栏、卡片面板（含对话框周围的选项框/菜单）、输入框与控件（发送框、Cordis 插件面板）、设置面板、对话文本框、轨迹页、右方侧边栏（或 bettersidebar）、产出物/高亮内容，以及顶栏选项（Agent Team 面板、后台任务列表与会话头部下拉菜单）各自独立滑块。
- **分部位界面模糊度** — 每个界面部位可独立调整毛玻璃 `backdrop-filter` 模糊（0–60 px），并通过宿主的稳定选择器为发送框、Cordis 面板与弹出层提供真实背景模糊。
- **产出物 / 高亮内容** — 对话正文里的代码块（含语言顶栏）、行内 `code` 高亮芯片与产出物 chip 共用一支滑块：透明度只**调制这些表面原本的背景色**（不会在旧背景上再叠一层新色），模糊度给同一层表面加磨砂，壁纸从内容后方透出来。
- **右方侧边栏 / bettersidebar 表面** — 同一对滑块（`panelOpacity` / `blurs.panel`）按宿主环境自动切换目标：未安装 dsh-better-sidebar 时叫「右方侧边栏」，驱动官方右侧栏的表面令牌与毛玻璃模糊（0.1.5-rc.2 至 0.1.7 均适用）；安装了 dsh-better-sidebar 时改叫「bettersidebar」，接管其底部工作台面板（官方右侧栏同样生效）。该行现在始终显示。
- **顶栏选项** — 会话头部的下拉浮层获得了独立的透明度 + 模糊滑块：Agent Team 面板、后台任务列表、「用其它应用打开」与「会话日志」菜单、子代理血缘树。由于这些浮层被 portal 到 `<body>`（与头部 DOM 断开），且 0.1.7 把「用其它应用打开」改成 portal、把会话行菜单改成动态槽位，插件改为在运行时监听稳定的 `conversation.session.header*` 槽位锚点来标记当前展开的浮层，不再依赖类名形状。
- **侧边栏「主题」页面（双模式）** — 同一套五页（色彩 / 界面 / 字体 / 背景 / 配置）注册到两处：未安装 dsh-better-sidebar 时，通过官方右侧栏的公开扩展点（`sidebarRightTabs` + `sidebar.right.pane.tab`）在**官方侧边栏**的引导页挂一张「主题」卡片，点开即五页；安装了 dsh-better-sidebar 时，改为在它的侧边栏注册同名页面，官方引导页上的卡片自动撤下，避免重复。两处（加设置面板共三处）共用同一套页面代码与同一份状态，改一处处处同步；外壳按面板宽度自适应，窄面板收紧内边距并回到单列。宿主没有右侧栏扩展点时静默不注册，不影响任何其它功能。
- **对话视图卡片** — 消息列表自动包裹为半透明卡片，轨迹页可整页调节透明度与模糊，让壁纸从内容后方透出来。
- **主题导出 / 导入** — 一键导出为自包含的 `dsh-any-theme.json`（配置 + 壁纸，视频以 data URL 内嵌），可随时导入还原。
- **外观预设与配置档案** — 六套一键预设（默认 / 毛玻璃 / 极简白 / 暗夜紫 / 赛博 / 暖阳），外加自定义命名档案：随时保存当前观感、随时套回，删除有二次确认保护。
- **壁纸轮换** — 把多张图片加入轮换池（缩略图选择器），按随机或顺序、每次刷新 / 每天 / 每周的频率自动更换；切换时服务端把所选图片复制进当前壁纸槽，导出/导入与取色管线完全不用改。
- **昼夜自动切换** — 指定日间与夜间两套配置，按固定时段或跟随系统深色模式自动切换。
- **自定义字体** — 上传一个 ttf / otf / woff / woff2 字体文件（上限 100 MB），通过 `@font-face` 应用到整个界面的文字；可随时停用或移除。字体按原始字节流式上传并持久化到插件数据目录，代码块仍保持等宽字体。
- **分组文字描边** — 沿用界面页的分组（现为十组，含顶栏选项），为每个分组单独加 `-webkit-text-stroke` 描边：粗细 0–4 px（0 = 关闭），颜色支持自动反色 / 灰 / 黑 / 白 / 主题色 / 自定义。代码块、`inline code`、图标，以及宿主那类 `background-clip: text` 的流光文字（「深度求索中」状态行与轮次过程行）自动豁免——多色语法不会糊成一团，渐变文字也不会被描边压成一坨纯色。
- **强制界面明暗** — 无论主题色明暗如何，都能强制生成亮色/暗色整套令牌；「自动」下配色与字体方向由主题色明度驱动（深色 → 浅字，浅色 → 深字），未选主题色时按壁纸画面亮度判断。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 更新日志（只保留最新两个版本）

### v0.3.1（版本适配隔离：每个宿主版本一个目录）

- **前置版本检测层**：宿主 release 的探测与渠道归类收进 `src/host-compat/`（Node 半侧读取进程所由以启动的那份 `@deepseek-ai/dsh/package.json`，即 `ctx.profileContext.installAnchor`，拿不到时再退回启动器 `homes/<ver>` 旁边 `versions/<ver>` 里的同名清单与目录名，经 `read` RPC 下发），客户端侧由 `src/client/host-compat/` 承接判定、广播变更，并在判定到达时重切静态样式表。原本散落在 `src/client/host.ts` 与各消费方里的版本判定统一到这一层，该模块已删除。
- **每个版本一个独立目录**：`src/client/host-compat/versions/` 下 `v0-1-5-rc-2-3` / `v0-1-6-alpha-1-2` / `v0-1-7-alpha-1-2-rc-1` / `unknown` 各自描述本版本的面板力学（提升与模糊挂在哪一层）与头部槽位键，`versions/registry.ts` 是全插件唯一的「release → 代码」映射。底码只向适配层提问（引导页表面归谁、用哪些槽位选择器），不再出现版本字符串比较——适配新宿主等于新增一个目录并登记，底码不用动。
- **版本标识细化到发布渠道**：适配键不再是 `0.1.5` 这种补丁号，而是「补丁行 + 预发布渠道」的 `0.1.5-rc` / `0.1.6-alpha` / `0.1.7-alpha`。理由是每个目录的力学都是照着某个具体渠道的 tag 逐条核对出来的，把 `0.1.5-rc.3` 与假想中的 `0.1.5-beta.1` 记成同一个键，等于让未核对过的形状继承已核对过的结论。目录名与适配器 id 现在也直接写出核对过的具体 tag（`v0-1-6-alpha-1-2`，id 报 `0.1.6-alpha.1/alpha.2`），不打开目录就知道这张表覆盖到哪一步；同一条补丁行内两个构建确有差别的地方（`leading` 槽位与插件管理页都只在 `0.1.6-alpha.2` 起存在）由该目录自己带预发布门控。
- **落在已核对范围外的宿主按就近原则取档**：`src/host-compat/channel.ts` 里那张 `SUPPORTED_RELEASES` 表（`0.1.5-rc.2` / `0.1.6-alpha.2` / `0.1.7-alpha.2` / `0.1.7-rc.1`，从旧到新——一行记一个核对过事实的构建，所以同一条补丁行可以有两行）先按**补丁行**匹配：本机是 `0.1.6-alpha.4` 而表上只核对到 `0.1.6-alpha.2` 时，用的仍是 `0.1.6-alpha` 这一档（渠道序号只是同一条线里的构建计数，`0.1.6-alpha.1` 比核对基准更早的情况另有适配器就近处理）；`0.1.6-beta.1`、乃至假想中不带渠道的 `0.1.6` 也算同一条线，落回该线。整条补丁行都不在表上时才收边：高于最新一档取最新，低于最低一档取最低，夹在两档中间取**较低**的那一档（适配层只声明它核对过的东西）。这类收边判定会打一条日志说明「本宿主不在核对范围内，按 X 档处理」，新宿主报问题时应先看这行。只有**完全解析不到 release**（例如 `~/.dsh` 这种没有启动器布局的安装）才归入 `unknown`，交给 DOM 形状仲裁。
- **`0.1.7-rc.1` 进入已核对范围，且不需要新的适配目录**：把它与 `0.1.7-alpha.2` 逐包比对后，本插件匹配的每个锚点都还在原处，所以 0.1.7 目录只是在名字里多记了这个构建（`v0-1-7-alpha-1-2-rc-1`），并在 `SUPPORTED_RELEASES` 里多一行——rc.1 宿主的判定因此从 `line` 变成 `exact`。真正变了的是宿主读清单的方式：从 rc.1 起，profile 组装阶段会把插件声明的 `@deepseek-ai/dsh*` `peerDependencies` 与运行版本比对，范围不匹配就**在导入任何模块之前把该插件整行禁用**，唯一放行办法是在插件管理器里授予「精确版本豁免」（写进 profile 自己的 `compatibility.json`）。`engines.dsh` 仍然只是声明，决定插件能不能加载的是 peer 列表——七个 `@deepseek-ai/dsh-*` peer 因此都补上 `|| 0.1.7-rc.1`。
- **确定宿主版本时不再依赖 `:has()`**：解析到 release 的宿主直接发本版本的定位分支，不带 `:has()` 门。这顺带修掉一个潜在问题：在不支持 `:has()` 的引擎上，原来的门控会让 0.1.5 / 0.1.6 的面板提升整条失效。解析不到 release 时仍归入 `unknown`，由 DOM 形状（`:has()` 双臂）仲裁，而不是猜一个版本。
- **头部浮层选择器单一来源**：顶栏表面的选择器此前在 `wallpaper.ts` 里重复了三份，现在拼一次、由透明度与描边两条规则共用（描边那条刻意用不加 `[role]` 的原始标记，原因就近写明）。槽位键改由适配器提供，`0.1.6-alpha.2` 独有的 `leading` 槽位不再散落在底码里。
- **插件页的卡片列表加上块级底板**：`设置 → 插件` 里每组插件的 `ul` 自身没有表面，设置界面淡出后整张表直接浮在壁纸上。现在每个分组列表拿到与对话输入框同一套处理——`::before` 底板撑出圆角磨砂块，底色由「设置界面」这一组驱动、模糊由「设置模糊」驱动（0.1.7 上该页是 centerCol 的子节点而不是设置对话框的后代，只跟着对话框的令牌重挂就会读错滑块）。这条规则只由确实带该页的版本适配器发出，没有插件管理页的宿主不会背上匹配不到的选择器。
- **修复展开右侧栏动画期间壁纸消失**：AppFrame 自身的半透明底色此前是用内联 `background: transparent` 抹掉的，而宿主在侧栏开合动画里重写 `style` 时把它丢了——框架回到不透明，壁纸被盖住，其上每一层磨砂同时被压平（`backdrop-filter` 背后没有内容就无从模糊）。现在改为带 `!important` 的 class 规则，宿主的 style 写入碰不到它（同一个 frame 现场实测：不透明 `rgb(200,207,218)` → 挂上 class 后 `rgba(0,0,0,0)`，去掉又回到不透明）。
- **修复启动时「对话卡片」套到设置页上**：聊天视图尚未挂载时（例如开着设置面板启动），对话卡片的无标记回退会按几何挑「最大的可滚动元素」，于是设置里的页面被穿上卡片外壳、并挂上一层磨砂垫（`<div class="dab-part-underlay">`）覆盖整个窗口。现在回退只能细化**已经存在**的对话：中心列里找不到任何对话标记（`[data-chat-flow]` / `[data-conversation-scroll]` / `[data-composer-seat]` / `[data-conversation-composer-overlay]`）时不再靠几何猜；属于设置对话框表面的候选也一并拒绝。
- **修复分部位毛玻璃的覆盖区域**：承载磨砂的元素那条类名规则漏写了开头的点（`dab-part-blur{isolation:isolate}`），所以该层从来没建立自己的层叠上下文，`z-index:-1` 的磨砂垫跑进了页面级的层叠上下文——模糊取样的范围和落位的位置都不再对应那个表面（现场实测宿主元素的 `isolation` 计算值为 `auto`）。补上点号后磨砂回到表面自身之内。这个缺陷早于 v0.3.0 就存在。
- 更正了几条对宿主的错误假设：原生右侧栏与 `ctx.sidebarRightTabs` 并非新宿主特性（`0.1.5-rc.2` 即已提供），dockkit 本身也存在得更早——只有 `host` / `empty` 两个属性才是 0.1.7 的标记。
- README：兼容性一节新增「版本适配隔离」条目，已知限制补充版本相关选择器的所在层；引言不再暗示官方右侧栏特性只出现在新宿主上。

### v0.3.0（DSH 0.1.7 适配，兼容 0.1.5-rc.2 ~ 0.1.7-alpha.1）

- **适配 0.1.7 官方右侧栏**：宿主重做了该面板——它现在是一个**静止外框**，滑动位移落在内部的 dockkit 子元素（`[data-dockkit-host="dock"]` / `[data-dockkit-empty]`）上，且面板本身不再绘制背景。插件随之调整：模糊改挂在真正滑动的子元素上，因此会跟随侧边栏一起移动而不是卡在原地；表面令牌也改为在面板实际渲染处重新作用域。原先无条件的 `position:fixed` 提升已移除——在 0.1.7 上它会让面板脱离动画轨道。
- **修复 0.1.6 右方侧边栏模糊失效**：`[data-dockkit-host]` 从 0.1.7 才存在，所以基于子元素的选择器在 0.1.6 上匹配空集（0.1.6 的滑动打在面板自身）。现在新增一条用 `:has()` 门控的分支为面板包装元素加磨砂，且 pre-0.1.7 的提升只在真正需要处重新生效。
- **修复流光文字被描边压成纯色**：`-webkit-text-stroke` 是继承属性，对话文本框的规则会一路继承到 `background-clip: text` 的活动状态文字上——「深度求索中」状态行（0.1.5/0.1.6）与轮次过程 / 流光行（0.1.7）会被糊成一块描边色。现在这些表面按 `[role="status"]`、`[data-turn-process]` 与 TextShimmer 标记被显式豁免。
- **新增「顶栏选项」表面**：Agent Team 面板、后台任务列表、「用其它应用打开」/「会话日志」菜单与子代理血缘树拥有独立的透明度 + 模糊滑块，以及对应的描边分组。这些浮层被 portal 到 `<body>`（与头部断开），且 0.1.7 把「用其它应用打开」改为 portal、把会话行菜单改为动态槽位，因此插件新增一个运行时标记器，监听稳定的 `conversation.session.header*` 槽位锚点来标记展开的浮层。豁免的确认对话框与会话行菜单用真实颜色字面量钉死——不再使用自引用的 `var()` 回退，那是 CSS 循环，会让表面彻底透明。
- **宿主版本探测**：客户端上下文不暴露宿主版本（`window.__DSH_BOOT__.version` 是模块表格式标记，不是 release），因此改由 Node 半侧从启动器的磁盘布局解析出 release 与渠道（`0.1.7-alpha` 这一级），再经 `read` RPC 下发。功能开关据此判定；无法确定时回退到能力探测，而不是猜一个版本。
- **原生适配官方右侧栏**：通过官方公开扩展点（`ctx.sidebarRightTabs` 注册页面类型 + `sidebar.right.pane.tab` 键控槽位挂载页面本体）在官方侧边栏的引导页挂上「主题」卡片，点开就是和设置面板一样的五页。未安装 dsh-better-sidebar 时生效；装了 better-sidebar 则让位给它自己的「主题」页（官方引导页卡片自动撤下，不重复占位）。注册走运行时动态等待：宿主没有右侧栏注册表 API 时静默跳过，旧宿主不受影响。
- **右方侧边栏栏位随环境改名**：界面页的面板分组（`panelOpacity` / `blurs.panel`）未安装 better-sidebar 时显示为「右方侧边栏」，直接驱动官方右侧栏的表面令牌与毛玻璃模糊（0.1.5-rc.2 至 0.1.7 均适用，该行现在始终显示）；安装了 better-sidebar 时改名为「bettersidebar」，语义不变。
- better-sidebar 存在性探测摘除了 `[data-sidebar-right-panel]` 标记——各代宿主中它都是官方右侧栏的稳定标记（随会话始终存在），继续计数会让「bettersidebar」判定永远为真。
- 兼容性声明现已覆盖 `0.1.5-rc.2`、`0.1.5-rc.3`、`0.1.6-alpha.1`、`0.1.6-alpha.2`、`0.1.7-alpha.1`；peerDependencies 放宽为同时覆盖各代客户端包版本；`@deepseek-ai/dsh-home-paths` 维持与 lockfile 一致的 `^0.1.0-rc.6`（仅构建期使用，运行时由宿主注入自身版本）。

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness) 0.1.5-rc.2 ~ 0.1.7-rc.1** — 兼容范围覆盖全部七个已发布版本（`0.1.6-alpha.2` 与 `0.1.7-alpha.1`、`0.1.7-alpha.2` 已实测验证，`0.1.7-rc.1` 以逐包比对核对）；`engines.dsh`、`@deepseek-ai/dsh-*` 的 `peerDependencies` 与 `dsh.compatibility.dshReleases` 都逐一列出——从 `0.1.7-rc.1` 起宿主自己就会按 peer 列表拒绝加载，列不列决定插件能不能跑，不是写给人看的说明。宿主版本在运行时由 Node 半侧解析，依赖特定宿主版本渠道的功能（右侧栏面板模糊、官方侧栏「主题」卡片）只在对应宿主结构存在时启用，其余功能在整个范围内表现一致。
- **版本适配隔离**：release 由 Node 半侧从进程自身那份 `@deepseek-ai/dsh/package.json` 读出（客户端上下文不暴露版本；`ctx.profileContext.installAnchor` 指不到时退回启动器的磁盘布局），经 `read` RPC 下发后只由前置适配层路由——`src/host-compat/` 负责探测与渠道归类，`src/client/host-compat/versions/` 下**每个版本一个目录**（`v0-1-5-rc-2-3` / `v0-1-6-alpha-1-2` / `v0-1-7-alpha-1-2-rc-1` / `unknown`），各自描述该版本的面板力学与头部槽位键。底码只向适配层提问（引导页表面归谁、模糊挂在哪一层），不比较版本字符串。同一补丁行内的其它构建（`0.1.6-alpha.4` 之于核对基准 `0.1.6-alpha.2`）用该行的档位；整条补丁行都不在已核对范围内才收边取最近的一档并写日志。只有解析不到 release 时归入 `unknown`，回退到按 DOM 形状探测（`:has()` 双臂）而不是猜一个版本；适配新宿主 = 新增一个版本目录并在注册表登记。
- **[DSHA](https://github.com/DSH-APP/DSHA)** — DeepSeek Harness 安卓启动器（免 ROOT、免 Termux）。其包内 dsh 为 `0.1.5-rc.2`，落在兼容范围内；移动端界面由 `dsh-web-mobile` 提供。
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 支持

## 权限、副作用与边界

- **接入形态**：官方 Profile Bundle——`package.json` 声明 `dsh.bundle.patch: ./cordis.patch.yml`（loader 插入层），仓库提交可直接使用的预构建运行时制品（`lib/index.js`、`lib/invariant.js`、`lib/client.js`），无安装脚本、无 postinstall、无 native 二进制、安装时不执行任何构建。
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
