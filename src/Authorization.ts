import type { Ca } from "./Ca"
import {
    dnsPersistRecordName,
    type DnsPersistOptions,
    type DnsPersistRecord,
} from "./DnsPersist"
import type { ResponseChallenge } from "./Challenge"
import {
    isResponseChallenge,
    isSupportedChallengeType,
    Challenge,
} from "./Challenge"
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
        let obj = await res.json()
        // Ignore future challenge types before validating supported methods.
        // Keep malformed entries so they still fail the response validator.
        if (isObject(obj) && Array.isArray(obj.challenges)) {
            obj = {
                ...obj,
                challenges: obj.challenges.filter(
                    (challenge) =>
                        !isObject(challenge) ||
                        typeof challenge.type !== "string" ||
                        challenge.type.trim().length === 0 ||
                        isSupportedChallengeType(challenge.type),
                ),
            }
        }
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

    get challengeDnsPersist() {
        return this.challenges.find(
            (challenge) => challenge.isVerifyByDnsPersist01,
        )
    }

    dnsPersistRecord(options: DnsPersistOptions = {}): DnsPersistRecord {
        const challenge = this.challengeDnsPersist
        if (this.identifierType !== "dns" || !challenge)
            throw new Error("Authorization does not offer DNS-PERSIST-01")
        return {
            type: "TXT",
            name: dnsPersistRecordName(this.identifierValue),
            value: challenge.dnsPersistValue({
                ...options,
                wildcard: this.isWildcard || options.wildcard,
            }),
        }
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
