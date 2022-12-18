import type { Ca } from "./Ca"

import BuyPass from "./BuyPass"
import LetsEncrypt from "./LetsEncrypt"
import ZeroSSL from "./ZeroSSL"

export * from "./Account"
export * from "./AuthenticatedRequest"
export * from "./Authorization"
export * from "./Ca"
export * from "./Challenge"
export * from "./Csr"
export * from "./Directory"
export * from "./Error"
export * from "./KeyPair"
export * from "./Order"
export * from "./SimpleRequest"
export * from "./Util"

export default class HandyAcme {
    static async create(
        ca: "LetsEncrypt" | "ZeroSSL" | "BuyPass",
        type: "staging" | "production" | "none" = "production",
    ) {
        const Acme = (await import(`./${ca}`)).default
        const acme: Ca = new Acme()
        if (type === "staging") {
            return acme.setStaging()
        } else if (type === "production") {
            return acme.setProduction()
        } else {
            return acme
        }
    }
}

export { LetsEncrypt, ZeroSSL, BuyPass }
