import { Account } from "../Account"
import { ExampleCa } from "./ca.spec"
import { mockNewNonce } from "./authenticated-request.spec"

jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox())
import fetchMock from "node-fetch"
import { ALG } from "../KeyPair"

export const exampleAccountUrl = "https://example.com/acme/acct/evOfKhNU60wg"
export const accountCreatedResponse = {
    status: 200,
    body: {
        status: "valid",
        contact: ["mailto:cert-admin@example.org", "mailto:admin@example.org"],
        orders: "https://example.com/acme/acct/evOfKhNU60wg/orders",
    },
    headers: {
        location: exampleAccountUrl,
    },
}
export const exampleJwk = {
    kty: "EC",
    crv: "P-256",
    key_ops: ["sign"],
    ext: true,
    d: "A_Knb2RaxKUPLY7NyAd6PJm20hvjJM-g9PSi32_o1fw",
    x: "XGL3mSUyVBYCDHwJI5Lg7wkTBXTQxi63LuneLO9Gd4c",
    y: "6hXD8-rkpXbmekgDE3CKdukgi08sURqW7R7mbXlfDAM",
}
export const examplePublicJwk = {
    kty: "EC",
    crv: "P-256",
    key_ops: [],
    ext: true,
    x: "XGL3mSUyVBYCDHwJI5Lg7wkTBXTQxi63LuneLO9Gd4c",
    y: "6hXD8-rkpXbmekgDE3CKdukgi08sURqW7R7mbXlfDAM",
}
export const exampleEmail = "admin@example.com"

export class ExampleAccount extends Account {
    constructor() {
        super({
            ca: new ExampleCa(),
            email: exampleEmail,
        })
    }
    static async mockImport() {
        return await Account.import({
            email: exampleEmail,
            ca: new ExampleCa(),
            jwk: exampleJwk,
            accountUrl: exampleAccountUrl,
        })
    }
}

let ca
beforeEach(() => {
    fetchMock.reset()
    ca = new ExampleCa()
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
