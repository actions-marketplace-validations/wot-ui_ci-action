# 使用指南

项目需先完成 checkout、依赖安装和构建，完整 workflow 见 [README](../README.md#快速开始)。以下步骤均放在构建完成后。默认 `command: upload`，上传版本读取工作目录的 `package.json.version`。

## 三个平台上传

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

## 预览和结果归档

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

支付宝使用同样的 `qrcode-output` 下载二维码，`preview` 对象的字段改为 `page` / `pageQuery` 等，见 [参数表](inputs.md#支付宝)。设置了 `working-directory` 时，归档与追加 Summary 的路径也要加上该工作目录。

## 首次接入检查

在上传或预览步骤加上 `dry-run: 'true'`，先检查目录、凭据文件和计划；这不会调用平台 SDK，也不会生成可扫码二维码。检查通过后移除该项才能真正上传 / 预览。也可将 `command` 改为 `doctor` 检查配置和环境。

## 已有配置和多平台

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

版本查询、体验版设置、发布编排等高级操作使用 [核心 CLI](https://github.com/wot-ui/ci/blob/main/docs/guides/commands.md)。从 v1 升级见 [迁移指南](migration.md)。
