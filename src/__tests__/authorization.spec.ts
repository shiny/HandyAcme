import { Authorization } from "../Authorization"
import { Challenge } from "../Challenge"
import { mockNewNonce } from "./authenticated-request.spec"
import { mockExampleCa } from "./ca.spec"
import { fetchMock } from "./simple-request.spec"

export const exampleAuthorizationUrl = "https://example.com/authz/3250549274"
export const exampleAuthorization = {
    data: {
        identifier: { type: "dns", value: "example.com" },
        status: "pending",
        expires: "2022-08-13T10:39:35Z",
    },
    challenges: [
        {
            type: "http-01",
            status: "pending",
            url: "https://example.com/authz/3250549274/NPuHT1",
            token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
        },
        {
            type: "dns-01",
            status: "pending",
            url: "https://example.com/authz/3250549274/NPuHTg",
            token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
        },
    ],
    url: exampleAuthorizationUrl,
}

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("create", async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)

    const auth = await Authorization.create(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.challengeDns).toBeInstanceOf(Challenge)
    expect(auth.challengeDns.url).toBe(
        "https://example.com/authz/3250549274/NPuHTg",
    )
    expect(auth.challengeHttp).toBeInstanceOf(Challenge)
    expect(auth.challengeHttp.url).toBe(
        "https://example.com/authz/3250549274/NPuHT1",
    )
    expect(auth.challengeTlsAlpn).toBeUndefined()
})

test("challengeTlsAlpn", async () => {
    const obj = Object.assign({}, exampleAuthorization, {
        challenges: [
            {
                type: "tls-alpn-01",
                status: "pending",
                url: "https://example.com/authz/3250549274/NPuHTg",
                token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
            },
        ],
    })
    fetchMock.post(exampleAuthorizationUrl, () => obj)

    const auth = await Authorization.create(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.challengeTlsAlpn).toBeInstanceOf(Challenge)
    expect(auth.challengeTlsAlpn.url).toBe(
        "https://example.com/authz/3250549274/NPuHTg",
    )
})

test("status", async () => {
    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)

    const auth = await Authorization.create(
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
