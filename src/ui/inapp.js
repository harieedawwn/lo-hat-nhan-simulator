/** Phát hiện trình duyệt trong ứng dụng (Zalo, Facebook…) và xử lý lỗi toàn cục không chặn người dùng. */
const UA = navigator.userAgent || '';
export const isZalo = /Zalo/i.test(UA);
export const isInApp = isZalo || /FBAN|FBAV|Instagram|Line\/|TikTok|musical_ly|BytedanceWebview/i.test(UA);
export const isIOS = /iP(hone|od|ad)/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(UA);
export const isIPhone = /iPhone|iPod/.test(UA);
export const isSafari = isIOS && /Safari/.test(UA) && !/CriOS|FxiOS|EdgiOS|OPiOS|Zalo|FBAN|FBAV|Instagram|Line\//.test(UA);
export const appName = isZalo ? 'Zalo' : /FBAN|FBAV/.test(UA) ? 'Facebook' : /Instagram/.test(UA) ? 'Instagram' : /TikTok|musical_ly|Bytedance/.test(UA) ? 'TikTok' : /Line\//.test(UA) ? 'LINE' : '';

const FOREIGN = /zalo|ZaloJavaBridge|zaloJSV2|webkit\.messageHandlers|FBAN|fbq/i;
const BASE = new URL('./', location.href).href;
const ownUrl = (f) => {
  if (!f) return false;
  try { const u = new URL(f, location.href); u.search = ''; u.hash = ''; const h = u.href; return h.startsWith(BASE + 'assets/') || h.startsWith(BASE + 'src/') || h.startsWith(BASE + '@vite') || h.startsWith(BASE + 'node_modules/'); } catch (_) { return false; }
};

let shown = false;
export function installErrorHandlers(onFatal) {
  const fatal = (what) => { try { console.error('[mô phỏng]', what); } catch (_) { /* */ } if (shown) return; shown = true; onFatal && onFatal(); };
  window.addEventListener('error', (e) => {
    const msg = String(e.message || '');
    if (!e.filename || msg === 'Script error.' || FOREIGN.test(msg) || FOREIGN.test(String(e.filename))) return;
    if (!ownUrl(e.filename)) return;
    fatal(e.error || msg);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason; const stack = String((r && r.stack) || ''); const msg = String((r && r.message) || r || '');
    if (FOREIGN.test(msg) || FOREIGN.test(stack)) return;
    const own = stack.split('\n').some((l) => { const m = l.match(/(https?:\/\/[^\s)]+?\.(?:js|ts))/); return m && ownUrl(m[1]); });
    if (!own) return;
    fatal(r);
  });
}

/** Mở bằng trình duyệt mặc định (Android: intent URL). Trả về true nếu đã thử. */
export function openExternalAndroid() {
  const u = new URL(location.href); const path = u.host + u.pathname.replace(/\/index\.html$/, '/');
  location.href = 'intent://' + path + '#Intent;scheme=https;end';
}

export async function copyLink() {
  const url = location.origin + location.pathname;
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(url); return true; } } catch (_) { /* thử cách khác */ }
  try {
    const ta = document.createElement('textarea'); ta.value = url; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-999px;top:0;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, 9999);
    const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(ta); return !!ok;
  } catch (_) { return false; }
}
export function canFullscreen() {
  const d = document.documentElement;
  return !!(d.requestFullscreen || d.webkitRequestFullscreen) && !isIPhone && !isInApp;
}
export function isFullscreen() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
export function requestFS() { const d = document.documentElement; try { const r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.catch) r.catch(() => {}); return true; } catch (_) { return false; } }
export function exitFS() { try { const r = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if (r && r.catch) r.catch(() => {}); } catch (_) { /* */ } }
