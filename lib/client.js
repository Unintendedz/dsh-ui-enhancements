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
var NS = "dsh-ui-enhancements";
var PINNED_STORAGE_KEY = "dsh-ui-enhancements.pinned-session-ids.v1";
var FLAT_SESSION_ORDER_KEY = "__flat_session_order__";
var STYLE_ID = "dsh-ui-enhancements-style";
var zh = {
  "pin.aria": "\u7F6E\u9876\u4F1A\u8BDD\u201C{title}\u201D",
  "unpin.aria": "\u53D6\u6D88\u7F6E\u9876\u4F1A\u8BDD\u201C{title}\u201D",
  "archive.aria": "\u5F52\u6863\u4F1A\u8BDD\u201C{title}\u201D",
  "archive.failed": "\u5F52\u6863\u5931\u8D25",
  "plugin.enable": "\u542F\u7528\u63D2\u4EF6\u201C{name}\u201D",
  "plugin.disable": "\u505C\u7528\u63D2\u4EF6\u201C{name}\u201D",
  "plugin.locked": "\u63D2\u4EF6\u7BA1\u7406\u5668\u201C{name}\u201D\u59CB\u7EC8\u542F\u7528",
  "plugin.failed": "\u63D2\u4EF6\u201C{name}\u201D\u5F00\u5173\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5"
};
var en = {
  "pin.aria": "Pin session \u201C{title}\u201D",
  "unpin.aria": "Unpin session \u201C{title}\u201D",
  "archive.aria": "Archive session \u201C{title}\u201D",
  "archive.failed": "Archive failed",
  "plugin.enable": "Enable plugin \u201C{name}\u201D",
  "plugin.disable": "Disable plugin \u201C{name}\u201D",
  "plugin.locked": "Plugin manager \u201C{name}\u201D is always enabled",
  "plugin.failed": "Could not change plugin \u201C{name}\u201D; try again"
};
var inject = ["locale", "remote"];
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
  const pinned = pinnedIds.filter((id, index) => sessions.has(id) && pinnedIds.indexOf(id) === index);
  const pinnedSet = new Set(pinned);
  return [...pinned, ...sessionIds.filter((id) => !pinnedSet.has(id))];
}
function syncPinnedSessionOrder(context, pinnedIds) {
  if (typeof context?.setSessionOrder !== "function" || typeof context?.accountKey !== "string") return false;
  const current = context.sessionOrderByAccount?.[context.accountKey];
  if (!Array.isArray(current)) return false;
  const next = pinnedSessionOrder(current, pinnedIds);
  if (next.length === current.length && next.every((id, index) => id === current[index])) return false;
  context.setSessionOrder(context.accountKey, next);
  return true;
}
function readPinnedSessionIds(storage = window.localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(PINNED_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id, index) => typeof id === "string" && id.trim() !== "" && parsed.indexOf(id) === index);
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
    d: "M2.5 4.5h11M3.5 4.5l.8-2h7.4l.8 2v7.5a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4.5ZM6 7.5h4",
    stroke: "currentColor",
    "stroke-width": "1.3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"
  }));
  return svg;
}
function mountSessionQuickActions(row, context, pinnedIds, t, onTogglePin) {
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
    return true;
  }
  const actions = documentApi.createElement("span");
  actions.classList.add("dsh-ui-enhancements-row-actions");
  actions.setAttribute("data-dsh-ui-enhancements-actions", context.sessionId);
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
    onTogglePin(context.sessionId);
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
      await context.archiveSession(context.sessionId);
    } catch {
      archive.disabled = false;
      archive.dataset.status = "failed";
      archive.setAttribute("title", t("archive.failed"));
    }
  });
  actions.append(pin, archive);
  actionHost.insertBefore(actions, actionHost.firstChild);
  return true;
}
function installSessionQuickActions(t, browser = window, documentApi = document, Observer = globalThis.MutationObserver) {
  let pinnedIds = readPinnedSessionIds(browser.localStorage);
  let timer;
  const sync = () => {
    const seen = /* @__PURE__ */ new Map();
    for (const row of documentApi.querySelectorAll('[role="treeitem"]')) {
      const context = sessionContextFromElement(row);
      if (context === void 0 || typeof context.archiveSession !== "function") continue;
      mountSessionQuickActions(row, context, pinnedIds, t, togglePin);
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
    const next = pinnedIds.includes(sessionId) ? pinnedIds.filter((id) => id !== sessionId) : [sessionId, ...pinnedIds];
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
  ctx.effect(() => installSessionQuickActions(ctx.locale.bind(NS)));
  ctx.effect(async () => {
    try {
      const unmount = await ctx.remote.$mount(PROFILE_PLUGIN_REMOTE);
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
      const cleanup = installPluginToggles(ctx.locale.bind(NS), api);
      return async () => {
        cleanup();
        await unmount();
      };
    } catch (error) {
      console.warn("dsh-ui-enhancements: plugin switch Remote unavailable", error);
    }
  });
}
return module.exports;}});
