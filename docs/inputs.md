# Action 参数参考

## 完整 inputs 参考

下表列出 `action.yml` 的全部 30 个 inputs。默认值是 Action 层的默认值，`空` 表示未显式传入；环境变量、配置文件和 CLI 仍可能提供回退值。元数据中的 inputs 均非必填，但无配置模式仍须满足所选平台的凭据与路径要求。布尔值建议写成字符串 `'true'` / `'false'`。

| input | 默认值 | 用途与生效范围 |
| --- | --- | --- |
| `command` | `upload` | CLI 命令，如 `upload`、`preview`、`doctor`、`release`、`build-npm`、`sourcemap`、`inspect`、`quality`、`version latest`、`version list`、`version delete`、`experience set`、`experience cancel`；完整列表见 [CLI 命令速查](https://github.com/wot-ui/ci/blob/main/docs/guides/commands.md#cli-命令速查)。无配置模式仅支持 `upload` / `preview` / `doctor` |
| `platform` | 空 | 回退到 `WOTCI_PLATFORM`；无配置模式必须选单个平台，配置文件模式可用逗号分隔多个平台（是否支持取决于命令） |
| `config` | 空 | 配置文件路径，相对 `working-directory`；省略时按前述规则选择无配置模式或自动发现 |
| `project-path` | 空 | 无配置模式的构建产物目录，相对 `working-directory`；与对应平台环境变量至少提供一个 |
| `appid` | 空 | 无配置模式的平台应用 ID；与对应平台环境变量至少提供一个 |
| `private-key` | 空 | 无配置模式的微信 / 支付宝私钥原文，建议来自 Secret；与 `private-key-path` 互斥 |
| `private-key-path` | 空 | 无配置模式的微信 / 支付宝私钥文件，相对 `working-directory`；必须提前存在 |
| `upload-version` | 空 | 无配置模式上传版本：input → `WOTCI_VERSION` → 当前执行目录的 `package.json.version`；上传时必须能取得版本 |
| `upload-desc` | 空 | 无配置模式上传描述：input → `WOTCI_DESC` → 当前执行目录的 `package.json.description` |
| `robot` | 空 | 无配置模式的微信机器人编号：input → `WEIXIN_ROBOT` → `platform-options.robot` → `1`，有效范围 1–30 |
| `tool-id` | 空 | 无配置模式的支付宝工具 ID；与 `ALIPAY_TOOL_ID` 至少提供一个 |
| `token` | 空 | 无配置模式的钉钉 API token；与 `DINGTALK_TOKEN` 至少提供一个。不是 GitHub 评论用的 token |
| `setting` | 空 | 无配置模式的微信编译设置 JSON；回退到 `WEIXIN_SETTING`，再取 `platform-options.setting`；默认补 `useProjectConfig: true` |
| `preview` | 空 | 无配置模式的预览设置 JSON；回退到 `WEIXIN_PREVIEW` / `ALIPAY_PREVIEW`，再取 `platform-options.preview`；钉钉不支持 |
| `platform-options` | 空 | 无配置模式的平台可选配置 JSON；回退到 `WEIXIN_OPTIONS` / `ALIPAY_OPTIONS` / `DINGTALK_OPTIONS`；凭据和产物路径使用专用 inputs |
| `working-directory` | `.` | CLI 执行目录，同时决定配置、产物、私钥、结果文件的相对路径及本地 CLI / package.json 的查找位置 |
| `summary` | 空 | Markdown 结果文件；仅传递给 `upload`、`preview`、`release`、`build-npm`、`sourcemap`、`inspect`、`quality`，其他命令忽略此 input；写入文件后可由后续步骤发布到 Job Summary |
| `json` | `false` | 传递 `--json`，在 CLI stdout 输出 JSON；不自动创建 artifact，也不代表 Action 整个步骤的日志只有 JSON |
| `json-output` | 空 | 保存 CLI JSON stdout，并自动启用 `json`；相对 `working-directory`，自动创建父目录并覆盖已有文件。CLI 的失败退出码继续传递 |
| `dry-run` | `false` | 传递 `--dry-run`，对支持该选项的命令生成计划 / 校验而不执行真实操作；不能替代独立的 `doctor --network`，也不能证明平台上传成功 |
| `network` | `false` | 传递 `--network`，用于 `doctor` 的网络检查；失败默认使步骤失败，如需只做诊断可在调用步骤设置 `continue-on-error: true` |
| `yes` | `false` | 传递 `--yes`，用于确认 `version delete` 等要求确认的操作 |
| `version` | 空 | `experience set`、`experience cancel`、`version delete` 的目标版本；不用于设置上传版本 |
| `pr-comment` | `auto` | 仅用于 `release`。`auto` 沿用配置（未配置时自动检测 PR 上下文）；`true` 显式请求评论，缺少上下文会记录评论错误；`false` 禁用评论 |
| `history` | `auto` | 仅用于 `release`。`false` 禁用历史；`auto` 和 `true` 均沿用配置（未配置时开启），`true` 不会覆盖配置中的 `history: false`。默认写入 `.wotci/history.json`，跨运行保留需自行归档 / 恢复 |
| `args` | 空 | 追加 CLI 参数，例如 `--concurrency 2`；按空白拆分，不支持 shell 引号分组、变量展开或命令替换。无配置模式禁止通过它覆盖 `--config` / `-c`、`--cwd`、`--platform` / `-p`、`--all` |
| `package-version` | 空 | 仅在没有本地 CLI、使用 npx 时生效；显式值优先，否则使用 Action 的 `package.json.wotciVersion`（v1.0.0 为 `0.5.3`），与 Action 标签无关 |
| `registry` | 空 | 临时 CLI 安装源：优先此 input，再取 `npm_config_registry` / `NPM_CONFIG_REGISTRY`，最后默认 `https://registry.npmjs.org/`；覆盖项目 `.npmrc` 的普通 `registry`，不修改项目依赖安装源 |
| `install-dependencies` | `false` | 在 `working-directory` 安装依赖后再运行 CLI，不负责构建；包管理器选择规则见下文 |
| `node-version` | `20` | 传给 Action 内部的 `actions/setup-node`。即使此前 job 已安装其他 Node 版本，Action 仍执行此设置；需要保持一致时显式指定 |

执行与版本规则：

- Action 优先使用 `working-directory/node_modules/.bin/wotci`；存在时 `package-version` 不会替换它。不存在时调用 `npx --yes @wot-ui/ci@<version>`。
- 临时 CLI 使用独立的 npm 缓存，按操作系统、架构、Node 版本、CLI 版本选择器、registry 和安装脚本隔离。自动恢复并保存包下载缓存和 npx 安装目录，不缓存项目文件、生成的配置、私钥或 npm 日志。准备 CLI 成功后，即使上传失败也会保存缓存；缓存服务失败不会阻止上传。项目本地 CLI 可用时跳过此缓存。
- 日志分别显示「CLI 准备耗时」和「CLI 执行耗时」；前者包含依赖解析、下载和安装，后者包含 CLI 启动及实际命令。首次运行或缓存未命中仍需安装；浮动版本仍由 npm 正常解析，缓存不会把 `latest` 固定为旧版本。
- npx 优先使用 `package-version`，否则使用本 Action 内记录的已验证 CLI 版本。Action 标签、分支或 SHA 不参与 CLI 版本推断。
- 配置文件中使用 `import { defineConfig } from '@wot-ui/ci'` 时，需在项目中安装该依赖以便解析；无配置模式不要求安装。
- `install-dependencies: 'true'` 按顺序检查当前目录：`pnpm-lock.yaml` → `pnpm install --frozen-lockfile`（缺少 pnpm 时尝试 `corepack enable`）；存在 `yarn.lock` 且 yarn 可用 → `yarn install --frozen-lockfile`；`package-lock.json` → `npm ci`；存在 `bun.lockb` 且 bun 可用 → `bun install --frozen-lockfile`；其余情况 → `npm install`。仅有 `bun.lock` 不会匹配 bun 分支。需要特定包管理器或 monorepo 根目录安装时，建议在前面的独立步骤完成安装。
- 使用私钥文件路径时，由调用方提前落盘并负责清理；建议写入 `$RUNNER_TEMP`、设置 `chmod 600` 并在 `if: always()` 的步骤删除。传 `private-key` 原文时则由 Action 创建和清理临时文件。

## 编译、预览与平台扩展参数

`setting`、`preview`、`platform-options` 均接受 **JSON 对象字符串**，沿用平台配置原有字段名。独立 Action v1 已包含这些 inputs。不要直接写 `with.minifyJS` 或 `args: --minifyJS`。

构建完成后可直接配置微信编译选项，无需创建 `wotci.config.ts`。下面使用稳定主版本标签：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    platform: weixin
    project-path: dist/build/mp-weixin
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    setting: |
      {
        "useProjectConfig": true,
        "es6": true,
        "es7": true,
        "minifyJS": true,
        "minifyWXML": true,
        "minifyWXSS": true,
        "codeProtect": false
      }
    platform-options: '{"type":"miniProgram","ignores":["test/**"]}'
  env:
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
```

纯环境变量也支持：

```yaml
- uses: wot-ui/ci-action@v1
  env:
    WOTCI_PLATFORM: weixin
    WEIXIN_PROJECT_PATH: dist/build/mp-weixin
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
    WEIXIN_PRIVATE_KEY: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    WEIXIN_SETTING: '{"minifyJS":false,"minifyWXML":true}'
    WEIXIN_OPTIONS: '{"type":"miniProgramPlugin","ignores":["test/**"]}'
```

微信 `setting` 支持 `useProjectConfig`、`es6`、`es7`、`disableUseStrict`、`minifyJS`、`minifyWXML`、`minifyWXSS`、`minify`、`codeProtect`、`autoPrefixWXSS`、`compileWorklet`，这些字段必须是 JSON 布尔值（`false` 而非 `"false"`）。额外的 SDK setting 字段也会原样传递，是否生效取决于所用 `miniprogram-ci` 版本。未指定 `useProjectConfig` 时补为 `true`，可显式关闭。字段作用见 [微信配置](https://github.com/wot-ui/ci/blob/main/docs/guides/configuration.md#微信-weixin)。

预览时将命令改为 `command: preview`，并添加如下 input：

```yaml
preview: |
  {
    "pagePath": "pages/index/index",
    "searchQuery": "from=ci&debug=1",
    "scene": 1011,
    "qrcodeFormat": "image",
    "qrcodeOutputDest": "artifacts/preview.png",
    "threads": 2,
    "bigPackageSizeSupport": false
  }
```

`platform-options` 支持当前平台配置的全部可选字段，包含嵌套的 `setting` / `preview`：

| 平台 | 可用字段 | 说明 |
| --- | --- | --- |
| 微信 | `type`、`ignores`、`robot`、`setting`、`preview`、`ide` | `type`：`miniProgram` / `miniGame` / `miniProgramPlugin` / `miniGamePlugin`；`ignores`：字符串数组；`robot`：1–30 整数 |
| 支付宝 | `clientType`、`autoincrement`、`preview`、`ide` | `clientType` 取值见 [支付宝配置](https://github.com/wot-ui/ci/blob/main/docs/guides/configuration.md#支付宝-alipay)；`autoincrement` 为布尔值 |
| 钉钉 | `projectType`、`autoincrement` | `projectType` 取值见 [钉钉配置](https://github.com/wot-ui/ci/blob/main/docs/guides/configuration.md#钉钉-dingtalk)，当前仅保留字段，上传实现未使用；`autoincrement` 为布尔值，钉钉不支持预览 |

微信 `preview` 字段（也可写在 `platform-options.preview`，或通过 `WEIXIN_PREVIEW` 提供）：

| 字段 | 类型 / 默认行为 | 用途 |
| --- | --- | --- |
| `qrcodeFormat` | 字符串，默认 `image` | `terminal` / `image` / `base64` |
| `qrcodeOutputDest` | 字符串，缺省写入 `.wotci/preview/` | 二维码文件路径，相对 `working-directory` |
| `pagePath` | 字符串，可省略 | 预览启动页面 |
| `searchQuery` | 字符串，可省略 | 启动页面参数，如 `from=ci&debug=1` |
| `scene` | 非负整数，可省略 | 预览场景值 |
| `desc` | 字符串，缺省沿用上传描述 | 预览备注 |
| `robot` | 1–30 整数，缺省沿用上传机器人 | 预览机器人编号 |
| `setting` | JSON 对象，缺省沿用上传 `setting` | 预览专用编译设置，支持相同的编译字段 |
| `threads` | 非负整数，省略时由 SDK 决定 | 本地编译线程数 |
| `bigPackageSizeSupport` | 布尔值，省略时由 SDK 决定 | 预览时将主包、分包体积上限调整为 4M |

支付宝 `preview` 字段（也可写在 `platform-options.preview`，或通过 `ALIPAY_PREVIEW` 提供；省略时不向 SDK 指定该值）：

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `page` | 字符串 | 预览启动页面 |
| `pageQuery` | 字符串 | 页面参数 |
| `query` | 字符串 | 全局启动参数 |
| `scene` | 字符串 | 场景值，注意与微信的整数类型不同 |
| `autoPush` | 布尔值 | 是否自动推送到客户端 |
| `ignoreHttpDomainCheck` | 布尔值 | 是否忽略 HTTP 请求域名白名单校验 |
| `ignoreWebViewDomainCheck` | 布尔值 | 是否忽略 WebView 域名白名单校验 |

微信 `ide` 支持 `cliPath`、`port`（1–65535）、`lang`（`zh` / `en`），支付宝 `ide` 支持 `appPath`。可保留这些配置，但无配置模式仍只支持 `upload` / `preview` / `doctor`，不执行 IDE 命令。

支付宝预览步骤示例（放在构建完成后，下载二维码到本地；执行上传时改为 `command: upload` 并移除预览专用字段）：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    command: preview
    platform: alipay
    project-path: dist/build/mp-alipay
    appid: ${{ secrets.ALIPAY_APPID }}
    private-key: ${{ secrets.ALIPAY_PRIVATE_KEY }}
    tool-id: ${{ secrets.ALIPAY_TOOL_ID }}
    platform-options: |
      { "clientType": "alipay", "autoincrement": false }
    preview: |
      {
        "page": "pages/index/index",
        "pageQuery": "from=ci",
        "query": "debug=1",
        "scene": "1001",
        "autoPush": false,
        "ignoreHttpDomainCheck": false,
        "ignoreWebViewDomainCheck": false
      }
    args: --qr-output artifacts/alipay-preview.png
```

支付宝 `clientType` 默认 `alipay`，同时用于上传、预览及版本查询。`autoincrement` 仅影响上传：`false` 时检查上传版本高于线上版本，`true` 时交给平台递增。微信编译设置不适用于支付宝，因此不能传 `setting` / `minifyJS`。

钉钉上传步骤示例（放在构建完成后）：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    platform: dingtalk
    project-path: dist/build/mp-alipay
    appid: ${{ secrets.DINGTALK_APPID }}
    token: ${{ secrets.DINGTALK_TOKEN }}
    upload-version: 1.2.3
    platform-options: '{"autoincrement":true}'
```

钉钉 `autoincrement` 默认 `false`，上传使用指定版本；开启后由平台递增。Action 的无配置上传入口仍要求提供 `upload-version` / `WOTCI_VERSION` 或当前目录的 `package.json.version`。`ALIPAY_OPTIONS` / `DINGTALK_OPTIONS` 可提供对应 `platform-options` 的 JSON，`ALIPAY_PREVIEW` 可提供预览 JSON。

**支持范围以 Wot CI 已实现的平台配置为准，不等于底层 SDK 所有参数都已开放。** 微信 `setting` 额外字段按 SDK 能力透传；其他平台扩展字段按上表校验。支付宝上传的 `experience` 当前固定为 `true`，不接受配置；钉钉的 `projectType` 仅保留、不参与上传，且没有预览能力。JSON 入口不会额外赋予这些能力。

优先级与限制：

- 每个 JSON input 的非空 `with` 值优先于对应 `env`，选中对象整体使用，不合并另一个来源。空白字符串视为未传，`{}` 是显式空对象。
- 专用 `setting` / `preview`（或其 env 回退）整体替换 `platform-options.setting` / `.preview`，不做深合并。`robot` 按 input → `WEIXIN_ROBOT` → `platform-options.robot` → `1` 取值。
- 微信未提供 `preview.setting` 时沿用上传 `setting`；提供后整体替换，不自动合并上传设置，也不自动补 `useProjectConfig`。CLI 预览参数（如 `args` 中的 `--qr-output`）仍优先于对应预览配置。
- JSON 中的路径仍相对 `working-directory`，可以含空白；参数不会作为 shell 代码执行。
- `appid`、`projectPath`、`privateKey`、`privateKeyPath`、`toolId`、`token` 使用专用 inputs / env，不能放进 `platform-options`。不支持的平台字段、已知字段的错误类型、无效 JSON 会在 CLI 执行前报错，不回显原始 JSON。
- 显式 `config` 不能混用扩展 inputs；只传扩展 env 时仍优先自动发现已有配置文件，不自动注入或覆盖该文件。需强制无配置模式时显式传 `project-path` 或扩展 input。
