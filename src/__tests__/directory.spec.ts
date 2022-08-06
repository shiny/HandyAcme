import { fetchMock } from "./simple-request.spec"
import { Directory, isDirectoryResponse } from "../Directory"
import { ErrorMalformedResponse } from "../Error"

const directoryUrl = "https://example.com/directory"
const newNonce = "https://example.com/newNonce"
const newAccount = "https://example.com/newAccount"
const newOrder = "https://example.com/newOrder"
const revokeCert = "https://example.com/revokeCert"
const keyChange = "https://example.com/keyChange"
const meta = {
    externalAccountRequired: true,
}

export class ExampleDirectory {
    directoryUrl = directoryUrl
    newNonce = newNonce
    newAccount = newAccount
    newOrder = newOrder
    revokeCert = revokeCert
    keyChange = keyChange
    meta = meta
}

export const exampleDirectoryResponse = {
    newNonce,
    newAccount,
    newOrder,
    revokeCert,
    keyChange,
    meta,
}

const malformedDirectoryResponse = Object.assign({}, exampleDirectoryResponse, {
    meta: 123,
})

afterEach(() => fetchMock.reset())

test("discover", async () => {
    fetchMock.get(directoryUrl, () => exampleDirectoryResponse)

    const directory = await Directory.discover(directoryUrl)
    expect(directory.directoryUrl).toBe(directoryUrl)
    expect(directory.keyChange).toBe(keyChange)
    expect(directory.meta).toEqual(meta)
    expect(directory.newAccount).toBe(newAccount)
    expect(directory.newNonce).toBe(newNonce)
    expect(directory.newOrder).toBe(newOrder)
    expect(directory.revokeCert).toBe(revokeCert)
})

test("Initialize Empty Meta", async () => {
    const res = Object.assign({}, exampleDirectoryResponse)
    delete res.meta
    fetchMock.get(directoryUrl, () => res)
    const directory = await Directory.discover(directoryUrl)
    expect(directory.meta).toEqual({})
})

test("isDirectoryResponse", () => {
    expect(isDirectoryResponse(exampleDirectoryResponse)).toBeTruthy()
    expect(isDirectoryResponse(malformedDirectoryResponse)).toBeFalsy()
    expect(
        isDirectoryResponse(
            Object.assign({}, exampleDirectoryResponse, {
                meta: undefined,
            }),
        ),
    ).toBeTruthy()
})

test("Malformed Directory Response", async () => {
    const mailformedDirectryUrl = "https://example.com/malformed-directory"
    fetchMock.get(mailformedDirectryUrl, () => malformedDirectoryResponse)
    await expect(
        Directory.discover(mailformedDirectryUrl),
    ).rejects.toThrowError(
        new ErrorMalformedResponse(malformedDirectoryResponse),
    )
})
