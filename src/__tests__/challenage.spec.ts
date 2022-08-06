import {
    Challenge,
    isResponseChallenge,
    type ResponseChallenge,
} from "../Challenge"
import { mockNewNonce } from "./authenticated-request.spec"
import { mockExampleCa } from "./ca.spec"
import { fetchMock } from "./simple-request.spec"

export const exampleHttpChallenge: ResponseChallenge = {
    type: "http-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPuHT1",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}

export const exampleDnsChallenge: ResponseChallenge = {
    type: "dns-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPuHTg",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}

export const exampleTlsAlpnChallenge: ResponseChallenge = {
    type: "tls-alpn-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPXHTg",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}

const malformedExampleHttpChallenge = Object.assign({}, exampleHttpChallenge, {
    status: "invalid-status",
})

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("isResponseChallenge", () => {
    expect(isResponseChallenge(1)).toBeFalsy()
    expect(isResponseChallenge(exampleHttpChallenge)).toBeTruthy()
    expect(isResponseChallenge(exampleDnsChallenge)).toBeTruthy()
    expect(isResponseChallenge(malformedExampleHttpChallenge)).toBeFalsy()
})

test("Challenge Status", async () => {
    fetchMock.post(exampleHttpChallenge.url, () => exampleHttpChallenge)

    const ca = await mockExampleCa()
    const challenge = await Challenge.restore(ca, exampleHttpChallenge.url)

    challenge.data.status = "valid"
    expect(challenge.isValid).toBeTruthy()
    expect(challenge.isInvalid).toBeFalsy()

    challenge.data.status = "invalid"
    expect(challenge.isInvalid).toBeTruthy()
    expect(challenge.isValid).toBeFalsy()

    challenge.data.status = "pending"
    expect(challenge.isPending).toBeTruthy()
    expect(challenge.isValid).toBeFalsy()

    challenge.data.status = "processing"
    expect(challenge.isProcessing).toBeTruthy()
    expect(challenge.isPending).toBeFalsy()
})

test("Http Challenge", async () => {
    fetchMock.post(exampleHttpChallenge.url, () => exampleHttpChallenge)

    const ca = await mockExampleCa()
    const challenge = await Challenge.restore(ca, exampleHttpChallenge.url)

    expect(challenge.url).toBe(exampleHttpChallenge.url)
    await expect(challenge.sign()).resolves.toBe(
        "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk.6If_IXv-j3pGhV-EK6C05PAnLOGYWIr4WEZlcDPS3YE",
    )
})

test("Dns Challenge", async () => {
    fetchMock.post(exampleDnsChallenge.url, () => exampleDnsChallenge)

    const ca = await mockExampleCa()
    const challenge = await Challenge.restore(ca, exampleDnsChallenge.url)

    expect(challenge.url).toBe(exampleDnsChallenge.url)
    await expect(challenge.sign()).resolves.toBe(
        "yA2dGkqN2PydigD-_fajBS0OzZMTPCvCh61VytccuMw",
    )
})

test("Dns Challenge", async () => {
    fetchMock.post(exampleTlsAlpnChallenge.url, () => exampleTlsAlpnChallenge)

    const ca = await mockExampleCa()
    const challenge = await Challenge.restore(ca, exampleTlsAlpnChallenge.url)

    expect(challenge.url).toBe(exampleTlsAlpnChallenge.url)
    await expect(challenge.sign()).rejects.toThrowError("not implemented")
})

test("Malformed Challenge", async () => {
    fetchMock.post(
        exampleHttpChallenge.url,
        () => malformedExampleHttpChallenge,
    )

    const ca = await mockExampleCa()
    const challenge = new Challenge(ca, exampleHttpChallenge)
    await Promise.all([
        expect(
            Challenge.restore(ca, exampleHttpChallenge.url),
        ).rejects.toThrowError("malformed"),
        expect(challenge.verify()).rejects.toThrowError("malformed"),
    ])
})

test("Challenge Verify", async () => {
    fetchMock.post(exampleHttpChallenge.url, () => exampleHttpChallenge)

    const ca = await mockExampleCa()
    const challenge = new Challenge(
        ca,
        Object.assign({}, exampleDnsChallenge, {
            url: exampleHttpChallenge.url,
        }),
    )
    await challenge.verify()
    expect(challenge.isVerifyByHttp01).toBeTruthy()
    expect(challenge.token).toBe(exampleHttpChallenge.token)
})
