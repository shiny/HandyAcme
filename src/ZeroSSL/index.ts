import type { Account, ExternalAccount } from "../Account"
import { Ca } from "../Ca"
import { SimpleRequest } from "../SimpleRequest"

export default class extends Ca {
    productionDirectoryUrl = "https://acme.zerossl.com/v2/DV90/directory"
    eabFromEmailUrl = "https://api.zerossl.com/acme/eab-credentials-email"

    setStaging(): never {
        throw new Error("No staging mode in ZeroSSL")
    }

    async getExternalAccount(account: Account): Promise<ExternalAccount> {
        if (!account.email) {
            throw new Error(
                "require email address to fetch external account credentials",
            )
        }
        const form = new URLSearchParams()
        form.append("email", account.email)

        const res = await SimpleRequest.fetch(this.eabFromEmailUrl, {
            method: "POST",
            body: form.toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        })
        const {
            success,
            error,
            eab_kid: kid,
            eab_hmac_key: hmacKey,
        } = await res.json()

        if (!success) {
            throw new Error(
                "failed to fetch external account credentials: " +
                    JSON.stringify(error),
            )
        }

        return {
            kid,
            hmacKey,
        }
    }
}
