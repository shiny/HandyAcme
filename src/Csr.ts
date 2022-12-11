import * as x509 from "@peculiar/x509"
import { Crypto } from "@peculiar/webcrypto"
import { PemConverter } from "@peculiar/x509"

type format = "pem" | "base64" | "base64url" | "hex"

const crypto = new Crypto()
x509.cryptoProvider.set(crypto)

function chunkString(str: string, limit = 64) {
    const reg = new RegExp(`.{1,${limit}}`, "g")
    return str.match(reg).join("\n")
}

async function exportPEM(keys: CryptoKeyPair) {
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", keys.privateKey)
    const keyString = Buffer.from(pkcs8).toString("base64")
    return (
        "-----BEGIN PRIVATE KEY-----\n" +
        chunkString(keyString) +
        "\n" +
        "-----END PRIVATE KEY-----"
    )
}

export function isPEM(data: string): data is string {
    return PemConverter.isPem(data)
}

export function convertFromPem(pem: string, format: format = "base64url") {
    const csr: ArrayBuffer = PemConverter.decodeFirst(pem)
    return Buffer.from(csr).toString(format as BufferEncoding)
}

export async function createEcdsaCsr(
    domains: string[],
    csrFormat: format = "pem",
) {
    const ecdsaAlg = {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: "SHA-256",
    }
    return await createCsr({
        alg: ecdsaAlg,
        domains,
        csrFormat,
    })
}

export async function createRsaCsr(
    domains: string[],
    csrFormat: format = "pem",
) {
    const rsaAlg = {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
        publicExponent: new Uint8Array([1, 0, 1]),
        modulusLength: 2048,
    }
    return await createCsr({
        alg: rsaAlg,
        domains,
        csrFormat,
    })
}

async function createKey(alg: RsaHashedKeyGenParams | EcKeyGenParams) {
    return await crypto.subtle.generateKey(alg, true, ["sign", "verify"])
}

interface CreateCsrParams {
    alg: RsaHashedKeyGenParams | EcKeyGenParams
    domains: string[]
    csrFormat: "pem" | "base64" | "base64url" | "hex"
}

async function createCsr({ alg, domains, csrFormat }: CreateCsrParams) {
    const keys = await createKey(alg)
    const privateKey = await exportPEM(keys)
    const csr = await x509.Pkcs10CertificateRequestGenerator.create({
        keys,
        signingAlgorithm: alg,
        extensions: [
            new x509.KeyUsagesExtension(
                x509.KeyUsageFlags.digitalSignature |
                    x509.KeyUsageFlags.keyEncipherment,
            ),
            new x509.SubjectAlternativeNameExtension(domains.map(domain => {
                return {
                    type: 'dns',
                    value: domain
                } as x509.JsonGeneralName
            })),
        ],
        attributes: [],
    })
    return {
        privateKey,
        csr: csr.toString(csrFormat),
    }
}
