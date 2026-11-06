# 迁移到 v2

v2 将 Action 接口收拢到 `upload`、`preview`、`doctor`，删除 11 个扩展 input，增加 `qrcode-output`，共保留 20 个 input。**这是不兼容升级**；`@v1` 和 `@v1.0.0` 保持原样，旧工作流可继续使用。[v1 完整参数文档](https://github.com/wot-ui/ci-action/blob/a804010605af76926be6ed857e0962c6b51efbba/docs/inputs.md)。

## 普通上传

只使用平台、路径、凭据、上传版本、编译设置等基础参数时，将 `uses` 改为 `wot-ui/ci-action@v2` 即可。上传凭据仍由调用方提供。

```yaml
- uses: wot-ui/ci-action@v2
  with:
    platform: weixin
    project-path: dist/build/mp-weixin
    appid: ${{ secrets.WEIXIN_APPID }}
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    upload-version: '1.2.3'
```

## 删除的参数与替代方式

| 已删除的 input | v2 做法 |
| --- | --- |
| `json` | 设置 `json-output: artifacts/result.json`，自动启用 JSON 输出并保存 |
| `args` | 二维码路径改用 `qrcode-output`；其他通用 CLI 参数使用单独的 CLI 步骤 |
| `network` | 需要网络探测时，在单独步骤运行 `pnpm exec wotci doctor --network` |
| `yes`、`version` | 删除确认、版本删除或体验版切换在单独 CLI 步骤中完成；上传版本使用 `upload-version` |
| `pr-comment`、`history` | 属于 CLI `release` 编排，通过单独 CLI 步骤配置 |
| `install-dependencies` | 在 Action 前显式执行 `pnpm install --frozen-lockfile` 等项目安装命令 |
| `node-version` | Action 内部固定 Node.js 22；项目构建的 Node 版本通过前置 `actions/setup-node` 配置 |
| `package-version` | 在项目中锁定 `@wot-ui/ci` 依赖并提前安装，Action 优先使用本地 CLI |
| `registry` | 改为标准环境变量 `npm_config_registry`，或 `NPM_CONFIG_REGISTRY` |

`command` 不再接受 `release`、`version latest`、`experience set`、IDE 命令或任意 CLI 子命令。将这些操作移到普通 `run` 步骤，或继续固定使用 `@v1`。

`platform-options` 同时移除了微信 / 支付宝的 `ide` 和钉钉的 `projectType`：这些字段在 Action 的上传、预览路径中不起作用。使用配置文件复用核心 CLI 时，配置结构不变。

旧参数不会继续透传。升级前移除表中的 `with` 项，避免 GitHub 未知参数提示或 Action 的接口校验失败。

## 预览路径迁移

```yaml
# v1
- uses: wot-ui/ci-action@v1
  with:
    command: preview
    config: wotci.config.ts
    args: '--qr-output artifacts/preview.png'

# v2
- uses: wot-ui/ci-action@v2
  with:
    command: preview
    config: wotci.config.ts
    qrcode-output: artifacts/preview.png
```

微信原有 `preview.qrcodeOutputDest` 仍支持；`qrcode-output` 为微信、支付宝提供统一路径入口，且优先级更高。

## 版本与执行环境

- `@v2` 是兼容主版本，`@v2.0.0` 是精确版本；不会移动 `v1` 标签。
- v2.0.0 默认 CLI 为 `@wot-ui/ci@0.5.3`，Action 标签不会映射为 npm 版本。
- `working-directory/node_modules/.bin/wotci` 存在且可执行时优先使用本地 CLI。
- Action 内部设置 Node.js 22，后续步骤也会看到这个版本；需要其他版本时再次调用 `actions/setup-node`。
- 临时私钥清理、CLI 缓存、JSON / Markdown 文件和失败退出码保持原有行为。

## 从旧仓库入口迁移

`wot-ui/ci@v0` 和已发布精确标签仍可用；核心仓库 `main` 已移除 Action 文件。使用 `wot-ui/ci@main` 的工作流必须迁移到独立仓库。

需要保持旧的 30 参数接口时使用 `wot-ui/ci-action@v1`；精简接入按本指南升级 v2。核心工具继续在 [wot-ui/ci](https://github.com/wot-ui/ci) 维护，独立 Action 的 Marketplace 为 [wot-ui-ci-action](https://github.com/marketplace/actions/wot-ui-ci-action)。
