import { ErrorMalformedResponse, ErrorResponse, isErrorDescription } from "../Error"

test("isErrorDescription", () => {
    const desc = {
        type: 'urn:ietf:params:acme:error:malformed',
        detail: 'Some of the identifiers requested were rejected',
        status: 403
    }
    expect(isErrorDescription(desc)).toBeTruthy()

    // missing detail
    const malformedDesc = {
        type: 'urn:ietf:params:acme:error:malformed',
        status: 403
    }
    expect(isErrorDescription(malformedDesc)).toBeFalsy()
})

test("ErrorResponse", () => {
    const desc = {
        type: 'urn:ietf:params:acme:error:malformed',
        detail: 'Some of the identifiers requested were rejected',
        status: 403
    }
    expect(() => {
        throw new ErrorResponse(desc)
    }).toThrowError(desc.detail)
})

test("ErrorMalformedResponse", () => {
    expect(() => {
        throw new ErrorMalformedResponse({
            any: 'val'
        })
    }).toThrowError(/malformed/)
})
