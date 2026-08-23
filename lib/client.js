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
  installSessionQuickActions: () => installSessionQuickActions,
  installStyles: () => installStyles,
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
  "archive.failed": "\u5F52\u6863\u5931\u8D25"
};
var en = {
  "pin.aria": "Pin session \u201C{title}\u201D",
  "unpin.aria": "Unpin session \u201C{title}\u201D",
  "archive.aria": "Archive session \u201C{title}\u201D",
  "archive.failed": "Archive failed"
};
var inject = ["locale"];
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
  .dsh-ui-enhancements-row-actions-host { transition: none; }
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
}
return module.exports;}});
