# dsh-ui-enhancements

为 DeepSeek Harness 提供独立、克制的小型界面增强。

## 当前功能

悬停已有内容的会话行时，在原生菜单旁直接显示 **置顶/取消置顶** 和 **归档**。

- 置顶会话保持在当前工作区分组或单列表顶部。
- Pin 偏好只保存在当前浏览器的本地存储中。
- 归档沿用 DSH 原生的非破坏性归档操作。
- 运行中会话更新状态时，hover 按钮仍保持稳定。
- 键盘焦点和触屏设备同样可以访问这些操作。

本插件不添加 Agent 工具，不读取会话内容，也不会复制对话数据。

## 安装

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.1.0
```

安装或卸载后请重启 DSH Web 服务。

## 卸载

```sh
dsh plugin --profile web remove dsh-ui-enhancements
```

## 开发

```sh
npm install
npm test
```

## 许可证

MIT
