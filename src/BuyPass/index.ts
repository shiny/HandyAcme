import { Ca } from "../Ca"

export default class BuyPass extends Ca {
    name = 'BuyPass'
    productionDirectoryUrl = "https://api.buypass.com/acme/directory"
    stagingDirectoryUrl = "https://api.test4.buypass.no/acme/directory"
}
