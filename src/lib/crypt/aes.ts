import { createCipheriv, createDecipheriv } from "crypto";
import { randomBytes } from "crypto";

// Generate random bytes if no key and iv are provided in .env file
// write them in .env file and use them for encryption and decryption
const checkSecrets = async () => {
  if (!process.env.SECRETS_AES_KEY || !process.env.SECRETS_AES_IV) {
    const key = randomBytes(32).toString("hex");
    const iv = randomBytes(16).toString("hex");

    process.env.SECRETS_AES_KEY = key;
    process.env.SECRETS_AES_IV = iv;

    // write them out
    console.log(`Created new AES key and IV: ${key}, ${iv}`);
    console.log("Please add them to your .env file");
    process.exit(0);
  }
};

class AESCipher {
  key: Buffer;
  iv: Buffer;

  constructor() {
    checkSecrets();
    this.key = Buffer.from(process.env.SECRETS_AES_KEY!, "hex");
    this.iv = Buffer.from(process.env.SECRETS_AES_IV!, "hex");
  }

  encrypt(text: string, algorithm = "aes-256-cbc") {
    const cipher = createCipheriv(algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  decrypt(encryptedData: string, algorithm = "aes-256-cbc") {
    const decipher = createDecipheriv(algorithm, this.key, this.iv);
    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

const aesCipher = new AESCipher();

export function encryptAes(
  text: string,
  algorithm = "aes-256-cbc"
): { value: string; algorithm: string } {
  return {
    value: aesCipher.encrypt(text, algorithm),
    algorithm: algorithm,
  };
}

export function decryptAes(
  text: string,
  algorithm = "aes-256-cbc"
): { value: string; algorithm: string } {
  return {
    value: aesCipher.decrypt(text, algorithm),
    algorithm: algorithm,
  };
}
