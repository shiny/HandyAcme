import type { Account, ExternalAccount } from "../Account"
import { Ca } from "../Ca"
import { ExampleDirectory } from "./directory.spec"
jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox())
import fetchMock from "node-fetch"
import { exampleEmail, exampleJwk, exampleAccountUrl } from "./account.spec"

const directory = new ExampleDirectory()

fetchMock.head(directory.newNonce, () => {
    return {
        status: 200,
        headers: {
            "replay-nonce": "example-nonce",
        },
    }
})

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
    }
    async getExternalAccount(_account: Account): Promise<ExternalAccount> {
        return {
            kid: "SuAqLb713TKpdsbZT0MjDQ",
            hmacKey:
                "lE6a4o_u0AloDGAmUXDpGustuK8kGjUZC9fPElUq3F78rQtBqsp-uLFg_5iarSOG4Q_pizy-vY1Ql8Mm6chCDw",
        }
    }
}
