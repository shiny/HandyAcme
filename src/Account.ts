import { KeyPair, ALG } from "./KeyPair"
import { AuthenticatedRequest } from "./AuthenticatedRequest"
import type { Ca } from "./Ca"
import { hmac, stringifyToBase64url } from "./Util"

const defaultAlg = ALG.ES256

export interface CreateAccountOptions {
    ca: Ca
    email: string
}

export interface ImportAccountOptions extends CreateAccountOptions {
    jwk: JsonWebKey
    accountUrl: string
}

export interface ExternalAccount {
    kid: string
    hmacKey: string
}

interface EABProtected {
    alg: string
    kid: string
    url: string
}

interface ExternalAccountBinding {
    // base64url encoding of the stringified EABProtected
    protected: string
    // base64url encoding of the stringified JSONWebKey
    payload: string
    signature: string
}

interface BodyCreateAccount {
    termsOfServiceAgreed: boolean
    contact: string[]
    externalAccountBinding?: ExternalAccountBinding
}

export class Account {
    public accountUrl: string
    public ca: Ca
    protected keyPair: KeyPair
    public email: string

    constructor(options: CreateAccountOptions) {
        this.ca = options.ca
        this.email = options.email
    }

    get alg() {
        return this.keyPair.alg
    }

    get initialized() {
        return this.keyPair && !!this.accountUrl
    }

    get isExternalAccountRequired() {
        return this.ca.directory.meta.externalAccountRequired
    }

    async sign(content: string): Promise<string> {
        return this.keyPair.sign(content)
    }

    async createKeyPair(alg?: ALG) {
        if (!alg) {
            alg = defaultAlg
        }
        this.keyPair = await KeyPair.create(alg)
    }

    async importJwk(alg: ALG, jwk: JsonWebKey) {
        this.keyPair = await KeyPair.importJwkKey(alg, jwk)
    }

    async exportJwk(): Promise<JsonWebKey> {
        return this.keyPair.exportJwk()
    }

    async exportPrivateJwk() {
        return this.keyPair.exportPrivateJwk()
    }

    async exportJwkThumbprint(): Promise<string> {
        return this.keyPair.exportJwkThumbprint()
    }

    async createExternalAccountBinding() {
        const { kid, hmacKey }: ExternalAccount =
            await this.ca.getExternalAccount(this)
        const eabProtected: EABProtected = {
            alg: "HS256",
            kid,
            url: this.ca.directory.newAccount,
        }
        const eab: ExternalAccountBinding = {
            payload: await this.keyPair.exportJwk("base64url"),
            protected: stringifyToBase64url(eabProtected),
            signature: "",
        }
        const signString = `${eab.protected}.${eab.payload}`
        eab.signature = hmac(hmacKey, signString, "base64url")
        return eab
    }

    /**
     * Create a new account
     * @param options
     * @returns
     * @example
     * const le = new Letsencrypt()
     * await le.setStaging()
     * await Account.create({
     *     email: 'test@example.com',
     *     ca: le
     * })
     */
    static async create(options: CreateAccountOptions) {
        const account = new Account(options)
        await account.createKeyPair()
        const request = new AuthenticatedRequest({
            directory: options.ca.directory,
            account,
        })
        const body: BodyCreateAccount = {
            termsOfServiceAgreed: true,
            contact: [`mailto:${options.email}`],
        }
        if (account.isExternalAccountRequired) {
            body.externalAccountBinding =
                await account.createExternalAccountBinding()
        }
        const res = await request.post(options.ca.directory.newAccount, body)
        const accountUrl = res.headers.get("location")
        if (!accountUrl) {
            throw new Error("can not get accountUrl")
        }
        account.accountUrl = accountUrl
        return account
    }

    /**
     * Import account from Json Web Key
     * @param options
     * @returns
     * @example
     *
     * await Account.import({
     *     email: 'test@example.com',
     *     ca: le,
     *     jwk: {...},
     *     accountUrl: 'https://example.com/acme/acct/evOfKhNU60wg'
     * })
     */
    static async import(options: ImportAccountOptions) {
        const account = new Account(options)
        account.accountUrl = options.accountUrl
        await account.importJwk(defaultAlg, options.jwk)
        return account
    }
}
