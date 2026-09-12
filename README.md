
<div align="center">
  <img src="https://user-images.githubusercontent.com/117487/183263478-c64b4a31-b5e1-43c1-9e31-6ff03e20ce46.svg" />
  <h3>Handy Acme</h3>
  <p>A TypeScript Client implements ACME (RFC 8555) </p>
  <p><a href="https://shiny.github.io/HandyAcme/">HandyACME API Reference</a></p>

  
  <a href="https://github.com/shiny/HandyAcme/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/shiny/HandyAcme/build.yml?logo=githubactions" /></a>
  <a href="https://www.npmjs.com/package/handyacme"><img src="https://img.shields.io/npm/v/handyacme?logo=nodedotjs" /></a>
  <img src="https://img.shields.io/badge/Lang-typescript-blue?logo=typescript" />
  <img src="https://img.shields.io/npm/l/handyacme?logo=opensourceinitiative" />
</div>

## Install
```bash
npm install handyacme --save
```

## Get Started
```typescript
import HandyAcme from "handyacme"
const le = await HandyAcme.create("LetsEncrypt")
```

### Create Account or import the exists account

```typescript
// Create an Account

await le.createAccount('user@example.com')
const account = await le.exportAccount()
/**
    {
        email: string
        accountUrl: string
        jwk: JsonWebKey
    }
**/

// Import Account
await le.importAccount(account)
```

### Create an Order

```typescript
// Create an Order

const order = await le.createOrder(['test.example.com'])

// authorizations
const authorizations = await order.authorizations()
// For restore
// const authorizationUrl = authorizations[0].url
// const authorization = await le.restoreAuthorization(authorizationUrl)

// sign for the default http-01 challenge
const token = authorizations[0].challengeHttp.token
const httpSignKey = await authorizations[0].challengeHttp.sign()
// Acme Server will send a http request to http://test.example.com/.well-known/acme-challenge/${token}
// and the expect content is ${httpSignKey}

// sign for the default dns-01 challenge
const dnsSignKey = await authorizations[0].challengeDns.sign()
// expect DNS TXT Record _acme-challenge.test.example.com => dnsSignKey

```

Verify the challenge when you are ready

```typescript
const le = await HandyAcme.create("LetsEncrypt")
await le.importAccount(account)
const authorization = await le.restoreAuthorization(authorizationUrl)

// pending verify
if (authorization.isPending) {
    const challenge = await le.restoreChallenge(challengeUrl)
    if (!challenge.isValid) {
        // challenge not ready. show the challenge
        return challenge
    }
// verify succeed
} else if (authorization.isValid) {
    const order = await le.restoreOrder(orderUrl)
    // order is ready
    // finalize certification from CSR
    // and return the PEM privateKey
    if (order.isReady) {
        const { privateKey, csr } = await order.csr("ECDSA")
        await order.finalize(csr)
        return privateKey
    // ready for download cert
    // download and return PEM cert
    } else if ( order.isValid ) {
        return await order.downloadCertification()
    // may be pending or invalid
    } else {
        return order
    }
}
```

### Persistent DNS validation (DNS-PERSIST-01)

For CAs that offer `dns-persist-01`, HandyAcme generates the persistent TXT
record and submits validation without a challenge token. The record authorizes
one ACME account with one CA; keep the same account when renewing.

```typescript
const order = await le.createOrder(["example.com", "*.example.com"])
const authorizations = await order.authorizations()
for (const authorization of authorizations) {
    if (authorization.isValid) continue
    const challenge = authorization.challengeDnsPersist
    if (!challenge) throw new Error("The CA does not offer DNS-PERSIST-01")

    // Use the wildcard policy for both authorizations so they share one record.
    const record = authorization.dnsPersistRecord({ wildcard: true })
    // record.type  = "TXT"
    // record.name  = "_validation-persist.example.com"
    // record.value = "letsencrypt.org; accounturi=<account URL>; policy=wildcard"
    // Provision this record once and wait for public DNS before continuing.
    // On renewal, check and reuse it. Do not delete it after issuance.
    await challenge.verify()
}
// Poll the order, then generate the CSR, finalize and download as usual.
```

`authorization.dnsPersistRecord()` automatically includes `policy=wildcard`
when that authorization is for a wildcard. Passing `wildcard: true` also lets a
base-domain authorization share the record with a wildcard in the same order.
For a single exact hostname, omit that option to avoid granting broader scope.

`issuerDomainName` can select another identity offered by the challenge.
`persistUntil` is an optional UNIX timestamp in seconds; omitting it creates
standing authorization. Removing the DNS record prevents future validation
after caches expire, but does not revoke existing certificates or cached ACME
authorizations. Persist and protect the account key separately.

The CA's `accounturi` is used verbatim when present. Older deployed CAs that
omit it use the imported or registered account URL. The selected issuer must be
one of the challenge's advertised identities. Neither account URIs nor issuer
values may inject extra record parameters.

For lower-level integrations, `challenge.dnsPersistValue(options)` and
`await challenge.sign(options)` return the TXT value. `challenge.token` throws
for DNS-PERSIST-01 because this method has no token. `dnsPersistRecordName` and
`dnsPersistRecordValue` are also exported for preparing records in advance.

This implements [draft-ietf-acme-dns-persist-01](https://datatracker.ietf.org/doc/html/draft-ietf-acme-dns-persist-01).
CA availability is determined by the challenges in each authorization; an
unavailable method is not silently substituted with another method.

### Additional challenge types

HandyAcme supports HTTP-01, DNS-01, TLS-ALPN-01 response parsing, and
DNS-PERSIST-01. Future unsupported challenge types are omitted when loading or
refreshing authorizations; malformed supported challenges are rejected.
`challengeDns`, `challengeDnsPersist`, `challengeHttp`, and `challengeTlsAlpn`
are `undefined` when the CA does not offer the corresponding method.

## License
MIT