# dsh-any-background

<a href="https://github.com/Tkingxiao/dsh-any-background" target="_blank">
  <img src="https://img.shields.io/github/stars/Tkingxiao/dsh-any-background?style=social" alt="GitHub stars" />
</a>

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
  <em>背景编辑器 · 图片壁纸支持拖动平移与滚轮缩放</em>
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
- **智能取色** — 一键从壁纸提取主题色：采样可见区域、量化像素、剔除灰色/近黑/近白，选出现量最大的鲜亮色。纯客户端完成。
- **吸管取色** — 在壁纸上悬停预览颜色，点击即可选为主题色。
- **背景壁纸** — 上传任意图片作为壁纸，在视口比例的编辑器中拖动平移、滚轮缩放。
- **动态生成背景** — 支持网格渐变、Shader、几何图案，可调节扩散范围、色彩强度并锁定种子。
- **分部位界面透明度** — 主背景、侧边栏、卡片面板、设置面板与壁纸各自独立滑块。
- **分部位界面模糊度** — 每个界面部位可独立调整毛玻璃 `backdrop-filter` 模糊（0–60 px）。
- **主题导出 / 导入** — 一键导出为自包含的 `dsh-any-theme.json`（配置 + 壁纸），可随时导入还原。
- **文件持久化** — 所有设置保存到文件系统 `~/.dsh/.dsh-any-background-data/`，不再依赖 `localStorage`。
- **中英双语** — 完整的中英文界面，自动跟随语言设置。
- **主题守护** — 宿主重置主题后自动重新激活自定义主题。

## 近期优化

- **消除启动闪屏** — 主题令牌改为通过独立的 `!important` 样式表注入，可抵御宿主主题服务的重置。
- **修复色轮覆盖** — 色相环绘制在饱和度/明度方形之上，方形四角不再遮挡色环。
- **灵感色板选中重置** — 在色轮中选取主题色后，灵感色板中的之前选中状态自动清除。
- **移除调试埋点** — 清理了临时的启动日志与 `MutationObserver` 探针代码。
- **分部位模糊隔离** — 模糊效果施加在 `::before` 伪元素上，避免影响宿主固定定位的设置弹窗。

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

- **[`dsh web`](https://github.com/deepseek-ai/deepseek-harness)** — 完全支持。
- **[deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop)** — 支持；已知 Electron 打包问题导致左侧边栏与中心区域透明度显示相反，需等待桌面端更新修复。

## Star History

[![Star History Chart](https://api.star-history.com/chart?repos=Tkingxiao/dsh-any-background&type=timeline&legend=bottom-right&sealed_token=f5MhnHibC049CC0Ed_nZX8rYpIq2wPTdTXUsPPafAiYxYKOeqyKyMFirxKppeLNJygxv1iw2BlsnCYOWgu9zN6ffr7kJlAG1SlRoQRmQivCIkPzZ2lhSBQ)](https://www.star-history.com/?repos=Tkingxiao%2Fdsh-any-background&type=timeline&legend=bottom-right)

## 许可

MIT
