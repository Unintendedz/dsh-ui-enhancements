window.__ModuleLoader__.load({id:"dsh-ui-enhancements",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  createSessionManager: () => createSessionManager,
  inject: () => inject,
  installPluginToggles: () => installPluginToggles,
  installSessionQuickActions: () => installSessionQuickActions,
  installStyles: () => installStyles,
  mountPluginToggle: () => mountPluginToggle,
  mountSessionQuickActions: () => mountSessionQuickActions,
  pinnedSessionOrder: () => pinnedSessionOrder,
  readPinnedSessionIds: () => readPinnedSessionIds,
  sessionContextFromElement: () => sessionContextFromElement,
  syncPinnedSessionOrder: () => syncPinnedSessionOrder,
  writePinnedSessionIds: () => writePinnedSessionIds
});
module.exports = __toCommonJS(client_exports);

// src/archive-styles.js
var ARCHIVE_STYLES = `
.dsh-archives-page { box-sizing:border-box; display:flex; flex-direction:column; height:100%; min-height:0; min-width:0; width:100%; max-width:1200px; margin:0 auto; padding:24px 28px 16px; color:var(--dsw-alias-label-primary); font-family:inherit; font-size:14px; line-height:1.45; }
.dsh-archives-header { display:flex; align-items:center; gap:8px; flex:none; }
.dsh-archives-header h1 { margin:0; font-size:18px; font-weight:500; line-height:28px; }
.dsh-archives-count { color:var(--dsw-alias-label-secondary); font-size:13px; font-variant-numeric:tabular-nums; }
.dsh-archives-description { margin:4px 0 20px 40px; color:var(--dsw-alias-label-secondary); font-size:13px; }
.dsh-archives-body { display:flex; flex:1; gap:24px; min-height:0; min-width:0; }
.dsh-archives-inventory { display:flex; flex-direction:column; flex:1; min-width:0; min-height:0; }
.dsh-archives-toolbar { display:flex; align-items:center; gap:8px; flex:none; }
.dsh-archives-search { display:flex; align-items:center; gap:8px; height:36px; flex:1; min-width:0; padding:0 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; color:var(--dsw-alias-label-secondary); }
.dsh-archives-search svg { flex:none; }
.dsh-archives-search:focus-within { outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:1px; }
.dsh-archives-search input { width:100%; min-width:0; padding:0; border:0; outline:0; background:transparent; color:var(--dsw-alias-label-primary); font:inherit; font-size:13px; }
.dsh-archives-search input::placeholder { color:var(--dsw-alias-label-secondary); }
.dsh-archives-icon { flex:none; display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; border:0; border-radius:7px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
.dsh-archives-icon:hover:not(:disabled) { color:var(--dsw-alias-label-primary); background:var(--dsw-alias-interactive-bg-hover); }
.dsh-archives-icon[data-danger]:hover:not(:disabled) { color:var(--dsw-alias-state-error-primary); }
.dsh-archives-icon:disabled { opacity:.4; cursor:default; }
.dsh-archives-page button:focus-visible,.dsh-archives-settings button:focus-visible { outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:1px; }
.dsh-archives-status { height:28px; display:flex; align-items:center; flex:none; color:var(--dsw-alias-label-secondary); font-size:12px; }
.dsh-archives-list { list-style:none; margin:0; padding:0 2px; overflow-y:auto; min-height:0; flex:1; overscroll-behavior:contain; scrollbar-gutter:stable; overflow-anchor:none; }
.dsh-archives-row { border-bottom:1px solid var(--dsw-alias-border-l1); border-radius:6px; }
.dsh-archives-row:hover,.dsh-archives-row:focus-within,.dsh-archives-row[data-selected=true] { background:var(--dsw-alias-interactive-bg-hover); }
.dsh-archives-row-main { display:flex; align-items:center; gap:12px; min-height:48px; padding:0 4px 0 8px; }
.dsh-archives-open { display:flex; flex-direction:column; justify-content:center; gap:1px; min-width:0; flex:1; min-height:48px; text-align:left; border:0; margin:0; padding:3px 0; background:transparent; color:inherit; font:inherit; cursor:pointer; }
.dsh-archives-row-title { display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:14px; font-weight:400; line-height:20px; }
.dsh-archives-row-meta { display:block; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; line-height:17px; color:var(--dsw-alias-label-secondary); }
.dsh-archives-date { color:var(--dsw-alias-label-secondary); font-size:12px; white-space:nowrap; }
.dsh-archives-actions { display:flex; flex:none; gap:2px; }
.dsh-archives-row .dsh-archives-actions { opacity:0; }
.dsh-archives-row:hover .dsh-archives-actions,.dsh-archives-row:focus-within .dsh-archives-actions,.dsh-archives-row[data-selected=true] .dsh-archives-actions { opacity:1; }
.dsh-archives-empty { padding:48px 16px; text-align:center; color:var(--dsw-alias-label-secondary); font-size:14px; }
.dsh-archives-detail { display:flex; flex-direction:column; min-width:0; min-height:0; flex:1; padding-left:24px; border-left:1px solid var(--dsw-alias-border-l1); }
.dsh-archives-body[data-detail=true] .dsh-archives-inventory { flex:0 0 43%; }
.dsh-archives-body[data-detail=true] .dsh-archives-date { display:none; }
.dsh-archives-detail-header { display:flex; align-items:center; gap:4px; }
.dsh-archives-detail-header h2 { font-size:15px; line-height:22px; font-weight:500; margin:0; flex:1; min-width:0; overflow-wrap:anywhere; }
.dsh-archives-preview-note { color:var(--dsw-alias-label-secondary); font-size:12px; line-height:18px; margin:10px 0 16px; }
.dsh-archives-messages { overflow-y:auto; flex:1; min-height:0; overscroll-behavior:contain; }
.dsh-archives-messages article { margin:0 0 24px; }
.dsh-archives-messages h3 { font-size:12px; font-weight:500; color:var(--dsw-alias-label-secondary); margin:0 0 6px; }
.dsh-archives-messages p { font-size:14px; line-height:1.65; white-space:pre-wrap; overflow-wrap:anywhere; margin:0; }
.dsh-archives-error { padding:8px; font-size:13px; color:var(--dsw-alias-state-error-primary); overflow-wrap:anywhere; }
.dsh-archives-error button { color:inherit; background:transparent; border:0; text-decoration:underline; cursor:pointer; font:inherit; margin-left:8px; }
.dsh-archives-settings h2 { margin:0 0 20px; font-size:16px; font-weight:500; }
.dsh-archives-settings-row { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.dsh-archives-settings-row h3 { margin:0 0 4px; font-size:14px; font-weight:400; }
.dsh-archives-settings-row p { margin:0; font-size:12px; line-height:18px; color:var(--dsw-alias-label-secondary); }
.dsh-archives-settings-row button { flex:none; white-space:nowrap; }
.dsh-archives-sr { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
.dsh-ui-enhancements-manager-button { min-height:32px; padding:6px 12px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; color:inherit; background:transparent; font:inherit; font-size:13px; cursor:pointer; }
.dsh-ui-enhancements-manager-button:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); }
.dsh-ui-enhancements-manager-button:focus-visible { outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:2px; }
.dsh-ui-enhancements-manager-button:disabled { opacity:.55; cursor:not-allowed; }
.dsh-ui-enhancements-dialog { box-sizing:border-box; width:min(440px,calc(100vw - 32px)); max-height:calc(100dvh - 48px); padding:24px; border:1px solid var(--dsw-alias-border-l1); border-radius:16px; background:var(--dsw-alias-bg-layer-2,Canvas); color:var(--dsw-alias-label-primary,CanvasText); box-shadow:var(--dsw-elevation-prominent); overflow:auto; }
.dsh-ui-enhancements-dialog[open] { display:flex; flex-direction:column; gap:16px; }
.dsh-ui-enhancements-dialog::backdrop { background:var(--dsw-alias-bg-mask-1,#0008); }
.dsh-ui-enhancements-dialog h2 { margin:0; font-size:16px; font-weight:500; line-height:1.5; overflow-wrap:anywhere; }
.dsh-ui-enhancements-dialog p { margin:0; font-size:14px; line-height:1.6; overflow-wrap:anywhere; }
.dsh-ui-enhancements-danger,.dsh-ui-enhancements-manager-error { color:var(--dsw-alias-state-error-primary); }
.dsh-ui-enhancements-manager-error:empty { display:none; }
.dsh-ui-enhancements-dialog-footer { display:flex; justify-content:flex-end; gap:8px; }
.dsh-ui-enhancements-manager-notice { position:fixed; bottom:max(24px,env(safe-area-inset-bottom)); left:50%; transform:translateX(-50%); z-index:10000; padding:10px 16px; border-radius:8px; background:var(--dsw-alias-bg-layer-2,Canvas); color:var(--dsw-alias-label-primary,CanvasText); border:1px solid var(--dsw-alias-border-l1); box-shadow:var(--dsw-elevation-prominent); font-size:13px; }
@media(max-width:1000px) { .dsh-archives-body[data-detail=true] .dsh-archives-inventory { display:none; } .dsh-archives-detail { border:0; padding:0; } }
@media(max-width:600px) { .dsh-archives-page { padding:16px 12px max(12px,env(safe-area-inset-bottom)); } .dsh-archives-description { margin:4px 0 16px; } .dsh-archives-date { display:none; } .dsh-archives-row-main { gap:4px; } .dsh-archives-row .dsh-archives-actions { opacity:1; } .dsh-ui-enhancements-dialog { padding:20px; } }
@media(pointer:coarse) { .dsh-archives-icon { width:44px; height:44px; } .dsh-archives-search { height:44px; } .dsh-archives-row-main,.dsh-archives-open { min-height:56px; } .dsh-archives-row .dsh-archives-actions { opacity:1; } .dsh-ui-enhancements-manager-button { min-height:44px; } }
`;

// src/archive-store.js
function createArchiveStore(api, onChanged) {
  let state = { items: [], loaded: false, loading: false, hydrating: false, error: "", query: "", selectedId: null, preview: null, pending: /* @__PURE__ */ new Set() };
  const listeners = /* @__PURE__ */ new Set();
  const removed = /* @__PURE__ */ new Set();
  const previews = /* @__PURE__ */ new Map();
  let request, generation = 0, disposed = false;
  const publish = (patch) => {
    if (disposed) return;
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  const errorText = (error) => error instanceof Error ? error.message : String(error);
  const hydrate = async (version) => {
    const ids = state.items.filter((item) => item.titlePending).map((item) => item.sessionId);
    if (!ids.length) return;
    publish({ hydrating: true });
    try {
      for (let offset = 0; offset < ids.length; offset += 8) {
        if (disposed || version !== generation) return;
        const batch = ids.slice(offset, offset + 8).filter((id2) => !removed.has(id2));
        if (!batch.length) continue;
        const result = await api.resolveArchivedTitles(batch);
        if (disposed || version !== generation) return;
        const titles = new Map(result.items.map((item) => [item.sessionId, item]));
        publish({ items: state.items.map((item) => titles.get(item.sessionId) ?? item) });
      }
    } catch (error) {
      if (version === generation) publish({ error: errorText(error) });
    } finally {
      if (version === generation) publish({ hydrating: false });
    }
  };
  const load = () => {
    if (request) return request;
    const version = ++generation;
    publish({ loading: true, error: "", hydrating: false });
    request = (async () => {
      try {
        const result = await api.listArchived();
        if (disposed) return;
        const ids = new Set(result.items.map((item) => item.sessionId));
        for (const id2 of removed) if (!ids.has(id2)) removed.delete(id2);
        const previous = new Map(state.items.map((item) => [item.sessionId, item]));
        const items = result.items.filter((item) => !removed.has(item.sessionId)).map((item) => {
          const known = previous.get(item.sessionId);
          return item.titlePending && item.title === item.sessionId && known?.createdAt === item.createdAt ? { ...item, title: known.title } : item;
        });
        const selected = items.some((item) => item.sessionId === state.selectedId);
        publish({ items, loaded: true, ...selected ? {} : { selectedId: null, preview: null } });
        void hydrate(version);
      } catch (error) {
        publish({ error: errorText(error) });
      } finally {
        request = void 0;
        publish({ loading: false });
      }
    })();
    return request;
  };
  const mutate = async (id2, action) => {
    if (state.pending.has(id2)) return;
    publish({ pending: /* @__PURE__ */ new Set([...state.pending, id2]), error: "" });
    try {
      const result = await (action === "delete" ? api.delete(id2, true) : api.restore(id2));
      removed.add(id2);
      previews.delete(id2);
      publish({ items: state.items.filter((item) => item.sessionId !== id2), ...state.selectedId === id2 ? { selectedId: null, preview: null } : {} });
      await onChanged(result);
      return result;
    } finally {
      const pending = new Set(state.pending);
      pending.delete(id2);
      publish({ pending });
    }
  };
  const select = async (id2) => {
    if (id2 === null) {
      publish({ selectedId: null, preview: null });
      return;
    }
    publish({ selectedId: id2, preview: previews.get(id2) ?? { loading: true } });
    if (previews.has(id2)) return;
    try {
      const result = await api.readArchived(id2);
      if (removed.has(id2) || disposed) return;
      if (previews.size >= 3) previews.delete(previews.keys().next().value);
      previews.set(id2, result);
      if (state.selectedId === id2) publish({ preview: result });
    } catch (error) {
      if (state.selectedId === id2) publish({ preview: { error: errorText(error) } });
    }
  };
  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setQuery(query) {
      publish({ query });
    },
    load,
    select,
    restore: (id2) => mutate(id2, "restore"),
    remove: (id2) => mutate(id2, "delete"),
    dispose() {
      disposed = true;
      generation++;
      listeners.clear();
      previews.clear();
    }
  };
}

// src/session-manager.js
function text(value) {
  if (typeof value !== "string") throw new TypeError("expected a string");
  return value;
}
function id(value) {
  if (text(value).trim() === "") throw new TypeError("sessionId must not be empty");
  return value;
}
function archiveState(value) {
  return { archivedSessionIds: value.archivedSessionIds.map(id) };
}
function codec(name, parse) {
  return { mode: "strict", typeSymbol: `dsh-ui-enhancements#${name}`, schema: { parse } };
}
var identity = { name: "id", wire: "id", source: "json", codec: codec("SessionId", id) };
function parseArchiveList(value) {
  return { items: value.items.map((item) => ({ sessionId: id(item.sessionId), title: text(item.title), cwd: text(item.cwd), createdAt: Number(item.createdAt), available: item.available === true, titlePending: item.titlePending === true })) };
}
var methods = [
  ["listArchived", [], codec("ArchiveList", parseArchiveList)],
  ["resolveArchivedTitles", [{ name: "ids", wire: "ids", source: "json", codec: codec("ArchiveIds", (value) => value.map(id)) }], codec("ArchiveList", parseArchiveList)],
  ["readArchived", [identity], codec("ArchivePreview", (value) => ({ sessionId: id(value.sessionId), messages: value.messages.map((message) => ({ role: text(message.role), text: text(message.text) })) }))],
  ["restore", [identity], codec("ArchiveState", archiveState)],
  ["delete", [identity, { name: "confirmed", wire: "confirmed", source: "json", codec: codec("DeleteConfirmation", (value) => {
    if (value !== true) throw new TypeError("deletion requires confirmation");
    return true;
  }) }], codec("DeletedSession", (value) => {
    if (value.deleted !== true) throw new TypeError("deletion was not confirmed");
    return { ...archiveState(value), sessionId: id(value.sessionId), deleted: true };
  })]
];
var SESSION_MANAGEMENT_REMOTE = {
  package: "dsh-ui-enhancements",
  descriptors: methods.map(([method, parameters, result]) => ({
    id: `dsh-ui-enhancements#sessionManagement/${method}`,
    service: "sessionManagement",
    namespace: "sessionManagement",
    method,
    invocation: { kind: "direct" },
    parameters,
    result
  }))
};
var nextDialogId = 0;
function createSessionManager(t, api, onChanged, documentApi = document) {
  const dialogs = /* @__PURE__ */ new Set();
  const store = createArchiveStore(api, onChanged);
  let navigate = () => {
  };
  let disposed = false;
  const element = (tag, content, className) => {
    const node = documentApi.createElement(tag);
    if (content !== void 0) node.textContent = content;
    if (className) node.classList.add(className);
    return node;
  };
  const button = (label, action, danger = false) => {
    const node = element("button", label, "dsh-ui-enhancements-manager-button");
    node.setAttribute("type", "button");
    if (danger) node.classList.add("dsh-ui-enhancements-danger");
    node.addEventListener("click", action);
    return node;
  };
  const dialog = (title, description) => {
    const node = element("dialog", void 0, "dsh-ui-enhancements-dialog");
    const heading = element("h2", title);
    heading.id = `dsh-session-dialog-${++nextDialogId}`;
    node.setAttribute("aria-labelledby", heading.id);
    node.appendChild(heading);
    if (description) {
      const detail = element("p", description);
      detail.id = `${heading.id}-description`;
      node.setAttribute("aria-describedby", detail.id);
      node.appendChild(detail);
    }
    dialogs.add(node);
    node.addEventListener("close", () => {
      dialogs.delete(node);
      node.remove();
    });
    documentApi.body.appendChild(node);
    return node;
  };
  const errorBox = () => {
    const node = element("p", "", "dsh-ui-enhancements-manager-error");
    node.setAttribute("role", "alert");
    return node;
  };
  const message = (error) => `${t("manager.failed")}${error instanceof Error ? error.message : String(error)}`;
  const confirmDelete = (target, afterDelete) => {
    if (disposed || [...dialogs].some((node2) => node2.dataset.deleting === target.sessionId)) return;
    const node = dialog(t("delete.title", { title: target.title }), t("delete.description"));
    node.dataset.deleting = target.sessionId;
    const error = errorBox();
    const footer = element("div", void 0, "dsh-ui-enhancements-dialog-footer");
    const cancel = button(t("manager.cancel"), () => node.close());
    const confirm = button(t("delete.action"), async () => {
      if (confirm.disabled) return;
      confirm.disabled = true;
      cancel.disabled = true;
      confirm.textContent = t("delete.pending");
      error.textContent = "";
      try {
        await store.remove(target.sessionId);
        node.close();
        afterDelete?.();
        const notice = element("div", t("delete.success"), "dsh-ui-enhancements-manager-notice");
        notice.setAttribute("role", "status");
        documentApi.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3500);
      } catch (reason) {
        error.textContent = message(reason);
      } finally {
        confirm.disabled = false;
        cancel.disabled = false;
        confirm.textContent = t("delete.action");
      }
    }, true);
    node.addEventListener("cancel", (event) => {
      if (confirm.disabled) event.preventDefault();
    });
    footer.append(cancel, confirm);
    node.append(error, footer);
    node.showModal();
    cancel.focus();
  };
  return {
    store,
    confirmDelete,
    showArchives() {
      if (!disposed) {
        navigate();
        void store.load();
      }
    },
    bindNavigation(action) {
      navigate = action;
    },
    dispose() {
      disposed = true;
      store.dispose();
      for (const node of dialogs) {
        node.close();
        node.remove();
      }
      ;
      dialogs.clear();
    }
  };
}
function registerArchiveEntry(ctx, manager, t) {
  const { createElement: h, useSyncExternalStore, useEffect, useLayoutEffect, useRef, useState } = require("react");
  const store = manager.store;
  const paths = {
    back: "m10 3-5 5 5 5",
    close: "m4 4 8 8M4 12l8-8",
    search: "M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm4-1 3 3",
    restore: "M3 5h7a4 4 0 0 1 0 8H7M3 5l3-3M3 5l3 3",
    delete: "M2 4h12M6 4V2h4v2M4 4l.5 10h7L12 4M7 7v4M9 7v4",
    refresh: "M13 6a5 5 0 1 0 0 4M13 2v4H9"
  };
  const icon = (name) => h("svg", { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true }, h("path", { d: paths[name], stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" }));
  const iconButton = (name, label, onClick, extra = {}) => h("button", { type: "button", className: "dsh-archives-icon", title: label, "aria-label": label, onClick, ...extra }, icon(name));
  const workspaceName = (cwd) => cwd.split(/[\\/]/).filter(Boolean).at(-1) || t("archives.noWorkspace");
  let savedScroll = 0;
  function ArchivePage() {
    const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
    const list = useRef(null), heading = useRef(null), search = useRef(null), detail = useRef(null);
    const [rowError, setRowError] = useState(null);
    useLayoutEffect(() => {
      if (list.current) list.current.scrollTop = savedScroll;
    }, []);
    useEffect(() => {
      heading.current?.focus();
    }, []);
    useEffect(() => {
      if (state.selectedId) detail.current?.focus();
    }, [state.selectedId]);
    const query = state.query.trim().toLocaleLowerCase();
    const shown = state.items.filter((item) => `${item.title} ${item.cwd}`.toLocaleLowerCase().includes(query));
    const selected = state.items.find((item) => item.sessionId === state.selectedId);
    const focusRow = (id2) => {
      const node = list.current?.querySelector(`[data-archived-session="${CSS.escape(id2 ?? "")}"] .dsh-archives-open`);
      (node ?? search.current)?.focus();
    };
    const afterRemove = (item) => {
      const index = shown.indexOf(item);
      const next = shown[index + 1] ?? shown[index - 1];
      requestAnimationFrame(() => focusRow(next?.sessionId));
    };
    const restore = async (item) => {
      setRowError(null);
      try {
        await store.restore(item.sessionId);
        afterRemove(item);
      } catch (error) {
        setRowError({ id: item.sessionId, text: String(error.message ?? error) });
      }
    };
    const backToList = () => {
      const id2 = state.selectedId;
      void store.select(null);
      requestAnimationFrame(() => focusRow(id2));
    };
    const actions = (item) => h(
      "div",
      { className: "dsh-archives-actions" },
      iconButton("restore", t("archives.restore"), () => void restore(item), { disabled: !item.available || state.pending.has(item.sessionId) }),
      iconButton("delete", t("delete.action"), () => manager.confirmDelete(item, () => afterRemove(item)), { disabled: state.pending.has(item.sessionId), "data-danger": true })
    );
    const preview = state.preview;
    return h(
      "section",
      { className: "dsh-archives-page", "aria-labelledby": "dsh-archives-heading" },
      h(
        "header",
        { className: "dsh-archives-header" },
        iconButton("back", t("archives.back"), () => ctx.layout.selectPanel(null)),
        h("h1", { id: "dsh-archives-heading", tabIndex: -1, ref: heading }, t("archives.title")),
        h("span", { className: "dsh-archives-count" }, state.loaded ? state.items.length : "")
      ),
      h("p", { className: "dsh-archives-description" }, t("archives.description")),
      h(
        "div",
        { className: "dsh-archives-body", "data-detail": !!selected },
        h(
          "div",
          { className: "dsh-archives-inventory" },
          h(
            "div",
            { className: "dsh-archives-toolbar" },
            h(
              "label",
              { className: "dsh-archives-search" },
              icon("search"),
              h("span", { className: "dsh-archives-sr" }, t("archives.search")),
              h("input", { type: "search", ref: search, value: state.query, placeholder: t("archives.search"), onChange: (e) => store.setQuery(e.target.value) })
            ),
            iconButton("refresh", t("archives.refresh"), () => void store.load(), { disabled: state.loading || state.hydrating })
          ),
          h("div", { className: "dsh-archives-status", role: "status" }, state.loading ? t("archives.loading") : state.hydrating ? t("archives.titlesLoading") : query ? t("archives.matches", { count: shown.length }) : t("archives.hint")),
          state.error ? h("div", { className: "dsh-archives-error", role: "alert" }, t("manager.failed") + state.error, h("button", { type: "button", onClick: () => void store.load() }, t("manager.retry"))) : null,
          h(
            "ul",
            { className: "dsh-archives-list", ref: list, onScroll: (e) => {
              savedScroll = e.currentTarget.scrollTop;
            }, "aria-label": t("archives.title") },
            !shown.length ? h("li", { className: "dsh-archives-empty" }, state.loading && !state.loaded ? t("archives.loading") : t(query ? "archives.noMatches" : "archives.empty")) : null,
            ...shown.map((item) => h(
              "li",
              { key: item.sessionId, "data-archived-session": item.sessionId, "data-selected": item.sessionId === state.selectedId, "aria-busy": state.pending.has(item.sessionId), className: "dsh-archives-row" },
              h(
                "div",
                { className: "dsh-archives-row-main" },
                h(
                  "button",
                  { type: "button", className: "dsh-archives-open", "aria-current": item.sessionId === state.selectedId ? "true" : void 0, onClick: () => void store.select(item.sessionId), title: item.title },
                  h("span", { className: "dsh-archives-row-title" }, item.titlePending && item.title === item.sessionId ? t("archives.untitled") : item.title),
                  h("span", { className: "dsh-archives-row-meta", title: item.cwd }, workspaceName(item.cwd), !item.available ? ` \xB7 ${t("archives.unavailableShort")}` : "")
                ),
                item.createdAt ? h("time", { className: "dsh-archives-date", dateTime: new Date(item.createdAt).toISOString(), title: t("archives.created") + new Date(item.createdAt).toLocaleString(t("archives.dateLocale")) }, new Date(item.createdAt).toLocaleDateString(t("archives.dateLocale"), { month: "short", day: "numeric" })) : null,
                actions(item)
              ),
              rowError?.id === item.sessionId ? h("div", { className: "dsh-archives-error", role: "alert" }, t("manager.failed") + rowError.text) : null
            ))
          )
        ),
        selected ? h(
          "section",
          { className: "dsh-archives-detail", "aria-label": selected.title },
          h("header", { className: "dsh-archives-detail-header" }, iconButton("back", t("archives.backToList"), backToList), h("h2", { tabIndex: -1, ref: detail }, selected.title), actions(selected)),
          h("p", { className: "dsh-archives-preview-note" }, t("archives.preview")),
          h(
            "div",
            { className: "dsh-archives-messages" },
            preview?.loading ? h("p", { role: "status" }, t("archives.loading")) : preview?.error ? h("div", { className: "dsh-archives-error", role: "alert" }, t("manager.failed") + preview.error, h("button", { type: "button", onClick: () => void store.select(selected.sessionId) }, t("manager.retry"))) : preview?.messages?.length ? preview.messages.map((entry, index) => h("article", { key: index }, h("h3", null, t(entry.role === "user" ? "archives.user" : "archives.assistant")), h("p", null, entry.text))) : h("p", null, t("archives.noText"))
          )
        ) : null
      )
    );
  }
  function ConversationSettings({ close }) {
    return h(
      "section",
      { className: "dsh-archives-settings" },
      h("h2", null, t("archives.settings")),
      h(
        "div",
        { className: "dsh-archives-settings-row" },
        h("div", null, h("h3", null, t("archives.title")), h("p", null, t("archives.settingsDescription"))),
        h("button", { type: "button", className: "dsh-ui-enhancements-manager-button", onClick: () => {
          close();
          manager.showArchives();
        } }, t("archives.manage"))
      )
    );
  }
  manager.bindNavigation(() => {
    ctx.layout.selectPanel("dsh-archives");
    requestAnimationFrame(() => {
      const heading = document.getElementById("dsh-archives-heading");
      const rect = heading?.closest(".dsh-archives-page")?.getBoundingClientRect();
      if (window.innerWidth < 600 && rect?.left > 200) ctx.layout.toggleSidebar();
      heading?.focus();
    });
  });
  const main = ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: "dsh-archives", locale: "dsh-ui-enhancements" }, ArchivePage));
  const settings = ctx.slots.inject("settings.section", () => ctx.slots.register({ name: "settings.section", id: "conversations", order: 20, label: () => t("archives.settings"), locale: "dsh-ui-enhancements" }, ConversationSettings));
  return () => {
    settings();
    main();
  };
}

// src/client.js
var NS = "dsh-ui-enhancements";
var PINNED_STORAGE_KEY = "dsh-ui-enhancements.pinned-session-ids.v1";
var FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
var STYLE_ID = "dsh-ui-enhancements-style";
var zh = {
  "archives.dateLocale": "zh-CN",
  "archives.settings": "\u5BF9\u8BDD\u7BA1\u7406",
  "archives.settingsDescription": "\u67E5\u770B\u548C\u6574\u7406\u5F52\u6863\u7684\u5BF9\u8BDD\uFF0C\u6216\u5C06\u5B83\u4EEC\u6062\u590D\u5230\u5DE5\u4F5C\u533A\u3002",
  "archives.manage": "\u7BA1\u7406",
  "archives.back": "\u8FD4\u56DE\u5BF9\u8BDD",
  "archives.backToList": "\u8FD4\u56DE\u5F52\u6863\u5217\u8868",
  "archives.titlesLoading": "\u6B63\u5728\u8865\u5168\u6807\u9898\u2026",
  "archives.hint": "\u9009\u62E9\u5BF9\u8BDD\u67E5\u770B\u5185\u5BB9",
  "archives.matches": "{count} \u6761\u5339\u914D",
  "archives.noWorkspace": "\u65E0\u5DE5\u4F5C\u533A",
  "archives.unavailableShort": "\u65E0\u6CD5\u8BFB\u53D6",
  "archives.untitled": "\u6B63\u5728\u8BFB\u53D6\u6807\u9898\u2026",
  "archives.created": "\u521B\u5EFA\u4E8E\uFF1A",
  "archives.noText": "\u6CA1\u6709\u53EF\u9884\u89C8\u7684\u6587\u672C\u5185\u5BB9",
  "pin.aria": "\u7F6E\u9876\u4F1A\u8BDD\u201C{title}\u201D",
  "unpin.aria": "\u53D6\u6D88\u7F6E\u9876\u4F1A\u8BDD\u201C{title}\u201D",
  "archive.aria": "\u5F52\u6863\u4F1A\u8BDD\u201C{title}\u201D",
  "archive.failed": "\u5F52\u6863\u5931\u8D25",
  "archives.title": "\u5F52\u6863\u5BF9\u8BDD",
  "archives.description": "\u5F52\u6863\u7684\u5BF9\u8BDD\u4FDD\u7559\u5728\u8FD9\u91CC\uFF0C\u4E0D\u4F1A\u51FA\u73B0\u5728\u5DE5\u4F5C\u533A\u5217\u8868\u4E2D\u3002",
  "archives.search": "\u641C\u7D22\u5F52\u6863\u6807\u9898\u6216\u5DE5\u4F5C\u533A",
  "archives.empty": "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u5BF9\u8BDD",
  "archives.unavailable": "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6B64\u5BF9\u8BDD\u3002\u53EF\u5237\u65B0\u91CD\u8BD5\uFF0C\u6216\u5220\u9664\u8FD9\u6761\u5F52\u6863\u8BB0\u5F55\u3002",
  "archives.noMatches": "\u6CA1\u6709\u5339\u914D\u7684\u5F52\u6863\u5BF9\u8BDD",
  "archives.view": "\u67E5\u770B",
  "archives.restore": "\u6062\u590D\u5230\u5DE5\u4F5C\u533A",
  "archives.preview": "\u6587\u672C\u9884\u89C8\uFF1B\u6062\u590D\u540E\u53EF\u5728\u5BF9\u8BDD\u4E2D\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u3002",
  "archives.user": "\u4F60",
  "archives.assistant": "\u52A9\u624B",
  "archives.loading": "\u6B63\u5728\u52A0\u8F7D\u2026",
  "archives.refresh": "\u5237\u65B0",
  "manager.close": "\u5173\u95ED",
  "manager.cancel": "\u53D6\u6D88",
  "manager.retry": "\u91CD\u8BD5",
  "manager.failed": "\u64CD\u4F5C\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\uFF1A",
  "delete.aria": "\u7ACB\u5373\u5220\u9664\u4F1A\u8BDD\u201C{title}\u201D",
  "delete.action": "\u7ACB\u5373\u5220\u9664",
  "delete.title": "\u7ACB\u5373\u5220\u9664\u201C{title}\u201D\uFF1F",
  "delete.description": "\u5C06\u505C\u6B62\u8FD9\u4E2A\u5BF9\u8BDD\u5E76\u6C38\u4E45\u5220\u9664\u5B83\u7684\u5BF9\u8BDD\u8BB0\u5F55\uFF0C\u65E0\u6CD5\u6062\u590D\u3002\u5DE5\u4F5C\u533A\u6587\u4EF6\u548C\u5176\u4ED6\u5206\u652F\u4F1A\u4FDD\u7559\u3002",
  "delete.pending": "\u6B63\u5728\u5220\u9664\u2026",
  "delete.success": "\u5BF9\u8BDD\u5DF2\u5220\u9664",
  "plugin.enable": "\u542F\u7528\u63D2\u4EF6\u201C{name}\u201D",
  "plugin.disable": "\u505C\u7528\u63D2\u4EF6\u201C{name}\u201D",
  "plugin.locked": "\u63D2\u4EF6\u7BA1\u7406\u5668\u201C{name}\u201D\u59CB\u7EC8\u542F\u7528",
  "plugin.refreshRequired": "\u8BBE\u7F6E\u5DF2\u4FDD\u5B58\u3002\u6D4F\u89C8\u5668\u63D2\u4EF6\u9700\u8981\u5237\u65B0\u540E\u751F\u6548\uFF1B\u8BF7\u5148\u4FDD\u5B58\u672A\u53D1\u9001\u7684\u5185\u5BB9\u3002",
  "plugin.refresh": "\u6211\u5DF2\u4FDD\u5B58\u5185\u5BB9\uFF0C\u5237\u65B0\u9875\u9762",
  "plugin.failed": "\u63D2\u4EF6\u201C{name}\u201D\u5F00\u5173\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"
};
var en = {
  "archives.dateLocale": "en-US",
  "archives.settings": "Conversations",
  "archives.settingsDescription": "View and organize archived conversations, or restore them to a workspace.",
  "archives.manage": "Manage",
  "archives.back": "Back to conversation",
  "archives.backToList": "Back to archived conversations",
  "archives.titlesLoading": "Updating titles\u2026",
  "archives.hint": "Select a conversation to preview",
  "archives.matches": "{count} matches",
  "archives.noWorkspace": "No workspace",
  "archives.unavailableShort": "Unavailable",
  "archives.untitled": "Reading title\u2026",
  "archives.created": "Created: ",
  "archives.noText": "No text to preview",
  "pin.aria": "Pin session \u201C{title}\u201D",
  "unpin.aria": "Unpin session \u201C{title}\u201D",
  "archive.aria": "Archive session \u201C{title}\u201D",
  "archive.failed": "Archive failed",
  "archives.title": "Archived conversations",
  "archives.description": "Archived conversations are kept here and hidden from workspace lists.",
  "archives.search": "Search archived titles or workspaces",
  "archives.empty": "No archived conversations",
  "archives.unavailable": "This conversation cannot be read right now. Refresh to retry, or delete this archived record.",
  "archives.noMatches": "No matching archived conversations",
  "archives.view": "View",
  "archives.restore": "Restore to workspace",
  "archives.preview": "Text preview. Restore the conversation to view its full content.",
  "archives.user": "You",
  "archives.assistant": "Assistant",
  "archives.loading": "Loading\u2026",
  "archives.refresh": "Refresh",
  "manager.close": "Close",
  "manager.cancel": "Cancel",
  "manager.retry": "Retry",
  "manager.failed": "Could not complete the action. Try again: ",
  "delete.aria": "Delete session \u201C{title}\u201D now",
  "delete.action": "Delete now",
  "delete.title": "Delete \u201C{title}\u201D now?",
  "delete.description": "This stops the conversation and permanently deletes its conversation log. This cannot be undone. Workspace files and other branches are kept.",
  "delete.pending": "Deleting\u2026",
  "delete.success": "Conversation deleted",
  "plugin.enable": "Enable plugin \u201C{name}\u201D",
  "plugin.disable": "Disable plugin \u201C{name}\u201D",
  "plugin.locked": "Plugin manager \u201C{name}\u201D is always enabled",
  "plugin.refreshRequired": "Settings saved. Refresh to apply browser plugins; save any unsent work first.",
  "plugin.refresh": "I have saved my work \u2014 refresh",
  "plugin.failed": "Could not change plugin \u201C{name}\u201D; try again"
};
var inject = ["locale", "remote", "slots", "sessions", "workspaces", "layout"];
function nonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}
function booleanValue(value, field) {
  if (typeof value !== "boolean") throw new TypeError(`${field} must be a boolean`);
  return value;
}
var entryIdSchema = {
  parse: (value) => nonEmptyString(value, "entryId")
};
var enabledSchema = {
  parse: (value) => booleanValue(value, "enabled")
};
var pluginToggleSnapshotSchema = {
  parse(value) {
    if (value === null || typeof value !== "object" || !Array.isArray(value.entries)) {
      throw new TypeError("entries must be an array");
    }
    return {
      entries: value.entries.map((entry, index) => {
        if (entry === null || typeof entry !== "object") {
          throw new TypeError(`entries[${index}] must be an object`);
        }
        return {
          entryId: nonEmptyString(entry.entryId, `entries[${index}].entryId`),
          moduleName: nonEmptyString(entry.moduleName, `entries[${index}].moduleName`),
          version: nonEmptyString(entry.version, `entries[${index}].version`),
          enabled: enabledSchema.parse(entry.enabled),
          locked: booleanValue(entry.locked, `entries[${index}].locked`)
        };
      })
    };
  }
};
var pluginToggleResultSchema = {
  parse(value) {
    if (value === null || typeof value !== "object") {
      throw new TypeError("toggle result must be an object");
    }
    return {
      entryId: entryIdSchema.parse(value.entryId),
      enabled: enabledSchema.parse(value.enabled)
    };
  }
};
function strictCodec(typeSymbol, schema) {
  return { mode: "strict", typeSymbol, schema };
}
var PROFILE_PLUGIN_REMOTE = {
  package: "dsh-ui-enhancements",
  descriptors: [
    {
      id: "dsh-ui-enhancements#profilePluginToggles/list",
      service: "profilePluginToggles",
      namespace: "profilePluginToggles",
      method: "list",
      invocation: { kind: "direct" },
      parameters: [],
      result: strictCodec(
        "dsh-ui-enhancements#ProfilePluginToggleSnapshot",
        pluginToggleSnapshotSchema
      )
    },
    {
      id: "dsh-ui-enhancements#profilePluginToggles/setEnabled",
      service: "profilePluginToggles",
      namespace: "profilePluginToggles",
      method: "setEnabled",
      invocation: { kind: "direct" },
      parameters: [
        {
          name: "entryId",
          wire: "entryId",
          source: "json",
          codec: strictCodec("dsh-ui-enhancements#ProfilePluginEntryId", entryIdSchema)
        },
        {
          name: "enabled",
          wire: "enabled",
          source: "json",
          codec: strictCodec("dsh-ui-enhancements#ProfilePluginEnabled", enabledSchema)
        }
      ],
      result: strictCodec(
        "dsh-ui-enhancements#ProfilePluginToggleResult",
        pluginToggleResultSchema
      )
    }
  ]
};
function pinnedSessionOrder(sessionIds, pinnedIds) {
  const sessions = new Set(sessionIds);
  const pinned = pinnedIds.filter((id2, index) => sessions.has(id2) && pinnedIds.indexOf(id2) === index);
  const pinnedSet = new Set(pinned);
  return [...pinned, ...sessionIds.filter((id2) => !pinnedSet.has(id2))];
}
function syncPinnedSessionOrder(context, pinnedIds) {
  if (typeof context?.setSessionOrder !== "function" || typeof context?.accountKey !== "string") return false;
  const current = context.sessionOrderByAccount?.[context.accountKey];
  if (!Array.isArray(current)) return false;
  const next = pinnedSessionOrder(current, pinnedIds);
  if (next.length === current.length && next.every((id2, index) => id2 === current[index])) return false;
  context.setSessionOrder(context.accountKey, next);
  return true;
}
function readPinnedSessionIds(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(PINNED_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id2, index) => typeof id2 === "string" && id2.trim() !== "" && parsed.indexOf(id2) === index);
  } catch {
    return [];
  }
}
function writePinnedSessionIds(storage, pinnedIds) {
  try {
    storage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedIds));
    return true;
  } catch {
    return false;
  }
}
function sessionContextFromElement(element) {
  const key = Object.getOwnPropertyNames(element).find((name) => name.startsWith("__reactFiber$"));
  let fiber = key === void 0 ? void 0 : element[key];
  let sessionId;
  let title;
  let archiveSession;
  let sessionOrderByAccount;
  let setSessionOrder;
  let workspaces;
  for (let depth = 0; fiber !== void 0 && fiber !== null && depth < 64; depth += 1) {
    const props = fiber.memoizedProps;
    const candidateId = props?.node?.id;
    if (sessionId === void 0 && typeof candidateId === "string" && candidateId.trim() !== "") {
      sessionId = candidateId;
      title = props.node.title;
    }
    if (archiveSession === void 0 && typeof props?.archiveSession === "function") {
      archiveSession = props.archiveSession;
    }
    if (setSessionOrder === void 0 && typeof props?.setSessionOrder === "function" && typeof props?.sessionOrderByAccount === "object") {
      sessionOrderByAccount = props.sessionOrderByAccount;
      setSessionOrder = props.setSessionOrder;
      workspaces = props.workspaces;
    }
    fiber = fiber.return;
  }
  if (sessionId === void 0) return void 0;
  const workspace = Array.isArray(workspaces) ? workspaces.find((item) => item?.sessionIds?.includes(sessionId)) : void 0;
  return {
    sessionId,
    title: typeof title === "string" ? title : sessionId,
    archiveSession,
    sessionOrderByAccount,
    setSessionOrder,
    workspaces,
    accountKey: Array.isArray(workspaces) ? workspace?.workspaceId ?? "" : FLAT_SESSION_ORDER_KEY
  };
}
function svgElement(documentApi, name, attributes) {
  const element = documentApi.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}
function quickActionIcon(documentApi, kind, active = false) {
  const svg = svgElement(documentApi, "svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    fill: "none",
    "aria-hidden": "true"
  });
  if (kind === "pin") {
    svg.appendChild(svgElement(documentApi, "path", {
      d: "M5.2 2.5h5.6l-.9 3.2 1.8 1.8v1H8.8V13L8 14l-.8-1V8.5H4.3v-1l1.8-1.8-.9-3.2Z",
      fill: active ? "currentColor" : "none",
      stroke: "currentColor",
      "stroke-width": "1.3",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }));
    return svg;
  }
  svg.appendChild(svgElement(documentApi, "path", {
    d: kind === "delete" ? "M3 4h10M6 4V2.5h4V4M4 4l.6 9h6.8l.6-9M6.5 6.5v4M9.5 6.5v4" : "M2.5 4.5h11M3.5 4.5l.8-2h7.4l.8 2v7.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4.5ZM6 7.5h4",
    stroke: "currentColor",
    "stroke-width": "1.3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }));
  return svg;
}
function mountSessionQuickActions(row, context, pinnedIds, t, onTogglePin, onRequestDelete) {
  if (typeof context?.archiveSession !== "function") return false;
  const nativeButton = row.querySelector("button");
  if (nativeButton === null) return false;
  let actionHost = nativeButton.parentElement;
  while (actionHost !== null && actionHost.parentElement !== row) actionHost = actionHost.parentElement;
  if (actionHost === null) return false;
  const documentApi = row.ownerDocument ?? document;
  const pinned = pinnedIds.includes(context.sessionId);
  row.classList.add("dsh-ui-enhancements-row");
  actionHost.classList.add("dsh-ui-enhancements-row-actions-host");
  actionHost.previousElementSibling?.classList.add("dsh-ui-enhancements-row-time");
  const existing = actionHost.querySelector("[data-dsh-ui-enhancements-actions]");
  if (existing !== null) {
    if (existing.currentContext.sessionId !== context.sessionId) existing.children[1].disabled = false;
    existing.currentContext = context;
    existing.onRequestDelete = onRequestDelete;
    existing.onTogglePin = onTogglePin;
    const pin2 = existing.children[0];
    const archive2 = existing.children[1];
    const pinChanged = pin2.getAttribute("aria-pressed") !== String(pinned);
    pin2.setAttribute("aria-pressed", String(pinned));
    const pinLabel2 = t(pinned ? "unpin.aria" : "pin.aria", { title: context.title });
    pin2.setAttribute("aria-label", pinLabel2);
    pin2.setAttribute("title", pinLabel2);
    if (pinChanged) pin2.replaceChildren(quickActionIcon(documentApi, "pin", pinned));
    const archiveLabel2 = t("archive.aria", { title: context.title });
    archive2.setAttribute("aria-label", archiveLabel2);
    archive2.setAttribute("title", archiveLabel2);
    if (existing.children[2]) {
      const label = t("delete.aria", { title: context.title });
      existing.children[2].setAttribute("aria-label", label);
      existing.children[2].setAttribute("title", label);
    }
    return true;
  }
  const actions = documentApi.createElement("span");
  actions.classList.add("dsh-ui-enhancements-row-actions");
  actions.setAttribute("data-dsh-ui-enhancements-actions", context.sessionId);
  actions.currentContext = context;
  actions.onRequestDelete = onRequestDelete;
  actions.onTogglePin = onTogglePin;
  const pin = documentApi.createElement("button");
  pin.setAttribute("type", "button");
  pin.classList.add("dsh-ui-enhancements-row-action");
  pin.setAttribute("data-dsh-ui-enhancements-action", "pin");
  pin.setAttribute("aria-pressed", String(pinned));
  const pinLabel = t(pinned ? "unpin.aria" : "pin.aria", { title: context.title });
  pin.setAttribute("aria-label", pinLabel);
  pin.setAttribute("title", pinLabel);
  pin.appendChild(quickActionIcon(documentApi, "pin", pinned));
  pin.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    actions.onTogglePin(actions.currentContext.sessionId);
  });
  const archive = documentApi.createElement("button");
  archive.setAttribute("type", "button");
  archive.classList.add("dsh-ui-enhancements-row-action");
  archive.setAttribute("data-dsh-ui-enhancements-action", "archive");
  const archiveLabel = t("archive.aria", { title: context.title });
  archive.setAttribute("aria-label", archiveLabel);
  archive.setAttribute("title", archiveLabel);
  archive.appendChild(quickActionIcon(documentApi, "archive"));
  archive.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (archive.disabled) return;
    archive.disabled = true;
    try {
      await actions.currentContext.archiveSession(actions.currentContext.sessionId);
    } catch {
      archive.disabled = false;
      archive.dataset.status = "failed";
      archive.setAttribute("title", t("archive.failed"));
    }
  });
  actions.append(pin, archive);
  if (typeof onRequestDelete === "function") {
    const deletion = documentApi.createElement("button");
    deletion.setAttribute("type", "button");
    deletion.classList.add("dsh-ui-enhancements-row-action");
    deletion.setAttribute("data-dsh-ui-enhancements-action", "delete");
    const label = t("delete.aria", { title: context.title });
    deletion.setAttribute("aria-label", label);
    deletion.setAttribute("title", label);
    deletion.appendChild(quickActionIcon(documentApi, "delete"));
    deletion.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { sessionId, title } = actions.currentContext;
      actions.onRequestDelete?.({ sessionId, title });
    });
    actions.appendChild(deletion);
  }
  actionHost.insertBefore(actions, actionHost.firstChild);
  return true;
}
function installSessionQuickActions(t, browser = window, documentApi = document, Observer = globalThis.MutationObserver, onRequestDelete) {
  let pinnedIds = readPinnedSessionIds(browser.localStorage);
  let timer;
  const sync = () => {
    const seen = /* @__PURE__ */ new Map();
    for (const row of documentApi.querySelectorAll('[role="treeitem"]')) {
      const context = sessionContextFromElement(row);
      if (context === void 0 || typeof context.archiveSession !== "function") continue;
      mountSessionQuickActions(row, context, pinnedIds, t, togglePin, onRequestDelete);
      if (typeof context.setSessionOrder !== "function") continue;
      let accounts = seen.get(context.setSessionOrder);
      if (accounts === void 0) {
        accounts = /* @__PURE__ */ new Set();
        seen.set(context.setSessionOrder, accounts);
      }
      if (accounts.has(context.accountKey)) continue;
      accounts.add(context.accountKey);
      syncPinnedSessionOrder(context, pinnedIds);
    }
  };
  const togglePin = (sessionId) => {
    const next = pinnedIds.includes(sessionId) ? pinnedIds.filter((id2) => id2 !== sessionId) : [sessionId, ...pinnedIds];
    if (!writePinnedSessionIds(browser.localStorage, next)) return;
    pinnedIds = next;
    sync();
  };
  const schedule = () => {
    if (timer !== void 0) return;
    timer = setTimeout(() => {
      timer = void 0;
      sync();
    }, 0);
  };
  const observer = typeof Observer === "function" ? new Observer(schedule) : void 0;
  observer?.observe(documentApi.body, { childList: true, subtree: true });
  const onStorage = (event) => {
    if (event.key !== null && event.key !== PINNED_STORAGE_KEY) return;
    pinnedIds = readPinnedSessionIds(browser.localStorage);
    sync();
  };
  browser.addEventListener?.("storage", onStorage);
  sync();
  return () => {
    if (timer !== void 0) clearTimeout(timer);
    observer?.disconnect();
    browser.removeEventListener?.("storage", onStorage);
  };
}
function syncPluginToggle(button, plugin, t) {
  button.setAttribute("aria-checked", String(plugin.enabled));
  button.disabled = plugin.locked === true || button.dataset.status === "pending";
  const key = plugin.locked ? "plugin.locked" : plugin.enabled ? "plugin.disable" : "plugin.enable";
  const label = t(key, { name: plugin.moduleName });
  button.setAttribute("aria-label", label);
  button.setAttribute("title", label);
}
function mountPluginToggle(card, plugin, t, onToggle) {
  const header = [...card.children].find((child) => child.tagName === "BUTTON");
  if (header === void 0) return false;
  const documentApi = card.ownerDocument ?? document;
  card.classList.add("dsh-ui-enhancements-plugin-card");
  header.classList.add("dsh-ui-enhancements-plugin-card-header");
  let button = card.querySelector("[data-dsh-ui-enhancements-plugin-toggle]");
  if (button === null) {
    button = documentApi.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("role", "switch");
    button.setAttribute("data-dsh-ui-enhancements-plugin-toggle", plugin.entryId);
    button.classList.add("dsh-ui-enhancements-plugin-toggle");
    const track = documentApi.createElement("span");
    track.classList.add("dsh-ui-enhancements-plugin-toggle-track");
    const thumb = documentApi.createElement("span");
    thumb.classList.add("dsh-ui-enhancements-plugin-toggle-thumb");
    track.appendChild(thumb);
    button.appendChild(track);
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const current = button.pluginToggleState;
      if (current.locked || button.disabled) return;
      const enabled = !current.enabled;
      button.disabled = true;
      button.dataset.status = "pending";
      try {
        const result = await button.pluginToggleAction(current.entryId, enabled);
        if (result?.entryId !== current.entryId || typeof result.enabled !== "boolean") {
          throw new Error("invalid plugin toggle response");
        }
        current.enabled = result.enabled;
        if (!button.pluginRefreshNotice) {
          const notice = documentApi.createElement("div");
          notice.setAttribute("role", "status");
          notice.classList.add("dsh-ui-enhancements-refresh-notice");
          const message = documentApi.createElement("p");
          const refresh = documentApi.createElement("button");
          refresh.setAttribute("type", "button");
          refresh.addEventListener("click", (event2) => {
            event2.preventDefault();
            event2.stopPropagation();
            documentApi.defaultView?.location.reload();
          });
          notice.append(message, refresh);
          card.appendChild(notice);
          button.pluginRefreshNotice = notice;
        }
        button.pluginRefreshNotice.children[0].textContent = button.pluginToggleTranslate("plugin.refreshRequired");
        button.pluginRefreshNotice.children[1].textContent = button.pluginToggleTranslate("plugin.refresh");
        button.dataset.status = "idle";
        syncPluginToggle(button, current, button.pluginToggleTranslate);
      } catch {
        button.dataset.status = "failed";
        syncPluginToggle(button, current, button.pluginToggleTranslate);
        button.setAttribute("title", button.pluginToggleTranslate("plugin.failed", { name: current.moduleName }));
      }
    });
    card.appendChild(button);
  }
  button.pluginToggleState = plugin;
  button.pluginToggleAction = onToggle;
  button.pluginToggleTranslate = t;
  syncPluginToggle(button, plugin, t);
  return true;
}
function installPluginToggles(t, api, documentApi = document, Observer = globalThis.MutationObserver) {
  let entries = /* @__PURE__ */ new Map();
  let timer;
  let disposed = false;
  const sync = () => {
    for (const card of documentApi.querySelectorAll("[data-plugin-entry]")) {
      const entry = entries.get(card.getAttribute("data-plugin-entry"));
      if (entry !== void 0) mountPluginToggle(card, entry, t, setEnabled);
    }
  };
  const refresh = async () => {
    try {
      const snapshot = await api.list();
      if (!Array.isArray(snapshot?.entries)) throw new Error("invalid plugin toggle inventory");
      entries = new Map(snapshot.entries.filter((entry) => typeof entry?.entryId === "string" && typeof entry?.moduleName === "string" && typeof entry?.enabled === "boolean" && typeof entry?.locked === "boolean").map((entry) => [entry.entryId, entry]));
      if (!disposed) sync();
    } catch (error) {
      entries = /* @__PURE__ */ new Map();
      console.warn("dsh-ui-enhancements: plugin switches unavailable", error);
    }
  };
  const setEnabled = async (entryId, enabled) => {
    const result = await api.setEnabled(entryId, enabled);
    const entry = entries.get(entryId);
    if (entry !== void 0 && result?.entryId === entryId && typeof result.enabled === "boolean") {
      entry.enabled = result.enabled;
    }
    return result;
  };
  const schedule = () => {
    if (timer !== void 0) return;
    timer = setTimeout(() => {
      timer = void 0;
      sync();
    }, 0);
  };
  const observer = typeof Observer === "function" ? new Observer(schedule) : void 0;
  observer?.observe(documentApi.body, { childList: true, subtree: true });
  void refresh();
  return () => {
    disposed = true;
    if (timer !== void 0) clearTimeout(timer);
    observer?.disconnect();
  };
}
function installStyles(documentApi = document) {
  if (documentApi.querySelector(`#${STYLE_ID}`) !== null) return () => {
  };
  const style = documentApi.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
.dsh-ui-enhancements-row-actions-host {
  display: inline-flex !important;
  align-items: center;
  gap: 4px !important;
  width: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 120ms var(--ds-ease-in-out);
}
.dsh-ui-enhancements-row:hover .dsh-ui-enhancements-row-actions-host,
.dsh-ui-enhancements-row:focus-within .dsh-ui-enhancements-row-actions-host {
  width: auto;
  opacity: 1;
  overflow: visible;
  pointer-events: auto;
}
.dsh-ui-enhancements-row:hover .dsh-ui-enhancements-row-time,
.dsh-ui-enhancements-row:focus-within .dsh-ui-enhancements-row-time { display: none; }
.dsh-ui-enhancements-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.dsh-ui-enhancements-row-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  color: var(--dsw-alias-label-tertiary);
  background: transparent;
  cursor: pointer;
}
.dsh-ui-enhancements-row-action:hover { color: var(--dsw-alias-label-primary); }
.dsh-ui-enhancements-row-action[data-dsh-ui-enhancements-action="delete"]:hover { color: var(--dsw-alias-state-error-primary); }
${ARCHIVE_STYLES}
.dsh-ui-enhancements-row-action:focus-visible {
  outline: 2px solid var(--dsw-alias-label-primary-bluish);
  outline-offset: 1px;
}
.dsh-ui-enhancements-row-action[aria-pressed="true"] {
  color: var(--dsw-alias-state-business-primary);
}
.dsh-ui-enhancements-row-action:disabled {
  opacity: .45;
  cursor: default;
}
.dsh-ui-enhancements-row-action[data-status="failed"] {
  color: var(--dsw-alias-label-error);
}
.dsh-ui-enhancements-row-action svg {
  width: 16px;
  height: 16px;
  flex: none;
}
.dsh-ui-enhancements-plugin-card {
  position: relative;
}
.dsh-ui-enhancements-plugin-card-header {
  padding-right: 72px !important;
}
.dsh-ui-enhancements-refresh-notice {
  padding: 12px;
  margin: 8px;
  border: 1px solid currentColor;
  border-radius: 8px;
  font-size: 13px;
}
.dsh-ui-enhancements-refresh-notice button { text-decoration: underline; cursor: pointer; }
.dsh-ui-enhancements-plugin-toggle {
  position: absolute;
  z-index: 1;
  top: 4px;
  right: 10px;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--dsw-alias-label-tertiary);
  background: transparent;
  cursor: pointer;
}
.dsh-ui-enhancements-plugin-toggle:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-ui-enhancements-plugin-toggle:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary);
  outline-offset: -2px;
}
.dsh-ui-enhancements-plugin-toggle-track {
  position: relative;
  display: block;
  width: 32px;
  height: 18px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh-ui-enhancements-plugin-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  transition: transform 120ms var(--ds-ease-in-out);
}
.dsh-ui-enhancements-plugin-toggle[aria-checked="true"] {
  color: var(--dsw-alias-state-business-primary);
}
.dsh-ui-enhancements-plugin-toggle[aria-checked="true"] .dsh-ui-enhancements-plugin-toggle-thumb {
  transform: translateX(14px);
}
.dsh-ui-enhancements-plugin-toggle:disabled {
  opacity: .45;
  cursor: default;
}
.dsh-ui-enhancements-plugin-toggle[data-status="pending"] { opacity: .65; }
.dsh-ui-enhancements-plugin-toggle[data-status="failed"] { color: var(--dsw-alias-label-error); }
@media (hover: none) and (pointer: coarse) {
  .dsh-ui-enhancements-row { min-height: 48px; }
  .dsh-ui-enhancements-row-action { width: 44px; height: 44px; }
  .dsh-ui-enhancements-row .dsh-ui-enhancements-row-actions-host {
    width: auto;
    opacity: 1;
    overflow: visible;
    pointer-events: auto;
  }
  .dsh-ui-enhancements-row .dsh-ui-enhancements-row-time { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-ui-enhancements-row-actions-host,
  .dsh-ui-enhancements-plugin-toggle-thumb { transition: none; }
}
`;
  documentApi.head.appendChild(style);
  return () => {
    style.remove();
  };
}
function apply(ctx) {
  ctx.effect(installStyles);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }));
  ctx.effect(async () => {
    const unmount = await ctx.remote.$mount({
      package: NS,
      descriptors: [...PROFILE_PLUGIN_REMOTE.descriptors, ...SESSION_MANAGEMENT_REMOTE.descriptors]
    });
    const cleanups = [];
    try {
      const remote = ctx.get("remote.profilePluginToggles");
      if (remote === void 0) throw new Error("profile plugin Remote did not mount");
      const api = {
        async list() {
          const result = await remote.list();
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        },
        async setEnabled(entryId, enabled) {
          const result = await remote.setEnabled(entryId, enabled);
          if (!result.ok) throw new Error(result.error.message);
          return result.value;
        }
      };
      cleanups.push(installPluginToggles(ctx.locale.bind(NS), api));
      const sessionRemote = ctx.get("remote.sessionManagement");
      const sessionApi = Object.fromEntries(["listArchived", "resolveArchivedTitles", "readArchived", "restore", "delete"].map((method) => [method, async (...args) => {
        const result = await sessionRemote[method](...args);
        if (!result.ok) throw new Error(result.error.message);
        return result.value;
      }]));
      const manager = createSessionManager(ctx.locale.bind(NS), sessionApi, async (result) => {
        ctx.workspaces.model.installArchived(result.archivedSessionIds);
        if (result.deleted && ctx.sessions.list.getSnapshot().current === result.sessionId) ctx.sessions.clear();
      });
      cleanups.push(() => manager.dispose());
      cleanups.push(registerArchiveEntry(ctx, manager, ctx.locale.bind(NS)));
      cleanups.push(installSessionQuickActions(ctx.locale.bind(NS), window, document, globalThis.MutationObserver, (target) => manager.confirmDelete(target)));
      return async () => {
        for (const cleanup of cleanups.reverse()) cleanup();
        await unmount();
      };
    } catch (error) {
      for (const cleanup of cleanups.reverse()) cleanup();
      await unmount();
      throw error;
    }
  });
}
return module.exports;}});
