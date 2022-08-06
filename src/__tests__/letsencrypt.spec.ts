import { Ca } from "../Ca"
import Letsencrypt from "../Letsencrypt"

test("Let's Encrypt", async () => {
    const le = new Letsencrypt()
    expect(le).toBeInstanceOf(Ca)
})
