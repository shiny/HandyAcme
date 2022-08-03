import { mergeDeep } from "./Util"
import { ErrorResponse, isErrorDescription } from "./Error"
import fetch, { Response, RequestInfo, RequestInit } from "node-fetch"

export default class SimpleRequest {
    protected defaultUserAgent = "HandyAcme/1.0.0"
    protected defaultContentType = "application/json"

    get userAgent() {
        return this.defaultUserAgent
    }

    set userAgent(ua) {
        this.defaultUserAgent = ua
    }

    get contentType() {
        return this.defaultContentType
    }

    set contentType(contentType) {
        this.defaultContentType = contentType
    }

    get defaultFetchOption(): RequestInit {
        return {
            headers: {
                "User-Agent": this.userAgent,
                "Content-Type": this.contentType,
            },
        }
    }

    async fetch(url: RequestInfo, options?: RequestInit): Promise<Response> {
        const res = await fetch(
            url,
            mergeDeep({}, this.defaultFetchOption, options),
        )
        if ([200, 201].includes(res.status)) {
            return res
        } else {
            const desc = await res.json()
            if (isErrorDescription(desc)) {
                throw new ErrorResponse(desc)
            } else {
                throw new Error(JSON.stringify(res))
            }
        }
    }

    static async fetch(
        url: RequestInfo,
        options?: RequestInit,
    ): Promise<Response> {
        const request = new SimpleRequest()
        return request.fetch(url, options)
    }

    head(url: RequestInfo): Promise<Response> {
        return this.fetch(url, {
            method: "HEAD",
        })
    }

    async get(url: RequestInfo): Promise<Response> {
        return this.fetch(url)
    }
}

export { Response, RequestInfo, RequestInit }
