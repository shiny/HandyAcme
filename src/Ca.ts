import Account from "./Account"
import Directory from "./Directory"
import AuthenticatedRequest from "./AuthenticatedRequest"
import Order from "./Order"
import Challenge from "./Challenge"

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
            directory: this.directory,
            email,
        })
    }

    async importAccount({ email, accountUrl, jwk }: ImportAccountOptions) {
        this.account = await Account.import({
            email,
            directory: this.directory,
            accountUrl,
            jwk,
        })
    }

    async exportAccount(): Promise<ImportAccountOptions> {
        if (!this.account.initialized) {
            throw new Error("Account did not initalized yet")
        }
        return {
            email: this.account.email,
            accountUrl: this.account.accountUrl,
            jwk: await this.account.exportPrivateJwk(),
        }
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

    async restoreChallenge(challengeUrl) {
        return Challenge.restore(this, challengeUrl)
    }
}
