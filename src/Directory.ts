import { ErrorMalformedResponse } from "./Error"
import { SimpleRequest } from "./SimpleRequest"
import { isObject, isOptionalBoolean, isOptionalString, isString } from "./Util"

export interface Meta {
    termsOfService?: string
    website?: string
    caaIdentities?: string[]
    externalAccountRequired?: boolean
}

export interface DirectoryResponse {
    newNonce: string
    newAccount: string
    newOrder: string
    revokeCert: string
    renewalInfo?: string
    keyChange: string
    meta?: Meta
}

export function isMeta(obj): obj is Meta {
    if (!isObject(obj)) {
        return false
    }
    return (
        isOptionalString([obj.termsOfService, obj.website]) &&
        isOptionalString(obj.caaIdentities) &&
        isOptionalBoolean(obj.externalAccountRequired)
    )
}

export function isDirectoryResponse(obj): obj is DirectoryResponse {
    if (obj.meta && !isMeta(obj.meta)) {
        return false
    }
    return (
        isString([
            obj.newNonce,
            obj.newAccount,
            obj.newOrder,
            obj.revokeCert,
            obj.keyChange,
        ]) && isOptionalString([obj.renewalInfo])
    )
}

export class Directory {
    directoryUrl: string

    newNonce: string
    newAccount: string
    newOrder: string
    revokeCert: string
    keyChange: string
    meta: Meta

    static async discover(url) {
        const directory = new Directory()
        directory.directoryUrl = url
        const res = await SimpleRequest.fetch(url)
        const obj = await res.json()
        if (isDirectoryResponse(obj)) {
            const {
                newNonce,
                newAccount,
                newOrder,
                revokeCert,
                keyChange,
                meta,
            }: DirectoryResponse = obj
            directory.newNonce = newNonce
            directory.newAccount = newAccount
            directory.newOrder = newOrder
            directory.revokeCert = revokeCert
            directory.keyChange = keyChange
            directory.meta = meta || {}
            return directory
        } else {
            throw new ErrorMalformedResponse(obj)
        }
    }
}
