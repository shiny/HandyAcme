import { createHash } from "crypto"
import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"
import { Authorization, isResponseAuthorization } from "../Authorization"
import { isResponseChallenge } from "../Challenge"
import { Order } from "../Order"
import { mockExampleCa } from "../__mocks__/ExampleCa"
import {
    exampleAuthorization,
    exampleAuthorizationUrl,
} from "../__mocks__/ExampleAuthorization"
import { exampleOrder } from "../__mocks__/ExampleOrder"

// DNS-PERSIST-01 has no token, unlike the three existing challenge methods.
const persistentChallenge = {
    type: "dns-persist-01",
    status: "pending",
    url: "https://example.com/chall/persist",
    "issuer-domain-names": ["letsencrypt.org"],
}
const dnsChallenge = exampleAuthorization.challenges.find(
    (challenge) => challenge.type === "dns-01",
)

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("order authorizations can sign and verify DNS-01 alongside DNS-PERSIST-01", async () => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [persistentChallenge, ...exampleAuthorization.challenges],
    })
    const ca = await mockExampleCa()
    const order = new Order(ca)
    order.data = {
        ...exampleOrder,
        status: "pending",
        authorizations: [exampleAuthorizationUrl],
    }

    const [authorization] = await order.authorizations()
    expect(authorization.identifierValue).toBe("example.com")
    expect(authorization.isPending).toBe(true)
    expect(isResponseAuthorization(authorization.data)).toBe(true)
    expect(authorization.challenges.map((challenge) => challenge.type)).toEqual(
        ["http-01", "dns-01"],
    )
    const thumbprint = await ca.account.exportJwkThumbprint()
    await expect(authorization.challengeDns.sign()).resolves.toBe(
        createHash("sha256")
            .update(`${dnsChallenge.token}.${thumbprint}`)
            .digest("base64url"),
    )
    await expect(authorization.challengeHttp.sign()).resolves.toBe(
        `${authorization.challengeHttp.token}.${thumbprint}`,
    )

    fetchMock.post(dnsChallenge.url, { ...dnsChallenge, status: "valid" })
    const challenge = authorization.challengeDns
    await challenge.verify()
    expect(challenge.isValid).toBe(true)
})

test("restores and refreshes wildcard authorizations with future challenge types", async () => {
    let status = "pending"
    fetchMock.post(exampleAuthorizationUrl, () => ({
        ...exampleAuthorization,
        wildcard: true,
        status,
        challenges: [
            dnsChallenge,
            { type: "future-method-01", futureField: { value: true } },
        ],
    }))
    const authorization = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(authorization.isWildcard).toBe(true)
    expect(authorization.challengeDns.token).toBe(dnsChallenge.token)
    status = "valid"
    await authorization.verify()
    expect(authorization.isValid).toBe(true)
    expect(authorization.challenges).toHaveLength(1)
})

test("never exposes unsupported methods as actionable challenges", async () => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [persistentChallenge],
    })
    const authorization = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(authorization.challenges).toEqual([])
    expect(authorization.challengeDns).toBeUndefined()
    expect(authorization.challengeHttp).toBeUndefined()
    expect(authorization.challengeTlsAlpn).toBeUndefined()
    expect(isResponseChallenge(persistentChallenge)).toBe(false)
})

test.each([
    { ...dnsChallenge, token: undefined },
    { ...dnsChallenge, url: 42 },
    { ...dnsChallenge, status: "unknown" },
    null,
    [],
    { status: "pending" },
    { type: "" },
    { type: "   " },
    { type: ["dns-persist-01"] },
])("still rejects malformed challenges: %j", async (invalid) => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [dnsChallenge, persistentChallenge, invalid],
    })
    await expect(
        Authorization.restore(await mockExampleCa(), exampleAuthorizationUrl),
    ).rejects.toThrow("Malformed authorization response")
})

test.each([
    { status: "unknown" },
    { wildcard: "yes" },
    { challenges: null },
    { challenges: {} },
])("still rejects malformed authorization fields: %j", async (invalid) => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [dnsChallenge, persistentChallenge],
        ...invalid,
    })
    await expect(
        Authorization.restore(await mockExampleCa(), exampleAuthorizationUrl),
    ).rejects.toThrow("Malformed authorization response")
})
