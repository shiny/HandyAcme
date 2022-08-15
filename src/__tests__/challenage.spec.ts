import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"

import {
    Challenge,
    isResponseChallenge,
} from "../Challenge"
import { mockExampleCa } from "../__mocks__/ExampleCa"
import { exampleDnsChallenge, exampleHttpChallenge, exampleTlsAlpnChallenge } from "../__mocks__/ExampleChallenage"


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
