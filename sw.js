// tvONE Product Selector — Service Worker
// v27.8.1 (2026-05-27)
//
// Changelog:
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

const CACHE_NAME = 'tvone-v27.8.1';
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
