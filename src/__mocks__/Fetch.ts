// eslint-disable-next-line @typescript-eslint/no-var-requires -- require is necessary to mock
jest.mock("node-fetch", () => require("fetch-mock-jest").sandbox())
import fetch from "node-fetch"
import { exampleNonce } from "./ExampleAuthenticatedRequest"
import { ExampleDirectory } from "./ExampleDirectory"

export function mockNewNonce() {
    const directory = new ExampleDirectory()
    fetch.head(directory.newNonce, (_req) => {
        return {
            status: 200,
            headers: {
                "replay-nonce": exampleNonce,
            },
        }
    })
}

export const fetchMock = fetch
