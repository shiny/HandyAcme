import type { Ca } from "./Ca"
import Challenge, { ResponseChallenge } from "./Challenge"
import { ResponseOrderIdentifier } from "./Order"

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

export default class Authorization {
    public data

    constructor(public ca, public url) {}

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
