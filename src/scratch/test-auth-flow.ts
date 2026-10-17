import argon2 from "argon2";
import bcrypt from "bcryptjs";

async function testPasswordHash() {
  const plain = "12345678";
  console.log("Testing plain password:", plain);

  const hashedArgon2 = await argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
  console.log("Hashed Argon2:", hashedArgon2);

  const isValidArgon2 = await argon2.verify(hashedArgon2, plain);
  console.log("Is valid Argon2:", isValidArgon2);

  const hashedBcrypt = await bcrypt.hash(plain, 10);
  console.log("Hashed Bcrypt:", hashedBcrypt);

  const isValidBcrypt = await bcrypt.compare(plain, hashedBcrypt);
  console.log("Is valid Bcrypt:", isValidBcrypt);
}

testPasswordHash();
