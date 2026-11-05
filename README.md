# Smartisan 博物馆

一座由爱好者建立的非官方数字博物馆，收藏 Smartisan 手机、周边和设计物件。

## 浏览

打开 `index.html`，或运行：

```sh
python -m http.server 8765 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8765`。

- 手机：按首次发布时间升序排列，可单独筛选主型号与特别版本。
- 周边：耳机、TNT、配件、足迹、包装与合作生态。
- 系统档案：Smartisan OS 界面图集。
- 展品详情：参数、发布配置与价格、设计观察、版本配色与资料来源。
- 我的一柜：在当前浏览器保存收藏。
- 环境轮播：可选择播放范围、时长与随机顺序；空格暂停、方向键切换、Esc 退出。

价格记录发布时公布的人民币定价，后续调价与限时优惠另行说明。详见 [产品目录与发布价格](CATALOG.md)。产品照片提供多视图与放大查看。手机发布日期与核对来源见 [发布日期表](DATES.md)。轮播为每件藏品随机选取 3—5 个设计特点，始终保留其最具代表性的特点。

## 数据

静态 HTML、CSS、JavaScript，无构建依赖。藏品数据位于 `data/products.json`，页面不依赖在线 API，不收集个人数据。修改数据后执行 `python scripts/build_catalog.py` 更新浏览器数据文件。

收藏与轮播偏好只保存在当前浏览器。全屏环境轮播使用浏览器能力，不是操作系统原生屏保。

## 贡献与许可

欢迎通过 Issue 或 PR 提供资料纠错、版本证据与实物照片，请附来源和媒体许可，见 [贡献说明](CONTRIBUTING.md)。

原创代码采用 MIT；品牌名称、商标、第三方图片和系统界面归各自权利人，见 [媒体说明](MEDIA_RIGHTS.md)。Noto Sans SC 遵循随附 OFL 许可证。

本仓库包含官网／媒体原图及其展示衍生图，均保留独立权利状态，不适用代码的 MIT 许可。素材索引、来源和 SHA-256 见 `data/assets.json`。原图总量约 1.19 GB，首次克隆需要一定时间。

`scripts/export_code.py` 生成不含第三方图片的代码包，保留数据索引并使用明确的媒体占位牌，不会自动联网或发布。

## 检查

```sh
python scripts/validate.py
node --check museum.js
```

不含媒体的代码检出使用 `python scripts/validate.py --metadata-only`。

资料缺项与日期、价格口径见 [DATA_STATUS.md](DATA_STATUS.md)。包装与跨版本界面影像不单列商品发布日期。
