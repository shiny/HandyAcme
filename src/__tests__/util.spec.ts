import {
    isEnum,
    isObject,
    isOptional,
    isOptionalBoolean,
    isOptionalString,
    isString,
    mergeDeep,
    sha256,
    stringifyToBase64url,
} from "../Util"

test("sha256", () => {
    expect(sha256("example", "hex")).toBe(
        "50d858e0985ecc7f60418aaf0cc5ab587f42c2570a884095a9e8ccacd0f6545c",
    )
    expect(sha256("example", "base64")).toBe(
        "UNhY4JhezH9gQYqvDMWrWH9CwlcKiECVqejMrND2VFw=",
    )
    expect(sha256("example", "base64url")).toBe(
        "UNhY4JhezH9gQYqvDMWrWH9CwlcKiECVqejMrND2VFw",
    )
    expect(sha256("example", "binary")).toBe(
        Buffer.from(
            "UNhY4JhezH9gQYqvDMWrWH9CwlcKiECVqejMrND2VFw=",
            "base64",
        ).toString("binary"),
    )
})

test("isObject", () => {
    expect(isObject({})).toBeTruthy()
    expect(isObject("")).toBeFalsy()
    expect(isObject(1)).toBeFalsy()
    expect(isObject([])).toBeFalsy()
})

test("isString", () => {
    expect(isString("")).toBeTruthy()
    expect(isString(["1", "2", "3"])).toBeTruthy()
    expect(isString(["1", "2", 3])).toBeFalsy()
    expect(isString({})).toBeFalsy()
    expect(isString(1)).toBeFalsy()
})

test("isEnum", () => {
    expect(isEnum("test", ["test", "test1"])).toBeTruthy()
    expect(isEnum("test2", ["test", "test1"])).toBeFalsy()
    expect(isEnum(1, ["1", "test1"])).toBeFalsy()
    expect(isEnum({}, ["test", "test1"])).toBeFalsy()
})

test("isOptional", () => {
    const obj = {
        a: 1,
        c: null,
    } as {
        a: number
        b?: string
        c?: string
    }
    expect(isOptional(obj.a)).toBeFalsy()
    expect(isOptional(obj.b)).toBeTruthy()
    expect(isOptional(obj.c)).toBeTruthy()
})

test("isOptionalString", () => {
    const obj = {
        a: 1,
        c: null,
        d: "1",
    } as {
        a: number
        b?: string
        c?: string
        d?: string
    }
    // isString
    expect(isOptionalString(obj.d)).toBeTruthy()
    expect(isOptionalString([obj.d])).toBeTruthy()
    // is undefined or null
    expect(isOptionalString(obj.c)).toBeTruthy()
    expect(isOptionalString(obj.b)).toBeTruthy()
    // others
    expect(isOptionalString(obj.a)).toBeFalsy()
    expect(isOptionalString([obj.a])).toBeFalsy()
    expect(isOptionalString([obj.a, obj.d])).toBeFalsy()
})

test("isOptionalBoolean", () => {
    const obj = {
        a: 1,
        c: null,
        d: false,
    } as {
        a: number
        b?: string
        c?: string
        d?: boolean
    }
    // is boolean
    expect(isOptionalBoolean(obj.d)).toBeTruthy()
    expect(isOptionalBoolean([obj.d])).toBeTruthy()
    // is undefined or null
    expect(isOptionalString(obj.c)).toBeTruthy()
    expect(isOptionalString(obj.b)).toBeTruthy()
    expect(isOptionalString([obj.b, obj.c])).toBeTruthy()
    // others
    expect(isOptionalString(obj.a)).toBeFalsy()
    expect(isOptionalString([obj.d, obj.a])).toBeFalsy()
})

test("mergeDeep", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target: Record<string, any> = {
        a: "a",
        b: {
            c: "c",
            g: {
                h: "h",
            },
        },
    }
    const source = {
        a: "b",
        b: {
            d: "d",
            g: {
                i: "i",
            },
        },
        e: "e",
        j: {
            k: "k",
        },
    }
    const result = mergeDeep(target, source)
    expect(target.a).toBe("b")
    expect(target.b.d).toBe("d")
    expect(target.b.c).toBe("c")
    expect(target.b.g.h).toBe("h")
    expect(target.b.g.i).toBe("i")
    expect(target.e).toBe("e")
    expect(target.j.k).toBe("k")

    expect(result.a).toBe("b")
    expect(result.b.d).toBe("d")
    expect(result.b.c).toBe("c")
    expect(result.b.g.h).toBe("h")
    expect(result.b.g.i).toBe("i")
    expect(result.e).toBe("e")
    expect(target.j.k).toBe("k")
})

test("stringifyToBase64url", () => {
    const obj = {
        x: "y",
        z: {
            x: "y",
        },
    }
    expect(stringifyToBase64url(obj)).toBe("eyJ4IjoieSIsInoiOnsieCI6InkifX0")
})
