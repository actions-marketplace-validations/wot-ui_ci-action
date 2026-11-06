# GitHub Action

仓库根目录提供 composite action。上传可以直接通过 `with` / `env` 配置，无需 `wotci.config.ts`，也不需要为 Action 单独安装 `@wot-ui/ci`。构建仍由项目自己的命令完成。

> 使用 `wot-ui/ci-action@v1`；从原 `wot-ui/ci` 入口迁移时见 [迁移指南](migration.md)。

## 无配置文件上传

下面以微信为例，将私钥的完整多行文本存入 `WEIXIN_PRIVATE_KEY` Secret，Action 会临时写入权限为 `600` 的文件，执行结束后清理。示例假定项目已通过 `packageManager` 指定 pnpm 版本，且 `pnpm build` 会生成 `dist/build/mp-weixin`；请替换为项目实际构建命令和产物路径：

```yaml
name: Upload

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
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

      - uses: wot-ui/ci-action@v1
        with:
          platform: weixin
          project-path: dist/build/mp-weixin
          private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
          # 上传版本默认读取 package.json，也可设置 upload-version
        env:
          WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
```

也可以全部使用环境变量（无配置文件时生效）：

```yaml
- uses: wot-ui/ci-action@v1
  env:
    WOTCI_PLATFORM: weixin
    WOTCI_VERSION: 1.2.3
    WEIXIN_PROJECT_PATH: dist/build/mp-weixin
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
    WEIXIN_PRIVATE_KEY: ${{ secrets.WEIXIN_PRIVATE_KEY }}
```

若已有落盘的私钥，可用 `private-key-path` / `WEIXIN_PRIVATE_KEY_PATH` 替代 `private-key` / `WEIXIN_PRIVATE_KEY`。路径相对 `working-directory` 解析，文件必须提前存在；Action 不会修改或删除调用者提供的私钥文件。

无配置文件模式支持微信、支付宝、钉钉的单平台上传，以及平台原有的 `preview` / `doctor` 能力（钉钉不支持预览）。支付宝额外需要 `tool-id` / `ALIPAY_TOOL_ID`，钉钉使用 `token` / `DINGTALK_TOKEN`，不传私钥。多平台使用多个步骤、GitHub Actions 矩阵或配置文件；此模式不会自动构建产物。

支付宝与钉钉可分别使用以下步骤，放在各自产物构建完成之后；`upload-version` 省略时同样读取当前执行目录的 `package.json`：

```yaml
# 支付宝
- uses: wot-ui/ci-action@v1
  with:
    platform: alipay
    project-path: dist/build/mp-alipay
    appid: ${{ secrets.ALIPAY_APPID }}
    private-key: ${{ secrets.ALIPAY_PRIVATE_KEY }}
    tool-id: ${{ secrets.ALIPAY_TOOL_ID }}

# 钉钉（这里使用 uni-app 的支付宝构建产物，请按实际项目调整）
- uses: wot-ui/ci-action@v1
  with:
    platform: dingtalk
    project-path: dist/build/mp-alipay
    appid: ${{ secrets.DINGTALK_APPID }}
    token: ${{ secrets.DINGTALK_TOKEN }}
```

| `with` 输入 | `env` 回退 | 说明 |
| --- | --- | --- |
| `platform` | `WOTCI_PLATFORM` | 单个平台：`weixin` / `alipay` / `dingtalk` |
| `project-path` | `WEIXIN_PROJECT_PATH` / `ALIPAY_PROJECT_PATH` / `DINGTALK_PROJECT_PATH` | 必填，构建产物目录 |
| `appid` | `WEIXIN_APPID` / `ALIPAY_APPID` / `DINGTALK_APPID` | 必填，平台应用 ID |
| `private-key` | `WEIXIN_PRIVATE_KEY` / `ALIPAY_PRIVATE_KEY` | 私钥原文，与私钥路径二选一 |
| `private-key-path` | `WEIXIN_PRIVATE_KEY_PATH` / `ALIPAY_PRIVATE_KEY_PATH` | 已存在的私钥文件路径 |
| `upload-version` | `WOTCI_VERSION` | 上传版本，未传则读取 `package.json` 的 `version` |
| `upload-desc` | `WOTCI_DESC` | 上传描述，未传则读取 `package.json` 的 `description` |
| `robot` | `WEIXIN_ROBOT` | 微信机器人编号，1–30，默认 1 |
| `tool-id` | `ALIPAY_TOOL_ID` | 支付宝必填 |
| `token` | `DINGTALK_TOKEN` | 钉钉必填 |
| `setting` | `WEIXIN_SETTING` | 微信编译设置 JSON 对象 |
| `preview` | `WEIXIN_PREVIEW` / `ALIPAY_PREVIEW` | 平台预览设置 JSON 对象 |
| `platform-options` | `WEIXIN_OPTIONS` / `ALIPAY_OPTIONS` / `DINGTALK_OPTIONS` | 平台可选配置 JSON 对象 |

配置方式与优先级：

- 显式 `config` 保留原配置文件行为；不能同时传上表中除 `platform` 外的无配置文件 inputs。配置文件可以照常读取 `env`。
- 不传 `config`，但传了任一无配置文件 input 时，直接使用 Action 参数，不加载项目里的配置文件。
- 只传 `env` 时，优先保留已有的配置文件自动发现逻辑（含 `package.json` 和 `.minicirc`）；项目没有配置时才使用环境变量生成配置。
- 无配置文件模式中，非空 `with` 值优先于对应 `env`；显式提供任一种私钥 input 后，不再读取环境变量里的两种私钥字段。选定来源中的私钥文本和私钥路径不能同时提供。
- `upload-version` 设置上传版本；原有 `version` input 仍只用于体验版和版本删除命令。
- 微信默认使用 `miniProgram` 项目类型及 `setting.useProjectConfig: true`；支付宝、钉钉默认关闭平台版本自动递增。平台扩展选项可通过下方 JSON inputs 配置；顶层 `versionStrategy`、`budgets`、`release` 编排仍使用配置文件。
- Action 生成的配置与私钥放在临时目录，正常结束或 CLI 报错时均清理。不会把私钥或 token 拼入命令行日志。

完整参数和编译、预览设置见 [Action 参数参考](inputs.md)。

## 复用配置文件

已有项目可以继续显式选择配置文件，或省略 `config` 让 CLI 自动发现。下例要求配置文件读取对应环境变量，且私钥已提前写入 `keys/weixin.private.key`：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    command: upload
    platform: weixin
    config: wotci.config.ts
  env:
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
    WEIXIN_PRIVATE_KEY_PATH: keys/weixin.private.key
```

使用 `release` 编排多平台发布时，仍在项目配置文件中维护发布规则。以下是已有 job 的步骤片段：依赖、配置及平台凭据需提前准备，构建可由配置中的 `release.buildCommand` 执行。需要 PR 评论时，在 workflow 或 job 上配置 `pull-requests: write`、`issues: write` 和 `contents: read`，同时注入 token；`auto` 只在检测到 token、仓库和 PR 编号时发表评论，手动运行且没有 PR 上下文时跳过。

```yaml
- uses: wot-ui/ci-action@v1
  with:
    command: release
    platform: weixin,alipay
    config: wotci.config.ts
    summary: ${{ runner.temp }}/release-summary.md
    pr-comment: auto
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    # 此处继续提供项目配置读取的平台凭据环境变量

- name: Publish release summary
  if: always()
  shell: bash
  run: |
    if [ -f "$RUNNER_TEMP/release-summary.md" ]; then
      cat "$RUNNER_TEMP/release-summary.md" >> "$GITHUB_STEP_SUMMARY"
    fi
```

## 预演、预览与结果归档

上传前可以用相同的 `with` / `env` 执行 `command: doctor` 检查配置，再用 `command: upload` 加 `dry-run: 'true'` 验证上传计划；真实上传时移除 `dry-run` 或设为 `'false'`。这些步骤仍需要准备相应配置、凭据和构建产物。

以下片段放在微信产物构建完成之后，执行真实预览，并在失败时也尽量收集已有结果。支付宝将平台、路径及凭据替换为前述支付宝输入即可；钉钉不支持 `preview`。示例使用 `ubuntu-latest`，二维码路径通过 `args` 传递，应避免包含空白。

```yaml
- name: Preview WeChat
  uses: wot-ui/ci-action@v1
  with:
    command: preview
    platform: weixin
    project-path: dist/build/mp-weixin
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    json-output: ${{ runner.temp }}/wotci/preview.json
    summary: ${{ runner.temp }}/wotci/preview-summary.md
    args: --qr-output ${{ runner.temp }}/wotci/preview.png
  env:
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}

- name: Publish preview summary
  if: always()
  shell: bash
  run: |
    if [ -f "$RUNNER_TEMP/wotci/preview-summary.md" ]; then
      cat "$RUNNER_TEMP/wotci/preview-summary.md" >> "$GITHUB_STEP_SUMMARY"
    fi

- name: Archive preview results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: wotci-preview-${{ github.run_id }}
    path: |
      ${{ runner.temp }}/wotci/preview.json
      ${{ runner.temp }}/wotci/preview-summary.md
      ${{ runner.temp }}/wotci/preview.png
    if-no-files-found: warn
```

`summary` 接收实际文件路径，不能写成 `${{ env.GITHUB_STEP_SUMMARY }}`：GitHub 默认环境变量不在 `env` context 中；直接传字面量 `$GITHUB_STEP_SUMMARY` 也不会由 Action 二次展开。上例先写明确路径，再在 `run` 的 shell 中读取 `$GITHUB_STEP_SUMMARY`，参见 [GitHub 变量说明](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)。

Action 当前不声明结构化 `outputs`，不能使用 `steps.<id>.outputs.json` 读取结果。请使用 `json-output` 文件；失败发生在 CLI 生成 JSON 之前时，该文件可能为空或不存在，应先检查内容再解析。文件存在不代表成功，需同时检查步骤状态和 JSON 的 `ok`；Action 保留 CLI 非零退出码。`json-output` 不包含包装脚本和 SDK 的诊断日志，也不会自动上传 artifact。

上传 / 预览失败时，批量文本日志及 Summary 会显示平台错误和已捕获的 `cause` 错误链，JSON 则在 `results[].error.cause` 中保留原因。`0.5.0` 的旧 CLI 在批量文本日志及 Summary 中只显示外层消息，排查时可先启用 `json: 'true'` / `json-output` 查看底层原因；升级到包含修复的 CLI 后无需依赖 JSON 才能看到错误链。仅升级 Action ref 但继续使用项目内旧版 CLI，不会修复旧版 CLI 的日志行为。

多平台可分别调用上述步骤，或在 job 上使用 `strategy.matrix.include` 为每个平台设置构建命令、产物路径和 Secret 名称，再通过 `${{ matrix.platform }}`、`${{ secrets[matrix.appid_secret] }}` 等传入。每个无配置模式调用只选一个平台；矩阵归档时在 artifact 名称中加入 `${{ matrix.platform }}` 避免重名。需要在一次发布中统一编排多个平台时使用配置文件模式的 `release`。

核心仓库的真实平台工作流见 [upload-playground.yml](https://github.com/wot-ui/ci/blob/main/.github/workflows/upload-playground.yml)：它调用 `wot-ui/ci-action@v1.0.0`，并显式绑定核心仓库当前构建的 CLI。新仓库 CI 通过 `uses: ./` 验证独立 Action 和已发布 CLI 的 dry-run；不包含真实平台上传验收。

维护者发布流程（含 Marketplace 上架的人工那一步）见 [docs/releasing.md](releasing.md)。
