import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"
import { mockExampleCa } from "../__mocks__/ExampleCa"
import { exampleAccountUrl } from "../__mocks__/ExampleAccount"
import {
    exampleAuthorization,
    exampleAuthorizationUrl,
} from "../__mocks__/ExampleAuthorization"
import { Authorization } from "../Authorization"
import {
    Challenge,
    isResponseChallenge,
    type ResponseDnsPersistChallenge,
} from "../Challenge"
import { dnsPersistRecordName, dnsPersistRecordValue } from "../DnsPersist"

const persist: ResponseDnsPersistChallenge = {
    type: "dns-persist-01",
    status: "pending",
    url: "https://example.com/challenge/persist",
    accounturi: exampleAccountUrl,
    "issuer-domain-names": ["letsencrypt.org", "ca.example.net"],
}

beforeEach(() => {
    jest.restoreAllMocks()
    fetchMock.reset()
    mockNewNonce()
})

test("loads a tokenless authorization, publishes the account-bound value and submits an empty challenge response", async () => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [persist],
    })
    fetchMock.post(persist.url, { ...persist, status: "valid" })
    const ca = await mockExampleCa()
    const auth = await Authorization.restore(ca, exampleAuthorizationUrl)
    const record = auth.dnsPersistRecord()
    expect(record).toEqual({
        type: "TXT",
        name: "_validation-persist.example.com",
        value: `letsencrypt.org; accounturi=${exampleAccountUrl}`,
    })
    expect(auth.challengeDns).toBeUndefined()
    expect(auth.challengeDnsPersist.isVerifyByDnsPersist01).toBe(true)
    expect(() => auth.challengeDnsPersist.token).toThrow("does not use")
    jest.spyOn(ca.account, "exportJwkThumbprint").mockRejectedValue(
        new Error("Must not hash a token"),
    )
    await expect(auth.challengeDnsPersist.sign()).resolves.toBe(record.value)
    const challenge = auth.challengeDnsPersist
    await challenge.verify()
    expect(challenge.isValid).toBe(true)
    const [, request] = fetchMock.lastCall(persist.url)
    const body = JSON.parse(String(request.body))
    expect(
        JSON.parse(Buffer.from(body.payload, "base64url").toString()),
    ).toEqual({})
    expect(
        JSON.parse(Buffer.from(body.protected, "base64url").toString()).kid,
    ).toBe(exampleAccountUrl)
    expect(challenge.dnsPersistValue()).toBe(record.value)
})

test("wildcard authorizations always include explicit wildcard policy at the base name", async () => {
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        wildcard: true,
        challenges: [persist],
    })
    const auth = await Authorization.restore(
        await mockExampleCa(),
        exampleAuthorizationUrl,
    )
    expect(auth.dnsPersistRecord({ wildcard: false })).toEqual({
        type: "TXT",
        name: "_validation-persist.example.com",
        value: `letsencrypt.org; accounturi=${exampleAccountUrl}; policy=wildcard`,
    })
})

test("a root and wildcard order can share one persistent value across renewals", async () => {
    const ca = await mockExampleCa()
    const root = new Authorization(ca, exampleAuthorizationUrl)
    root.data = {
        ...exampleAuthorization,
        status: "pending",
        identifier: { type: "dns", value: "example.com" },
        wildcard: false,
        challenges: [persist],
    }
    const wildcard = new Authorization(ca, exampleAuthorizationUrl)
    wildcard.data = {
        ...exampleAuthorization,
        status: "pending",
        identifier: { type: "dns", value: "example.com" },
        wildcard: true,
        challenges: [
            { ...persist, url: "https://example.com/challenge/renewed" },
        ],
    }
    expect(root.dnsPersistRecord({ wildcard: true })).toEqual(
        wildcard.dnsPersistRecord(),
    )
})

test("uses the registered account URL for deployed CAs that omit accounturi", async () => {
    const data = { ...persist }
    delete data.accounturi
    expect(isResponseChallenge(data)).toBe(true)
    const challenge = new Challenge(await mockExampleCa(), data)
    expect(challenge.dnsPersistValue()).toBe(
        `letsencrypt.org; accounturi=${exampleAccountUrl}`,
    )
})

test("honors the CA's advertised account identifier without normalizing it", async () => {
    const accounturi = "https://EXAMPLE.com/acme/acct/Case%2fSensitive?tenant=A"
    const challenge = new Challenge(await mockExampleCa(), {
        ...persist,
        accounturi,
    })
    expect(challenge.dnsPersistValue()).toBe(
        `letsencrypt.org; accounturi=${accounturi}`,
    )
})

test("selects only an offered issuer and supports an explicit UNIX expiration", async () => {
    const challenge = new Challenge(await mockExampleCa(), persist)
    expect(
        challenge.dnsPersistValue({
            issuerDomainName: "ca.example.net",
            wildcard: true,
            persistUntil: 1900000000,
        }),
    ).toBe(
        `ca.example.net; accounturi=${exampleAccountUrl}; policy=wildcard; persistUntil=1900000000`,
    )
    expect(() =>
        challenge.dnsPersistValue({ issuerDomainName: "attacker.example" }),
    ).toThrow("not offered")
})

test("refreshes tokenless challenge states and rejects malformed persistent responses", async () => {
    fetchMock.post(persist.url, { ...persist, status: "processing" })
    const challenge = await Challenge.restore(
        await mockExampleCa(),
        persist.url,
    )
    expect(challenge.isProcessing).toBe(true)
    fetchMock.post(
        persist.url,
        { ...persist, "issuer-domain-names": [] },
        { overwriteRoutes: true },
    )
    await expect(challenge.verify()).rejects.toThrow("malformed")
})

test.each([
    undefined,
    null,
    [],
    Array(11).fill("ca.example"),
    ["CA.example"],
    ["ca.example."],
    ["a".repeat(64) + ".example"],
    ["ca..example"],
    ["127.0.0.1"],
    ["ca.example; policy=wildcard"],
    ["例子.example"],
    ["-ca.example"],
    [["ca.example"]],
    [42],
])("rejects malformed persistent issuer identities: %j", async (issuers) => {
    const bad = { ...persist, "issuer-domain-names": issuers }
    expect(isResponseChallenge(bad)).toBe(false)
    fetchMock.post(exampleAuthorizationUrl, {
        ...exampleAuthorization,
        challenges: [bad],
    })
    await expect(
        Authorization.restore(await mockExampleCa(), exampleAuthorizationUrl),
    ).rejects.toThrow("Malformed authorization")
})

test.each([
    "",
    null,
    [],
    42,
    "not-a-uri",
    "https://example.com/acct/1; policy=wildcard",
    "https://example.com/acct/1\n",
    "https://u:p@example.com/acct/1",
    "https://example.com/acct/1#fragment",
])("rejects malformed accounturi: %j", (accounturi) => {
    expect(isResponseChallenge({ ...persist, accounturi })).toBe(false)
})

test.each([-1, 1.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1900000000"])(
    "rejects invalid expiration: %j",
    (persistUntil) => {
        expect(() =>
            dnsPersistRecordValue(["ca.example"], exampleAccountUrl, {
                persistUntil: persistUntil as number,
            }),
        ).toThrow("UNIX seconds")
    },
)

test.each([
    "",
    "https://example.com",
    "example.com/path",
    "example.com?x",
    "*.example.*",
    "127.0.0.1",
    "example.com ",
    "a".repeat(64) + ".example",
])("rejects invalid record names: %j", (domain) => {
    expect(() => dnsPersistRecordName(domain)).toThrow("Invalid")
})

test("normalizes IDNs, wildcard bases, and a terminal DNS dot", () => {
    expect(dnsPersistRecordName("*.EXAMPLE.com.")).toBe(
        "_validation-persist.example.com",
    )
    expect(dnsPersistRecordName("bücher.example")).toBe(
        "_validation-persist.xn--bcher-kva.example",
    )
})

test("requires a registered account when the CA omits its identifier", async () => {
    const ca = await mockExampleCa()
    ca.account.accountUrl = undefined
    const data = { ...persist }
    delete data.accounturi
    expect(() => new Challenge(ca, data).dnsPersistValue()).toThrow(
        "account URI",
    )
})
