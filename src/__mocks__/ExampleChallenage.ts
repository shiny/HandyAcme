import { ResponseChallenge } from "../Challenge"

export const exampleHttpChallenge: ResponseChallenge = {
    type: "http-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPuHT1",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}

export const exampleDnsChallenge: ResponseChallenge = {
    type: "dns-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPuHTg",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}

export const exampleTlsAlpnChallenge: ResponseChallenge = {
    type: "tls-alpn-01",
    status: "pending",
    url: "https://example.com/authz/3250549274/NPXHTg",
    token: "Jyq2Kxs8rbwGOPAPMOiHMhj3X_Y9cjqYIDcuKss0tTk",
}
