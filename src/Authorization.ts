import type { Ca } from "./Ca"
import type { ResponseChallenge } from "./Challenge"
import { Challenge } from "./Challenge"
import type { ResponseOrderIdentifier } from "./Order"

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

export class Authorization {
    public data

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

    get status() {
        return this.data.status
    }

    static async create(ca: Ca, url: string) {
        const auth = new Authorization(ca, url)
        await auth.load()
        return auth
    }

    async load() {
        const res = await this.ca.postAsGet(this.url)
        this.data = await res.json()
    }

    get challenges() {
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
