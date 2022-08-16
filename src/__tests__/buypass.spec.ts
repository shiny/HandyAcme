import { Ca } from "../Ca"
import BuyPass from "../BuyPass"

test("Let's Encrypt", async () => {
    const bp = new BuyPass()
    expect(bp).toBeInstanceOf(Ca)
})
