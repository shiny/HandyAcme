import { Ca } from "../Ca"

export default class extends Ca {
    productionDirectoryUrl = "https://acme.zerossl.com/v2/DV90/directory"

    setStaging(): never {
        throw new Error("No staging mode in ZeroSSL")
    }
}
