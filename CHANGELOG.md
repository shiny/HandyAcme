# Changelog

## 0.2.0 — 2026-09-13

- Implement DNS-PERSIST-01 validation with tokenless response parsing, persistent TXT record generation, and challenge submission.
- Support CA-provided account identifiers, registered-account fallback for deployed CAs, issuer selection, wildcard policy, and optional UNIX expiry.
- Add `Authorization.challengeDnsPersist`, `Authorization.dnsPersistRecord`, `Challenge.dnsPersistValue`, and standalone record helpers. Persistent signing never hashes a challenge token.
- Preserve HTTP-01 and DNS-01 behavior and future challenge compatibility. `ResponseChallenge` is now a discriminated union; DNS-PERSIST-01 has no token and its `Challenge.token` getter throws.

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
