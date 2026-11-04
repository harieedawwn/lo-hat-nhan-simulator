/** Truy cập localStorage an toàn (WebView có thể ném lỗi). */
export const store = {
  get(k, d = null) { try { const v = window.localStorage.getItem('pwr.' + k); return v === null ? d : v; } catch (_) { return d; } },
  set(k, v) { try { window.localStorage.setItem('pwr.' + k, String(v)); } catch (_) { /* bỏ qua */ } },
};
export const sstore = {
  get(k, d = null) { try { const v = window.sessionStorage.getItem('pwr.' + k); return v === null ? d : v; } catch (_) { return d; } },
  set(k, v) { try { window.sessionStorage.setItem('pwr.' + k, String(v)); } catch (_) { /* bỏ qua */ } },
};
