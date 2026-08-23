# dsh-ui-enhancements

English | [中文](./README.zh.md)

Small, focused UI enhancements for DeepSeek Harness.

## Current enhancement

Hover a populated session row to reveal **Pin / Unpin** and **Archive** beside the native menu.

- Pinned sessions stay at the top of their workspace group or the flat list.
- Pin preferences stay in the current browser's local storage.
- Archive reuses DSH's native, non-destructive archive action.
- Running sessions keep stable hover actions while their status updates.
- Keyboard focus and coarse-pointer devices can also reach the actions.

This plugin does not add agent tools, read session content, or copy conversation data.

## Install

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.1.0
```

Restart the DSH Web service after installing or removing the plugin.

## Remove

```sh
dsh plugin --profile web remove dsh-ui-enhancements
```

## Development

```sh
npm install
npm test
```

## License

MIT
