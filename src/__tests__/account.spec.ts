
import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"
import { Account } from "../Account"
import { ExampleCa } from "../__mocks__/ExampleCa"
import { ALG } from "../KeyPair"
import { accountCreatedResponse, ExampleAccount, exampleAccountUrl, exampleEmail, exampleJwk, examplePublicJwk } from "../__mocks__/ExampleAccount"

mockNewNonce()
let ca = new ExampleCa()

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("Create Account", async () => {
    fetchMock.post(ca.directory.newAccount, (_req) => accountCreatedResponse)

    const account = await Account.create({
        email: exampleEmail,
        ca,
    })
    expect(account.isExternalAccountRequired).toBeTruthy()
    expect(account.accountUrl).toBe(exampleAccountUrl)
})

test("Create Account Failed", async () => {
    const failedResponse = Object.assign({}, accountCreatedResponse, {
        headers: {},
    })

    fetchMock.post(ca.directory.newAccount, (_req) => failedResponse)

    await expect(
        Account.create({
            email: exampleEmail,
            ca,
        }),
    ).rejects.toThrow()
})

test("Create Account KeyPair", async () => {
    const account = new ExampleAccount()
    expect(account.initialized).toBeFalsy()

    await account.createKeyPair(ALG.RS256)
    const rsa = await account.exportPrivateJwk()
    expect(rsa.kty).toBe("RSA")
    expect(rsa.alg).toBe("RS256")

    await account.createKeyPair(ALG.ES256)
    const ec = await account.exportPrivateJwk()
    expect(ec.kty).toBe("EC")
    expect(ec.crv).toBe("P-256")
})

test("Import Account", async () => {
    const account = await Account.import({
        email: exampleEmail,
        ca,
        jwk: exampleJwk,
        accountUrl: exampleAccountUrl,
    })
    expect(account.initialized).toBeTruthy()
    await Promise.all([
        expect(account.sign("example")).resolves.not.toBe(""),
        expect(account.exportPrivateJwk()).resolves.toEqual(exampleJwk),
        expect(account.exportJwkThumbprint()).resolves.toBe(
            "6If_IXv-j3pGhV-EK6C05PAnLOGYWIr4WEZlcDPS3YE",
        ),
        expect(account.exportJwk()).resolves.toEqual(examplePublicJwk),
    ])
})
