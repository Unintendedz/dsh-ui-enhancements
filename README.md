# dsh-ui-enhancements

English | [中文](./README.zh.md)

Small, focused UI enhancements for DeepSeek Harness.

## Current enhancements

### Profile plugin switches

Open **Settings → Plugins → Plugin list** to enable or disable every plugin bundle installed in the active DSH profile.

- Changes are applied to the running Loader immediately and survive DSH restarts.
- The selected state is stored in a managed block inside the profile's `cordis.patch.yml`; unrelated user YAML is preserved.
- The `dsh-ui-enhancements` switch stays visible but locked on so the recovery control cannot disable itself.
- DSH's built-in runtime entries remain read-only because disabling core services can make the Web UI or plugin manager unavailable.
- A failed runtime update restores the previous persistent state and leaves the switch retryable.

Plugin switches require DSH `0.1.1-rc.2` or a compatible newer `0.1.x` release.

### Session quick actions

Hover a populated session row to reveal **Pin / Unpin** and **Archive** beside the native menu.

- Pinned sessions stay at the top of their workspace group or the flat list.
- Pin preferences stay in the current browser's local storage.
- Archive reuses DSH's native, non-destructive archive action.
- Running sessions keep stable hover actions while their status updates.
- Keyboard focus and coarse-pointer devices can also reach the actions.

This plugin does not add agent tools, read session content, or copy conversation data.

## Install

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.2.0
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
