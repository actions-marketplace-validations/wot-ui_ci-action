# 维护与发布

本仓库只发布 GitHub Action，不发布 npm 包。核心 CLI 在 [wot-ui/ci](https://github.com/wot-ui/ci) 发布。

## 本地检查

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:action
```

单元测试检查参数、临时私钥清理、缓存和失败输出。真实 CLI 测试使用 npm 发布的 `@wot-ui/ci`；CI 的 composite job 使用 `uses: ./` 和模拟凭据执行三平台 dry-run，不会上传到小程序平台。

## 更新 CLI

同时修改 `package.json.wotciVersion` 与 `devDependencies.@wot-ui/ci`，更新锁文件并跑检查。该版本是没有本地 CLI 时的默认值。Action 版本独立递增，不从 Action 标签推断 CLI 版本。

## 发布 Action

1. 更新 `package.json.version` 与锁文件，合并通过 CI 的提交。
2. 在该提交创建精确标签，例如 `v2.0.0`，运行 `pnpm verify:release v2.0.0` 后推送标签。
3. `Release` 工作流重新验证元数据、测试与 composite dry-run，通过后生成 draft release。
4. 打开 draft，勾选 **Publish this Action to the GitHub Marketplace**，选择分类并发布。
5. `Update major tag` 自动把 `v2` 指向最新稳定发布。预发布不会更新主版本标签。

手动重跑 `Release` 时，必须同时选择同一个 tag 作为 workflow ref 和输入 `tag`；可直接使用 GitHub 的 Re-run failed jobs。

Marketplace 名称使用 `wot-ui-ci-action`，与核心仓库原有的 `wot-ui-ci` 区分。精确版本标签发布后不重写；兼容主版本标签由发布工作流维护。
