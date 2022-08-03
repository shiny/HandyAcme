import { stringifyToBase64url } from "./Util"
import Directory from "./Directory"
import { ErrorNotDiscovered } from "./Error"
import Account from "./Account"
import SimpleRequest, {
    Response,
    RequestInfo,
    RequestInit,
} from "./SimpleRequest"

export interface JoseProtectedNewAccount {
    alg: string
    nonce: string
    url: string
    jwk: JsonWebKey
}

export interface JoseProtectedExistsAccount {
    alg: string
    nonce: string
    url: string
    kid: string
}

export type JoseProtected = JoseProtectedNewAccount | JoseProtectedExistsAccount

export default class AuthenticatedRequest extends SimpleRequest {
    protected defaultContentType = "application/jose+json"

    directory: Directory
    account: Account

    /**
     *
     * @param param0.directory
     * @param param0.account
     */
    constructor({ directory, account }) {
        super()
        this.directory = directory
        this.account = account
    }

    protected noncePool: string[] = []

    async nonce(): Promise<string> {
        if (!this.directory?.newNonce) {
            throw new ErrorNotDiscovered()
        }
        const nonce = this.noncePool.pop()
        if (nonce) {
            console.log("nonce from cache %s", nonce)
            return nonce
        } else {
            const res = await this.head(this.directory.newNonce)
            const nonce = res.headers.get("replay-nonce")
            if (!nonce) {
                throw new Error(`Failed to get "replay-nonce"`)
            }
            return nonce
        }
    }

    async prepareJoseProtected(url): Promise<JoseProtected> {
        const nonce = await this.nonce()
        const common = {
            alg: this.account.alg,
            nonce,
            url,
        }
        if (this.account.accountUrl) {
            return {
                ...common,
                kid: this.account.accountUrl,
            } as JoseProtectedExistsAccount
        } else {
            return {
                ...common,
                jwk: await this.account.exportJwk(),
            } as JoseProtectedNewAccount
        }
    }

    async fetch(url: RequestInfo, options?: RequestInit): Promise<Response> {
        return super.fetch(url, options)
    }

    async postAsGet(url) {
        return this.post(url)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async post(url, payload: any = undefined, options = {}) {
        const body = {
            protected: stringifyToBase64url(
                await this.prepareJoseProtected(url),
            ),
            payload: payload === undefined ? "" : stringifyToBase64url(payload),
            signature: "",
        }
        body.signature = await this.account.sign(
            `${body.protected}.${body.payload}`,
        )
        return this.fetch(url, {
            method: "POST",
            body: JSON.stringify(body),
            ...options,
        })
    }
}
