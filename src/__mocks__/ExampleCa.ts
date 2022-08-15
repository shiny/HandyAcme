import type { Account, ExternalAccount } from "../Account"
import { Ca } from "../Ca"
import { exampleAccountUrl, exampleEmail, exampleJwk } from "./ExampleAccount"
import { ExampleDirectory } from "./ExampleDirectory"

const directory = new ExampleDirectory()

export async function mockExampleCa() {
    const ca = new ExampleCa()
    await ca.importAccount({
        email: exampleEmail,
        accountUrl: exampleAccountUrl,
        jwk: exampleJwk,
    })
    return ca
}

export class ExampleCa extends Ca {
    constructor() {
        super()
        this.directory = directory
        this.request.directory = directory
    }
    async getExternalAccount(_account: Account): Promise<ExternalAccount> {
        return {
            kid: "SuAqLb713TKpdsbZT0MjDQ",
            hmacKey:
                "lE6a4o_u0AloDGAmUXDpGustuK8kGjUZC9fPElUq3F78rQtBqsp-uLFg_5iarSOG4Q_pizy-vY1Ql8Mm6chCDw",
        }
    }
}
