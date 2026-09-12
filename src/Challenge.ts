import type { Ca } from "./Ca"
import { isEnum, isObject, sha256 } from "./Util"
import {
    dnsPersistRecordValue,
    isDnsPersistIssuerName,
    isDnsPersistAccountUri,
    type DnsPersistOptions,
} from "./DnsPersist"

export interface ResponseChallengeBase {
    status: "pending" | "processing" | "valid" | "invalid"
    url: string
    // The time at which the server validated this challenge
    validated?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any
}

export interface ResponseTokenChallenge extends ResponseChallengeBase {
    type: "http-01" | "dns-01" | "tls-alpn-01"
    token: string
}

export interface ResponseDnsPersistChallenge extends ResponseChallengeBase {
    type: "dns-persist-01"
    token?: never
    "issuer-domain-names": string[]
    // Older deployed CAs omit this field. Their registered account URL is valid.
    accounturi?: string
}

export type ResponseChallenge =
    | ResponseTokenChallenge
    | ResponseDnsPersistChallenge

export function isSupportedChallengeType(
    type: unknown,
): type is ResponseChallenge["type"] {
    return isEnum(type, ["http-01", "dns-01", "tls-alpn-01", "dns-persist-01"])
}

export function isResponseChallenge(obj): obj is ResponseChallenge {
    if (!isObject(obj)) {
        return false
    }
    if (
        !isSupportedChallengeType(obj.type) ||
        !isEnum(obj.status, ["pending", "processing", "valid", "invalid"]) ||
        typeof obj.url !== "string" ||
        !obj.url
    )
        return false
    if (obj.type === "dns-persist-01") {
        const issuers = obj["issuer-domain-names"]
        return (
            Array.isArray(issuers) &&
            issuers.length > 0 &&
            issuers.length <= 10 &&
            issuers.every(isDnsPersistIssuerName) &&
            (obj.accounturi === undefined ||
                isDnsPersistAccountUri(obj.accounturi))
        )
    }
    return typeof obj.token === "string" && obj.token.length > 0
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

    get isVerifyByDnsPersist01() {
        return this.data.type === "dns-persist-01"
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

    get token(): string {
        if (this.data.type === "dns-persist-01")
            throw new Error("DNS-PERSIST-01 does not use a challenge token")
        return this.data.token
    }

    dnsPersistValue(options: DnsPersistOptions = {}): string {
        if (this.data.type !== "dns-persist-01")
            throw new Error("Challenge is not DNS-PERSIST-01")
        return dnsPersistRecordValue(
            this.data["issuer-domain-names"],
            this.data.accounturi ?? this.ca.account.accountUrl,
            options,
        )
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

    async sign(options: DnsPersistOptions = {}) {
        if (this.isVerifyByDnsPersist01) return this.dnsPersistValue(options)
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
