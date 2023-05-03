import { ErrorResponse, isErrorDescription } from "./Error"
import fetch from "node-fetch"
import type { Response, RequestInfo, RequestInit } from "node-fetch"
import type { Agent } from "node:http"

export class SimpleRequest {
    public userAgent = "HandyAcme/1.0.0"
    public contentType = "application/json"

    // maximum redirect count. 0 to not follow redirect
    public follow = 20
    // req/res timeout in ms, it resets on redirect. 0 to disable (OS limit applies). Signal is recommended instead.
    public timeout = 0
    // support gzip/deflate content encoding. false to disable
    public compress = true
    // maximum response body size in bytes. 0 to disable
    public size = 0
    // http(s).Agent instance or function that returns an instance
    public agent: Agent

    get defaultFetchOption(): RequestInit {
        return {
            headers: {
                "User-Agent": this.userAgent,
                "Content-Type": this.contentType,
            },
            agent: this.agent,
            size: this.size,
            compress: this.compress,
            timeout: this.timeout,
            follow: this.follow,
        }
    }

    async fetch(url: RequestInfo, options?: RequestInit): Promise<Response> {
        const fetchOptions = Object.assign({}, this.defaultFetchOption, options)
        if (options?.headers) {
            fetchOptions.headers = Object.assign(
                {},
                this.defaultFetchOption.headers,
                options.headers,
            )
        }
        const res = await fetch(url, fetchOptions)
        if ([200, 201].includes(res.status)) {
            return res
        } else {
            const resCopy = await res.clone()
            const desc = await res.json()
            if (isErrorDescription(desc)) {
                throw new ErrorResponse(desc)
            } else {
                // https://github.com/node-fetch/node-fetch/issues/85
                const errorDescription = {
                    status: res.status,
                    statusText: res.statusText,
                    text: await resCopy.text(),
                }
                throw new Error(JSON.stringify(errorDescription))
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

export type { Response, RequestInfo, RequestInit }
