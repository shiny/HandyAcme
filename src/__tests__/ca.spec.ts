import { Account, type ExternalAccount } from "../Account"
import { Ca } from "../Ca"
import { ExampleDirectory, exampleDirectoryResponse } from "./directory.spec"
jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox())
import fetchMock from "node-fetch"
import {
    exampleEmail,
    exampleJwk,
    exampleAccountUrl,
    accountCreatedResponse,
} from "./account.spec"
import { mockNewNonce } from "./authenticated-request.spec"
import { ErrorMalformedResponse } from "../Error"
import { exampleOrderResponse } from "./order.spec"
import { Order } from "../Order"
import {
    exampleAuthorization,
    exampleAuthorizationUrl,
} from "./authorization.spec"
import { Authorization } from "../Authorization"
import { exampleHttpChallenge } from "./challenage.spec"
import { Challenge } from "../Challenge"

const directory = new ExampleDirectory()

fetchMock.head(directory.newNonce, () => {
    return {
        status: 200,
        headers: {
            "replay-nonce": "example-nonce",
        },
    }
})

export async function mockExampleCa() {
    const ca = new ExampleCa()
    await ca.importAccount({
        email: exampleEmail,
        accountUrl: exampleAccountUrl,
        jwk: exampleJwk,
    })
    return ca
}

export class ExampleCa extends Ca {
    constructor() {
        super()
        this.directory = directory
        this.request.directory = directory
    }
    async getExternalAccount(_account: Account): Promise<ExternalAccount> {
        return {
            kid: "SuAqLb713TKpdsbZT0MjDQ",
            hmacKey:
                "lE6a4o_u0AloDGAmUXDpGustuK8kGjUZC9fPElUq3F78rQtBqsp-uLFg_5iarSOG4Q_pizy-vY1Ql8Mm6chCDw",
        }
    }
}

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("Ca Environment", async () => {
    const ca = new Ca()
    ca.productionDirectoryUrl = "https://example.com/production"
    ca.stagingDirectoryUrl = "https://example.com/staging"

    fetchMock.get(ca.productionDirectoryUrl, () => exampleDirectoryResponse)
    fetchMock.get(ca.stagingDirectoryUrl, () => {
        return {
            body: { invalid: true },
        }
    })

    await Promise.all([
        expect(ca.setProduction()).resolves,
        expect(ca.setStaging()).rejects.toThrowError(ErrorMalformedResponse),
    ])
    fetchMock.get(ca.stagingDirectoryUrl, () => exampleDirectoryResponse, {
        overwriteRoutes: true,
    })
    await expect(ca.setStaging()).resolves
})

test("Ca Create Account", async () => {
    const ca = new ExampleCa()

    fetchMock.post(ca.directory.newAccount, () => accountCreatedResponse)
    await ca.createAccount(exampleEmail)
    expect(ca.account.email).toBe(exampleEmail)
    expect(ca.account).toBeInstanceOf(Account)
})

test("Ca Export Account", async () => {
    const ca = new ExampleCa()
    await expect(ca.exportAccount()).rejects.toThrowError("initalized")
    ca.account = new Account({
        ca,
        email: exampleEmail,
    })
    await expect(ca.exportAccount()).rejects.toThrowError("initalized")
})

test("should implements getExternalAccount", async () => {
    const ca = new Ca()
    await expect(
        ca.getExternalAccount(
            new Account({
                ca,
                email: exampleEmail,
            }),
        ),
    ).rejects.toThrowError("not implemented")
})

test("Ca Create/Restore Order", async () => {
    const ca = await mockExampleCa()
    fetchMock.post(ca.directory.newOrder, exampleOrderResponse)
    const order = await ca.createOrder(["example.com"])
    expect(order).toBeInstanceOf(Order)
    expect(order.domains).toContain("example.com")

    fetchMock.post(order.url, exampleOrderResponse)
    const restoredOrder = await ca.restoreOrder(order.url)
    expect(restoredOrder).toBeInstanceOf(Order)
    expect(restoredOrder.domains).toContain("example.com")
})

test("Ca Restore Authorization", async () => {
    const ca = await mockExampleCa()

    fetchMock.post(exampleAuthorizationUrl, () => exampleAuthorization)
    const auth = await ca.restoreAuthorization(exampleAuthorizationUrl)
    expect(auth).toBeInstanceOf(Authorization)
    expect(auth.url).toBe(exampleAuthorizationUrl)
})

test("Ca Restore Challenge", async () => {
    const ca = await mockExampleCa()

    fetchMock.post(exampleHttpChallenge.url, () => exampleHttpChallenge)
    const challenge = await ca.restoreChallenge(exampleHttpChallenge.url)
    expect(challenge).toBeInstanceOf(Challenge)
    expect(challenge.url).toBe(exampleHttpChallenge.url)
    expect(challenge.token).toBe(exampleHttpChallenge.token)
})
