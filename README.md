# Wot CI Action

[![CI](https://github.com/wot-ui/ci-action/actions/workflows/ci.yml/badge.svg)](https://github.com/wot-ui/ci-action/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

在 GitHub Actions 中上传微信、支付宝、钉钉小程序，生成微信 / 支付宝预览二维码。直接传入构建产物和凭据，无需额外配置文件。

本仓库维护 GitHub Action 接入层；CLI、JS API、Vite 插件与核心实现由 [Wot CI](https://github.com/wot-ui/ci) 提供。

[完整用法](docs/usage.md) · [全部参数](docs/inputs.md) · [从旧入口迁移](docs/migration.md)

## 快速开始

在仓库 Secrets 中添加 `WEIXIN_APPID` 与 `WEIXIN_PRIVATE_KEY`（完整的多行上传私钥），创建 `.github/workflows/upload.yml`：

```yaml
name: Upload mini-program

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: wot-ui/ci-action@v2
        with:
          platform: weixin
          project-path: dist/build/mp-weixin
          appid: ${{ secrets.WEIXIN_APPID }}
          private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
```

示例要求项目在 `package.json.packageManager` 中指定 pnpm 版本。按项目实际情况调整安装、构建命令和产物目录。Action 默认执行上传，上传版本读取项目的 `package.json.version`。

微信上传前需配置公众平台的 CI IP 白名单。Action 会创建临时私钥文件并在结束后清理；已有私钥文件可使用 `private-key-path`。

## 常用参数

这里只列常用项；[完整参数手册](docs/inputs.md) 按上传、预览和结果文件说明参数、默认值与平台差异。

| 参数 | 说明 |
| --- | --- |
| `command` | 默认 `upload`；生成二维码用 `preview`，检查配置用 `doctor` |
| `platform` | `weixin` / `alipay` / `dingtalk` |
| `project-path` | 构建产物目录，相对 `working-directory` |
| `appid` | 平台应用 ID |
| `private-key` | 微信 / 支付宝私钥文本，从 Secrets 注入 |
| `upload-version` | 上传版本，默认读取项目 `package.json.version` |
| `working-directory` | 执行目录，默认 `.` |
| `dry-run` | `'true'` 时只校验上传计划 |
| `config` | 复用项目配置文件，支持多平台 |

支付宝额外传 `tool-id`；钉钉传 `token`，不传私钥。无配置模式每次选择一个平台，多平台可使用矩阵或配置文件。

## 预览与结果

将微信步骤改为 `command: preview`，添加以下参数，再用 `actions/upload-artifact@v4` 归档结果：

```yaml
qrcode-output: artifacts/preview.png
json-output: artifacts/result.json
```

Action 保留 CLI 失败退出码，当前不提供 `steps.<id>.outputs`。完整预览、Summary 与归档流程见 [使用指南](docs/usage.md#预览和结果归档)。

## 版本规则

Action 与 CLI 独立版本管理：`@v2` 是 Action 的兼容主版本，`@v2.0.0` 是精确 Action 版本。v2.0.0 默认安装并验证 `@wot-ui/ci@0.5.3`，不会把 Action 标签当作 CLI 版本。

已有项目本地 CLI 时优先使用本地版本。v2 仅提供上传、预览和配置检查；v1 保持可用。删除的扩展参数及替代方式见 [迁移指南](docs/migration.md)。

MIT © wot-ui
