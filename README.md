# dsh-ui-enhancements

English | [中文](./README.zh.md)

Small, focused UI enhancements for DeepSeek Harness.

## Current enhancements

### Conversations without a workspace

Select **New Session** and start typing. The composer defaults to **No workspace**; its existing workspace picker can still select or add a workspace. A workspace's own new-session action continues to start inside that workspace.

- Conversations appear in the sidebar's **No workspace** group. These are ordinary, persistent DSH conversations with the native model picker, attachments, tools, history, search, branches, archive, and delete actions.
- **No workspace** uses the same chat-bubble icon in the sidebar, composer workspace button, and picker menu. Its disclosure supports the keyboard, and its **+** action starts a no-workspace conversation.
- Before sending, hover or focus the selected workspace button and click **×** to switch directly to **No workspace**, carrying the draft and attachments. Touch devices keep **×** visible. This clears the new conversation's workspace choice; it does not delete the workspace.
- The sidebar's subtle blue background marks the current conversation's workspace, including **No workspace**, even when collapsed. Inactive groups have no persistent highlight.
- Each new conversation receives its own real working directory at `<DSH_HOME>/projectless/session-projectless-<uuid>`. The active profile determines the DSH home. No workspace is registered and no existing project directory is used; the browser only presents the conversation as a **No workspace** virtual workspace entry, leaving DSH's workspace registry untouched. See the storage location under **Settings → Conversations → No workspace**; the native **Open workspace in Finder** action opens the conversation's directory.
- An empty draft is reused in the same browser tab, including after a reload. Once it has messages, **New Session** allocates another directory. Branches retain their source conversation's directory. Concurrent starts share one allocation; failed creation can retry the same identity. Late creation does not interrupt navigation to a different conversation.
- Before sending, switching between **No workspace** and a workspace carries the text and attachments through DSH's native draft transfer. Carried text is synchronized to native draft storage for reload recovery. Unsent attachments use DSH's in-memory draft storage; send them before reloading.
- Archiving and restoring retain the same directory. Deleting a conversation removes its logs and list entries while keeping generated files and branches. Empty draft directories are also retained; this feature never automatically deletes working files.
- With [dsh-session-workspace](https://github.com/Unintendedz/dsh-session-workspace) installed, a completed conversation can later use **Move to another workspace**. Switch away and wait for the session to close first. Future file operations use the selected workspace; existing generated files remain in their original directory.

The interaction follows [Codex's option to start without a project](https://learn.chatgpt.com/docs/projects), while retaining DSH's native conversation controls.

### Workspace activity order

- **No workspace** is a fixed anchor: it always leads the sidebar, and its own activity never moves it. The remaining groups follow their most recently updated visible conversation. Collapsed groups follow the same rule; pinned conversations do not pin their workspace. Empty workspaces fall back to their creation time, and ties retain Host order.
- Activity, archive, restore, delete, and membership changes update the order from the existing session feed. Reordering keeps the same group elements, expansion state, and active draft without reloading the session list.
- **View options → Manual** retains DSH's stored workspace order and workspace drag controls. **No workspace** keeps the first slot in both modes and offers no drag handle, because its position is not part of Host order and dragging it could only look inert. Automatic mode disables workspace dragging; switch to Manual to arrange groups yourself. The native flat conversation view is unchanged.

### Profile plugin switches

Open **Settings → Plugins → Plugin list** to enable or disable every plugin bundle installed in the active DSH profile.

- Changes are applied to the host Loader immediately and survive DSH restarts. Refresh the page to synchronize browser plugins: after a successful toggle, a visible notice and refresh button remind you to save unsent work first. The plugin never reloads automatically.
- The selected state is stored in a managed block inside the profile's `cordis.patch.yml`; unrelated settings and comments are preserved. Flow and block sequences are supported (flow formatting may become block formatting). Invalid YAML or patch entries are rejected before an atomic file replacement.
- The `dsh-ui-enhancements` switch stays visible but locked on so the recovery control cannot disable itself.
- DSH's built-in runtime entries remain read-only because disabling core services can make the Web UI or plugin manager unavailable.
- A failed runtime update restores the previous persistent state and leaves the switch retryable.

Version `0.6.3` requires DSH `0.2.0-rc.2`. Restart DSH after installing or upgrading so the host and browser halves reload together.

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

- Compact rows show a title, workspace name (or **No workspace**), and creation date. Hover or keyboard focus reveals **Restore conversation** and **Delete now**; touch devices keep these actions visible with larger targets. The full workspace path is available on hover and through search.
- Search matches titles and workspace paths. Selecting a conversation opens a read-only text preview alongside the list; smaller screens show the preview with a back button. Tools and attachments are visible in the full conversation after restoration.
- **Restore conversation** removes the archive flag and retains the original workspace membership or no-workspace state. The manager stays open so you can continue organizing.
- **Delete now** uses one confirmation dialog with **Cancel** focused first. A successful deletion or restoration removes only that row, keeping the search and scroll position. A failure retains the row and offers retry; neither operation reloads the inventory or all sessions.
- Reopening or refreshing shows conversations archived again after restoration. Late inventory responses still cannot resurrect rows removed while those requests were pending.
- Existing DSH header and title checkpoints populate the initial list without reading conversation logs. Missing titles are resolved in background batches of up to eight, with duplicate reads shared. Resolved fallback titles remain in host memory. After one minute, background metadata checks validate the log revision; unchanged logs are not reread. Known titles remain visible during revalidation, including after a host restart. Reopening retains the visible inventory while checking for changes; **Refresh** retries failed reads.
- Only actual Host archive records are included; versions hidden by `dsh-conversation-tree` are excluded. Missing or unreadable records stay visible. Unavailable rows cannot be restored; their text preview can be retried or the record deleted.

The plugin adds no agent tools or conversation copies. Title fallback resolution may read a session log; message text is sent to the browser only when you select a conversation. The browser keeps at most three text previews in memory until the plugin unloads.

### Compatibility

`0.6.3` is validated against DSH `0.2.0-rc.2` only. 0.2.0 changed three internal contracts this plugin relies on: descriptor value codecs moved from a `schema` field to a `create()` factory; the sidebar session list arrives as a `list` snapshot prop instead of a `useSessions` hook; and the hero and composer no longer flow through the `main.conversation` `renderSlot` pipeline. This release adapts to all three and replaces the render-prop injection with a virtual workspace entry (`::dsh-no-workspace`) in the client-side workspace model. The host registry gains no workspace.

Session quick actions read the session id from the row's `data-row-key` on 0.2.0 and take the archive callback from `uiWorkspace`. The composer **×** shortcut relied on 0.1.5's composer chip pipeline; on 0.2.0 the same switch is made from the **No workspace** entry in the workspace picker.

`0.6.2` fixes: 0.2.0 also removed the `navigation.sessions.clear()` helper the New Session action used, and calling it threw inside the click handler, leaving the sidebar button and the ⌥⌘N shortcut completely inert; this release starts the managed conversation directly instead. It also stopped claiming only the selected conversation, which left the remaining workspace-less conversations in the native ungrouped area and produced two identically named **No workspace** groups.

`0.6.3` fixes: **No workspace** was sorted by activity together with real workspaces, so a busy workspace could push it down, while the **Last updated** view disables group dragging — which made "dragging No workspace" look completely inert. The workspace-less anchor now leads every order mode (the native ungrouped bucket renders under the same label and travels with it), activity order only decides the groups below it, and the anchor row no longer offers a drag handle it cannot honor.

0.2.0 draws the composer workspace button and the picker menu itself, in a component the plugin can no longer wrap, so the shared chat icon is applied through a DOM adapter: a button or menu item is decorated only while it shows this plugin's own **No workspace** label, and the native folder icon returns for a real workspace.

DSH `0.2.0-rc.2` has no native restore/delete API. This release uses its registry serialization, native Agent handles, JSONL write leases, and SQLite search eviction. Revalidate these integrations before upgrading DSH. Restart DSH if a session was already active before the plugin loaded. Subagent sessions owned by another agent cannot be deleted directly. The storage root and every conversation directory must be real directories, not symlinks.

## Install

```sh
dsh plugin --profile web add github:Unintendedz/dsh-ui-enhancements#v0.6.3
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

The browser regression in `tests/browser/workspace-choice.js` checks direct clearing, shared icons, current-group highlighting, keyboard use, and draft transfer. Run it with `playwright-cli run-code --filename=tests/browser/workspace-choice.js` against a fresh isolated profile with synthetic **Alpha Workspace** and **Beta Workspace** fixtures. Its safety guard requires a temporary `dsh-workspace-choice-test-*` DSH home and a dedicated loopback port; never use an existing profile.

## License

MIT
