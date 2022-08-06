jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox())
import fetchMock from "node-fetch"
import { AuthenticatedRequest } from "../AuthenticatedRequest"
import { Directory } from "../Directory"
import { ErrorNotDiscovered } from "../Error"
import { ExampleAccount } from "./account.spec"
import { ExampleDirectory } from "./directory.spec"

const directory = new ExampleDirectory()
export const exampleNonce = "example-nonce"
export function mockNewNonce() {
    fetchMock.head(directory.newNonce, (_req) => {
        return {
            status: 200,
            headers: {
                "replay-nonce": exampleNonce,
            },
        }
    })
}

export async function mockAuthenticatedRequest() {
    return new AuthenticatedRequest({
        directory,
        account: await ExampleAccount.mockImport(),
    })
}

export { fetchMock }

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

test("No nonce", async () => {
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
        directory,
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
