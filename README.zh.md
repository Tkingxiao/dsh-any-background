# dsh-any-background

<a href="https://github.com/Tkingxiao/dsh-any-background" target="_blank">
  <img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars" />
</a>

[English](README.md) | 中文

一个 **DeepSeek Harness** 外观插件，让你完全自定义 Web 端的主题色、背景壁纸和透明度控制。

---

## 功能特性

- **PS 风格色轮** — 在色相环上选取色相，在内嵌方形中调整饱和度与明度。实时生成 30+ 个 CSS 设计令牌并立即生效。
- **背景壁纸** — 选择任意图片作为壁纸。在视口比例的编辑器中拖动平移、滚轮缩放，所见即所得。
- **透明度控制** — 主界面背景透明度、设置面板透明度、壁纸透明度各自独立滑块控制。
- **模糊效果** — 可调壁纸模糊（0–60 px），打造毛玻璃质感。
- **持久化存储** — 所有设置（颜色、壁纸、透明度、模糊、编辑器位置）由 Node 端保存到 **文件系统** 的 `~/.dsh/.dsh-any-background-data/`，下次启动自动恢复。不再受 `localStorage` 容量限制。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 后台看门狗定期重新激活自定义主题，即使宿主重置也不会丢失你的选择。

## 项目结构

```
dsh-any-background/
├── package.json          # 包元数据、dsh.client 声明、依赖
├── cordis.patch.yml      # 捆绑补丁层（插入到 profile 组合配置中）
├── cordis.yml            # 开发用补丁覆盖层（pnpm dsh web --patch）
├── tsdown.config.ts      # 构建配置：Node 端（ESM）+ 客户端（CJS 浏览器包）
├── src/
│   ├── index.ts          # Node 端 — 文件持久化（RPC 文件存储）
│   ├── invariant.ts      # 不变量 companion（注册包所有权）
│   └── client/
│       └── index.tsx     # 浏览器端 — 所有 UI 逻辑都在这里
├── lib/                  # 构建产物（已提交，安装无需构建步骤）
│   ├── index.js          # Node 入口
│   ├── invariant.js      # 不变量入口
│   ├── client.js         # 浏览器包（经 __ModuleLoader__ 包装）
│   └── client.js.map     # 源码映射
├── example_img/          # 示例截图
├── README.md             # 英文版说明
└── README.zh.md          # 本文件（中文）
```

## 实现原理

本插件是一个 Cordis 插件，分为两个部分：

- **Node 端**（`src/index.ts`）— 负责文件持久化。管理 DSH 数据主目录（`~/.dsh/`）下的 `.dsh-any-background-data/` 存储，并在共享 `/api` 通道上暴露一组小的 RPC 接口。
- **浏览器端**（`src/client/index.tsx`）— 所有 UI 逻辑都在这里。浏览器无法直接读写文件系统，因此通过 Node 端的 RPC 接口读写存储。

### 持久化

由于插件运行在浏览器中，持久化数据由 **Node 端** 写入磁盘：

```
~/.dsh/.dsh-any-background-data/
├── theme-config.json   # 主题色、主界面/设置面板/壁纸透明度、模糊、壁纸编辑状态
└── wallpaper.jpg       # 选中的背景图片（移除时删除）
```

- 启动时客户端调用 `read`，返回配置以及（如果存在）壁纸的 data URL。
- 每次设置变更都会同步写回 `theme-config.json`；更换壁纸写入 `wallpaper.jpg`，移除壁纸则删除文件。
- 存储目录不存在时会自动创建；配置缺失或损坏时回退默认值（并记录警告），所有写入都有错误保护以避免数据丢失。

### 架构

```
┌─────────────────────────────────────────────────────────┐
│  apply(ctx)  —  插件入口                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. 恢复保存的颜色 → registerCustom() → setTheme        │
│  2. 注入渐变 <style> 到 <head>                          │
│  3. 创建状态存储（defineStore）                           │
│  4. applyWp() → 壁纸 + 令牌覆盖                         │
│  5. 监听 theme/change → 重新应用                         │
│  6. ResizeObserver → 视口感知重定位                       │
│  7. 语言注册（中/英）                                     │
│  8. 设置面板注入（ThemeSection）                          │
│  9. 延迟启动恢复（300ms, 1500ms）                         │
│ 10. 主题守护（1 秒间隔）                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 色轮

- 单个 `<canvas>` 元素：色相环（360° 分段）+ 内嵌 SL 方形（HSV S-V 平面）。
- `hitTest()` 判断点击落在色相环（色相）还是方形（饱和度/明度）上。
- 色轮拾取的 HSV 值通过 `hsvToHsl()` 转换为 HSL 后传给 `genTokens()`。
- `genTokens()` 根据所选颜色生成 30+ 个 CSS 自定义属性（`--dsw-alias-*`），根据明度自动选择深色或浅色方案。
- 完整令牌集以内联样式写入 `<body>`，主题色完全不依赖主题服务的时序。

#### 主题色调整

<p align="center">
  <img src="example_img/image.png" alt="蓝色主题" width="600">
  <br/>
  <em>蓝色主题 · 较亮 · 默认深色字体</em>
</p>

<p align="center">
  <img src="example_img/image-1.png" alt="粉色主题" width="600">
  <br/>
  <em>粉色主题 · 较暗 · 默认浅色字体</em>
</p>

### 背景壁纸

- 一个 `position:fixed; z-index:-1` 的 `<div>` 被插入到 `<body>` 最前面。
- 图片通过 Canvas API 压缩（最大边 1600px，JPEG 质量 0.75）；Node 端写入 `~/.dsh/.dsh-any-background-data/wallpaper.jpg`，客户端在内存中保留 data URL 用于显示。
- 编辑器弹窗显示视口比例的矩形区域；拖动平移，滚轮缩放（0.1×–10×）。
- 提交的位置以分数中心坐标 + 原始图片尺寸存储，布局在视口变化时保持一致。
- 壁纸透明度直接作用于 `<div>` 元素；背景色透明度通过内联令牌覆盖实现。

#### 背景图片

<p align="center">
  <img src="example_img/image-2.png" alt="壁纸透明度和模糊调整" width="600">
  <br/>
  <em>壁纸透明度和模糊调整</em>
</p>

#### 编辑器调整

<p align="center">
  <img src="example_img/image-3.png" alt="编辑器调整" width="400">
  <img src="example_img/image-4.png" alt="背景实际对应" width="400">
  <br/>
  <em>编辑器调整 · 背景实际对应</em>
</p>

### 透明度体系

三个独立的透明度层，各有独立滑块和一个持久化的配置字段：

| 层 | 配置字段 | 默认值 | 实现方式 |
|----|----------|--------|---------|
| 主界面 | `opacity` | 85% | `<body>` 上的内联 CSS 变量 |
| 设置面板 | `settingsOpacity` | 100% | `<html>` 上的 CSS 变量，通过 `[aria-modal]` 选择器定位 |
| 壁纸 | `wallpaperOpacity` | 100% | 壁纸 `<div>` 上的 `style.opacity` |

#### 设置透明度

<p align="center">
  <img src="example_img/image-5.png" alt="设置透明度100%" width="400">
  <img src="example_img/image-6.png" alt="设置透明度49%" width="400">
  <br/>
  <em>设置透明度 100% · 设置透明度 49%</em>
</p>

#### 主界面透明度

<p align="center">
  <img src="example_img/image-6.png" alt="主界面透明度100%" width="400">
  <img src="example_img/image-7.png" alt="主界面透明度0%" width="400">
  <br/>
  <em>主界面透明度 100% · 主界面透明度 0%</em>
</p>

#### 壁纸透明度

<p align="center">
  <img src="example_img/image-8.png" alt="壁纸透明度100%" width="400">
  <img src="example_img/image-9.png" alt="壁纸透明度500%" width="400">
  <br/>
  <em>壁纸透明度 0% · 壁纸透明度 100%</em>
</p>

#### 壁纸模糊

<p align="center">
  <img src="example_img/image-10.png" alt="壁纸模糊50%" width="400">
  <img src="example_img/image-11.png" alt="壁纸模糊0%" width="400">
  <br/>
  <em>壁纸模糊 50% · 壁纸模糊 0%</em>
</p>

## 安装方式

### 方式一：npm 安装（推荐）

直接从 GitHub 安装插件到 Web profile：

```sh
dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

然后启动 Web UI：

```sh
dsh web
```

插件将作为 **"主题"** 分区出现在设置面板中。

### 方式二：npx（无需全局安装）

如果没有全局安装 `dsh`，可以使用 `npx`：

```sh
npx @deepseek-ai/dsh plugin --profile web add github:Tkingxiao/dsh-any-background
```

然后启动：

```sh
npx @deepseek-ai/dsh web
```

### 方式三：本地构建（开发模式）

`lib/` 目录已提交，安装无需构建步骤。若修改了 `src/` 需要重新构建（需 Node + pnpm）：

```sh
# 1. 克隆本仓库
git clone https://github.com/Tkingxiao/dsh-any-background.git
cd dsh-any-background

# 2. 安装构建工具（同时拉取 @deepseek-ai/dsh-home-paths 运行时依赖）
pnpm install

# 3. 重新构建 lib/
pnpm run bundle

# 4. 从本地安装到 web profile
#    （`dsh plugin add` 是 `pnpm add <dir>` 的封装，传入本目录即可）
dsh plugin --profile web add .

# 5. 启动
dsh web
```

## 兼容性

插件同时支持 **Web 界面** 和 **桌面客户端**：

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness)** — Web profile，完整支持。
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 已支持，但存在一个已知的 Electron 打包问题：**左侧边栏与主区域的透明度相反**（侧边栏看起来比主区域更透明，反之亦然）。这是客户端侧打包问题，并非插件缺陷 —— 我们正在等待桌面客户端更新修复。

## 依赖

| 包名 | 用途 |
|------|------|
| `@deepseek-ai/cordis` | 插件框架（Cordis） |
| `@deepseek-ai/dsh-home-paths` | 解析 DSH 数据主目录，用于持久化存储 |
| `@deepseek-ai/dsh-client-runtime` | 客户端运行时 + `defineStore` |
| `@deepseek-ai/dsh-client-locale` | 国际化（中/英） |
| `@deepseek-ai/dsh-client-ui-theme` | 主题服务（register/setTheme/overrideTokens） |
| `@deepseek-ai/dsh-invariants` | 包不变量 companion |
| `react` ^18.2.0 | UI 渲染 |

## Star History

<a href="https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=date&theme=dark&legend=bottom-right&sealed_token=7GSnWLC53Di99WoOA-OGKn_GLJ-kQ6jgcdGRLS7wUzlwkbtJxLtH9kT3D7gCvxb0HoMF8aZklqQT4ijJ7hcFA2zO43Sfh-ccbqGBtvLundJKPELZ1a2xNA" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=date&legend=bottom-right&sealed_token=7GSnWLC53Di99WoOA-OGKn_GLJ-kQ6jgcdGRLS7wUzlwkbtJxLtH9kT3D7gCvxb0HoMF8aZklqQT4ijJ7hcFA2zO43Sfh-ccbqGBtvLundJKPELZ1a2xNA" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=date&legend=bottom-right&sealed_token=7GSnWLC53Di99WoOA-OGKn_GLJ-kQ6jgcdGRLS7wUzlwkbtJxLtH9kT3D7gCvxb0HoMF8aZklqQT4ijJ7hcFA2zO43Sfh-ccbqGBtvLundJKPELZ1a2xNA" />
 </picture>
</a>

## 许可证

MIT
