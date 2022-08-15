import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"
import { Account } from "../Account"
import { Ca } from "../Ca"
import { exampleDirectoryResponse } from "../__mocks__/ExampleDirectory"
import {
    exampleEmail,
    accountCreatedResponse,
} from "../__mocks__/ExampleAccount"
import { ErrorMalformedResponse } from "../Error"
import { Order } from "../Order"
import { Authorization } from "../Authorization"
import { Challenge } from "../Challenge"
import { ExampleCa, mockExampleCa } from "../__mocks__/ExampleCa"
import {
    exampleAuthorization,
    exampleAuthorizationUrl,
} from "../__mocks__/ExampleAuthorization"
import { exampleOrderResponse } from "../__mocks__/ExampleOrder"
import { exampleHttpChallenge } from "../__mocks__/ExampleChallenage"

mockNewNonce()

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
