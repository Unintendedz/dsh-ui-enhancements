export const ARCHIVE_STYLES = `
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
.dsh-projectless-path { display:block; margin-top:8px; font-size:12px; color:var(--dsw-alias-label-secondary); overflow-wrap:anywhere; }
.dsh-projectless-error { max-width:320px; color:var(--dsw-alias-state-error-primary); font-size:12px; overflow-wrap:anywhere; }
.dsh-projectless-error button { min-height:32px; padding:4px 8px; border:0; border-radius:6px; color:inherit; background:var(--dsw-alias-interactive-bg-hover); cursor:pointer; }
.dsh-projectless-group-row { background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent); box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent); border-radius:8px; }
.dsh-projectless-group-row:hover { background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 13%,transparent); }
.dsh-projectless-group-row:focus-visible { outline:2px solid var(--dsw-alias-state-business-primary); outline-offset:-2px; }
.dsh-projectless-group-row [data-dsh-projectless-icon] { color:var(--dsw-alias-state-business-primary); }
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
`
