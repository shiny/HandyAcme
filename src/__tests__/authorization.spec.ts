import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"

import { Authorization, isResponseAuthorization } from "../Authorization"
import { Challenge } from "../Challenge"
import { mockExampleCa } from "../__mocks__/ExampleCa"
import {
    exampleAuthorization,
    exampleAuthorizationUrl,
} from "../__mocks__/ExampleAuthorization"

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("create", async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)

    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.challengeDns).toBeInstanceOf(Challenge)
    expect(auth.challengeDns.url).toBe(
        "https://example.com/chall-v3/3253391304/LHutKA",
    )
    expect(auth.challengeHttp).toBeInstanceOf(Challenge)
    expect(auth.challengeHttp.url).toBe(
        "https://example.com/chall-v3/3253391304/kGxvWQ",
    )
    expect(auth.challengeTlsAlpn).toBeUndefined()
})

test('is Not Wildcard', async () => {
    fetchMock.post(exampleAuthorizationUrl, () => {
        return {
            ...exampleAuthorization,
            wildcard: null
        }
    })
    const authNotWildcatd = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl
    )
    expect(authNotWildcatd.isWildcard).toBeFalsy()
})

test('is Wildcard', async () => {
    fetchMock.post(exampleAuthorizationUrl, () => {
        return {
            ...exampleAuthorization,
            wildcard: true
        }
    })
    const authWildcard = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl
    )
    expect(authWildcard.isWildcard).toBeTruthy()
})
test('expiresAt', async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)

    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    // remove milliseconds part
    // '2016-03-02T21:54:00.000Z' to '2016-03-02T21:54:00Z'
    const dateISOStringWithoutMilliseconds = auth.expiresAt.toISOString().replace(/\.\d+Z/,'Z')
    expect(dateISOStringWithoutMilliseconds).toBe(exampleAuthorization.expires)
})

test('identifierType/identifierValue', async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)
    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.identifierType).toBe(exampleAuthorization.identifier.type)
    expect(auth.identifierValue).toBe(exampleAuthorization.identifier.value)

})

test("Malformed Response", async () => {
    const malformedAuthorization = Object.assign({}, exampleAuthorization, {
        status: "any",
    })
    fetchMock.post(exampleAuthorizationUrl, () => malformedAuthorization)
    await expect(
        Authorization.restore(await mockExampleCa(), exampleAuthorizationUrl),
    ).rejects.toThrowError("Malformed")
})

test("isResponseAuthorization", () => {
    expect(isResponseAuthorization(1)).toBeFalsy()
    expect(isResponseAuthorization(exampleAuthorization)).toBeTruthy()
})

test("challengeTlsAlpn", async () => {
    const obj = Object.assign({}, exampleAuthorization, {
        challenges: [
            {
                type: "tls-alpn-01",
                status: "pending",
                url: "https://example.com/chall-v3/3253391304/R-cT_Q",
                token: "sf6nXJsqYgOxOhdIR3wvjJRuEBfrr5GGZ-Acyr7Fb8Q",
            },
        ],
    })
    fetchMock.post(exampleAuthorizationUrl, () => obj)

    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.challengeTlsAlpn).toBeInstanceOf(Challenge)
    expect(auth.challengeTlsAlpn.url).toBe(
        "https://example.com/chall-v3/3253391304/R-cT_Q",
    )
})

test("status", async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)

    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )

    auth.data.status = "pending"
    expect(auth.isPending).toBeTruthy()
    expect(auth.isValid).toBeFalsy()
    auth.data.status = "valid"
    expect(auth.isValid).toBeTruthy()
    expect(auth.isInvalid).toBeFalsy()
    auth.data.status = "invalid"
    expect(auth.isInvalid).toBeTruthy()
    expect(auth.isValid).toBeFalsy()
    auth.data.status = "deactivated"
    expect(auth.isDeactivated).toBeTruthy()
    expect(auth.isPending).toBeFalsy()
    auth.data.status = "expired"
    expect(auth.isExpired).toBeTruthy()
    expect(auth.isPending).toBeFalsy()
    auth.data.status = "revoked"
    expect(auth.isRevoked).toBeTruthy()
    expect(auth.isValid).toBeFalsy()
})
