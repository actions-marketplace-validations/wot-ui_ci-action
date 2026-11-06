# Wot CI Action

[![CI](https://github.com/wot-ui/ci-action/actions/workflows/ci.yml/badge.svg)](https://github.com/wot-ui/ci-action/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

在 GitHub Actions 中上传微信、支付宝、钉钉小程序，生成微信 / 支付宝预览二维码。直接传入构建产物和凭据，无需额外配置文件。

本仓库维护 GitHub Action 接入层；CLI、JS API、Vite 插件与核心实现由 [Wot CI](https://github.com/wot-ui/ci) 提供。

[快速开始](#快速开始) · [使用示例](#使用示例) · [全部参数](#参数参考) · [维护与发布](#维护与发布)

对象字段直达：[setting](#setting) · [preview](#preview) · [platform-options](#platform-options)

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

## 使用示例

项目需先完成 checkout、依赖安装和构建，完整 workflow 见 [README](#快速开始)。以下步骤均放在构建完成后。默认 `command: upload`，上传版本读取工作目录的 `package.json.version`。

### 三个平台上传

微信：

```yaml
- uses: wot-ui/ci-action@v2
  with:
    platform: weixin
    project-path: dist/build/mp-weixin
    appid: ${{ secrets.WEIXIN_APPID }}
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    setting: '{"minifyJS":true,"minifyWXML":true,"minifyWXSS":true}'
```

支付宝：

```yaml
- uses: wot-ui/ci-action@v2
  with:
    platform: alipay
    project-path: dist/build/mp-alipay
    appid: ${{ secrets.ALIPAY_APPID }}
    tool-id: ${{ secrets.ALIPAY_TOOL_ID }}
    private-key: ${{ secrets.ALIPAY_PRIVATE_KEY }}
```

钉钉：

```yaml
- uses: wot-ui/ci-action@v2
  with:
    platform: dingtalk
    project-path: dist/build/mp-dingtalk
    appid: ${{ secrets.DINGTALK_APPID }}
    token: ${{ secrets.DINGTALK_TOKEN }}
```

凭据由调用方仓库 Secrets 提供。微信上传需配置 CI IP 白名单；使用何种 runner 由项目决定。已有私钥文件可把 `private-key` 替换为 `private-key-path`。

### 预览和结果归档

微信和支付宝支持 `command: preview`；钉钉不支持。下面生成微信预览二维码、JSON 结果和 Markdown 摘要：

```yaml
- uses: wot-ui/ci-action@v2
  with:
    command: preview
    platform: weixin
    project-path: dist/build/mp-weixin
    appid: ${{ secrets.WEIXIN_APPID }}
    private-key: ${{ secrets.WEIXIN_PRIVATE_KEY }}
    preview: '{"pagePath":"pages/index/index","searchQuery":"from=ci"}'
    qrcode-output: artifacts/preview.png
    json-output: artifacts/result.json
    summary: artifacts/summary.md

- name: Show result
  if: always()
  shell: bash
  run: |
    if [ -f artifacts/summary.md ]; then
      cat artifacts/summary.md >> "$GITHUB_STEP_SUMMARY"
    fi

- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: miniapp-preview
    path: artifacts/
    if-no-files-found: warn
```

支付宝使用同样的 `qrcode-output` 下载二维码，`preview` 对象的字段改为 `page` / `pageQuery` 等，见 [参数表](#支付宝)。设置了 `working-directory` 时，归档与追加 Summary 的路径也要加上该工作目录。

### 首次接入检查

在上传或预览步骤加上 `dry-run: 'true'`，先检查目录、凭据文件和计划；这不会调用平台 SDK，也不会生成可扫码二维码。检查通过后移除该项才能真正上传 / 预览。也可将 `command` 改为 `doctor` 检查配置和环境。

### 已有配置和多平台

```yaml
- uses: wot-ui/ci-action@v2
  with:
    command: upload
    config: wotci.config.ts
    platform: weixin,alipay
    json-output: artifacts/result.json
  env:
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
    WEIXIN_PRIVATE_KEY_PATH: ${{ runner.temp }}/weixin.key
```

此例要求配置文件读取相应环境变量，并提前准备私钥文件。配置模式不要同时传入 `appid`、`project-path` 等直接配置参数。多平台也可以用 GitHub matrix 分别调用 Action，让每个平台独立执行与归档。

版本查询、体验版设置、发布编排等高级操作使用 [核心 CLI](https://github.com/wot-ui/ci/blob/main/docs/guides/commands.md)。

## 参数参考

v2 专注小程序 **上传、预览、配置检查**。普通微信上传只需 4 项：`platform`、`project-path`、`appid`、`private-key`。Action 不安装项目依赖、不执行项目构建；请在前面的步骤完成。

### 对象参数快速入口

| Input | 适用平台 | 子字段说明 |
| --- | --- | --- |
| `setting` | 微信 | [11 个编译字段：类型、默认行为和含义](#setting) |
| `preview` | 微信、支付宝 | [微信 10 个字段](#微信)、[支付宝 7 个字段](#支付宝)，包含嵌套 `preview.setting` |
| `platform-options` | 微信、支付宝、钉钉 | [按平台列出全部一级字段及嵌套对象](#platform-options) |

这三项在 `with` 中都要写成 **JSON 对象字符串**，不是 YAML 对象。例如 `setting: '{"minifyJS":true}'`，或使用 `setting: |` 换行写 JSON。子字段里的布尔值和数字不用引号；JSON 不支持注释或尾随逗号。除微信编译 `setting` 允许 SDK 扩展字段外，未知字段会在调用 CLI 前报错。

### 上传必需的信息

| 参数 | 微信 | 支付宝 | 钉钉 |
| --- | --- | --- | --- |
| `platform` | `weixin` | `alipay` | `dingtalk`（也接受 `dd`） |
| `project-path` | 构建后的目录，例如 `dist/build/mp-weixin` | 例如 `dist/build/mp-alipay` | 例如 `dist/build/mp-dingtalk` |
| `appid` | 小程序 App ID | 业务应用 App ID | 应用 App ID |
| `private-key` / `private-key-path` | 上传私钥，二选一 | 工具私钥，二选一 | 不传 |
| `tool-id` | 不传 | 开放平台工具 ID，必填，与业务 App ID 不同 | 不传 |
| `token` | 不传 | 不传 | API token，必填 |

所有 input 在 YAML 中均以字符串传入，缺省为空；是否必填取决于平台、配置文件和环境变量。`private-key` 是完整的多行私钥文本，建议从 Secrets 注入；Action 写入临时文件并在退出时清理。`private-key-path` 指向已存在的文件，Action 不删除该文件。两者不可同时提供。

`project-path` 指向**可上传产物**，不是源码目录。路径统一相对 `working-directory`（默认 `.`，即当前工作区目录），也可使用绝对路径。Monorepo 中例如 `working-directory: apps/miniapp`、`project-path: dist/build/mp-weixin`。

### 版本和上传说明

| 参数 | 默认值 / 来源 | 含义 |
| --- | --- | --- |
| `upload-version` | `WOTCI_VERSION` → 工作目录的 `package.json.version` | 上传到平台的小程序版本，与 Action / CLI 版本无关 |
| `upload-desc` | `WOTCI_DESC` → `package.json.description` | 上传备注，例如本次改动或提交号；可省略 |
| `robot` | `WEIXIN_ROBOT` → `platform-options.robot` → `1` | 微信 CI 机器人，字符串形式的整数 `1`–`30` |

非空 input 优先于环境变量。没有 `package.json.version` 时上传需显式提供 `upload-version`；预览和配置检查不要求它。支付宝默认要求上传版本大于平台最新版本。支付宝 / 钉钉可通过 `platform-options.autoincrement` 交由平台递增；无配置模式的前置校验仍需要版本来源，递增时不会把该版本作为最终上传版本。

```yaml
upload-version: 1.2.3
upload-desc: 修复登录问题
robot: '2'
```

### 命令和结果文件

| 参数 | 类型 / 默认值 | 用途 |
| --- | --- | --- |
| `command` | 字符串，`upload` | 仅 `upload` / `preview` / `doctor`；钉钉不支持预览 |
| `dry-run` | 布尔字符串，`'false'` | `'true'`（也接受 `'1'`）只校验计划，不调用平台 SDK，不生成真实二维码 |
| `qrcode-output` | 路径，空 | 仅 `preview`：微信二维码文件 / 支付宝二维码下载路径 |
| `json-output` | 路径，空 | 启用结构化 JSON 输出并保存文件；保留 CLI 的失败退出码 |
| `summary` | 路径，空 | `upload` / `preview` 的 Markdown 结果文件，`doctor` 不使用它 |

`doctor` 检查配置和运行环境，不开启平台网络探测。JSON / Markdown / 二维码路径均相对 `working-directory`。`summary` 不会自动出现在 GitHub Job Summary，需后续步骤追加到 `$GITHUB_STEP_SUMMARY`。Action 没有公开的 `steps.<id>.outputs`；通过这些文件归档或读取结果，见 [完整流程](#预览和结果归档)。

微信二维码默认写入 `.wotci/preview/weixin.png`；Base64 格式默认 `.wotci/preview/weixin.txt`。`qrcode-output` 优先于 `preview.qrcodeOutputDest`；`qrcodeFormat: terminal` 不写文件。支付宝未指定 `qrcode-output` 时只返回二维码 URL。

### 微信编译设置

#### setting

仅用于微信，全部子字段均为可选。直接传 `setting`，或写在 `platform-options.setting`，字段相同。

| 子字段 | JSON 类型 | 省略时的行为 | 含义 |
| --- | --- | --- | --- |
| `useProjectConfig` | `boolean` | 顶层编译设置补为 `true` | 使用产物目录中 `project.config.json` 的编译设置 |
| `es6` | `boolean` | 不指定，由 SDK / 项目配置决定 | ES6 转 ES5 |
| `es7` | `boolean` | 不指定，由 SDK / 项目配置决定 | 增强编译 |
| `disableUseStrict` | `boolean` | 不指定，由 SDK / 项目配置决定 | 增强编译时禁用 JS 严格模式 |
| `minifyJS` | `boolean` | 不指定，由 SDK / 项目配置决定 | 压缩 JavaScript |
| `minifyWXML` | `boolean` | 不指定，由 SDK / 项目配置决定 | 压缩 WXML |
| `minifyWXSS` | `boolean` | 不指定，由 SDK / 项目配置决定 | 压缩 WXSS |
| `minify` | `boolean` | 不指定，由 SDK / 项目配置决定 | 压缩所有代码 |
| `codeProtect` | `boolean` | 不指定，由 SDK / 项目配置决定 | 代码保护 |
| `autoPrefixWXSS` | `boolean` | 不指定，由 SDK / 项目配置决定 | 自动补全 WXSS 样式前缀 |
| `compileWorklet` | `boolean` | 不指定，由 SDK / 项目配置决定 | 编译 worklet 代码 |

“未指定”不等于 `false`。Action 只为顶层 `setting.useProjectConfig` 补默认值，不为其他字段强行设置开关。`true` / `false` 必须是 JSON 布尔值，`"false"` 会因类型错误被拒绝。额外的微信 SDK setting 字段会原样传入，是否生效取决于项目实际使用的 SDK。

常用上传设置可直接复制到 `with`：

```yaml
setting: |
  {
    "useProjectConfig": true,
    "es6": true,
    "minifyJS": true,
    "minifyWXML": true,
    "minifyWXSS": true
  }
```

这些选项传给微信 SDK，Action 本身不执行源码构建；产物仍需提前生成。

### 预览设置

#### preview

`preview` 接受 JSON 对象字符串，用于指定启动页面和平台预览选项；无需定制时省略。只在 `command: preview` 时生效。

```yaml
command: preview
qrcode-output: artifacts/preview.png
preview: '{"pagePath":"pages/index/index","searchQuery":"from=ci"}'
```

#### 微信

| 字段 | 类型 / 默认行为 | 用途 |
| --- | --- | --- |
| `pagePath` | 字符串，可省略 | 启动页面 |
| `searchQuery` | 字符串，可省略 | 页面参数，例如 `from=ci&debug=1` |
| `scene` | 非负整数，可省略 | 场景值 |
| `qrcodeFormat` | `image`（默认）/ `base64` / `terminal` | 二维码格式 |
| `qrcodeOutputDest` | 字符串，可省略 | 二维码路径；通常直接用 `qrcode-output` |
| `desc` | 字符串，沿用上传备注 | 预览备注 |
| `robot` | 整数 `1`–`30`，沿用上传机器人 | 预览机器人 |
| `setting` | 对象，省略整个对象时沿用上传编译设置 | 预览专用的 [11 个编译字段](#setting)，见下面的嵌套示例 |
| `threads` | 非负整数，由 SDK 决定 | 编译线程数 |
| `bigPackageSizeSupport` | 布尔值，由 SDK 决定 | 启用大包预览支持 |

`preview.setting` 支持与 `setting` 相同的 11 个布尔字段，但**传入后整体替换上传编译设置，不做逐字段合并**；也不会自动补入 `useProjectConfig: true`。例如上传设置启用了 `es6`，而预览只传 `{"minifyJS":true}`，预览不会自动继承那个 `es6`。需要时明确写出：

```yaml
command: preview
qrcode-output: artifacts/preview.png
preview: |
  {
    "pagePath": "pages/index/index",
    "searchQuery": "from=ci&debug=1",
    "scene": 1011,
    "qrcodeFormat": "image",
    "setting": {
      "useProjectConfig": true,
      "es6": true,
      "minifyJS": true
    }
  }
```

#### 支付宝

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `page` | 字符串 | 启动页面 |
| `pageQuery` | 字符串 | 页面参数 |
| `query` | 字符串 | 全局启动参数 |
| `scene` | 字符串 | 场景值，与微信的整数类型不同 |
| `autoPush` | 布尔值 | 是否自动推送到客户端 |
| `ignoreHttpDomainCheck` | 布尔值 | 忽略 HTTP 域名白名单校验 |
| `ignoreWebViewDomainCheck` | 布尔值 | 忽略 WebView 域名白名单校验 |

支付宝字段均可省略；未传时由 SDK 决定。支付宝不支持 `preview.setting`、`pagePath` 或 `searchQuery`，应使用下面的字段名。钉钉不支持 `preview`。

```yaml
command: preview
qrcode-output: artifacts/alipay-preview.png
preview: |
  {
    "page": "pages/index/index",
    "pageQuery": "from=ci",
    "query": "debug=1",
    "scene": "ci",
    "autoPush": false
  }
```

### 其他平台选项

#### platform-options

JSON 对象字符串，所有子字段均可省略；只接受当前平台的下列字段。凭据、App ID 和产物路径使用专用 inputs，不放在这个对象里。

| 平台 | 子字段 | JSON 类型 | 默认行为 / 取值 |
| --- | --- | --- | --- |
| 微信 | `type` | `string` | 默认 `miniProgram`；还可选 `miniGame`、`miniProgramPlugin`、`miniGamePlugin` |
| 微信 | `ignores` | `string[]` | 默认不额外传排除列表；例如 `["test/**", "node_modules/**"]` |
| 微信 | `robot` | `number`（整数） | `1`–`30`，缺省为 `1`；专用 `robot` input / `WEIXIN_ROBOT` 优先 |
| 微信 | `setting` | `object` | [全部 11 个子字段](#setting)；缺省补 `{ "useProjectConfig": true }` |
| 微信 | `preview` | `object` | [全部 10 个子字段](#微信)；只在预览时使用 |
| 支付宝 | `clientType` | `string` | 默认 `alipay`；完整枚举见下文 |
| 支付宝 | `autoincrement` | `boolean` | 默认关闭；开启时由平台递增上传版本 |
| 支付宝 | `preview` | `object` | [全部 7 个子字段](#支付宝)；只在预览时使用 |
| 钉钉 | `autoincrement` | `boolean` | 默认关闭；开启时由平台递增上传版本 |

`clientType` 可选：`alipay`、`ampe`、`amap`、`genie`、`alios`、`uc`、`quark`、`koubei`、`alipayiot`、`cainiao`、`alihealth`、`health`。选择应用实际所属终端。

微信嵌套示例（可以只保留需要的字段）：

```yaml
platform-options: |
  {
    "type": "miniProgram",
    "ignores": ["test/**"],
    "robot": 1,
    "setting": { "useProjectConfig": true, "minifyJS": true },
    "preview": { "pagePath": "pages/index/index", "scene": 1011 }
  }
```

支付宝：

```yaml
platform-options: |
  {
    "clientType": "alipay",
    "autoincrement": true,
    "preview": { "page": "pages/index/index", "autoPush": false }
  }
```

钉钉只接受一个子字段：

```yaml
platform-options: '{"autoincrement":true}'
```

这里的 `setting`、`preview` 已在 JSON 内部，因此直接写对象，不要再次编码成 JSON 字符串。例如 `"setting": {"es6":true}` 正确，`"setting": "{...}"` 会被拒绝。

JSON 对象按整体覆盖，不做逐字段合并：专用 input → 专用环境变量 → `platform-options` 中的同名对象。`platform-options` 本身也整体优先于对应 `*_OPTIONS`。只有微信顶层 `setting.useProjectConfig` 缺省时补为 `true`。

### 复用项目配置

`config` 指定配置文件路径，相对 `working-directory`。不指定时自动发现 `wotci.config.*`、`.minicirc`、`package.json.wotci` 等核心配置。配置模式的 `platform` 可以是逗号分隔的平台列表；无配置模式只选一个平台，多平台建议矩阵。

```yaml
- uses: wot-ui/ci-action@v2
  with:
    config: wotci.config.ts
    platform: weixin,alipay
    dry-run: 'true'
    json-output: artifacts/plan.json
  env:
    WEIXIN_APPID: ${{ secrets.WEIXIN_APPID }}
```

显式 `config` 不能与 `project-path`、`appid`、`private-key`、`private-key-path`、`upload-version`、`upload-desc`、`robot`、`tool-id`、`token`、`setting`、`preview`、`platform-options` 混用。请在配置文件内读取环境变量。

没有 `config` 时，任一上述非空 input 会启用无配置模式，绕过自动发现的配置。只有环境变量时，优先保留已有项目配置；未发现配置才根据平台环境变量生成临时配置。配置模式接受核心 CLI 的配置结构，不受 `platform-options` 字段白名单限制；Action 的三个命令限制仍适用。

### 环境变量回退

下表适用于无配置模式。非空 input 优先，空白 input 视为未传。已有配置文件时，请由配置文件读取环境变量。

| Input | 环境变量 |
| --- | --- |
| `platform` | `WOTCI_PLATFORM` |
| `project-path` | `WEIXIN_PROJECT_PATH` / `ALIPAY_PROJECT_PATH` / `DINGTALK_PROJECT_PATH` |
| `appid` | `WEIXIN_APPID` / `ALIPAY_APPID` / `DINGTALK_APPID` |
| `private-key` | `WEIXIN_PRIVATE_KEY` / `ALIPAY_PRIVATE_KEY` |
| `private-key-path` | `WEIXIN_PRIVATE_KEY_PATH` / `ALIPAY_PRIVATE_KEY_PATH` |
| `upload-version` / `upload-desc` | `WOTCI_VERSION` / `WOTCI_DESC` |
| `robot` / `tool-id` / `token` | `WEIXIN_ROBOT` / `ALIPAY_TOOL_ID` / `DINGTALK_TOKEN` |
| `setting` | `WEIXIN_SETTING` |
| `preview` | `WEIXIN_PREVIEW` / `ALIPAY_PREVIEW` |
| `platform-options` | `WEIXIN_OPTIONS` / `ALIPAY_OPTIONS` / `DINGTALK_OPTIONS` |

私钥文本和路径作为一对选择来源：任一私钥 input 非空时只使用 input；否则使用环境变量对。每个来源内部仍须二选一。其他平台的环境变量不会混入当前平台。

### 运行环境

Action 内部使用 Node.js 22；项目安装和构建使用的 Node 版本在前置步骤中设置。Action 之后的步骤也会看到该 Node 版本，需要其他版本时再次使用 `actions/setup-node`。

工作目录内存在可执行的 `node_modules/.bin/wotci` 时优先使用它，否则临时安装 Action 固定并验证的 `@wot-ui/ci@0.5.3`。如需控制 CLI 版本，将它作为项目依赖锁定并提前安装。下载默认使用 npm 官方源，可通过 `npm_config_registry`（优先）或 `NPM_CONFIG_REGISTRY` 指定；临时安装不会继承项目 `.npmrc` 的 registry。

## 版本规则

Action 与 CLI 独立版本管理：`@v2` 是 Action 的兼容主版本，`@v2.0.0` 是精确 Action 版本。v2.0.0 默认安装并验证 `@wot-ui/ci@0.5.3`，不会把 Action 标签当作 CLI 版本。

已有项目本地 CLI 时优先使用本地版本。Action 提供上传、预览和配置检查。

## 维护与发布

<details>
<summary>展开本地检查、CLI 更新和 Action 发布流程</summary>

本仓库只发布 GitHub Action，不发布 npm 包。核心 CLI 在 [wot-ui/ci](https://github.com/wot-ui/ci) 发布。

### 本地检查

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm lint
pnpm typecheck
pnpm test
pnpm verify:action
```

单元测试检查参数、临时私钥清理、缓存和失败输出。真实 CLI 测试使用 npm 发布的 `@wot-ui/ci`；CI 的 composite job 使用 `uses: ./` 和模拟凭据执行三平台 dry-run，不会上传到小程序平台。

### 更新 CLI

同时修改 `package.json.wotciVersion` 与 `devDependencies.@wot-ui/ci`，更新锁文件并跑检查。该版本是没有本地 CLI 时的默认值。Action 版本独立递增，不从 Action 标签推断 CLI 版本。

### 发布 Action

1. 更新 `package.json.version` 与锁文件，合并通过 CI 的提交。
2. 在该提交创建精确标签，例如 `v2.0.0`，运行 `pnpm verify:release v2.0.0` 后推送标签。
3. `Release` 工作流重新验证元数据、测试与 composite dry-run，通过后生成 draft release。
4. 打开 draft，勾选 **Publish this Action to the GitHub Marketplace**，选择分类并发布。
5. `Update major tag` 自动把 `v2` 指向最新稳定发布。预发布不会更新主版本标签。

手动重跑 `Release` 时，必须同时选择同一个 tag 作为 workflow ref 和输入 `tag`；可直接使用 GitHub 的 Re-run failed jobs。

Marketplace 名称使用 `wot-ui-ci-action`。精确版本标签发布后不重写；兼容主版本标签由发布工作流维护。

</details>

MIT © wot-ui
