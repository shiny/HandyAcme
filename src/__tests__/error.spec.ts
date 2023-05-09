import {
    ErrorMalformedResponse,
    ErrorResponse,
    isErrorDescription,
} from "../Error"

test("isErrorDescription", () => {
    const desc = {
        type: "urn:ietf:params:acme:error:malformed",
        detail: "Some of the identifiers requested were rejected",
    }
    expect(isErrorDescription(desc)).toBeTruthy()

    // missing detail
    const malformedDesc = {
        type: "urn:ietf:params:acme:error:malformed",
        status: 403,
    }
    expect(isErrorDescription(malformedDesc)).toBeFalsy()
})

test("ErrorResponse", () => {
    const desc = {
        type: "urn:ietf:params:acme:error:malformed",
        detail: "Some of the identifiers requested were rejected",
        status: 403,
    }
    expect(() => {
        throw new ErrorResponse(desc)
    }).toThrowError(desc.detail)
    try {
        throw new ErrorResponse(desc)
    } catch (err) {
        const errorString = err.toString()
        const errorObj = err.toJSON()
        expect(errorString).toContain(desc.type)
        expect(errorString).toContain(desc.detail)
        expect(errorObj.type).toBe(desc.type)
        expect(errorObj.message).toBe(desc.detail)
    }

})
test("BuyPass Error Code", () => {
    // BuyPass error code compatible
    const buyPassErrorDesc = {
        type: 'urn:ietf:params:acme:error:malformed',
        detail: 'Wildcard not supported, but *.any.host requested',
        code: 400,
        message: 'MALFORMED_BAD_REQUEST',
        details: 'HTTP 400 Bad Request'
    }
    try {
        throw new ErrorResponse(buyPassErrorDesc)
    } catch (err) {
        const errorObj = err.toJSON()
        expect(errorObj.status).toBe(buyPassErrorDesc.code)
    }
})

test("ErrorMalformedResponse", () => {
    expect(() => {
        throw new ErrorMalformedResponse({
            any: "val",
        })
    }).toThrowError(/malformed/)
})
