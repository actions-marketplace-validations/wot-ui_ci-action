# 从 wot-ui/ci 迁移

旧入口 `wot-ui/ci@v0` 及已经发布的精确标签继续可用。核心仓库 `main` 已移除 Action 实现；使用 `wot-ui/ci@main` 的工作流需迁移到独立仓库。新接入使用：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    platform: weixin
    project-path: dist/build/mp-weixin
    appid: ${{ secrets.WEIXIN_APPID }}
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
```

## 保留的行为

- 原有 30 个 inputs、环境变量和配置文件格式保持兼容。
- 本地 CLI 优先；没有本地 CLI 时由 Action 安装。
- 私钥清理、缓存、JSON 文件、Summary 和失败退出码保持原有行为。
- 无配置模式支持单平台 upload / preview / doctor；钉钉不支持 preview。

## 改变的版本规则

原入口在没有本地 CLI 和 `package-version` 时，会把精确 Action 标签映射为同版本 npm 包，浮动标签回退到 `latest`。

独立 Action 不再使用这个映射。v1.0.0 的默认 CLI 固定为经过测试的 `0.5.3`。需要其他版本时显式设置 `package-version`；存在本地 CLI 时依然以本地安装为准。

```yaml
- uses: wot-ui/ci-action@v1
  with:
    package-version: '0.5.3'
    command: doctor
    config: wotci.config.ts
```

Action 版本、CLI 版本、上传的小程序版本分别由 `uses`、`package-version`、`upload-version` 控制。

## 仓库和 Marketplace

- 核心工具：[wot-ui/ci](https://github.com/wot-ui/ci)
- 独立 Action：[wot-ui/ci-action](https://github.com/wot-ui/ci-action)
- 新 Marketplace 标识：`wot-ui-ci-action`；原 `wot-ui-ci` 条目和历史版本保留。

拆仓不转移项目 Secrets。调用方继续在自己的 workflow 中注入原有凭据即可。
