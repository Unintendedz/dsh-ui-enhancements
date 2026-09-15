# dsh-ui-enhancements

English | [中文](./README.zh.md)

Small, focused UI enhancements for DeepSeek Harness.

## Current enhancements

### Profile plugin switches

Open **Settings → Plugins → Plugin list** to enable or disable every plugin bundle installed in the active DSH profile.

- Changes are applied to the host Loader immediately and survive DSH restarts. Refresh the page to synchronize browser plugins: after a successful toggle, a visible notice and refresh button remind you to save unsent work first. The plugin never reloads automatically.
- The selected state is stored in a managed block inside the profile's `cordis.patch.yml`; unrelated settings and comments are preserved. Flow and block sequences are supported (flow formatting may become block formatting). Invalid YAML or patch entries are rejected before an atomic file replacement.
- The `dsh-ui-enhancements` switch stays visible but locked on so the recovery control cannot disable itself.
- DSH's built-in runtime entries remain read-only because disabling core services can make the Web UI or plugin manager unavailable.
- A failed runtime update restores the previous persistent state and leaves the switch retryable.

Version `0.3.1` requires DSH `0.1.5-rc.1` and its JSONL session backend. Restart DSH after installation so the plugin can track each conversation's native lifecycle.

### Session quick actions

Hover a populated session row to reveal **Pin / Unpin**, **Archive**, and **Delete now** beside the native menu.

- Pinned sessions stay at the top of their workspace group or the flat list.
- Pin preferences stay in the current browser's local storage.
- Archive reuses DSH's native, non-destructive archive action.
- Delete now opens one confirmation dialog, with **Cancel** focused first. Confirming stops that conversation, removes all of its JSONL log generations and its workspace/archive/search records, and refreshes the sidebar. Failed operations display an error and can be retried.
- Deletion targets that session only. Workspace files, independent branches, and shared attachment blobs are retained. It does not move logs to a trash folder and cannot be undone.
- Running sessions keep stable hover actions while their status updates.
- Keyboard focus and coarse-pointer devices can also reach the actions.

### Archived conversations

Click **Archived** at the bottom of the sidebar, above **Settings**, even when the normal session list is empty.

- Search archived titles or workspace paths, including conversations from earlier DSH runs.
- **View** shows a read-only text preview of user and assistant messages while keeping the conversation archived. Restore it to see the full conversation, including tools and attachments.
- **Restore and open** removes the archive flag, keeps its workspace membership, and opens the conversation.
- **Delete now** is also available here and uses the same confirmation as the ordinary list.
- The inventory uses the Host's actual archive records. Versions hidden only by `dsh-conversation-tree` are not shown as archived.
- Unreadable or missing old logs do not block the archive list. Their records remain visible with an unavailable notice; refresh to retry or delete the record. View and restore stay disabled until the log can be read.

The plugin adds no agent tools. Archive discovery reads titles and metadata; message text is read only when you choose **View**. No conversation copies are created.

### Compatibility

DSH `0.1.5-rc.1` has no native restore/delete API. This release uses its registry serialization, native Agent handles, JSONL write leases, and SQLite search eviction. Revalidate these integrations before upgrading DSH. Restart DSH if a session was already active before the plugin loaded. Subagent sessions owned by another agent cannot be deleted directly.

## Install

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.3.1
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
