# dsh-any-background

<p align="center">
  <a href="https://github.com/Tkingxiao/dsh-any-background"><img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars"></a>
  <a href="https://dsh.directory/plugins/tkingxiao/dsh-any-background"><img src="https://dsh.directory/badges/listed.svg" alt="dsh.directory listed"></a>
</p>

[English](README.md) | 中文

一个 **DeepSeek Harness** 外观插件，让你完全自定义 Web 端的主题色、背景壁纸，以及分部位精细的透明度与模糊度控制。

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
- **分部位界面透明度** — 主背景、侧边栏、卡片面板（含对话框周围的选项框/菜单）、输入框与控件（发送框、Cordis 插件面板）、设置面板与壁纸各自独立滑块。
- **分部位界面模糊度** — 每个界面部位可独立调整毛玻璃 `backdrop-filter` 模糊（0–60 px），并通过宿主的稳定选择器为发送框与 Cordis 面板提供真实背景模糊。
- **对话视图卡片** — 消息列表自动包裹为半透明卡片，轨迹页可整页调节透明度与模糊，让壁纸从内容后方透出来。
- **主题导出 / 导入** — 一键导出为自包含的 `dsh-any-theme.json`（配置 + 壁纸，视频以 data URL 内嵌），可随时导入还原。
- **外观预设与配置档案** — 六套一键预设（默认 / 毛玻璃 / 极简白 / 暗夜紫 / 赛博 / 暖阳），外加自定义命名档案：随时保存当前观感、随时套回，删除有二次确认保护。
- **壁纸轮换** — 把多张图片加入轮换池（缩略图选择器），按随机或顺序、每次刷新 / 每天 / 每周的频率自动更换；切换时服务端把所选图片复制进当前壁纸槽，导出/导入与取色管线完全不用改。
- **昼夜自动切换** — 指定日间与夜间两套配置，按固定时段或跟随系统深色模式自动切换。
- **强制界面明暗** — 无论主题色明暗如何，都能强制生成亮色/暗色整套令牌；「自动」下配色与字体方向由主题色明度驱动（深色 → 浅字，浅色 → 深字），未选主题色时按壁纸画面亮度判断。
- **明暗判断修复** — 即使未选主题色，界面明暗现在也会依据壁纸画面的实际亮度（每张壁纸分析一次）自动判断，修复浅色壁纸配宿主深色主题导致的全白字体；未选主题色时强制亮色/暗色也会生成中性灰配色，而不再完全无效。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 近期优化

### v0.2.6

- **修复窄视口（移动端布局）顶栏与内容区割裂** — 窄视口下宿主在对话列之外另有一个 52px 高的固定会话标题条（`.dsh-mobile-app-header`），主背景不透明度此前只写在三列上，该标题条便直接透出清晰壁纸，与下方半透明的内容区明显割裂（[#11](https://github.com/Tkingxiao/dsh-any-background/issues/11)）。现在标题条复用插件自有的 `--dsh-any-op-bg` 变量，自动跟随「主背景不透明度」滑块与主题切换；未设置时回退宿主默认外观。
- **主背景模糊镜像到 `:root`** — 新增全局变量 `--dsh-any-part-blur-global`（跟随「主背景模糊」滑块），顶栏据此同步磨砂效果；第三方样式也可直接引用，与既有全局变量 `--dsh-any-input-blur` / `--dsh-any-blur-settings` / `--dsh-any-blur-card-panels` 一致（元素级的 `--dsh-any-part-blur` 在列子树之外继承不到）。
- **启动提速，告别白屏等待** — 壁纸不再以 base64 走 RPC 通道。上传以原始字节流直接落盘，持久化的图片通过 HTTP 路由由浏览器原生解码显示，与普通 `<img>` 完全一致。共享解码缓存把同一张壁纸的四次按 URL 解码（取色、明暗判定、拖动降采样、尺寸读取）合并为一次。大壁纸启动恢复从 ~5.5 s 降到 ~1.2 s（RPC 读取 3010 ms → ~170 ms，首次解码 1464 ms → ~780 ms）。
- **原地替换壁纸后必然显示新图** — 上传、网址下载与轮换都发生在同一个 serve URL 背后，此前所有按 URL 键控的缓存——图层重设守卫、解码缓存、明暗判定与低清拷贝——都还握着旧像素。图片槽现与视频槽一样携带查询串版本号，每次替换都会得到新 URL、触发新解码。
- **自动取色无竞态** — 取色解码期间壁纸被替换时，旧图颜色不再有机会覆盖新图（与明暗判定采用同一套单调守卫）。
- **上传更健壮** — 视频上传上限 2 GB、使用独立临时文件（并发的壁纸上传不会损坏它）、并在服务端立即记录 MIME；两个上传路由与 RPC 通道一样加上了 Host/Origin 围栏。
- **四个新动态背景预设** — Shader 新增**星空**（缓慢星云幕布上的三层闪烁星点）；几何图案新增**雨滴**（下落的光痕）、**等高线**（漂移的地形流线）与**流体光斑**（缓慢漂移的柔光色球），均与既有预设一样可调参数、可锁种子。
- **动态背景可暂停** — 「重新生成」旁新增暂停/播放按钮，直接停掉画布动画循环而不拆除背景（仅当前会话有效，重新生成或刷新后恢复播放）。
- **尊重系统减弱动态偏好** — 系统开启 `prefers-reduced-motion` 时，动态背景只渲染首帧、不再运行动画循环。
- **网络视频 URL 壁纸** — 「从网址」流程现可识别视频链接：服务端以流式下载写入视频槽（上限 2 GB、60 秒无数据超时，MIME 取自 Content-Type 或扩展名）并写入配置；播放、截帧与取色沿用既有 serve 路由。
- **清理** — 移除启动性能探针与静态快照死代码；网址下载的壁纸直接写盘，不再经过临时 base64 字符串。

### v0.2.5

- **修复壁纸 MIME 错标 — GIF/APNG 壁纸可用了** — `readWallpaper` 此前无条件把所有图片按 `image/jpeg` 回读，而经网址抓取的 PNG/WebP/GIF 字节都写在同一个文件里。现在每次读取都从文件头嗅探真实格式，动图 GIF 壁纸（以及 PNG/WebP 的色彩配置）在刷新后可以正确保留。
- **外观预设** — 「配置」页新增六套一键预设（默认、毛玻璃、极简白、暗夜紫、赛博、暖阳），每套打包主题色、分部位透明度、模糊度与色彩叠加——绝不动你的壁纸。
- **配置档案** — 可将当前外观保存为命名档案，一键套用/删除（删除有二次确认），并可供昼夜调度（见下）自动切换。
- **壁纸轮换** — 「背景」页新增轮换池：添加图片（缩略图条）、选择随机/顺序与每次刷新/每天/每周频率，或点「立即切换」。服务端把所选图片复制进当前壁纸槽，启动还原、主题导出、取色等既有管线零改动。
- **昼夜自动切换** — 选定日间/夜间两套档案与触发方式（固定时段或系统 `prefers-color-scheme`），插件自动套用匹配的档案（每 30 秒检查一次；只切换外观，不动壁纸）。
- **强制界面明暗** — 「色彩」页新增亮色/暗色/自动分段控件，强制后整套配色令牌按所选方向重新生成，而不再依据主题色明度推导。
- **修复强制亮/暗无差别 — 方向判定真值 bug** — `buildTokens` 此前用 `scheme ?? lit < 0.55` 推导方向，`scheme='light'` 时字符串真值导致亮色/暗色都走深色分支。现改为显式比较，两套令牌（79 项中 78 项）正确区分。
- **强制方向自动重映射主题色明度** — 强制方向与主题色明度冲突时（如浅色主题色 + 强制暗色），把明度镜像映射进目标区间（深色带 0.14–0.44 / 亮色带 0.6–0.88）再构建令牌，色相与饱和度保留，保存的主题色本身不变。
- **自动模式明暗规则重构** — 有主题色时字体与表面方向统一由主题色明度驱动（过深 → 白字，过浅 → 黑字，与壁纸判定结果不再打架）；未选主题色时按壁纸感知亮度（Rec.709）判断字体方向；全局明暗标志（`color-scheme`、原生控件）与配色方向保持一致。
- **自动提取主题色的链路补全** — 无保存主题色时从壁纸自动提取的结果，此前只写入内存配置：不注册宿主皮肤（且此后永久不再更新）、不落盘、不同步取色轮盘。现补全为完整自适应（注册皮肤 + 持久化 + UI 同步），并把提取时的亮度度量统一为 Rec.709，与壁纸判定对同一张图永远给出一致方向。
- **壁纸轮换零闪现** — 到期的轮换改在刷新阶段由服务端直接完成（读取配置时先推进轮换池再返回壁纸），首次上屏即新壁纸，消除「旧壁纸闪现后突然切换」；客户端随后自动从新壁纸重提取主题色并持久化，配色跟随轮换。客户端推进逻辑保留作兜底。

## 安装

### 方式一：npm 安装（推荐）

```sh
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
# 若已发布到 registry：
dsh plugin --profile web add dsh-any-background
```

然后启动：

```sh
dsh web
```

插件会出现在设置面板的 **“主题”** 分类中。

### 方式二：npx（无需全局安装）

```sh
npx @deepseek-ai/dsh plugin --profile web add github:Tkingxiao/dsh-any-background
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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness)** — 同时兼容 npm 发布版与新版源码构建。插件会自动检测宿主携带的客户端模块表（新版 `@deepseek-ai/dsh-client-store` 或旧版 `@deepseek-ai/dsh-client-runtime`），并在运行时据此解析 `defineStore`。
- **兼容版本声明** — `package.json` 的 `dsh.compatibility.dshReleases` 对 npm 上 `0.1.2-alpha.4` 至 `0.1.5-rc.2` 间的全部 8 个公开发布版本（`0.1.2-alpha.4`、`0.1.2-alpha.5`、`0.1.2-rc.1`、`0.1.3-alpha.2`、`0.1.5-alpha.1`、`0.1.5-alpha.2`、`0.1.5-rc.1`、`0.1.5-rc.2`）逐项声明为 `compatible`。
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 支持

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## 许可

MIT
