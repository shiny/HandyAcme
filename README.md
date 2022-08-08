# Handy Acme


![GitHub Workflow Status](https://img.shields.io/github/workflow/status/shiny/handyacme/Node.js%20CI?style=plastic)
![npm](https://img.shields.io/npm/v/handyacme?style=plastic)
![GitHub](https://img.shields.io/github/license/shiny/handyacme?style=plastic)


![HandyAcme](https://user-images.githubusercontent.com/117487/183263478-c64b4a31-b5e1-43c1-9e31-6ff03e20ce46.svg)

[HandyACME API](https://shiny.github.io/HandyAcme/)

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

## License
MIT