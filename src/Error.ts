import { isObject, isString } from "./Util"

export class ErrorNotDiscovered extends Error {}

export interface ErrorDescription {
    type: string
    detail: string
    status: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isErrorDescription(desc: any): desc is ErrorDescription {
    return (
        isObject(desc) &&
        isString([desc.type, desc.detail]) &&
        Number.isInteger(desc.status)
    )
}

export class ErrorResponse extends Error {
    public type: string
    public status: number

    constructor(desc: ErrorDescription) {
        super(desc.detail)
        this.type = desc.type
        this.status = desc.status
    }
}

export class ErrorMalformedResponse extends Error {
    constructor(obj) {
        super("Response format was malformed: " + JSON.stringify(obj))
    }
}
