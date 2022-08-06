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
    directory: Directory
    account: Account
    productionDirectoryUrl = ""
    stagingDirectoryUrl = ""

    async setStaging(): Promise<this> {
        const directory = await Directory.discover(this.stagingDirectoryUrl)
        this.directory = directory
        return this
    }

    async setProduction(): Promise<this> {
        const directory = await Directory.discover(this.productionDirectoryUrl)
        this.directory = directory
        return this
    }

    async createAccount(email: string) {
        this.account = await Account.create({
            ca: this,
            email,
        })
    }

    async importAccount({ email, accountUrl, jwk }: ImportAccountOptions) {
        this.account = await Account.import({
            email,
            ca: this,
            accountUrl,
            jwk,
        })
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
        const request = new AuthenticatedRequest({
            directory: this.directory,
            account: this.account,
        })
        return request.post(url, payload, options)
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
