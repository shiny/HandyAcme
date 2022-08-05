import { Ca } from "../Ca"

export default class extends Ca {
    productionDirectoryUrl = "https://acme-v02.api.letsencrypt.org/directory"
    stagingDirectoryUrl =
        "https://acme-staging-v02.api.letsencrypt.org/directory"
}
