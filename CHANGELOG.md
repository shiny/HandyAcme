# Changelog

## 0.1.5 — 2026-09-13

- Accept authorization responses containing additional challenge types, including
  the tokenless `dns-persist-01` offered by Let's Encrypt, while continuing to
  validate HTTP-01, DNS-01, and TLS-ALPN-01 responses strictly.
- Preserve DNS-01 signing, wildcard authorization, order loading, and status
  refresh when additional methods are present. Unsupported methods are omitted
  from the available challenges; this release does not implement DNS-PERSIST-01
  validation.
- Build the distribution before packing or publishing and exclude test fixtures
  from the published package.

Background: [Let's Encrypt DNS-PERSIST-01 announcement](https://letsencrypt.org/2026/02/18/dns-persist-01).
