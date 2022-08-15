import { Account } from "../Account"
import { ExampleCa } from "./ExampleCa"

export const exampleAccountUrl = "https://example.com/acme/acct/evOfKhNU60wg"
export const accountCreatedResponse = {
    status: 200,
    body: {
        status: "valid",
        contact: ["mailto:cert-admin@example.org", "mailto:admin@example.org"],
        orders: "https://example.com/acme/acct/evOfKhNU60wg/orders",
    },
    headers: {
        location: exampleAccountUrl,
    },
}
export const exampleJwk = {
    kty: "EC",
    crv: "P-256",
    key_ops: ["sign"],
    ext: true,
    d: "A_Knb2RaxKUPLY7NyAd6PJm20hvjJM-g9PSi32_o1fw",
    x: "XGL3mSUyVBYCDHwJI5Lg7wkTBXTQxi63LuneLO9Gd4c",
    y: "6hXD8-rkpXbmekgDE3CKdukgi08sURqW7R7mbXlfDAM",
}
export const examplePublicJwk = {
    kty: "EC",
    crv: "P-256",
    key_ops: [],
    ext: true,
    x: "XGL3mSUyVBYCDHwJI5Lg7wkTBXTQxi63LuneLO9Gd4c",
    y: "6hXD8-rkpXbmekgDE3CKdukgi08sURqW7R7mbXlfDAM",
}
export const exampleEmail = "admin@example.com"

export class ExampleAccount extends Account {
    constructor() {
        super({
            ca: new ExampleCa(),
            email: exampleEmail,
        })
    }
    static async mockImport() {
        return await Account.import({
            email: exampleEmail,
            ca: new ExampleCa(),
            jwk: exampleJwk,
            accountUrl: exampleAccountUrl,
        })
    }
}
