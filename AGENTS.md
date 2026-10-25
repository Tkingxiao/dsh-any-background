# AGENTS.md — dsh-any-background 检查与测试手册

本文件由 46 个提交（v0.1 → v0.3.9）里每一次**真实发生过的回归**反推而来，目的是让任何一次改动
在提交前把该踩的坑踩完。每条都带出处，不是通用建议。

- 修 bug：先在 §2 找到对应缺陷类别，按它的"检查路径"逐项过。
- 加功能：先看 §3 的"改动 → 必查"表，再动手。
- 不确定怎么验：§4 说明四条测试路径各自能证明什么、**不能**证明什么。
- 改完必须回来补条目（§6）。

---

## 0. 这个仓库怎么运转

| 事实 | 位置 | 后果 |
|---|---|---|
| 两半结构：Node 宿主半 + 浏览器客户端半 | `src/index.ts` → `lib/index.js`；`src/client/**` → `lib/client.js` | 同一份配置形状存在两处，任一侧不认识键就会静默丢（§2-A） |
| **构建产物入库** | `lib/` 是提交内容，`tsdown` 生成（`tsdown.config.ts` 两套 config） | 改了 `src/` 不重新 bundle 就提交 = 发出去的是旧代码（用户装到的就是它） |
| 客户端产物是 CJS 包壳 | banner：`window.__ModuleLoader__.load({id, factory})` | 宿主运行时按 id 取模块；`react` / `@deepseek-ai/dsh-*` 是 external，不能自己引 |
| **发布物白名单很短** | `package.json` 的 `files`：`lib/index.js`、`lib/client.js`、`lib/client.js.map`、`cordis.patch.yml` | 新增任何运行时文件必须同时进 `files` 与 `exports`；`e58e9a4` 就是 `types` 指向了根本没生成的 `lib/types` |
| 装载入口靠 bundle patch | `dsh.bundle.patch = ./cordis.patch.yml`（根目录的 `cordis.yml` 是给 `dsh web --patch ./cordis.yml` 用的开发插层，**不在** `files` 里） | 改了 patch 层却没进 `files` = 装出来的插件没有插层 |
| 配置落盘在真实磁盘 | `<DSH_HOME>/.dsh-any-background-data/theme-config.json` | **在 generation restore 之外**：回滚主题不会还原插件设置，删目录 = 整体重置 |
| 版本事实按 release 隔离 | `src/host-compat/channel.ts`、`src/client/host-compat/versions/<目录>/` | 样式/逻辑代码里出现版本号比较 = 架构违规（§2-D） |
| 静态样式表只有一张，顺序即语义 | `src/client/host-compat/styles.ts: buildStaticStyles()` | 挪动拼接顺序会改变胜负（§2-E） |
| 动态写盘的另一半 | `style[data-plugin="…-tokens" / "-header" / "-exempt" / "-wco" / "-parts" / "-table-fix"]` | 现场调试先看这几张表（§4.3），比读代码快 |
| body 级 MutationObserver 只有一个 | `src/client/dom-watch.ts`（统一 bus：childList+subtree+`aria-expanded`） | 新的 DOM 观察订阅 bus，不要自建 observer（parts / header-tag / env / navIcon 四个原来各自一个）；最后一个退订自动断开 |
| 轮换到期/选图数学双端共享 | `src/shared/rotation.ts`（tsdown 内联进两个 bundle） | 改日/周/随机语义只改这一处；在任一半侧重写 = 两端推进会打架 |

---

## 1. 提交前必跑（顺序执行，全部要绿）

```bash
npx tsc -p tsconfig.json --noEmit   # 类型：版本目录、adapter 字段、配置形状都靠它兜底
npm run bundle                      # 必须跑：lib/ 是发布物
npm test                            # 真起宿主半侧，跑「写盘 → 重读 → Profile」往返
```

视觉/CSS 类改动**再加一步真机冒烟**（§4.3）：mock 证明不了"拖了滑块那块真的变"，本仓库已经
两次在 mock 全绿后被用户告知"还是失效"（v0.3.9 的 rAF 饿死、0 语义反向）。

最后四条人工核对：

1. `git diff --stat` 里 `lib/client.js` / `lib/index.js` 与 `src/` 同批出现。
2. 版本号：`package.json` 的 `version` 已升；`README.md` / `README.zh.md` changelog 新增段落
   （**只保留最近两个版本**，第三老的整段删掉）。
3. 双语同步：`src/client/i18n.ts` 中英两套 key 数量一致 —— 宿主 locale 的回退是 `?? key`
   （`packages/client/locale/src/client/index.ts:470`），漏 key 会把 `settings.anyBg.xxx` 直接
   渲染到界面上；两份 README 要点一致；界面文案变了要顺带核对 `example_img/` 是否还相符。
4. `git status` 里没有 `tmp-*`、壁纸、`theme-config.json` 等本机产物。

---

## 2. 缺陷类型清单

### A. 配置形状两半不一致 —— 出现频率最高

**症状**：滑块能动、看起来保存成功，重启后回到默认值；控制台有 `ignoring unknown config field "…"`。

**根因模式**：`writeConfig()` 先过 `normalizeConfig()` 白名单再落盘，白名单没有的键**写不进去**；
浏览器半侧 `adoptConfig()` 的列表里却有，读回时用客户端默认值回填。

**检查路径**（新增/改名任何配置键，五处全要走）：
`src/index.ts` 的 `ThemeConfig` → `DEFAULT_CONFIG` → `normalizeConfig`（含 `blurs` / `strokes`
子白名单、`STROKE_GROUPS`）→ `ProfileAppearance` + `normalizeProfileAppearance`（如果要进 Profile）
→ `src/client/types.ts` + `src/client/state.ts` 的 `DEFAULT_CONFIG` / `adoptConfig` / `r*()` 读函数。

**实例**：v0.2.8 `produced`、v0.3.8 `blurs.headerBar` / `headerBarOpacity` / `strokes.headerBar`
（issue #28、#29②）、v0.3.9 `captionInk`。
**防线**：`scripts/smoke.mjs` —— 每加一个键加一条断言（默认值 + 写入落盘 + 重读一致 + 非法值塌回
默认 + 无 drift 警告）。

### B. RPC 通道与端点

**症状**：装了插件后宿主全部 slash 命令 404；或 0.1.5 上设置根本不持久化。

**规则**：只用自己作用域的通道 —— `handle('/dsh-any-background')`，**绝不**碰共享 `/api`
（`13fe424` 事故）；持久化路由要在插件自己的 webServer 作用域注册 prefix 路由并保留 Host/Origin
鉴权（`d30370e`）。

**测试注意**：端点格式是 `dshAnyBackground/<method>`，**URL 尾段和 envelope 的 `method` 两处都要**，
写成裸方法名会得到 `unknown endpoint`（写 smoke test 时踩过）。

### C. 宿主版本门禁

**症状**：新宿主一发布，插件整包不加载，界面无任何提示（issue #19、#20）。

**检查路径**：`engines.dsh`、六条 `@deepseek-ai/dsh-*` `peerDependencies`、`dsh.compatibility.dsh`、
`dsh.compatibility.dshReleases` 四处一起改。宿主**只对前缀是 `@deepseek-ai/dsh` / `dsh-*` 的 peer**
做门禁（`packages/boot/app-boot/src/plugin-compatibility.ts`，`semver.satisfies(…, {includePrerelease:true})`）
—— `@deepseek-ai/cordis`、`react`、`dsh-better-sidebar` 不参与，别误算。

**红线**：**不要 fail closed**，门禁收窄 = 一堵墙。策略是"逐点名列举已验证构建 + 一个不封顶的 `>=`"。
装/更新插件后必须重启宿主（门禁在**组装 profile 时**跑，不在更新时跑）—— 这条要写进 issue 回复。

### D. 版本事实隔离

- 新宿主 = 新增 `src/client/host-compat/versions/<目录>/` + `registry.ts` 一行 + `channel.ts` 的
  `KnownChannel`/`channelOf`；目录名按**它事实验证过的 tag** 命名（`v0-2-1`、`v0-2-0-rc-2`）。
- 事实粒度按"事实"切，不按版本号形状：`0.2.0-rc.1` 与 `rc.2` 同渠道，但 rc.2 改了粘性分组标题的
  令牌名，于是两个目录。
- 消费方只问问题（`hostAdapter().menus.frostDecl`、`surface.headerSlotKeys`），不比对字符串。
- 客户端**探测不到**宿主版本：版本由 Node 半解析（`ctx.profileContext.installAnchor`）随 `read`
  RPC 载荷下发，`release.ts: adoptHostInfo` 采纳 —— 所以 RPC 失败时跑的是 `unknown` 适配层，
  第一张静态表是 DOM 仲裁版，这是设计不是 bug。
- 未验证的新构建：夹到最近的行并在日志里说明（`detect.ts` 的 `exact` / `line` / `nearest`）。
  猜错最坏只错一个滑块；门禁失败会整个插件不见。
- **删旧目录要连根删**：`SUPPORTED_RELEASES` 行、渠道键、失去引用者的常量（`LEGACY_MENU_SURFACE`、
  `prereleaseOf` 都是这么清掉的）。

### E. CSS 层叠与自定义属性陷阱（本仓库最贵的坑）

| 陷阱 | 规则 | 实例 |
|---|---|---|
| 元素自身声明恒胜继承 | 给宿主令牌写 `var(--x, none)` 不是"不加值"，是**删掉宿主的默认值** | v0.3.7 的菜单霜门控 → v0.3.9 撤销：**滑块 0 = 关**，默认值 30px 保证全新安装不丢宿主观感 |
| 0 的语义必须全局一致且双向检查 | 每个滑块都要问"0 = 关 还是 0 = 跟随宿主"，并检查 0 与"未设置"两种取值各画出什么 | v0.3.9：0 被解释成"保留宿主磨砂"后，滑块下端成了最糊的一端，用户报"模糊度无用" |
| 自引用回退是循环 | `--a: var(--a, …)` 计算成 guaranteed-invalid → 所有 `background:var(--a)` **全透明** | `applyExemptDefaults` 因此改成"解析出真实字面量再写"，解析不到就**一条声明都不发** |
| `var()` 指向未设置的属性 | 同上，宁可不发声明 | `applyHeaderPopovers` / `applyExemptDefaults` 的 bail 分支 |
| 同令牌 + 同选择器 + 同优先级 | 胜负退化成样式表插入顺序 | 宿主 `base.css` 从某版起也在 `body` 合成 `--dsw-font-family` → 字体规则加 `!important` |
| `:where()` 不花优先级 | 门控要零成本时用 `:where(.cls)`，否则会压过本该赢的对手 | 菜单霜门控用过（已撤销，见上两条） |
| 宿主令牌声明在 `body`，不在 `:root` | 自定义属性只向下继承：在 `:root` 上读 `--dsw-specific-*` 恒为空 | v0.3.9：`readHostOpacityTokens()` 读错元素 → 无主题色时**所有**透明度滑块是死的 |
| 读自己写过的值 = 回声 | 采样宿主令牌时要把插件自己的 `body{}` 表关掉，且按宿主代次缓存 | 同上 |
| CSS Module 哈希类名 | 用形状 `[class*="_localName"]`（产物是 `<hash>_<local>`），别写死哈希；宿主改名就自然失效（= 保持宿主原样） | `[class*="_sidebarCol"]`、`[class*="_ioCard"]`、`[class*="_panel"]` |
| 规范问题去查规范，别猜 | `isolation:isolate` 造层叠上下文但**不**造 backdrop root；`clip-path`/`opacity<1`/`mask` 才造 | v0.3.9 判"行霜吞掉子层模糊"时以 MDN 列表为准 |

### F. `backdrop-filter` 三宗罪

`backdrop-filter` / `filter` 非 `none` 同时造成：**层叠上下文** + **fixed 后代的包含块** +
**backdrop root**。`isolation:isolate` 只造成层叠上下文。

**规则**：磨砂永远走 `::before` 垫层 + `isolation:isolate`，绝不直接压在宿主部件上。
**实例**：
- v0.3.5 把霜压在会话标题行 → 行内挂出的 `z-index:100` 菜单被关进行内、压到对话之下（issue #26）。
  修法是给行补 `z-index:10`（高于 `.seat` 9 / 回底 8 / 页脚 7 / `.tabs` 1，远低于 portal 100 /
  模态 1000 / 统计面板 1100），**不是**用 `:has()` 撤霜。
- v0.3.9 行霜改垫层后，就地浮层才重新采得到壁纸（此前"顶栏模糊度无效"的另一半）。
- 模态打开时撤隔离（`:has([role="dialog"])`）是**故意**的：看不见对话框是死路，丢一会儿磨砂是便宜。

### G. 认领 / 误认领（谁的表面归谁）

- **单一持有者**：切换会话、行变空（宿主标 `headerBlank`）时旧类必须摘掉（v0.3.6）。
- **形状判别**：设置面板用 `[class*="_panel"]` + `aria-labelledby` 与 antd 弹窗区分（v0.3.2 误认领
  第三方 Modal → 它继承了设置面板的底色/模糊/描边）。
- **排除项要写两遍**：dockkit 标签菜单既是 `[role="menu"]` 也是 `MenuSurface`，
  `:not([data-dockkit-tab-menu])` 在两条分支上都要有。
- **portal vs 就地**（v0.3.9）：`session-log-export` 的 `…` 菜单**不带 `portal`**，就地挂在
  `[data-slot="conversation.session.header.utilities"]` 里 → 认领条件必须是"body 直接子级 **或**
  头部锚点后代"，只认 body 就会漏。
- **启发式有代价就写清楚**：`:has([class*="_danger"])` 近似"会话行菜单"，也会命中 `TaskMenu` 的
  危险行；这是已知取舍，别当 bug 乱改。
- **保持原样的豁免**：宿主刻意不透明的东西（安装对话框的 `fieldset[data-install-registry]`）要并入
  `applyExemptDefaults` 的钉组（含子树，因为自定义属性只向下传）。

### H. 计时与"窗口是否在绘制"

**症状**：控件在测试环境里没反应，在用户机器上偶发没反应。

**规则**：DOM 驱动的一致性检查**不要挂在 `requestAnimationFrame` 上** —— 页面不绘制（隐藏标签页、
被遮挡/最小化的桌面窗口、后台 Electron 表面）时排下去的帧根本不跑。`MutationObserver` 回调本就按批
在微任务时点投递，用微任务合批同样省，且不依赖合成器（v0.3.9 的 `header-tag.ts: schedule()`）。
teardown 之后要有 `active` 闸门，防止已排队的回调把标记再写回去。
**把任何逻辑接进周期性 tick 前，先问它对"恒为真"的输入会怎样**：v0.4.0 把 `maybeRotate()` 挂进
30 秒的 `scheduleTick`（注释还写着"数学门控，没到期是空操作"），但 `rotationDue` 对 `reload`
档位**无条件返回 true**——那是"每次 read 换一张"的实现方式，接进 tick 就成了壁纸每 30 秒自动切换
（v0.4.1 修：`shared/rotation.ts: rotationAdvancesLive()` 划定只有时间档位参与活推进，`reload`
只在 read / 手动按钮 / boot 回退里推进）。tick 的其他触发源（系统明暗变化、开启昼夜定时）同理会被
放大，修这类问题要连调用图一起看，不止 setInterval 那一处。

### I. 一个表面只涂一次 alpha

宿主令牌是不透明色，叠几层看不出来；插件把它变半透明后，每多一层就多一次 alpha。

**检查方法**：对每个被滑块接管的令牌，`grep` 宿主里所有 `background:var(该令牌)` 的消费者，
数目标区域里有几层。
**实例**：`--dsw-specific-sidebar-fill` 在侧栏区域被 `.sidebarCol`、`SidebarRoot .root`、
`WorkspaceBrowser .fade` 各涂一次，而上方标题条带只涂一次 → "顶部和下面分层"（v0.3.8
`SIDEBAR_ONE_LAYER_RULE`：把令牌在列的后代上置 `transparent`，让最外层列做唯一绘制者 —— 这也是
宿主自己在 macOS 上的选择）。同类：`FRAME_CLEAR_RULE` 清帧底色、`PRODUCED_RULE` 清不透明包层。

### J. 明暗判定与取色

- 方向判定不要用真值短路（v0.2.5：`scheme='light'` 是真值，导致强制亮暗都走深色分支）。
- 亮度度量统一 Rec.709（壁纸判定与自动取色同一把尺子）。
- 有主题色时字体与表面方向由**主题色明度**驱动；无主题色时才由壁纸亮度驱动 —— 两者要分开，
  别把壁纸 verdict 当主题方向用。
- 强制方向与主题色明度冲突时，明度镜像映射进目标区间再建令牌，色相/饱和度不变（v0.2.5）。
- **条带/铬用墨的冲突要交给用户**：宿主标签色跟随主题，而条带是"主题色 × 侧栏透明度 × 壁纸"，
  低透明度下可能反向。v0.3.8 用 composite 推导修好"白按钮看不见"，v0.3.9 就收到 issue #30
  "暗主题下应用/编辑变黑"—— 同一场景两种诉求，所以做成「标题条带文字」四态选项，不再猜赢家。

### K. 二进制、限额与文件路径

- 上限集中在 `src/index.ts`：壁纸上传 100 MB、视频 2 GB、字体 100 MB、URL 拉取壁纸 25 MB /
  视频 2 GB、Profile 20 个、轮换池 30 项、缩略图 64 KB。**改上限要连 UI 文案一起改**。
- 拒绝时必须把"原因 + 限额"一起回给 UI（只回"失败"会让超大壁纸看起来像静默无操作）。
- MIME 要落盘并用于 `@font-face` 的 `format()`；视频走原生 HTTP + Range 流式；帧快照只用于预览。
- 配置写入是原子（temp + rename）；这些文件**不在 generation restore 范围内**。

### L. 桌面壳交互（Windows）

- `-webkit-app-region` **按绘制序收集**：插件生成的层上标 `drag` 会覆盖原生标题栏菜单自己挖的
  `no-drag` 洞 → 左上控件点不动但窗口还能拖（issue #29①）。生成段一律 **paint-only**
  （`pointer-events:none`，完全不声明 app-region）。
- 宿主蒙版故意从标题栏下方开始（`--dsh-frame-chrome-top`），条带是插件自绘 → 模态时自己变暗（#29④）。
- 原生最小化/最大化/关闭块**没有页面侧 IPC**：唯一杠杆是 preload 的探针 `<span>`，它读
  `--dsw-specific-sidebar-fill` 与 `--dsw-alias-label-primary` → 探针喂 `transparent` 让 Windows
  别自绘背景；**滑块动时要重写规则文本**，探针才重新量得到。
- 分段依据是宿主发在帧元素上的 `--dsh-windows-sidebar-width`（Windows only），折叠时宽度 0 自动整条交还。

### M. 平台 / 宿主形态差异

`data-windows-titlebar`（桌面壳）、`data-platform='darwin'`（宿主自己清 `.root` 底色、藏 `.fade`
渐变）、移动端 `dsh-web-mobile` / DSHA（窄视口、`MOBILE_HEADER_RULE`、编辑器触摸手势）、
以及"官方右侧栏 vs dsh-better-sidebar"两种面板归属。依赖某形态的功能必须**结构探测**，不要假设。

### N. 宿主皮肤注册与主题守护

- 只有 `registerCustom()` 真注册成功才 `setTheme(CUSTOM_ID)`；注册失败要回退到宿主皮肤，
  否则宿主在 apply 时崩（`e58e9a4`）。HMR 会重复注册 —— 先 dispose 再注册，中间态注册表里没有
  `CUSTOM_ID`，`theme/change` 回调要按"注册表存在"设闸。
- 宿主重置主题会**静默**丢掉插件偏好 → `watchThemeResets()` 重新激活；皮肤偏好是内存态，
  宿主 adoption 后也要重发。
- 深色标记用插件专用值 `body[data-ds-dark-theme="dsh-any-background"]`，不要复用宿主的属性值
  （`e58e9a4`：选择器与设置值不一致 → 深色渐变根本不生效）。
- 令牌要写成样式表规则而不是 `body.style`，因为宿主会在启动时清 body 内联样式（v0.3.x 注释）。

### O. 生命周期与卸载残留（新增写入就必须新增清理）

**症状**：卸载/停用插件后界面残留半个样式，或反复开关后越用越慢。

**规则**：任何写入 DOM 的东西（类、属性、内联样式、`<style>`、插入的垫层、observer、interval、
`ctx.on(...)` 订阅）都必须有对应 teardown，且 teardown 要**幂等**：
`teardownWp()` / `stopWatchingParts()` / `mountStaticStyles()` 返回的 unsubscribe /
`ctx.effect(() => …)` 注册的清理。守卫式内联写的 `position` 用 `data-dab-pos-patched` 标记，
**只有写入者能清**；`markerSeen` 这类缓存在 teardown 时必须清空（旧证据不代表当前 DOM）。

### P. 启动时序与首屏

- boot 时持久化状态还没加载完，**不要**用 `rColor()` 的默认值发令牌（会闪一下默认色）；
  透明度可以无条件发，颜色必须等有条件（v0.3.x 的 `applyWp` 注释）。
- 到期轮换要在 `read` 里由服务端直接推进，首屏就是新壁纸，不做二次刷新（v0.2.5）。
- 静态表在版本判定落地前是 `unknown` 版（DOM 仲裁），落地后整表替换 —— 别把两套都留在页面上。
- 页面直接读 `cfg` 的地方要订阅 `metaRev`，否则预设/导入/Profile 改完界面还显示旧值（v0.2.10）。

### Q. 插件互不越界

不抢共享通道（§B）、不写别人的 slot、不假设别的插件的 DOM 或加载顺序；`dsh-better-sidebar` 是
可选 peer，功能要探测它在不在（`startBetterSidebarWatch`）。宿主对不兼容插件是"跳过并警告"，
我们宁可少功能也不能带崩宿主 —— 这条也是 §C 不收窄门禁的另一个理由。
**插件自己抛出去的东西会带走宿主**：五页都包在 `components/ErrorBoundary.tsx` 里
（`ThemeSection.tsx` 用 `<ErrorBoundary t={t}>` 包住），新增页面/入口必须留在它内部；
宿主扩展点（`sidebarRightTabs` / `slots.contribute`）的返回值要判空，注册不上就静默不注册，
不要 throw。

### R. 性能

拖滑块的路径只改 CSS 变量，不重建规则文本（`OPACITY_VARS` / `--dsh-any-*` 的设计初衷）；
observer 回调必须合批 + 早退（`needsPartsPass` + 值签名 + 目标身份三重门）；大壁纸上避免每帧
`getComputedStyle`；采样宿主令牌要按代次缓存（§E 回声条）。

### S. 文档与发布

README 双语；changelog 只留最近两版；`dshReleases` 记录"怎么验证的"（逐 tag diff / 上手实测）；
release 标题与提交主题一致；issue 回复要带根因 + 验证数字 + "重启宿主"提醒。

---

## 3. 改动 → 必查映射

| 你改了这个 | 必须同时检查 |
|---|---|
| 任何配置键（增/改名/改默认） | §2-A 五处 + `scripts/smoke.mjs` 断言 + `utils/presets.ts` 是否要带 + i18n 标签 + `ProfileAppearance`（要不要进 Profile） |
| 一条 CSS 规则（`wallpaper.ts` 常量） | `styles.ts` 里的**位置**（谁该赢）、优先级、`0` 与"未设置"两种取值各画出什么（§E 第 2 行） |
| 认领 / 标记逻辑 | 单一持有者摘除、空态排除、portal 与就地两种形状、误认领邻居（dockkit / antd / 输入位）、teardown 能摘干净（§O） |
| 磨砂（任何 `backdrop-filter`） | 是否压在宿主部件上（三宗罪）、模态撤隔离、`0` 的语义、宿主同名令牌是否被覆盖 |
| 版本事实（新宿主） | §C 四处 + §D 三处 + `dshReleases` + README 兼容性段 |
| 滑块 / 选择器 UI | `onInput` 与 `onChange` 两条路径都落值；`metaRev` 订阅；禁用态与越界值；双语标签 |
| 取色 / 明暗 | 强制方向 × 主题色明度 × 壁纸 verdict 的 2×2×3 组合；无主题色分支；皮肤注册（§N） |
| 轮换档位 / 池语义 | 数学只改 `src/shared/rotation.ts`（§0）；给轮换接**新调用点**时逐个数一遍推进者——服务端 `read`、客户端 tick / boot 回退 / 启用开关 / 手动按钮——`reload` 档 `rotationDue` 恒为 true，多接一个就多一处"每次都切"（§2-H v0.4.1） |
| 上传 / URL 拉取 | 上限与错误回传、MIME 落盘、`revokeObjectURL`、失败不留半个槽位 |
| 新增运行时文件 | `package.json` 的 `files` + `exports`（§0） |
| `lib/` | 一定要 `npm run bundle`，产物和源码同批提交 |

---

## 4. 四条测试路径：能证明什么

1. **`npm test`（宿主半侧真机）** —— 唯一能证明"配置真的落盘、真的读回、Profile 真的带"。
   它用一个临时 `DSH_HOME` 起真实 `lib/index.js` + 真 HTTP，不碰你的 `~/.dsh`。
   *不能*证明任何视觉 / CSS。

2. **浏览器 mock（file:// 页 + 真实生成样式表）** —— 把 `buildStaticStyles()` 和宿主安装产物里的
   CSS 原文装进同一页，用 `getComputedStyle` 量 computed 值。做法：写一个临时 entry 引
   `styles.ts` / `header-tag.ts` / `wallpaper.ts`，`npx rolldown <entry> -o out.js -f iife -p browser`
   打成 IIFE 再在 mock 里调用 —— 测的是**真代码**，不是抄一份。
   能证明：层叠胜负、令牌是否落到 `.material`、类名形状是否匹配、认领后属性是否写上。
   **不能**证明：像素遮挡、模糊的观感、任何需要绘制的东西。
   已知环境限制：内置浏览器视口 0×0 且 `visibilityState=hidden` → 截图 / `elementFromPoint` 不可用，
   **rAF 不触发**（要么先把 rAF 换成 `setTimeout`，要么像 v0.3.9 那样让代码不依赖绘制）。

3. **真机 `dsh web`** —— 唯一能证明"用户拖这个滑块，那块表面真的变了"。
   ```bash
   # 配置档 dabtest 里是 link:D:/Code/dsh-plugin/dsh-any-background，改完重启即生效
   cd "C:/Users/12997/AppData/Roaming/in.dsh-plug.dsh-launcher/versions/<宿主版本>"
   ./node_modules/.bin/dsh dabtest --no-open --port <空闲端口> > web.log 2>&1
   # web.log 里那行 "dsh web: http://127.0.0.1:<port>/?token=…" 才是可访问地址（裸访问是 401）
   ```
   纪律：① 测前 `cp ~/.dsh/.dsh-any-background-data/theme-config.json` 备份，测后逐字节还原并核对
   （**拖滑块就是改用户配置**）；② 只杀**自己**起的端口的进程；③ 服务端 9ms 有响应而 CDP 全超时 =
   浏览器标签页卡死，别误判成插件死循环（拿已提交版本做 A/B 可以区分，v0.3.9 就是这样排除的）；
   ④ 要看改的是哪张表，读 `style[data-plugin=…]` 系列（§0 末行）。

4. **桌面版** —— Windows 专属行为（条带、原生按钮区、`--dsh-frame-chrome-top`、app-region）
   只有桌面壳能验。**无法自动化时必须在报告里明说"这条我没跑过"**，不要拿 web 的结果代替。

**事实来源优先级**（写适配 / 查结构时）：宿主源码对应 tag > 安装产物里的 CSS 原文
（`versions/<v>/node_modules/.pnpm/@deepseek-ai+dsh-client-ui-*/…/lib/client.js` 内联字符串，
哈希类名以这里为准）> 规范文档（MDN）> 推断。子代理 / 工具给出的"宿主有这个东西"必须自己 grep
一遍再动手 —— 本仓库出现过被幻觉出来的宿主 API 和文档路径带偏的情况。

---

## 5. 红线（每一条都对应一次已发生的返工）

1. 不在样式 / 逻辑代码里比较版本号；只问 adapter。
2. 不收窄版本门禁、不 fail closed。
3. 不把 `backdrop-filter` 直接压在宿主部件上。
4. 不发指向未设置变量的声明（宁可不发）。
5. 不为了"看起来对"引入会改变部件状态的门控（`:has()` 撤霜那类）。
6. 不替宿主的盒子决定 `position`；要垫层就按 `setBlur` 的守卫式内联写法。
7. 不碰共享 `/api` 通道；不拿 `localStorage` 当唯一持久化。
8. 不提交未重建的 `lib/`；不漏 `npm test` 的新键断言。
9. 不猜宿主结构；引号里必须是读过的 `文件:行`。
10. 报告里不把"没测"说成"测过"。

### 5.5 git / 发布纪律

- 只提交本次改动相关文件，**不用** `git add -A`；提交前 `git status` 复核没有 `tmp-*`、壁纸、
  `theme-config.json`、日志。
- 已推送的提交不 amend、不强推；要改就新提交。
- 版本三连：`package.json` version + changelog（两份 README）+ 提交主题里的版本号必须一致；
  发 release 时标题与提交主题对齐（历史 tag 不全，别假设"每个版本都有 tag"）。
- 推送 / 发 release / 关 issue 属于对外动作，未获明确指示不做。

---

## 6. 维护本文件

每修完一个**新类型**的 bug，必须回来做三件事，否则同类问题一定会再犯：

1. 在 §2 增/补对应类别：症状、根因模式、检查路径、带出处（commit 或 issue 号）的实例。
2. 能自动化的补一条断言：配置类进 `scripts/smoke.mjs`，CSS / 层叠类进 §4.2 的 mock 流程。
3. 若新增了"改 X 必查 Y"的关系，补进 §3 表。
