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

Version `0.4.1` requires DSH `0.1.5-rc.1` and its JSONL session backend. Restart DSH after installation so the plugin can track each conversation's native lifecycle.

### Session quick actions

Hover a populated session row to reveal **Pin / Unpin**, **Archive**, and **Delete now** beside the native menu.

- Pinned sessions stay at the top of their workspace group or the flat list.
- Pin preferences stay in the current browser's local storage.
- Archive reuses DSH's native, non-destructive archive action.
- Delete now opens one confirmation dialog, with **Cancel** focused first. Confirming stops that conversation, removes all of its JSONL log generations and its workspace/archive/search records, and updates the sidebar through DSH’s removal event. Failed operations display an error and can be retried.
- Deletion targets that session only. Workspace files, independent branches, and shared attachment blobs are retained. It does not move logs to a trash folder and cannot be undone.
- Running sessions keep stable hover actions while their status updates.
- Keyboard focus and coarse-pointer devices can also reach the actions.

### Archived conversations

Open **Settings → Conversations → Archived conversations → Manage**, including when the session list is empty. Settings closes and the manager opens in DSH's main content area. **Back to conversation** returns to your current conversation.

- Compact rows show a title, workspace name, and creation date. Hover or keyboard focus reveals **Restore to workspace** and **Delete now**; touch devices keep these actions visible with larger targets. The full workspace path is available on hover and through search.
- Search matches titles and workspace paths. Selecting a conversation opens a read-only text preview alongside the list; smaller screens show the preview with a back button. Tools and attachments are visible in the full conversation after restoration.
- **Restore to workspace** removes the archive flag and retains the original workspace membership. The manager stays open so you can continue organizing.
- **Delete now** uses one confirmation dialog with **Cancel** focused first. A successful deletion or restoration removes only that row, keeping the search and scroll position. A failure retains the row and offers retry; neither operation reloads the inventory or all sessions.
- Existing DSH header and title checkpoints populate the initial list without reading conversation logs. Missing titles are resolved in background batches of up to eight, with duplicate reads shared. Resolved fallback titles remain in host memory. After one minute, background metadata checks validate the log revision; unchanged logs are not reread. Known titles remain visible during revalidation, including after a host restart. Reopening retains the visible inventory while checking for changes; **Refresh** retries failed reads.
- Only actual Host archive records are included; versions hidden by `dsh-conversation-tree` are excluded. Missing or unreadable records stay visible. Unavailable rows cannot be restored; their text preview can be retried or the record deleted.

The plugin adds no agent tools or conversation copies. Title fallback resolution may read a session log; message text is sent to the browser only when you select a conversation. The browser keeps at most three text previews in memory until the plugin unloads.

### Compatibility

DSH `0.1.5-rc.1` has no native restore/delete API. This release uses its registry serialization, native Agent handles, JSONL write leases, and SQLite search eviction. Revalidate these integrations before upgrading DSH. Restart DSH if a session was already active before the plugin loaded. Subagent sessions owned by another agent cannot be deleted directly.

## Install

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.4.1
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
