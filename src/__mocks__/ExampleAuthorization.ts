export const exampleAuthorizationUrl = "https://example.com/authz/3250549274"
export const exampleAuthorization = {
    identifier: { type: "dns", value: "example.com" },
    status: "pending",
    expires: "2022-08-13T16:34:55Z",
    challenges: [
        {
            type: "http-01",
            status: "pending",
            url: "https://example.com/chall-v3/3253391304/kGxvWQ",
            token: "sf6nXJsqYgOxOhdIR3wvjJRuEBfrr5GGZ-Acyr7Fb8Q",
        },
        {
            type: "dns-01",
            status: "pending",
            url: "https://example.com/chall-v3/3253391304/LHutKA",
            token: "sf6nXJsqYgOxOhdIR3wvjJRuEBfrr5GGZ-Acyr7Fb8Q",
        },
    ],
}
