import { domainToASCII } from "url"
import { isIP } from "net"

export interface DnsPersistOptions {
    issuerDomainName?: string
    wildcard?: boolean
    /** Optional UNIX expiry time, in seconds. Omit for standing authorization. */
    persistUntil?: number
}

export interface DnsPersistRecord {
    type: "TXT"
    name: string
    value: string
}

export function isDnsPersistIssuerName(value: unknown): value is string {
    return (
        typeof value === "string" &&
        value.length > 0 &&
        value.length <= 253 &&
        value === value.toLowerCase() &&
        domainToASCII(value) === value &&
        !isIP(value) &&
        value
            .split(".")
            .every((label) =>
                /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
            )
    )
}

export function isDnsPersistAccountUri(value: unknown): value is string {
    // A record parameter cannot contain a delimiter or unescaped whitespace.
    // Preserve the original URI: account identifiers use exact string matching.
    if (
        typeof value !== "string" ||
        !value ||
        value.length > 4096 ||
        /[^\x21-\x7e]|[;"\\]/.test(value)
    )
        return false
    try {
        const uri = new URL(value)
        return !uri.username && !uri.password && !uri.hash
    } catch {
        return false
    }
}

export function dnsPersistRecordName(domain: string): string {
    if (
        typeof domain !== "string" ||
        domain !== domain.trim() ||
        /[\s/:\\?#@%]/.test(domain)
    )
        throw new Error("Invalid DNS-PERSIST-01 domain")
    const name = domainToASCII(
        domain.replace(/^\*\./, "").replace(/\.$/, "").toLowerCase(),
    )
    if (
        !isDnsPersistIssuerName(name) ||
        name.length + "_validation-persist.".length > 253
    )
        throw new Error("Invalid DNS-PERSIST-01 domain")
    return `_validation-persist.${name}`
}

export function dnsPersistRecordValue(
    issuerDomainNames: string[],
    accountUri: string,
    options: DnsPersistOptions = {},
): string {
    if (
        !Array.isArray(issuerDomainNames) ||
        !issuerDomainNames.length ||
        issuerDomainNames.length > 10 ||
        !issuerDomainNames.every(isDnsPersistIssuerName)
    )
        throw new Error("Invalid DNS-PERSIST-01 issuer identities")
    if (!isDnsPersistAccountUri(accountUri))
        throw new Error(
            "A valid ACME account URI is required for DNS-PERSIST-01",
        )
    const issuer = options.issuerDomainName ?? issuerDomainNames[0]
    if (!issuerDomainNames.includes(issuer))
        throw new Error("DNS-PERSIST-01 issuer was not offered by the CA")
    if (options.wildcard !== undefined && typeof options.wildcard !== "boolean")
        throw new Error("Invalid DNS-PERSIST-01 wildcard policy")
    let value = `${issuer}; accounturi=${accountUri}`
    if (options.wildcard) value += "; policy=wildcard"
    if (options.persistUntil !== undefined) {
        if (
            !Number.isSafeInteger(options.persistUntil) ||
            options.persistUntil < 0
        )
            throw new Error("DNS-PERSIST-01 persistUntil must be UNIX seconds")
        value += `; persistUntil=${options.persistUntil}`
    }
    return value
}
