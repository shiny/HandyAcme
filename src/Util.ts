import { BinaryToTextEncoding, createHash } from "crypto"

// Deep Merge
// https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item)
}

export function isString(str) {
    if (Array.isArray(str) && str.length > 0) {
        return str.every(isString)
    }
    return typeof str === "string"
}

export function isEnum(str, types: string[]): str is string {
    return isString(str) && types.includes(str)
}

export function isOptional(val): val is null | undefined {
    if (val === undefined) {
        return true
    } else if (val === null) {
        return true
    } else {
        return false
    }
}

export function isOptionalString(str) {
    if (Array.isArray(str)) {
        return str.every(isOptionalString)
    }
    return isOptional(str) || isString(str)
}

export function isOptionalBoolean(val) {
    if (Array.isArray(val)) {
        return val.every(isOptionalBoolean)
    }
    return isOptional(val) || typeof val === "boolean"
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
    if (!sources.length) return target
    const source = sources.shift()

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} })
                mergeDeep(target[key], source[key])
            } else {
                Object.assign(target, { [key]: source[key] })
            }
        }
    }

    return mergeDeep(target, ...sources)
}

/**
 * JSON.stringify and convert encoding to base64url
 * `base64url(json.stringify(obj))`
 *
 * @param obj
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyToBase64url(obj: any) {
    return Buffer.from(JSON.stringify(obj), "utf8").toString("base64url")
}

export function sha256(
    signString: string,
    format: BinaryToTextEncoding = "base64url",
) {
    return createHash("sha256").update(signString).digest(format)
}
