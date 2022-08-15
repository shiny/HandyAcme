import { fetchMock } from "../__mocks__/Fetch"

import { Account } from "../Account"
import ZeroSSL from "../ZeroSSL"
import { exampleEmail } from "../__mocks__/ExampleAccount"
import { URLSearchParams } from "url"

test("No staging mode in ZeroSSL", async () => {
    const zerossl = new ZeroSSL()
    await expect(zerossl.setStaging()).rejects.toThrowError("No staging mode")
})

test("getExternalAccount", async () => {
    const zerossl = new ZeroSSL()

    fetchMock.post(zerossl.eabFromEmailUrl, (_url, options) => {
        const form = new URLSearchParams(options.body)
        expect(form.get("email")).toBe(exampleEmail)
        return {
            body: {
                success: true,
                eab_kid: "1",
                eab_hmac_key: "2",
            },
        }
    })

    const eab = await zerossl.getExternalAccount(
        new Account({
            ca: zerossl,
            email: exampleEmail,
        }),
    )
    expect(eab).toHaveProperty("kid", "1")
    expect(eab).toHaveProperty("hmacKey", "2")

    fetchMock.post(
        zerossl.eabFromEmailUrl,
        () => ({
            success: false,
        }),
        {
            overwriteRoutes: true,
        },
    )

    await Promise.all([
        expect(
            zerossl.getExternalAccount(
                new Account({
                    ca: zerossl,
                    email: exampleEmail,
                }),
            ),
        ).rejects.toThrowError("failed to fetch"),

        expect(
            zerossl.getExternalAccount(
                new Account({
                    ca: zerossl,
                    email: "",
                }),
            ),
        ).rejects.toThrowError("email address"),
    ])

    fetchMock.reset()
})
