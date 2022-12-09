import { Account, type ExternalAccount } from "./Account"
import { Directory } from "./Directory"
import { AuthenticatedRequest } from "./AuthenticatedRequest"
import { Order } from "./Order"
import { Challenge } from "./Challenge"
import { Authorization } from "./Authorization"

interface ImportAccountOptions {
    email: string
    accountUrl: string
    jwk: JsonWebKey
}

export class Ca {
    name: string
    directory: Directory
    account: Account
    productionDirectoryUrl = ""
    stagingDirectoryUrl = ""
    request: AuthenticatedRequest
    env: "staging" | "production"

    constructor() {
        this.request = new AuthenticatedRequest({
            directory: null,
            account: null,
        })
    }

    async setStaging(): Promise<this> {
        this.env = "staging"
        return this.setDirectory(this.stagingDirectoryUrl)
    }

    async setProduction(): Promise<this> {
        this.env = "production"
        return this.setDirectory(this.productionDirectoryUrl)
    }

    async setDirectory(directoryUrl): Promise<this> {
        this.directory = new Directory()
        this.directory.request = this.request
        this.request.directory = this.directory
        await this.directory.discover(directoryUrl)
        return this
    }

    async createAccount(email: string) {
        const account = await Account.create({
            ca: this,
            email,
        })
        this.setAccount(account)
    }

    async importAccount({ email, accountUrl, jwk }: ImportAccountOptions) {
        const account = await Account.import({
            email,
            ca: this,
            accountUrl,
            jwk,
        })
        this.setAccount(account)
    }

    setAccount(account: Account) {
        this.account = account
        this.request.account = account
    }

    async exportAccount(): Promise<ImportAccountOptions> {
        if (!this.account?.initialized) {
            throw new Error("Account did not initalized yet")
        }
        return {
            email: this.account.email,
            accountUrl: this.account.accountUrl,
            jwk: await this.account.exportPrivateJwk(),
        }
    }

    async getExternalAccount(_account: Account): Promise<ExternalAccount> {
        throw new Error(`getExternalAccount did not implemented`)
    }

    async postAsGet(url, options = {}) {
        return this.post(url, undefined, options)
    }

    async post(url, payload, options = {}) {
        return this.request.post(url, payload, options)
    }

    async createOrder(domains: string[]) {
        return Order.create(this, domains)
    }

    async restoreOrder(orderUrl) {
        return Order.restore(this, orderUrl)
    }

    async restoreAuthorization(authorizationUrl) {
        return Authorization.restore(this, authorizationUrl)
    }

    async restoreChallenge(challengeUrl) {
        return Challenge.restore(this, challengeUrl)
    }
}
