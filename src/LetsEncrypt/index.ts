import { Ca } from "../Ca"

export default class extends Ca {
    name = 'LetsEncrypt'
    productionDirectoryUrl = "https://acme-v02.api.letsencrypt.org/directory"
    stagingDirectoryUrl =
        "https://acme-staging-v02.api.letsencrypt.org/directory"
}
