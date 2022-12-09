import type { Ca } from "./Ca"
import type {
    ResponseChallenge
} from "./Challenge"
import { isResponseChallenge, Challenge } from "./Challenge"
import {
    isResponseOrderIdentifier,
    type ResponseOrderIdentifier,
} from "./Order"
import { isEnum, isObject, isOptionalBoolean, isOptionalString } from "./Util"

export interface ResponseAuthorization {
    identifier: ResponseOrderIdentifier
    status:
        | "pending"
        | "valid"
        | "invalid"
        | "deactivated"
        | "expired"
        | "revoked"
    expires: string
    challenges: ResponseChallenge[]
    wildcard?: boolean
}

export function isResponseAuthorization(obj): obj is ResponseAuthorization {
    if (!isObject(obj)) {
        return false
    }
    return (
        isResponseOrderIdentifier(obj.identifier) &&
        isEnum(obj.status, [
            "pending",
            "valid",
            "invalid",
            "deactivated",
            "expired",
            "revoked",
        ]) &&
        isOptionalString(obj.expires) &&
        isOptionalBoolean(obj.wildcard) &&
        Array.isArray(obj.challenges) &&
        obj.challenges.every(isResponseChallenge)
    )
}

export class Authorization {
    public data: ResponseAuthorization

    constructor(public ca, public url) {}

    get isPending() {
        return this.status === "pending"
    }

    get isValid() {
        return this.status === "valid"
    }

    get isInvalid() {
        return this.status === "invalid"
    }
    get isDeactivated() {
        return this.status === "deactivated"
    }
    get isExpired() {
        return this.status === "expired"
    }
    get isRevoked() {
        return this.status === "revoked"
    }

    get isWildcard(): boolean {
        return !!this.data.wildcard
    }

    get expiresAt(): Date {
        return new Date(this.data.expires)
    }

    get status() {
        return this.data.status
    }

    get identifierType(): string {
        return this.data.identifier.type
    }

    get identifierValue(): string {
        return this.data.identifier.value
    }

    static async restore(ca: Ca, url: string) {
        const auth = new Authorization(ca, url)
        await auth.verify()
        return auth
    }

    async verify() {
        const res = await this.ca.postAsGet(this.url)
        const obj = await res.json()
        if (isResponseAuthorization(obj)) {
            this.data = obj
        } else {
            throw new Error("Malformed authorization response")
        }
    }

    get challenges(): Challenge[] {
        return this.data.challenges.map(
            (challenge) => new Challenge(this.ca, challenge),
        )
    }

    get challengeDns() {
        return this.challenges.find((challenge) => challenge.isVerifyByDns01)
    }

    get challengeHttp() {
        return this.challenges.find((challenge) => challenge.isVerifyByHttp01)
    }

    get challengeTlsAlpn() {
        return this.challenges.find(
            (challenge) => challenge.isVerifyByTlsAlpn01,
        )
    }
}
