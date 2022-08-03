import KeyPair, { ALG } from "./KeyPair"
import Directory from "./Directory"
import AuthenticatedRequest from "./AuthenticatedRequest"

const defaultAlg = ALG.ES256

export interface CreateAccountOptions {
    directory: Directory
    email: string
}

export interface ImportAccountOptions extends CreateAccountOptions {
    jwk: JsonWebKey
    accountUrl: string
}

export default class Account {
    public accountUrl: string
    public directory: Directory
    protected keyPair: KeyPair
    public email: string

    constructor(options: CreateAccountOptions) {
        this.directory = options.directory
        this.email = options.email
    }

    get alg() {
        return this.keyPair.alg
    }

    get initialized() {
        return this.keyPair && !!this.accountUrl
    }

    get isExternalAccountRequired() {
        return this.directory.meta.externalAccountRequired
    }

    async sign(content: string): Promise<string> {
        return this.keyPair.sign(content)
    }

    async createKeyPair(alg?: ALG) {
        if (!alg) {
            alg = defaultAlg
        }
        this.keyPair = await KeyPair.create(defaultAlg)
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

    /**
     * Create a new account
     * @param options
     * @returns
     * @example
     *
     * await Account.create({
     *     email: 'test@example.com',
     *     directory: await Directory.discover()
     * })
     */
    static async create(options: CreateAccountOptions) {
        const account = new Account(options)
        await account.createKeyPair()
        const request = new AuthenticatedRequest({
            directory: options.directory,
            account,
        })
        const body = {
            termsOfServiceAgreed: true,
            contact: [`mailto:${options.email}`],
        }
        const res = await request.post(options.directory.newAccount, body)
        const accountUrl = res.headers.get("location")
        if (!accountUrl) {
            console.error(await res.json())
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
     *     directory: await Directory.discover(),
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
