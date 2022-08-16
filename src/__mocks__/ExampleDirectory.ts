import { Directory } from "../Directory"

export const directoryUrl = "https://example.com/directory"
export const newNonce = "https://example.com/newNonce"
export const newAccount = "https://example.com/newAccount"
export const newOrder = "https://example.com/newOrder"
export const revokeCert = "https://example.com/revokeCert"
export const keyChange = "https://example.com/keyChange"
export const meta = {
    externalAccountRequired: true,
}

export class ExampleDirectory extends Directory {
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
