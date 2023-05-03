import { fetchMock, mockNewNonce } from "../__mocks__/Fetch"

import { Authorization } from "../Authorization"
import { convertFromPem } from "../Csr"
import { ErrorMalformedResponse } from "../Error"
import { isResponseOrder, isResponseOrderIdentifier, Order } from "../Order"
import { mockExampleCa } from "../__mocks__/ExampleCa"
import { exampleAuthorization } from "../__mocks__/ExampleAuthorization"
import {
    exampleFinalizeResult,
    exampleOrder,
    exampleOrderResponse,
    exampleOrderUrl,
} from "../__mocks__/ExampleOrder"

beforeEach(() => {
    fetchMock.reset()
    mockNewNonce()
})

test("isResponseOrder", () => {
    const obj = {
        status: "pending",
        expires: "2022-08-11T09:45:20Z",
        identifiers: [
            {
                type: "dns",
                value: "test1.keqin.tech",
            },
        ],
        authorizations: [
            "https://acme-v02.api.letsencrypt.org/acme/authz-v3/138190560796",
        ],
        finalize:
            "https://acme-v02.api.letsencrypt.org/acme/finalize/661604266/113013029716",
    }
    expect(isResponseOrder(obj)).toBeTruthy()
    const malformedOrder = Object.assign({}, obj, {
        status: "any other invalid status",
    })
    expect(isResponseOrder(malformedOrder)).toBeFalsy()
    expect(isResponseOrder(1)).toBeFalsy()
})

test("isResponseOrderIdentifier", () => {
    const identifier = {
        type: "dns",
        value: "test1.keqin.tech",
    }
    expect(isResponseOrderIdentifier(identifier)).toBeTruthy()

    const malformedIdentifier1 = {
        type: "any",
        value: "test1.keqin.tech",
    }
    const malformedIdentifier2 = {
        type: "dns",
    }
    expect(isResponseOrderIdentifier(malformedIdentifier1)).toBeFalsy()
    expect(isResponseOrderIdentifier(malformedIdentifier2)).toBeFalsy()
})

test("new Order", async () => {
    const domains = ["example.com", "*.example.com"]
    const ca = await mockExampleCa()
    fetchMock.post(ca.directory.newOrder, exampleOrderResponse)

    const order = await Order.create(ca, domains)
    expect(order.url).toBe(exampleOrderUrl)
    expect(order.finalizeUrl).toBe(exampleOrder.finalize)

    for (const authUrl of exampleOrder.authorizations) {
        fetchMock.post(authUrl, () =>
            Object.assign({}, exampleAuthorization, {
                url: authUrl,
            }),
        )
    }

    for (const auth of await order.authorizations()) {
        expect(auth).toBeInstanceOf(Authorization)
    }
})

test("new Order without url", async () => {
    const domains = ["example.com", "*.example.com"]
    const ca = await mockExampleCa()
    fetchMock.post(ca.directory.newOrder, () => exampleOrder)
    await expect(Order.create(ca, domains)).rejects.toThrowError("orderUrl")
})

test("Order Status", async () => {
    const domains = ["example.com", "*.example.com"]
    const ca = await mockExampleCa()
    fetchMock.post(ca.directory.newOrder, exampleOrderResponse)

    const order = await Order.create(ca, domains)
    order.data.status = "pending"
    expect(order.isPending).toBeTruthy()
    expect(order.isValid).toBeFalsy()

    order.data.status = "ready"
    expect(order.isReady).toBeTruthy()
    expect(order.isValid).toBeFalsy()

    order.data.status = "processing"
    expect(order.isProcessing).toBeTruthy()
    expect(order.isValid).toBeFalsy()

    order.data.status = "valid"
    expect(order.isValid).toBeTruthy()
    expect(order.isPending).toBeFalsy()

    order.data.status = "invalid"
    expect(order.isInvalid).toBeTruthy()
    expect(order.isPending).toBeFalsy()
})

test("Order ExpiredAt", async () => {
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, exampleOrderResponse)

    const order = await Order.restore(ca, exampleOrderUrl)
    expect(order.expiredAt).toEqual(new Date(exampleOrder.expires))
})

test("Order Restore", async () => {
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, exampleOrderResponse)

    const order = await Order.restore(ca, exampleOrderUrl)
    expect(order.certificateUrl).toBe(exampleOrder.certificate)
    expect(order.domains).toEqual(
        exampleOrder.identifiers.map((item) => item.value),
    )
})

test("Create CSR", async () => {
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, exampleOrderResponse)

    const order = await Order.restore(ca, exampleOrderUrl)
    const rsa = await order.csr("RSA")
    expect(rsa.privateKey).toContain("-----BEGIN PRIVATE KEY-----")
    expect(rsa.privateKey).toContain("-----END PRIVATE KEY-----")
    expect(rsa.csr).toContain("-----BEGIN CERTIFICATE REQUEST-----")
    expect(rsa.csr).toContain("-----END CERTIFICATE REQUEST-----")

    const ecdsa = await order.csr("ECDSA")
    expect(ecdsa.privateKey).toContain("-----BEGIN PRIVATE KEY-----")
    expect(ecdsa.privateKey).toContain("-----END PRIVATE KEY-----")
    expect(ecdsa.csr).toContain("-----BEGIN CERTIFICATE REQUEST-----")
    expect(ecdsa.csr).toContain("-----END CERTIFICATE REQUEST-----")
})

test("Order Finalize", async () => {
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, exampleOrderResponse)

    const order = await Order.restore(ca, exampleOrderUrl)
    const rsa = await order.csr("RSA")
    const targetCsr = convertFromPem(rsa.csr)
    fetchMock.post(order.finalizeUrl, (_url, options) => {
        const body = JSON.parse(options.body)
        const form = JSON.parse(
            Buffer.from(body.payload, "base64url").toString(),
        )
        expect(targetCsr).toBe(form?.csr)
        return {
            body: exampleFinalizeResult,
        }
    })
    await expect(order.finalize(rsa.csr)).resolves.toHaveProperty(
        "status",
        "valid",
    )
})

test("Order Malformed Response", async () => {
    const malformedResponse = Object.assign({}, exampleOrder, {
        status: "okk",
    })
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, malformedResponse)
    fetchMock.post(ca.directory.newOrder, () => {
        return {
            headers: {
                location: exampleOrderUrl,
            },
            body: malformedResponse,
        }
    })

    await Promise.all([
        expect(Order.restore(ca, exampleOrderUrl)).rejects.toThrowError(
            ErrorMalformedResponse,
        ),
        expect(Order.create(ca, ["example.com"])).rejects.toThrowError(
            ErrorMalformedResponse,
        ),
    ])
})

test("Download Certification", async () => {
    const certificationContent = "Certification content here"
    const UrlNotFound = "http://example.com/anyotherurl"
    const ca = await mockExampleCa()
    fetchMock.post(exampleOrderUrl, exampleOrderResponse)

    fetchMock.post(exampleOrder.certificate, (_url, options) => {
        expect(options.headers["Accept"]).toBe(
            "application/pem-certificate-chain",
        )

        return {
            body: certificationContent,
        }
    })

    fetchMock.post(UrlNotFound, () => 404)

    const order = await Order.restore(ca, exampleOrderUrl)
    await expect(order.downloadCertification()).resolves.toBe(
        certificationContent,
    )
    await expect(
        order.downloadCertification(UrlNotFound),
    ).rejects.toThrowError()
})
