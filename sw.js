// tvONE Product Selector — Service Worker
// v27.14.0 (2026-05-28)
//
// Changelog:
//   v27.14.0 — Dashboard reframe: stage funnel promoted from 1/3-width
//             tile to full-width top position per owner perspective;
//             regional chart redesigned (Option B) — abstract India SVG
//             blobs replaced with clean horizontal bar chart. Product
//             mentions + Origin split rebalanced to col-6 each. No
//             backend changes. CACHE_NAME bump only.
//   v27.13.2 — OEM donut empty-state fix: when one side is 0, the SVG
//             stroke-linecap:round was rendering the zero-dasharray as a
//             visible rounded dot at the start position. Now handles 3
//             states cleanly: both zero (hide), one zero (full ring), both
//             nonzero (split). CACHE_NAME bump only.
//   v27.13.1 — Dashboard visual fixes (frontend-only): null-safe ticker
//             formatter + ticker CSS overlap fix on Z Fold, 'Unknown' →
//             defensive name cascade with UUID fallback, funnel bar empty
//             state at count=0, attention card label 2-line wrap, "Product
//             mix" → "Product mentions" framing, smoother India zone blobs.
//             No backend changes. CACHE_NAME bump only.
//   v27.13.0 — Security + reliability hardening: CSP meta header, SRI doc
//             comment for ECharts CDN, RPC rate limiter (20/10s/RPC),
//             error_log_list + push_subs_count for #/admin/health view,
//             SLA-crossed cron + push trigger. SW unchanged from v27.12.0
//             other than CACHE_NAME bump.
//   v27.12.0 — Offline draft mode in frontend (no SW logic change here —
//             saves go to IndexedDB on the page, not via SW). CACHE_NAME
//             bump only. Push event handlers unchanged from v27.9.0.
//   v27.9.0 — Tier-1.4 push notifications frontend: SW push event handler
//             + notificationclick handler. Payload schema: {title, body, url}.
//             Notification tag = url to dedupe per-deal updates. Click opens
//             or focuses existing app window, navigates to URL.
//   v27.8.2 — Sprint 1 UX polish: smart close_month default (today+60d),
//             keyboard shortcuts (Ctrl/Cmd+S, /, ?, g+h/d/q/l), Z Fold
//             safe-area inset fix on BoM action bar.
//   v27.8.1 — Tier-1.3 follow-on: stage velocity bars on the dashboard
//             now color by SLA state (fresh/aging/slipped) instead of
//             per-stage palette when SLA is configured. Bar labels show
//             "avg / target" format. No DB changes. Frontend-only ship.
//   v27.8.0 — Tier-1.3 ships: stage aging / SLA badges. Adds
//             stage_sla_days column on pipeline_stages + denormalized
//             current_stage_entered_at on deals. New helpers
//             computeStageAgeBadge / renderStageAgeBadge. Badge renders
//             on saved deals list next to stage chip. Requires
//             MIGRATION-v27_8_0-stage-sla.sql applied first.
//   v27.7.4 — Bundle ships F6 (a11y baseline: openSheet focus management +
//             aria-labelledby + ESC handler + Tab focus trap). No SW logic
//             change — CACHE_NAME bump only.
//   v27.7.3 — Bundle ships F5 (SALES_TEAM / PRESALES_TEAM from live roster
//             at login, no more hardcoded UUID arrays).
//   v27.7.2 — Bundle ships F1 (stages-from-DB), F2 (AP-536 placeholder
//             flag), F3 (de-hardcoded escalation contact), F7 (uncaught
//             error → error_log).
//   v27.7.1 — Manifest fix (minimal manifest, no embedded PNG / hex)
//
// Strategy:
//   - Shell (index.html + CDN scripts): cache-first. On install, prime the
//     cache. On fetch, serve from cache if present; revalidate in background.
//   - Supabase / RPC calls: NEVER cached. Network only. Returning stale RPC
//     data would silently corrupt the dashboard.
//   - Navigation requests: cache-first with offline fallback to cached
//     index.html so the SPA shell still boots without network.
//
// Versioning: bump CACHE_NAME on every release. Old caches are deleted in
// the activate handler. Promotes hard-refresh semantics for users with the
// PWA installed.

const CACHE_NAME = 'tvone-v27.14.0';
const SHELL_URLS = [
  './',
  './index.html'
];

// Domains whose responses must NEVER be cached.
const NEVER_CACHE_HOSTS = [
  'supabase.co',
  'supabase.in',
  'googleapis.com'  // any Google Identity / OAuth calls
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Don't fail install if shell prime errors — let runtime cache it later.
      return cache.addAll(SHELL_URLS).catch(function(err) {
        console.warn('[SW] shell prime failed (non-fatal):', err && err.message);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) {
        return k !== CACHE_NAME;
      }).map(function(k) {
        return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  const req = event.request;

  // Only handle GET. Non-GET (POST/PATCH/DELETE) goes straight to network.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Skip caching for explicitly-blocked hosts (Supabase RPC, OAuth).
  const isNeverCache = NEVER_CACHE_HOSTS.some(function(host) {
    return url.hostname.indexOf(host) >= 0;
  });
  if (isNeverCache) return;

  // Navigation requests: cache-first with offline fallback to index.html.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function(resp) {
        // Network fresh — cache the response if successful for future offline use.
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
        }
        return resp;
      }).catch(function() {
        // Offline — serve cached index.html shell.
        return caches.match('./index.html').then(function(hit) {
          return hit || caches.match('./');
        });
      })
    );
    return;
  }

  // All other GET (CDN scripts, fonts, etc): cache-first.
  event.respondWith(
    caches.match(req).then(function(hit) {
      if (hit) {
        // Background revalidate — don't wait on the response. Stale-while-revalidate.
        fetch(req).then(function(resp) {
          if (resp && resp.ok && resp.type !== 'opaque') {
            caches.open(CACHE_NAME).then(function(c) { c.put(req, resp.clone()); });
          }
        }).catch(function() { /* offline, ignore */ });
        return hit;
      }
      // Miss — go to network. Cache successful responses.
      return fetch(req).then(function(resp) {
        if (resp && resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
        }
        return resp;
      });
    })
  );
});

// Allow runtime cache nuke via postMessage. Use sparingly — only for
// debugging "force-refresh" scenarios.
self.addEventListener('message', function(event) {
  if (event.data === 'tvone:cache:nuke') {
    caches.keys().then(function(keys) {
      keys.forEach(function(k) { caches.delete(k); });
    });
  }
});

// v27.9.0 — Tier-1.4 push notifications. Payload format expected from
// Supabase Edge Function `send_push`:
//   { title: string, body: string, url: string }
// All three are size-limited server-side (title <=80, body <=200). On
// notification click we open or focus the URL in the app's existing
// client window (no new tab if the app is already open).
self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    // Non-JSON or empty payload — show a generic notification rather
    // than silently dropping. Most push services reject empty payloads
    // upstream so this is rare.
    data = { title: 'tvONE', body: 'You have a new update', url: '/' };
  }
  const title = String(data.title || 'tvONE').slice(0, 80);
  const opts = {
    body:  String(data.body  || '').slice(0, 200),
    icon:  './icon-192.png',
    badge: './icon-192.png',
    data:  { url: String(data.url || '/') },
    // tag dedupes notifications: if a new push has the same tag, the
    // OS replaces the old one rather than stacking. URL is a good dedup
    // key since multiple updates to the same deal collapse to one.
    tag:   String(data.url || 'tvone-default')
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If the app is already open, focus that window + navigate to URL
      for (const c of clientList) {
        if ('focus' in c) {
          c.focus();
          if ('navigate' in c) {
            try { c.navigate(url); } catch (_) {}
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
