
export const exampleOrderUrl = "https://example.com/order/63534994/3527102614"
export const exampleOrder = {
    status: "pending",
    expires: "2022-08-05T10:00:13Z",
    identifiers: [
        { type: "dns", value: "example.com" },
        { type: "dns", value: "*.example.com" },
    ],
    authorizations: [
        "https://example.com/authz/3166415814",
        "https://example.com/authz/3166415824",
    ],
    finalize: "https://example.com/finalize/62584554/3411423254",
    certificate:
        "https://example.com/cert/fa0651f1f73b5484d9fa97f2c559f38585e4",
}

export const exampleFinalizeResult = {
    status: "valid",
    expires: "2022-08-13T13:29:19Z",
    identifiers: [{ type: "dns", value: "example.com" }],
    authorizations: ["https://example.com/authz/3166415814"],
    finalize: "https://example.com/finalize/63544074/3528857884",
    certificate:
        "https://example.com/cert/fa0651f1f73b5484d9fa97f2c559f38585e4",
}

export const exampleOrderResponse = () => {
    return {
        headers: {
            location: exampleOrderUrl,
        },
        body: exampleOrder,
    }
}
