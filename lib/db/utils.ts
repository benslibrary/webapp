import { genSaltSync, hashSync } from "bcrypt-ts";
import { nanoid } from "nanoid";

export function generateHashedPassword(password: string) {
  const salt = genSaltSync(10);
  return hashSync(password, salt);
}

export function generateDummyPassword() {
  return generateHashedPassword(nanoid());
}
