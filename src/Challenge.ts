import type { Ca } from "./Ca"
import { isEnum, isObject, isString, sha256 } from "./Util"

export interface ResponseChallenge {
    type: "http-01" | "dns-01" | "tls-alpn-01"
    status: "pending" | "processing" | "valid" | "invalid"
    url: string
    token: string
    // The time at which the server validated this challenge
    validated?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any
}

export function isResponseChallenge(obj): obj is ResponseChallenge {
    if (!isObject(obj)) {
        return false
    }
    return (
        isEnum(obj.type, ["http-01", "dns-01", "tls-alpn-01"]) &&
        isEnum(obj.status, ["pending", "processing", "valid", "invalid"]) &&
        isString(obj.url) &&
        isString(obj.token)
    )
}

export class Challenge {
    constructor(protected ca: Ca, public data: ResponseChallenge) {}

    get isPending() {
        return this.status === "pending"
    }

    get isProcessing() {
        return this.status === "processing"
    }

    get isValid() {
        return this.status === "valid"
    }

    get isInvalid() {
        return this.status === "invalid"
    }

    get isVerifyByDns01() {
        return this.data.type === "dns-01"
    }

    get isVerifyByHttp01() {
        return this.data.type === "http-01"
    }

    get isVerifyByTlsAlpn01() {
        return this.data.type === "tls-alpn-01"
    }

    get type() {
        return this.data.type
    }

    get status() {
        return this.data.status
    }

    get url() {
        return this.data.url
    }

    get token() {
        return this.data.token
    }

    static async restore(ca: Ca, url: string) {
        const res = await ca.post(url, {})
        const obj = await res.json()
        if (isResponseChallenge(obj)) {
            return new Challenge(ca, obj)
        } else {
            throw new Error(
                "Challenge response was malformed: " + JSON.stringify(obj),
            )
        }
    }

    async verify() {
        const res = await this.ca.post(this.data.url, {})
        const obj = await res.json()
        if (isResponseChallenge(obj)) {
            this.data = obj
        } else {
            throw new Error(
                "Challenge response was malformed: " + JSON.stringify(obj),
            )
        }
    }

    async sign() {
        const jwkThumbprint = await this.ca.account.exportJwkThumbprint()
        const signString = `${this.token}.${jwkThumbprint}`
        if (this.isVerifyByHttp01) {
            return signString
        } else if (this.isVerifyByDns01) {
            return sha256(signString)
        } else {
            throw new Error(
                `Challenge type ${this.data.type} is not implemented`,
            )
        }
    }
}
