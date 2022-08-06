import { Crypto } from "@peculiar/webcrypto"
import { sha256 } from "./Util"

// https://github.com/PeculiarVentures/webcrypto
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
const crypto = new Crypto()

export enum ALG {
    RS256 = "RS256",
    ES256 = "ES256",
}

const supportedAlgorithms = {
    [ALG.ES256]: {
        genParams: {
            name: "ECDSA",
            namedCurve: "P-256",
        },
        params: {
            name: "ECDSA",
            hash: "SHA-256",
        },
    },
    // RSASSA-PKCS1-v1_5 using SHA-256 
    [ALG.RS256]: {
        genParams: {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: 'SHA-256'
        },
        params: {
            name: "RSASSA-PKCS1-v1_5",
        },
    }
}

export class KeyPair {
    constructor(public alg: ALG, public keyPair: CryptoKeyPair) {}

    static async create(alg: ALG) {
        const algorithm = supportedAlgorithms[alg].genParams
        const extractable = true
        const keyUsages = ["sign"] as KeyUsage[]
        const keyPair = await crypto.subtle.generateKey(
            algorithm,
            extractable,
            keyUsages,
        )
        return new KeyPair(alg, keyPair)
    }

    static async importJwkKey(alg: ALG, jwk: JsonWebKey) {
        const algorithm = supportedAlgorithms[alg].genParams
        const extractable = true
        const publicJwk = { ...jwk }
        // https://stackoverflow.com/questions/72151096/how-to-derive-public-key-from-private-key-using-webcryptoapi/72153942#72153942
        // https://stackoverflow.com/questions/56807959/generate-public-key-from-private-key-using-webcrypto-api/57571350#57571350
        delete publicJwk.d
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            jwk,
            algorithm,
            extractable,
            ["sign"],
        )
        const publicKey = await crypto.subtle.importKey(
            "jwk",
            publicJwk,
            algorithm,
            extractable,
            [],
        )
        const keyPair = {
            privateKey,
            publicKey,
        }
        return new KeyPair(alg, keyPair)
    }

    async sign(string) {
        const alg = supportedAlgorithms[this.alg].params
        const signature = await crypto.subtle.sign(
            alg,
            this.keyPair.privateKey,
            Buffer.from(string),
        )
        return Buffer.from(signature).toString("base64url")
    }

    public async exportJwk(): Promise<JsonWebKey>
    public async exportJwk(format: "base64url"): Promise<string>
    public async exportJwk(format?: "base64url"): Promise<JsonWebKey | string> {
        const jwk = await crypto.subtle.exportKey("jwk", this.keyPair.publicKey)
        if (format === "base64url") {
            return Buffer.from(JSON.stringify(jwk)).toString("base64url")
        } else {
            return jwk
        }
    }

    /**
     * Jwk Thumbprint
     * https://datatracker.ietf.org/doc/html/rfc7638
     */
    async exportJwkThumbprint() {
        const jwk = await this.exportJwk()
        // JWK Members Used in the Thumbprint Computation
        // https://datatracker.ietf.org/doc/html/rfc7638#section-3.2
        const remainKeys = {
            [ALG.ES256]: ["crv", "kty", "x", "y"],
            [ALG.RS256]: ["e", "kty", "n"],
        }

        /* Sort keys */
        const sortedJwk = Object.keys(jwk)
            .sort()
            .reduce((result, k) => {
                if (remainKeys[this.alg].includes(k)) {
                    result[k] = jwk[k]
                }
                return result
            }, {})
        return sha256(JSON.stringify(sortedJwk))
    }

    async exportPrivateJwk() {
        return await crypto.subtle.exportKey("jwk", this.keyPair.privateKey)
    }
}
