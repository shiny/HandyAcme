import { isObject, isString } from "./Util"

export class ErrorNotDiscovered extends Error {}

export interface ErrorDescription {
    type: string
    detail: string
    /**
     * status is not required in ACME (rfc8555)
     * Some Authority may not use `status` field
     * e.g. BuyPass use `code` 
     */
    status?: number
    code?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isErrorDescription(desc: any): desc is ErrorDescription {
    return (
        isObject(desc) &&
        isString([desc.type, desc.detail])
    )
}

export class ErrorResponse extends Error {
    public type: string
    public status?: number
    private desc: ErrorDescription

    constructor(desc: ErrorDescription) {
        super(desc.detail)
        this.desc = desc
        this.type = desc.type
        this.status = desc.status
    }

    toJSON() {
        return {
            type: this.type,
            message: this.desc.detail,
            status: this.desc.status || this.desc.code
        }
    }

    toString() {
        return `[${this.type}] ${this.message}`
    }
}

export class ErrorMalformedResponse extends Error {
    constructor(obj) {
        super("Response format was malformed: " + JSON.stringify(obj))
    }
}
