import { Authorization } from "./Authorization"
import type { Ca } from "./Ca"
import { createEcdsaCsr, createRsaCsr, isPEM, convertFromPem } from "./Csr"
import { ErrorMalformedResponse } from "./Error"
import { isEnum, isObject, isOptionalString, isString } from "./Util"

export interface ResponseOrderIdentifier {
    type: string
    value: string
}

export interface ResponseOrder {
    status: "pending" | "ready" | "processing" | "valid" | "invalid"
    expires: string
    identifiers: ResponseOrderIdentifier[]
    authorizations: string[]
    finalize: string
    certificate?: string
}

export function isResponseOrderIdentifier(obj): obj is ResponseOrderIdentifier {
    return isString([obj.type, obj.value]) && obj.type === "dns"
}

export function isResponseOrder(obj): obj is ResponseOrder {
    if (!isObject(obj)) {
        return false
    }
    return (
        isEnum(obj.status, [
            "pending",
            "ready",
            "processing",
            "valid",
            "invalid",
        ]) &&
        isString(obj.authorizations) &&
        isString(obj.finalize) &&
        isOptionalString(obj.certificate) &&
        Array.isArray(obj.identifiers) &&
        obj.identifiers.every(isResponseOrderIdentifier)
    )
}

export class Order {
    public url: string
    public data: ResponseOrder
    public domains: string[]

    constructor(protected ca: Ca) {}

    static async create(ca: Ca, domains: string[]) {
        const order = new Order(ca)
        await order.create(domains)
        return order
    }

    static async restore(ca: Ca, orderUrl: string) {
        const order = new Order(ca)
        await order.restore(orderUrl)
        return order
    }

    get status() {
        return this.data.status
    }

    get isPending() {
        return this.status === "pending"
    }

    get isReady() {
        return this.status === "ready"
    }

    get isProcessing() {
        return this.status === "processing"
    }

    get isValid() {
        return this.status === "valid"
    }

    get isInvalid() {
        return this.status === "invalid"
    }

    get finalizeUrl() {
        return this.data.finalize
    }

    get certificateUrl() {
        return this.data.certificate
    }

    get expiredAt() {
        return new Date(this.data.expires)
    }

    async create(domains: string[]) {
        this.domains = domains
        const payload = {
            identifiers: domains.map((domain) => {
                return {
                    type: "dns",
                    value: domain,
                }
            }),
        }
        const res = await this.ca.post(this.ca.directory.newOrder, payload)
        const orderUrl = res.headers.get("location")
        if (!orderUrl) {
            throw new Error("Can not get orderUrl")
        }
        this.url = orderUrl
        const obj = await res.json()
        if (isResponseOrder(obj)) {
            this.data = obj
        } else {
            throw new ErrorMalformedResponse(obj)
        }
    }

    async restore(url) {
        this.url = url
        await this.verify()
        this.domains = this.data.identifiers.map((item) => item.value)
    }

    async authorizations() {
        return Promise.all(
            this.data.authorizations.map((url) => {
                return Authorization.restore(this.ca, url)
            }),
        )
    }

    async csr(type: "RSA" | "ECDSA") {
        if (type === "ECDSA") {
            return createEcdsaCsr(this.domains, "pem")
        } else if (type === "RSA") {
            return createRsaCsr(this.domains, "pem")
        }
    }

    async verify() {
        const res = await this.ca.postAsGet(this.url)
        const obj = await res.json()
        if (isResponseOrder(obj)) {
            this.data = obj
        } else {
            throw new ErrorMalformedResponse(obj)
        }
    }

    async finalize(csr: string) {
        if (isPEM(csr)) {
            csr = convertFromPem(csr)
        }
        const res = await this.ca.post(this.finalizeUrl, {
            csr,
        })
        return res.json()
    }

    async downloadCertification(url?: string) {
        if (!url) {
            url = this.certificateUrl
        }
        const res = await this.ca.postAsGet(url, {
            headers: {
                Accept: "application/pem-certificate-chain",
            },
        })
        return res.text()
    }
}
