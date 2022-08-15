
import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"
import { AuthenticatedRequest } from "../AuthenticatedRequest"
import { Directory } from "../Directory"
import { ErrorNotDiscovered } from "../Error"
import { ExampleAccount } from "../__mocks__/ExampleAccount"
import { exampleNonce } from "../__mocks__/ExampleAuthenticatedRequest"
import { ExampleDirectory } from "../__mocks__/ExampleDirectory"

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("ErrorNotDiscovered", async () => {
    const directory = new Directory()
    const request = new AuthenticatedRequest({
        directory,
        account: new ExampleAccount(),
    })
    await expect(request.nonce()).rejects.toThrowError(new ErrorNotDiscovered())
})

test("nonce", async () => { 
    const directory = new ExampleDirectory()

    const request = new AuthenticatedRequest({
        directory,
        account: new ExampleAccount(),
    })
    await expect(request.nonce()).resolves.toBe(exampleNonce)
})

test("Nonce Cache", async () => { 
    const directory = new ExampleDirectory()

    const request = new AuthenticatedRequest({
        directory,
        account: await ExampleAccount.mockImport(),
    })
    const nonceCache1 = 'nonce cache 1'
    const nonceCache2 = 'nonce cache 2'
    request.noncePool.push(nonceCache1)
    await expect(request.nonce()).resolves.toBe(nonceCache1)

    const url = "http://example.com/postAsGet"
    fetchMock.post(url, (_url, req) => {
        return {
            headers: {
                'replay-nonce': nonceCache2
            },
            status: 200,
            body: req.body,
        }
    })
    await request.postAsGet(url)
    await expect(request.nonce()).resolves.toBe(nonceCache2)

})


test("No nonce", async () => {
    const directory = new ExampleDirectory()
    fetchMock.head(directory.newNonce, () => 200, {
        overwriteRoutes: true,
    })
    const request = new AuthenticatedRequest({
        directory,
        account: new ExampleAccount(),
    })
    await expect(request.nonce()).rejects.toThrow("replay-nonce")
})

test("postAsGet", async () => {
    const url = "http://example.com/postAsGet"
    fetchMock.post(url, (_url, req) => {
        return {
            status: 200,
            body: req.body,
        }
    })
    const request = new AuthenticatedRequest({
        directory: new ExampleDirectory(),
        account: await ExampleAccount.mockImport(),
    })
    const res = await request.postAsGet(url)
    const result = await res.json()
    expect(result).toHaveProperty(
        "protected",
        "eyJhbGciOiJFUzI1NiIsIm5vbmNlIjoiZXhhbXBsZS1ub25jZSIsInVybCI6Imh0dHA6Ly9leGFtcGxlLmNvbS9wb3N0QXNHZXQiLCJraWQiOiJodHRwczovL2V4YW1wbGUuY29tL2FjbWUvYWNjdC9ldk9mS2hOVTYwd2cifQ",
    )
    expect(result).toHaveProperty("payload", "")
    expect(result).toHaveProperty("signature")
})
