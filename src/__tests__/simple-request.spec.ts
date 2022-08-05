import { SimpleRequest } from "../SimpleRequest"
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox())
import fetchMock from "node-fetch"
import { ErrorResponse } from "../Error";


afterEach(() => {
    fetchMock.reset()
});

test("userAgent", async () => {

    fetchMock.get('http://example.com', (url, options, request) => {
        if (options.headers['User-Agent'] === 'test/0.0.0') {
            return 200
        } else {
            return {
                status: 400,
                body: {
                    any: 'string'
                }
            }
        }
    })

    const request = new SimpleRequest()
    request.userAgent = "test/0.0.0"
    expect(request.defaultFetchOption.headers['User-Agent']).toBe('test/0.0.0')
    const res = await request.fetch("http://example.com")
    expect(res.status).toEqual(200)

    request.userAgent = "test/0.0.1"
    await expect(request.fetch("http://example.com")).rejects.toThrowError()
})


test("contentType", async () => {
    const error = {
        type: "urn:ietf:params:acme:error:malformed",
        detail: "Request payload did not parse as JSON",
        status: 400
    }
    fetchMock.get('http://example.com', (url, options, request) => {
        if (options.headers['Content-Type'] === 'text/plain') {
            return 200
        } else {
            return {
                status: 400,
                body: error
            }
        }
    })

    const request = new SimpleRequest()
    request.contentType = "text/plain"
    expect(request.defaultFetchOption.headers['Content-Type']).toBe('text/plain')

    const res = await request.get("http://example.com")
    expect(res.status).toEqual(200)

    request.contentType = "application/json"
    await expect(request.fetch("http://example.com")).rejects.toThrowError(ErrorResponse)


})

test("head", async () => {
    fetchMock.head("http://example.com", () => {
        return 201
    })
    const request = new SimpleRequest()
    const res = await request.head("http://example.com")
    expect(res.status).toBe(201)
})

test("SimepleRequest.fetch", async () => {
    fetchMock.get("http://example.com", () => {
        return 201
    })
    const res = await SimpleRequest.fetch("http://example.com")
    expect(res.status).toBe(201)
})