# Action 参数参考

完整说明全部 **30 个 inputs**、三平台 JSON 子字段、环境变量及组合规则。快速复制工作流见 [使用指南](usage.md)，旧入口升级见 [迁移指南](migration.md)。

- [全部 inputs 索引](#完整-inputs-参考)
- [模式选择、必需信息与版本区别](#先选择配置模式)
- [逐项参数说明](#逐项参数说明)
- [环境变量对照](#环境变量对照)
- [路径与 monorepo 示例](#路径与-monorepo-示例)
- [编译、预览与平台扩展参数](#编译预览与平台扩展参数)
- [其他常用组合](#其他常用组合)
- [参数排错](#参数排错)

## 完整 inputs 参考

下表列出 `action.yml` 的全部 30 个 inputs。默认值是 Action 层的默认值，`空` 表示未显式传入；环境变量、配置文件和 CLI 仍可能提供回退值。元数据中的 inputs 均非必填，但无配置模式仍须满足所选平台的凭据与路径要求。布尔值建议写成小写字符串 `'true'` / `'false'`。不要使用 `True`、`yes` 或任意非空字符串代替布尔值；包装脚本按明确的字符串值判断，未识别值不一定报错。

| input | 值类型 | 默认值 | 用途与生效范围 |
| --- | --- | --- | --- |
| [`command`](#command) | 字符串 | `upload` | CLI 命令，如 `upload`、`preview`、`doctor`、`release`、`build-npm`、`sourcemap`、`inspect`、`quality`、`version latest`、`version list`、`version delete`、`experience set`、`experience cancel`；完整列表见 [CLI 命令速查](https://github.com/wot-ui/ci/blob/main/docs/guides/commands.md#cli-命令速查)。无配置模式仅支持 `upload` / `preview` / `doctor` |
| [`platform`](#platform) | 字符串 | 空 | 回退到 `WOTCI_PLATFORM`；无配置模式必须选单个平台，配置文件模式可用逗号分隔多个平台（是否支持取决于命令） |
| [`config`](#config) | 路径 | 空 | 配置文件路径，相对 `working-directory`；省略时按下方规则选择无配置模式或自动发现 |
| [`project-path`](#project-path) | 路径 | 空 | 无配置模式的构建产物目录，相对 `working-directory`；与对应平台环境变量至少提供一个 |
| [`appid`](#appid) | 字符串 | 空 | 无配置模式的平台应用 ID；与对应平台环境变量至少提供一个 |
| [`private-key`](#private-key) | 字符串 | 空 | 无配置模式的微信 / 支付宝私钥原文，建议来自 Secret；与 `private-key-path` 互斥 |
| [`private-key-path`](#private-key-path) | 路径 | 空 | 无配置模式的微信 / 支付宝私钥文件，相对 `working-directory`；必须提前存在 |
| [`upload-version`](#upload-version) | 字符串 | 空 | 无配置模式上传版本：input → `WOTCI_VERSION` → 当前执行目录的 `package.json.version`；上传时必须能取得版本 |
| [`upload-desc`](#upload-desc) | 字符串 | 空 | 无配置模式上传描述：input → `WOTCI_DESC` → 当前执行目录的 `package.json.description` |
| [`robot`](#robot) | 整数文本 1–30 | 空 | 无配置模式的微信机器人编号：input → `WEIXIN_ROBOT` → `platform-options.robot` → `1`，有效范围 1–30 |
| [`tool-id`](#tool-id) | 字符串 | 空 | 无配置模式的支付宝工具 ID；与 `ALIPAY_TOOL_ID` 至少提供一个 |
| [`token`](#token) | 字符串 | 空 | 无配置模式的钉钉 API token；与 `DINGTALK_TOKEN` 至少提供一个。不是 GitHub 评论用的 token |
| [`setting`](#setting) | JSON 对象字符串 | 空 | 无配置模式的微信编译设置 JSON；回退到 `WEIXIN_SETTING`，再取 `platform-options.setting`；默认补 `useProjectConfig: true` |
| [`preview`](#preview) | JSON 对象字符串 | 空 | 无配置模式的预览设置 JSON；回退到 `WEIXIN_PREVIEW` / `ALIPAY_PREVIEW`，再取 `platform-options.preview`；钉钉不支持 |
| [`platform-options`](#platform-options) | JSON 对象字符串 | 空 | 无配置模式的平台可选配置 JSON；回退到 `WEIXIN_OPTIONS` / `ALIPAY_OPTIONS` / `DINGTALK_OPTIONS`；凭据和产物路径使用专用 inputs |
| [`working-directory`](#working-directory) | 路径 | `.` | CLI 执行目录，同时决定配置、产物、私钥、结果文件的相对路径及本地 CLI / package.json 的查找位置 |
| [`summary`](#summary) | 路径 | 空 | Markdown 结果文件；仅传递给 `upload`、`preview`、`release`、`build-npm`、`sourcemap`、`inspect`、`quality`，其他命令忽略此 input；写入文件后可由后续步骤发布到 Job Summary |
| [`json`](#json) | 布尔字符串 | `false` | 传递 `--json`，在 CLI stdout 输出 JSON；不自动创建 artifact，也不代表 Action 整个步骤的日志只有 JSON |
| [`json-output`](#json-output) | 路径 | 空 | 保存 CLI JSON stdout，并自动启用 `json`；相对 `working-directory`，自动创建父目录并覆盖已有文件。CLI 的失败退出码继续传递 |
| [`dry-run`](#dry-run) | 布尔字符串 | `false` | 传递 `--dry-run`，对支持该选项的命令生成计划 / 校验而不执行真实操作；不能替代独立的 `doctor --network`，也不能证明平台上传成功 |
| [`network`](#network) | 布尔字符串 | `false` | 传递 `--network`，用于 `doctor` 的网络检查；失败默认使步骤失败，如需只做诊断可在调用步骤设置 `continue-on-error: true` |
| [`yes`](#yes) | 布尔字符串 | `false` | 传递 `--yes`，用于确认 `version delete` 等要求确认的操作 |
| [`version`](#version) | 字符串 | 空 | `experience set`、`experience cancel`、`version delete` 的目标版本；不用于设置上传版本 |
| [`pr-comment`](#pr-comment) | auto / true / false | `auto` | 仅用于 `release`。`auto` 沿用配置（未配置时自动检测 PR 上下文）；`true` 显式请求评论，缺少上下文会记录评论错误；`false` 禁用评论 |
| [`history`](#history) | auto / true / false | `auto` | 仅用于 `release`。`false` 禁用历史；`auto` 和 `true` 均沿用配置（未配置时开启），`true` 不会覆盖配置中的 `history: false`。默认写入 `.wotci/history.json`，跨运行保留需自行归档 / 恢复 |
| [`args`](#args) | 单行参数字符串 | 空 | 追加 CLI 参数，例如 `--concurrency 2`；按空白拆分，不支持 shell 引号分组、变量展开或命令替换。无配置模式禁止通过它覆盖 `--config` / `-c`、`--cwd`、`--platform` / `-p`、`--all` |
| [`package-version`](#package-version) | 字符串 | 空 | 仅在没有本地 CLI、使用 npx 时生效；显式值优先，否则使用 Action 的 `package.json.wotciVersion`（v1.0.0 为 `0.5.3`），与 Action 标签无关 |
| [`registry`](#registry) | URL 字符串 | 空 | 临时 CLI 安装源：优先此 input，再取 `npm_config_registry` / `NPM_CONFIG_REGISTRY`，最后默认 `https://registry.npmjs.org/`；覆盖项目 `.npmrc` 的普通 `registry`，不修改项目依赖安装源 |
| [`install-dependencies`](#install-dependencies) | 布尔字符串 | `false` | 在 `working-directory` 安装依赖后再运行 CLI，不负责构建；包管理器选择规则见下文 |
| [`node-version`](#node-version) | 字符串 | `20` | 传给 Action 内部的 `actions/setup-node`。即使此前 job 已安装其他 Node 版本，Action 仍执行此设置；需要保持一致时显式指定 |

CLI 下载缓存：

- 临时 CLI 使用独立的 npm 缓存，按操作系统、架构、Node 版本、CLI 版本选择器、registry 和安装脚本隔离。自动恢复并保存包下载缓存和 npx 安装目录，不缓存项目文件、生成的配置、私钥或 npm 日志。准备 CLI 成功后，即使上传失败也会保存缓存；缓存服务失败不会阻止上传。项目本地 CLI 可用时跳过此缓存。
- 日志分别显示「CLI 准备耗时」和「CLI 执行耗时」；前者包含依赖解析、下载和安装，后者包含 CLI 启动及实际命令。首次运行或缓存未命中仍需安装；浮动版本仍由 npm 正常解析，缓存不会把 `latest` 固定为旧版本。

## 先选择配置模式

本页对应 Action v1.0.0 的行为，默认 CLI 为 `@wot-ui/ci@0.5.3`。手动指定或在项目中安装其他 CLI 版本时，CLI 命令能力、SDK 行为和返回结构以实际使用版本为准。所有 `with` inputs 最终均作为字符串传入；下面的类型指字符串应该表达的内容。

| 模式 | 选择方式 | 支持的场景 |
| --- | --- | --- |
| 显式配置文件 | 设置 `config`，不设置无配置专用 inputs | 复用项目配置、多平台、`release`、版本管理、微信诊断等 |
| 显式无配置 | 不设 `config`，设置任一无配置专用 input | 单平台 `upload` / `preview` / `doctor`；忽略项目中已有的配置文件 |
| 自动发现 | 不设 `config`，也不设无配置专用 inputs | 优先使用项目配置；没有项目配置且存在所选平台的环境变量时，生成单平台配置 |

无配置专用 inputs 共 12 个：`project-path`、`appid`、`private-key`、`private-key-path`、`upload-version`、`upload-desc`、`robot`、`tool-id`、`token`、`setting`、`preview`、`platform-options`。**即使只传一个 `upload-version` 或 `setting`，也会进入无配置模式；它们不是配置文件的覆盖参数。** `platform` 本身不会强制切换模式。

配置文件自动发现顺序：`wotci.config.js` / `.mjs` / `.cjs` / `.ts` / `.mts` / `.cts`（按此顺序）→ `package.json.wotci` → `.minicirc` → `package.json["uni-mini-ci"]`。只传平台环境变量不会覆盖已有配置文件；配置文件需自行读取 `process.env`。配置中使用 `defineConfig` 导入时，需要项目安装 `@wot-ui/ci`。

在兼容旧用法时，若仅通过 `args` 指定 `--config` / `-c` / `--cwd` 且没有无配置专用 input，Action 将配置选择交给 CLI。新接入建议使用 `config` 与 `working-directory`，避免出现两套路径基准。

### 三平台最小必需信息

所有 inputs 在元数据中都标记为非必填，是为了兼容配置文件和环境变量；不代表实际上传无需凭据。以下要求针对无配置模式，也适用于该模式下的 `doctor` 和 `preview`，上传版本除外。

| 信息 | 微信 `weixin` | 支付宝 `alipay` | 钉钉 `dingtalk` |
| --- | --- | --- | --- |
| `platform` | 必须明确选择 | 必须明确选择 | 必须明确选择；接受别名 `dd` |
| `project-path` | 已构建的微信产物目录 | 已构建的支付宝产物目录 | 对应钉钉项目的构建产物目录 |
| `appid` | 小程序 AppID | 平台应用 ID | 平台应用 ID |
| 凭据 | `private-key` 或 `private-key-path` | `private-key` 或 `private-key-path`，以及 `tool-id` | `token` |
| 上传版本 | input / 环境变量 / 当前目录 package.json 三者至少一个 | 同左；即使开启自动递增，Action 无配置上传仍检查此项 | 同左；即使开启自动递增也检查 |
| 预览 | 支持 | 支持 | 不支持，不能通过设置 `preview` 开启 |

`dry-run` 不会免除这些信息的本地校验。它不会验证凭据是否获得平台授权，也不会替你构建产物。

### 区分 Action、CLI 与小程序版本

| 名称 | 控制什么 | 示例 |
| --- | --- | --- |
| `uses: wot-ui/ci-action@v1` | GitHub Action 的代码版本 | `@v1`、`@v1.0.0`、提交 SHA |
| `package-version` | 没有本地 CLI 时安装的 npm 包版本 | `'0.5.3'` |
| `upload-version` | 无配置模式下要上传的小程序版本 | `'1.2.3'` |
| `version` | 版本删除、体验版管理操作的目标版本 | `'1.2.3'` |

## 逐项参数说明

### `command`

字符串，默认 `upload`。多级命令写成单行字符串，例如 `command: 'version latest'`，不带 `wotci` 前缀。

| 命令 | 平台 / 条件 | 常搭配的参数 |
| --- | --- | --- |
| `upload` | 微信、支付宝、钉钉；两种模式均可 | `platform`、`dry-run`、`summary`、`json-output` |
| `preview` | 微信、支付宝；两种模式均可 | `preview`、`args: --qr-output ...` |
| `doctor` | 检查项目配置；两种模式均可 | `network`、`json-output`；不接收 Action 的 `summary` |
| `release` | 配置文件模式，多平台发布编排 | `config`、`platform`、`pr-comment`、`history`、`summary` |
| `build-npm` / `sourcemap` / `inspect` / `quality` | 微信，配置文件模式 | `args`、`summary`、`json-output` |
| `version latest` | 微信、支付宝，配置文件模式 | `platform`、`json-output` |
| `version list` / `version delete` | 支付宝，配置文件模式 | 删除需 `version`、`yes` |
| `experience set` / `experience cancel` | 支付宝，配置文件模式 | `version` |
| `init` / IDE 相关命令 | CLI 的其他入口；不能混用无配置 inputs | 具体参数见 [CLI 文档](https://github.com/wot-ui/ci/blob/main/docs/guides/commands.md)；IDE 操作还需本机安装开发者工具 |

`command` 按空白拆分，不执行 shell 语法。附加选项用 `args`；无配置模式不能把 `upload --help` 当作命令名，需写 `command: upload`、`args: --help`。

### `platform`

字符串，默认空；回退到 `WOTCI_PLATFORM`。规范值是 `weixin`、`alipay`、`dingtalk`，`dd` 为钉钉别名。无配置模式必须选择一个平台；`weixin,alipay` 不适用该模式。

配置文件模式的上传、预览或发布可用逗号分隔的平台列表；`args: --all` 可用于支持该选项的命令。`doctor` 不指定平台时检查已配置的平台。避免在 `args` 再次传入与 `platform` 冲突的选项。

### `config`

文件路径，默认空；相对 `working-directory`，也可使用绝对路径。支持的文件形式和自动发现顺序见上文。设置后不能再同时传任何无配置专用 input，凭据、版本和平台扩展设置应写入配置或由配置读取环境变量。

```yaml
with:
  command: upload
  working-directory: apps/miniapp
  config: wotci.config.ts
  platform: weixin
# 不要在这里再加 appid、upload-version、setting 等无配置专用 inputs
```

### `project-path`

目录路径，默认空，仅无配置模式使用。回退到所选平台的 `*_PROJECT_PATH`。目录必须是已构建的产物；Action 不执行项目构建。相对路径以 `working-directory` 为起点，而不是以 Action 仓库或临时配置文件所在目录为起点。路径可含空格，推荐使用正斜杠。

### `appid`

字符串，默认空，仅无配置模式使用。回退到所选平台的 `*_APPID`。建议对数字形式的应用 ID 加引号，避免 YAML 将其视作数字。与 `token`、私钥、支付宝 `tool-id` 分别提供，不要把这些字段放进 `platform-options`。

### `private-key`

多行私钥文本，默认空，仅微信 / 支付宝无配置模式使用，回退到对应的 `*_PRIVATE_KEY`。输入的是完整私钥文本，不是文件名或 Base64 编码；Action 不做 Base64 解码。常用写法：`private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}`。

Action 将原文写入临时文件（创建权限 `0600`），生成的配置也在临时目录中；成功、CLI 失败、正常可捕获的终止信号都会触发清理。机器突然停止等情况不能依赖退出清理。不会删除调用方已有的私钥文件。

### `private-key-path`

已存在的私钥文件路径，默认空，仅微信 / 支付宝无配置模式使用，回退到对应的 `*_PRIVATE_KEY_PATH`。相对 `working-directory`，或使用 `${{ runner.temp }}/upload.key` 这样的绝对路径。调用者负责准备文件、权限和执行后的清理。

**私钥优先级按一组处理**：只要显式传了 `private-key` 或 `private-key-path` 中任一个，就忽略环境变量中的两种私钥形式；同一来源内两者互斥。例如 `with.private-key` 可以覆盖已有的 `env.WEIXIN_PRIVATE_KEY_PATH`，但同时传两个私钥 inputs 会报错。

### `upload-version`

字符串，默认空，仅无配置模式使用。优先级为 input → `WOTCI_VERSION` → **当前 `working-directory` 的** `package.json.version`。`upload` 必须有版本；`preview` / `doctor` 不要求提供此项。不会修改 package.json，也不会直接修改 Git 标签。

配置文件模式使用配置的 `version` / `versionStrategy`。支付宝 / 钉钉的 `autoincrement` 控制平台递增策略，不会取消无配置上传入口的版本存在性检查。

### `upload-desc`

字符串，默认空，仅无配置模式使用。input → `WOTCI_DESC` → 当前目录的 `package.json.description`；均未提供时保持未设置。微信可用于上传 / 预览描述；其他平台是否有对应远端描述字段由 CLI / SDK 决定，CLI 结果仍可包含该描述。空或纯空白输入视为未传，不能用它强制清空已有环境变量回退。

### `robot`

整数文本，默认空，仅微信无配置模式使用。允许 `1`–`30`，建议写 `robot: '2'`。input → `WEIXIN_ROBOT` → `platform-options.robot` → `1`。`platform-options` 中该值必须是 JSON 数字。支付宝和钉钉不接受这个专用 input。

微信预览还可以通过 `preview.robot` 指定独立编号；预览命令行选项优先于 `preview.robot`，再回退到上传机器人编号。

### `tool-id`

字符串，默认空，支付宝无配置模式必需。input → `ALIPAY_TOOL_ID`，是支付宝开放平台工具 ID，与业务应用 `appid` 不同。微信和钉钉不接受这个 input。

### `token`

字符串，默认空，钉钉无配置模式必需。input → `DINGTALK_TOKEN`。建议从 Secrets 传入；微信 / 支付宝不接受这个 input。它不是 `GITHUB_TOKEN`，不能用于 GitHub PR 评论。

### `setting`

JSON 对象字符串，默认空，仅微信无配置模式使用。input → `WEIXIN_SETTING` → `platform-options.setting`。Action 会为上传设置补上 `useProjectConfig: true`，显式传 `false` 可以关闭；其他字段不由 Action 补默认值。

对象整体覆盖，不逐字段合并。例如专用 `setting: '{"es6":true}'` 会替换 `platform-options.setting` 中已有的 `minifyJS`。所有字段说明见下文「微信编译字段」。

### `preview`

JSON 对象字符串，默认空，仅微信 / 支付宝无配置模式使用。input → `WEIXIN_PREVIEW` / `ALIPAY_PREVIEW` → `platform-options.preview`。**这个 input 只设置预览选项，不会把 `command: upload` 改成预览**；生成二维码还需设置 `command: preview`。

微信与支付宝的字段和类型不同，例如 `scene` 在微信中是整数，在支付宝中是字符串。详见下文两张预览字段表；钉钉不支持此 input。

### `platform-options`

JSON 对象字符串，默认空，仅无配置模式使用。input → 对应平台的 `*_OPTIONS`。接受下文列出的可选平台字段，可嵌套 `setting` / `preview` / `ide`，不接受平台外层包装（如 `{"weixin":{...}}`）。

不接受凭据字段、`projectPath`，也不接受顶层 `versionStrategy`、`budgets`、`release`；这些能力请使用配置文件。未知字段会报错，唯一例外是微信 `setting` 中允许透传额外 SDK 字段。JSON 必须是对象，不能是数组、`null`、带注释的 JS 对象或字符串形式的 JSON 布尔值。

### `working-directory`

目录路径，默认 `.`，相对调用步骤的工作目录，正常 checkout 场景即仓库根目录。目录必须提前存在。它决定本地 CLI、package.json、自动发现配置和依赖安装的位置，并作为其他相对路径的基准。

例如设置 `working-directory: apps/miniapp` 后，`project-path: dist/mp-weixin` 实际指向 `apps/miniapp/dist/mp-weixin`；`json-output: artifacts/result.json` 实际写到 `apps/miniapp/artifacts/result.json`。后续 `upload-artifact` 的 `path` 仍需写完整的仓库相对路径。参见后面的 monorepo 示例。

### `summary`

Markdown 文件路径，默认空。仅对 `upload`、`preview`、`release`、`build-npm`、`sourcemap`、`inspect`、`quality` 追加 `--summary`；其他命令忽略此 input。相对路径基于 `working-directory`，建议使用 `${{ runner.temp }}/wotci/summary.md`。

它不会自动出现在 GitHub Job Summary，也不提供 Action output。先保存为明确的文件，再在后续 `run` 步骤中追加到 `$GITHUB_STEP_SUMMARY`。`summary: '$GITHUB_STEP_SUMMARY'` 不会进行 shell 变量展开；GitHub 的默认环境变量也不在 `env` context 中，不能用 `${{ env.GITHUB_STEP_SUMMARY }}` 取得它。见 [GitHub 默认变量说明](https://docs.github.com/en/actions/reference/workflows-and-actions/variables) 和 [归档示例](usage.md#预演预览与结果归档)。

### `json`

布尔字符串，默认 `'false'`。`'true'` / `'1'` 开启 `--json`。CLI 的结构化数据输出到 stdout，诊断日志输出到 stderr；整个 Action 日志仍包含初始化与安装信息。不会创建 JSON 文件，保存文件请使用 `json-output`。

### `json-output`

文件路径，默认空。设置后自动启用 `--json`，同时将 CLI stdout 输出到日志并写入文件；诊断 stderr 不进入该文件。相对路径以 `working-directory` 为起点，自动创建父目录，**覆盖已有同名文件**。

配置生成后、依赖安装和 CLI 执行前就会预先创建 / 清空文件；配置生成失败可能没有文件，安装失败可能留下空文件。因此读取时检查文件是否存在、非空及 JSON 的 `ok`。非零 CLI 退出码继续使 Action 失败，产物上传需加 `if: always()`。结果格式由具体 CLI 命令决定；上传 / 预览的批量 JSON 可读取 `ok` 和 `results`，不要假定所有命令都返回同一结构。

### `dry-run`

布尔字符串，默认 `'false'`；`'true'` / `'1'` 追加 `--dry-run`。上传 / 预览生成本地计划，`release` 进行预演；不调用真实上传 / 预览 SDK，也不证明平台权限、IP 白名单或二维码可用。

这不是整个 Action 的全局离线开关：Node 设置、CLI 安装、开启的依赖安装仍可能访问网络。也不能把它当作所有 CLI 命令的操作拦截器；例如版本查询 / 版本删除按各自命令行为执行。`doctor` 网络检查由独立的 `network` 参数控制。

### `network`

布尔字符串，默认 `'false'`；`'true'` / `'1'` 追加 `--network`，供 `doctor` 使用。其他命令不会因此变成网络诊断。检查失败默认让步骤失败；若诊断只是辅助信息，在调用步骤使用 `continue-on-error: true`，不需要修改本 input。

### `yes`

布尔字符串，默认 `'false'`；`'true'` / `'1'` 追加 `--yes`。用于 `version delete` 等需要确认的 CLI 操作，不用于控制上传、预览或平台授权。调用前明确指定 `platform` 和目标 `version`。

### `version`

字符串，默认空；非空时追加 `--version <值>`。用于 `version delete`、`experience set`、`experience cancel` 的目标版本。它不会覆盖上传版本；上传请用无配置模式的 `upload-version` 或配置文件中的版本设置。

### `pr-comment`

三态字符串，默认 `auto`，只对 `release` 有意义。`true` / `1` 追加 `--pr-comment`，`false` / `0` 追加 `--no-pr-comment`，`auto` 不追加标志，沿用配置与 CLI 的自动检测。

`auto` 在具备 token、仓库和 PR 编号时发表评论，否则跳过；显式 `true` 缺少上下文时会记录评论错误。需要步骤注入 `GITHUB_TOKEN` 或 `GH_TOKEN`，并配置相应的 PR / issue 写权限。不是传入 `with.token`。完整说明与示例见 [release 接入](usage.md#复用配置文件)。

### `history`

三态字符串，默认 `auto`，只对 `release` 有意义。`false` / `0` 追加 `--no-history`；`auto` / `true` 均不追加强制开启标志。因此 `history: 'true'` **不会覆盖配置文件中的 `history: false`**。

未禁用时默认记录到 `.wotci/history.json`；路径和策略可在配置中调整。不同 GitHub runner 之间不会自动保留此文件，需要自己归档和恢复。

### `args`

单行字符串，默认空。追加到 Action 生成的 CLI 参数之后；适用于 `--concurrency 2`、`--build-npm`、`--qr-output artifacts/preview.png` 等尚无专用 input 的选项。

当前实现只读取第一行，按空白拆分；shell 引号不会把多个词组合成一个参数，不展开 `$变量`、`~`，不执行 `$(命令)`。长参数可用 YAML 折叠形式 `>-`，不要用会保留换行的 `|`。含空格的路径优先通过专用 input 或 JSON 字段传递。

```yaml
args: >-
  --build-npm
  --concurrency 2
```

无配置模式禁止通过它覆盖 `--config` / `-c`、`--cwd`、`--platform` / `-p`、`--all`。避免重复传已经由其他 input 生成的选项。`args` 会显示在 CLI 参数日志中，不应放入私钥、token 等敏感值。

### `package-version`

npm 版本选择器字符串，默认空。没有可执行的本地 CLI 时，空值选择 Action 内记录的已验证版本（v1.0.0 是 `0.5.3`）；显式值可为精确版本、合法 npm 范围或 tag，例如 `'0.5.3'`、`'^0.5.3'`、`latest`。浮动选择器会随 npm 解析变化，需可重复执行时指定精确版本。

`working-directory/node_modules/.bin/wotci` 可执行时始终优先，`package-version` 不会替换它。检查是在可选的依赖安装之后进行；并不向父目录搜索另一个本地 CLI。Action tag / SHA 与 CLI 版本互不推断，更新 CLI 需更新项目依赖或此参数。

### `registry`

registry URL 字符串，默认空。优先级：input → `npm_config_registry` → `NPM_CONFIG_REGISTRY` → `https://registry.npmjs.org/`，用于临时 CLI 的 npx 安装。显式 registry 避免直接沿用项目 `.npmrc` 的普通 registry 设置；认证、作用域 registry 等仍遵循 npm 自身规则。

已选择本地 CLI 时不使用它；也不改变 `install-dependencies` 的项目安装源。它不是鉴权 token input。缓存按 registry 值隔离，日志不会打印该 URL。

### `install-dependencies`

布尔字符串，默认 `'false'`。**只有精确的 `'true'` 会开启安装，`'1'` 不开启**。它在配置选择 / 生成之后、CLI 选择之前运行；不会构建项目，无法补救配置选择阶段已缺失的必需信息。

只检查 `working-directory` 中的锁文件，按以下顺序选择：

| 条件 | 实际命令 |
| --- | --- |
| 存在 `pnpm-lock.yaml` | `pnpm install --frozen-lockfile`；找不到 pnpm 时尝试 `corepack enable` |
| 存在 `yarn.lock` 且 yarn 可用 | `yarn install --frozen-lockfile` |
| 存在 `package-lock.json` | `npm ci` |
| 存在 `bun.lockb` 且 bun 可用 | `bun install --frozen-lockfile` |
| 其他情况 | `npm install` |

`bun.lock` 不匹配当前 bun 分支；缺少 yarn / bun 时会继续检查后续条件。Action 不保证安装这些包管理器；尤其 monorepo 或有定制安装参数时，建议在前置步骤安装依赖并保持本 input 为默认值。

### `node-version`

`actions/setup-node` 接受的版本字符串，默认 `'20'`。它会在 Action 开始时重新设置 Node，即使 job 前面已经设置过 Node。需要与构建环境一致时显式使用同一个版本，例如 `'22'`。

本 Action 的 CI 覆盖 Linux Node 20 / 22 / 24，以及 macOS / Windows Node 22；这代表当前测试范围。实际 Node 还需满足选择的 CLI 及其 SDK 的要求。此参数不指定 pnpm / yarn 版本。

## 环境变量对照

下表是无配置适配层明确读取的环境变量。配置文件模式不会由适配层自动把它们合并进用户配置；应让配置显式读取。`platform` 的 `WOTCI_PLATFORM` 回退在两种模式均参与平台选择。

| input | 微信 | 支付宝 | 钉钉 |
| --- | --- | --- | --- |
| `platform` | `WOTCI_PLATFORM` | `WOTCI_PLATFORM` | `WOTCI_PLATFORM` |
| `project-path` | `WEIXIN_PROJECT_PATH` | `ALIPAY_PROJECT_PATH` | `DINGTALK_PROJECT_PATH` |
| `appid` | `WEIXIN_APPID` | `ALIPAY_APPID` | `DINGTALK_APPID` |
| `private-key` | `WEIXIN_PRIVATE_KEY` | `ALIPAY_PRIVATE_KEY` | 不适用 |
| `private-key-path` | `WEIXIN_PRIVATE_KEY_PATH` | `ALIPAY_PRIVATE_KEY_PATH` | 不适用 |
| `upload-version` | `WOTCI_VERSION` | `WOTCI_VERSION` | `WOTCI_VERSION` |
| `upload-desc` | `WOTCI_DESC` | `WOTCI_DESC` | `WOTCI_DESC` |
| `robot` | `WEIXIN_ROBOT` | 不适用 | 不适用 |
| `tool-id` | 不适用 | `ALIPAY_TOOL_ID` | 不适用 |
| `token` | 不适用 | 不适用 | `DINGTALK_TOKEN` |
| `setting` | `WEIXIN_SETTING` | 不适用 | 不适用 |
| `preview` | `WEIXIN_PREVIEW` | `ALIPAY_PREVIEW` | 不适用 |
| `platform-options` | `WEIXIN_OPTIONS` | `ALIPAY_OPTIONS` | `DINGTALK_OPTIONS` |

无配置模式中 `ALIPAY_AUTOINCREMENT` / `DINGTALK_AUTOINCREMENT` 不是单独的适配层入口；请在对应 `*_OPTIONS` JSON 中写 `autoincrement`。配置文件当然可以自行读取这些变量。其他 inputs 没有自动的同名环境变量回退，例如 `WOTCI_COMMAND` 不会代替 `with.command`。

## 路径与 monorepo 示例

假定仓库根目录负责安装依赖和构建，应用在 `apps/miniapp`，应用 package.json 中记录上传版本。下面的片段放在已有 job 的 checkout 之后；项目需通过 `packageManager` 固定 pnpm 版本并定义相应构建脚本。

```yaml
- uses: pnpm/action-setup@v4
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: pnpm
- run: pnpm install --frozen-lockfile
- run: pnpm --dir apps/miniapp build:mp-weixin
- uses: wot-ui/ci-action@v1
  with:
    node-version: '22'
    platform: weixin
    working-directory: apps/miniapp
    project-path: dist/build/mp-weixin
    appid: ${{ secrets.WEIXIN_APPID }}
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    dry-run: 'true'
    json-output: artifacts/result.json
    summary: ${{ runner.temp }}/miniapp-summary.md
- name: Publish summary
  if: always()
  shell: bash
  run: |
    if [ -f "$RUNNER_TEMP/miniapp-summary.md" ]; then
      cat "$RUNNER_TEMP/miniapp-summary.md" >> "$GITHUB_STEP_SUMMARY"
    fi
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: miniapp-plan
    path: apps/miniapp/artifacts/result.json
    if-no-files-found: warn
```

本例先做 dry-run；准备真实上传时移除它或设为 `'false'`。如果应用目录没有本地可执行 CLI，Action 会安装默认 CLI，即使 monorepo 根目录装过另一个版本；想使用应用依赖版本，应保证应用目录中的 CLI 入口可执行。

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

### 微信编译字段

下表所有字段的 JSON 类型都是 `boolean`，例如 `"minifyJS": true`；`"true"` 是字符串，会被拒绝。只有上传 `setting.useProjectConfig` 由 Action 默认补为 `true`；其余未指定字段交给项目配置和实际 SDK 处理，不要把「未传」理解为固定 `false`。

| 字段 | 含义 |
| --- | --- |
| `useProjectConfig` | 使用产物目录中的 `project.config.json` 编译设置 |
| `es6` | ES6 转 ES5 |
| `es7` | 增强编译 |
| `disableUseStrict` | 增强编译时禁用 JS 严格模式 |
| `minifyJS` | 压缩 JavaScript |
| `minifyWXML` | 压缩 WXML |
| `minifyWXSS` | 压缩 WXSS |
| `minify` | 压缩所有代码 |
| `codeProtect` | 代码保护 |
| `autoPrefixWXSS` | WXSS 自动补全样式前缀 |
| `compileWorklet` | 编译 worklet 代码 |

这些是传给微信 SDK 的选项；具体编译行为以所用 SDK 和项目配置为准，见 [微信 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html) 和 [miniprogram-ci 发布说明](https://www.npmjs.com/package/miniprogram-ci)。已有 CLI 版本未升级时，Action 不会替换其 SDK。

### 平台可选字段的完整取值

以下是无配置模式 `platform-options` 接受的全部一级字段。字段类型与白名单由 Action 校验，默认行为由 Action 或 CLI 实现。

| 平台 / 字段 | 类型 | 默认行为与限制 |
| --- | --- | --- |
| 微信 `type` | 枚举字符串 | 默认 `miniProgram`；另支持 `miniGame`、`miniProgramPlugin`、`miniGamePlugin` |
| 微信 `ignores` | 字符串数组 | 未指定时不额外传入排除列表；例如 `["test/**", "node_modules/**"]` |
| 微信 `robot` | 整数 | `1`–`30`；优先级低于专用 `robot` input 和 `WEIXIN_ROBOT` |
| 微信 `setting` | 对象 | 同上方编译字段；低于专用 `setting` 及其环境变量回退 |
| 微信 `preview` | 对象 | 同下方微信预览表；低于专用 `preview` 及其环境变量回退 |
| 微信 `ide` | 对象 | 可保存 `cliPath`（字符串）、`port`（1–65535 整数）、`lang`（`zh` / `en`）；无配置模式不运行 IDE 命令 |
| 支付宝 `clientType` | 枚举字符串 | 默认 `alipay`，同时用于上传、预览、版本查询；完整枚举见下文 |
| 支付宝 `autoincrement` | 布尔值 | 默认关闭；关闭时上传版本需大于平台最新版本，开启时由平台递增 |
| 支付宝 `preview` | 对象 | 同下方支付宝预览表；低于专用 `preview` 及其环境变量回退 |
| 支付宝 `ide` | 对象 | 仅 `appPath`（字符串）；无配置模式不运行 IDE 命令 |
| 钉钉 `projectType` | 枚举字符串 | 只保留并校验该配置，当前上传实现不向 SDK 传它；无默认生效值 |
| 钉钉 `autoincrement` | 布尔值 | 默认关闭；开启时把版本递增交给平台 |

支付宝 `clientType` 的完整允许值：`alipay`、`ampe`、`amap`、`genie`、`alios`、`uc`、`quark`、`koubei`、`alipayiot`、`cainiao`、`alihealth`、`health`。选择实际应用所属终端；枚举通过校验不代表账号已获该终端权限。

钉钉 `projectType` 的完整允许值：`dingtalk-personal`、`dingtalk-biz-isv`、`dingtalk-biz`、`dingtalk-biz-custom`、`dingtalk-biz-worktab-plugin`。当前字段不参与上传调用，不要依赖修改它切换 SDK 上传行为。

### 微信预览字段

微信 `preview` 字段（也可写在 `platform-options.preview`，或通过 `WEIXIN_PREVIEW` 提供）：

| 字段 | 类型 / 默认行为 | 用途 |
| --- | --- | --- |
| `qrcodeFormat` | 字符串，默认 `image` | `terminal` / `image` / `base64` |
| `qrcodeOutputDest` | 字符串，图片默认 `.wotci/preview/weixin.png`，Base64 默认 `.wotci/preview/weixin.txt` | 二维码文件路径，相对 `working-directory`；`terminal` 模式不写二维码文件 |
| `pagePath` | 字符串，可省略 | 预览启动页面 |
| `searchQuery` | 字符串，可省略 | 启动页面参数，如 `from=ci&debug=1` |
| `scene` | 非负整数，可省略 | 预览场景值 |
| `desc` | 字符串，缺省沿用上传描述 | 预览备注 |
| `robot` | 1–30 整数，缺省沿用上传机器人 | 预览机器人编号 |
| `setting` | JSON 对象，缺省沿用上传 `setting` | 预览专用编译设置，支持相同的编译字段 |
| `threads` | 非负整数，省略时由 SDK 决定 | 本地编译线程数 |
| `bigPackageSizeSupport` | 布尔值，省略时由 SDK 决定 | 预览时将主包、分包体积上限调整为 4M |

### 支付宝预览字段

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

## 其他常用组合

固定临时 CLI 安装版本与来源（项目没有本地 CLI 时生效），以下放在 checkout、构建及凭据准备完成之后：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    command: doctor
    config: wotci.config.cjs
    node-version: '22'
    package-version: '0.5.3'
    registry: https://registry.npmjs.org/
    install-dependencies: 'false'
```

配置文件模式下关闭发布评论与历史记录，并限制并发；具体构建和版本策略由项目配置控制：

```yaml
- uses: wot-ui/ci-action@v1
  with:
    command: release
    config: wotci.config.ts
    platform: weixin,alipay
    dry-run: 'true'
    pr-comment: 'false'
    history: 'false'
    args: --concurrency 2
    json-output: artifacts/release.json
```

操作指定支付宝版本（真实操作，不是上传参数；示例假定项目配置及授权已准备好）：

```yaml
# 将已有版本设置为体验版
- uses: wot-ui/ci-action@v1
  with:
    command: experience set
    config: wotci.config.ts
    platform: alipay
    version: '1.2.3'
# 如需删除某个已有版本，使用 version delete，并显式设置 yes: 'true'
```

## 参数排错

| 现象 | 原因与处理 |
| --- | --- |
| `config 不能与无配置文件模式的 inputs 混用` | 显式配置与 12 个无配置专用 inputs 混用了；移除这些 inputs，把值交给配置文件 |
| 项目有配置，但传 `setting` 后提示缺少 appid | `setting` 已强制进入无配置模式，需要提供该模式的完整必需信息；或把编译设置移入原配置 |
| 只传环境变量却没有覆盖已有配置 | 自动发现优先保留配置文件；让配置读取 env，或显式使用无配置 inputs |
| `platform-options` 包含不支持的字段 | 检查平台、拼写和层级；不要写 `{"weixin": ...}`、凭据字段或顶层发布配置 |
| JSON 的类型或取值无效 | 布尔值使用 `true` / `false`，数字使用 JSON 数字；微信 scene 是整数，支付宝 scene 是字符串；不能使用单引号 JS 对象 |
| 私钥来源互斥 | 检查同一来源是否同时给了文本和路径；显式 input 来源优先于整组 env 来源 |
| 设置 `version` 后上传版本没有变化 | 上传用 `upload-version`；配置模式改配置中的 `version` / `versionStrategy` |
| 找不到产物 / 私钥 / 配置文件 | 这些相对路径都从 `working-directory` 计算；确认前置步骤创建了实际文件 |
| `package-version` 没有生效 | 当前目录有可执行的本地 `wotci`，优先使用项目安装版本 |
| `args` 中带空格路径被拆开 | 参数不是 shell 命令，不支持引号分组；改用专用 input、JSON 路径或不含空格的路径 |
| Job Summary 没显示 | `summary` 只写文件，需要后续 shell 追加到 `$GITHUB_STEP_SUMMARY` |
| JSON 为空但文件存在 | 文件在 CLI 执行前已创建；检查安装、配置、CLI 启动错误，不要仅按文件存在判成功 |
| 上传失败后没收集到产物 | 后续 artifact 步骤加 `if: always()`，路径按调用工作区计算；Action 不自动上传文件 |
| 想用 `steps.upload.outputs.*` | 当前没有公开 outputs；用 `json-output` 文件和步骤 outcome。内部缓存步骤输出不是公共 API |
| 想直接传 `minifyJS` / `autoincrement` | 这不是独立 input；分别放入 `setting` / `platform-options` |

## 参考实现

本页以 [action.yml](../action.yml)、[配置适配脚本](../scripts/github-action-config.mjs)、[JSON 字段校验](../scripts/github-action-options.mjs) 和 [执行脚本](../scripts/github-action.sh) 为依据。全部 inputs 的接线、优先级、冲突、失败退出码与私钥清理由 [测试](../test) 覆盖；三平台 dry-run 通过不等于真实平台上传验收。
