import { Order, isResponseOrder, isResponseOrderIdentifier } from "../Order"

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
