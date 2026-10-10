// Fullscreen is optional: denied iframe/browser permissions must never stop a match.
export function fullscreenElement(doc) {
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}
export async function enterFullscreen(doc, screen, landscape = false) {
  const root = doc.documentElement;
  try {
    if (!fullscreenElement(doc)) {
      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) await root.webkitRequestFullscreen();
      else return { ok: false, reason: 'unsupported' };
    }
    // iOS and some desktop browsers don't expose orientation locking.
    if (landscape && screen?.orientation?.lock) {
      try { await screen.orientation.lock('landscape'); } catch { /* Rotation is optional. */ }
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'denied' };
  }
}
export async function exitFullscreen(doc, screen) {
  try {
    if (fullscreenElement(doc)) {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    }
    try { screen?.orientation?.unlock?.(); } catch { /* Optional API. */ }
    return { ok: true };
  } catch { return { ok: false, reason: 'denied' }; }
}
export function viewportSize(win) {
  // Layout viewport (not visualViewport) keeps touch/canvas projection aligned.
  return { width: Math.max(1, win.innerWidth), height: Math.max(1, win.innerHeight) };
}
