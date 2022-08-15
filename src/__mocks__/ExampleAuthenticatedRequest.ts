import { AuthenticatedRequest } from "../AuthenticatedRequest"
import { ExampleAccount } from "./ExampleAccount"
import { ExampleDirectory } from "./ExampleDirectory"
import { fetchMock } from "./Fetch"

const directory = new ExampleDirectory()
export const exampleNonce = "example-nonce"
export function mockNewNonce() {
    fetchMock.head(directory.newNonce, (_req) => {
        return {
            status: 200,
            headers: {
                "replay-nonce": exampleNonce,
            },
        }
    })
}

export async function mockAuthenticatedRequest() {
    return new AuthenticatedRequest({
        directory,
        account: await ExampleAccount.mockImport(),
    })
}
