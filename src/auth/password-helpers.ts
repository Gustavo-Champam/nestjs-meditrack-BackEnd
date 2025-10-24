import * as bcrypt from "bcryptjs";
import * as argon2 from "argon2";

export async function verifyPasswordGeneric(plain: string, hashed: string): Promise<boolean> {
  if (!hashed) return false;
  try {
    // bcrypt ($2a/$2b/$2y)
    if (hashed.startsWith("$2a$") || hashed.startsWith("$2b$") || hashed.startsWith("$2y$")) {
      return await bcrypt.compare(plain, hashed);
    }
    // argon2
    if (hashed.startsWith("$argon2")) {
      return await argon2.verify(hashed, plain);
    }
    // fallback: tenta ambos
    return (await bcrypt.compare(plain, hashed)) || (await argon2.verify(hashed, plain).catch(() => false));
  } catch {
    return false;
  }
}




