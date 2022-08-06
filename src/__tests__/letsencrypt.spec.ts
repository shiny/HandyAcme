import { Ca } from "../Ca"
import LetsEncrypt from "../LetsEncrypt"

test("Let's Encrypt", async () => {
    const le = new LetsEncrypt()
    expect(le).toBeInstanceOf(Ca)
})
