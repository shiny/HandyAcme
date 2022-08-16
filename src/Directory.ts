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
    request: SimpleRequest

    constructor(url = "") {
        if (url) {
            this.directoryUrl = url
        }
    }

    static async discover(url) {
        const directory = new Directory()
        return directory.discover(url)
    }

    async discover(url = "") {
        if (url) {
            this.directoryUrl = url
        }
        if (!this.request) {
            this.request = new SimpleRequest()
        }
        const res = await this.request.fetch(url)
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
            this.newNonce = newNonce
            this.newAccount = newAccount
            this.newOrder = newOrder
            this.revokeCert = revokeCert
            this.keyChange = keyChange
            this.meta = meta || {}
            return this
        } else {
            throw new ErrorMalformedResponse(obj)
        }
    }
}
