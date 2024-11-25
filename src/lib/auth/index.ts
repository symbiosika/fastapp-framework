import { eq } from "drizzle-orm";
import { sessions, users } from "../db/db-schema";
import { getDb } from "../db/db-connection";
import jwt from "jsonwebtoken";
import type { UsersEntity } from "../types/shared/db/users";
import {
  sendMagicLink,
  sendVerificationEmail,
  verifyEmail,
  verifyMagicLink,
} from "./magic-link";
import { _GLOBAL_SERVER_CONFIG } from "../..";

const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || "";

export const saltAndHashPassword = async (
  password: string
): Promise<string> => {
  const hash = await Bun.password.hash(password);
  return hash;
};

const getUserFromDb = async (
  email: string,
  password: string
): Promise<UsersEntity> => {
  // no-role-check necessary here
  try {
    const user = await getDb()
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (user.length === 0 || !user[0].password) {
      throw "user not found";
    }

    if (!user[0].emailVerified) {
      // send verification email again
      await sendVerificationEmail(email);
      throw "Email is not verified.";
    }

    const isMatch = await Bun.password.verify(password, user[0].password + "");

    if (isMatch) {
      return user[0];
    } else {
      throw "passwords do not match";
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const setUserInDb = async (
  email: string,
  password: string,
  sendMailAfterRegister: boolean
) => {
  const hash = await saltAndHashPassword(password);

  const user = await getDb()
    .insert(users)
    .values({
      email: email,
      password: hash,
      firstname: "",
      surname: "",
      extUserId: "",
      salt: "",
      emailVerified: false,
    })
    .returning()
    .catch((err) => {
      throw "Email already exists. " + err;
    });

  // send verification email
  if (sendMailAfterRegister) {
    await sendVerificationEmail(email).catch((err) => {
      throw "Error sending verification email. " + err;
    });
  }

  return user[0];
};

export const generateJwt = async (user: UsersEntity, expiresIn: number) => {
  // use same keys as Auth0 here

  const token = jwt.sign(
    { email: user.email, sub: user.id, symbiosika: { roles: [] } },
    JWT_PRIVATE_KEY,
    { expiresIn }
  );
  return {
    token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
};

const checkAndCreateSession = async (email: string, password: string) => {
  const user = await getUserFromDb(email, password);

  const { token, expiresAt } = await generateJwt(
    user,
    _GLOBAL_SERVER_CONFIG.jwtExpiresAfter
  );
  const session = await getDb()
    .insert(sessions)
    .values({
      sessionToken: "",
      userId: user.id,
      expires: expiresAt.toISOString(),
    })
    .onConflictDoUpdate({
      target: sessions.sessionToken,
      set: {
        expires: expiresAt.toISOString(),
      },
    })
    .returning();
  return { token, expiresAt };
};

export const LocalAuth = {
  async authorize(email: string, password: string) {
    return await getUserFromDb(email, password);
  },

  async register(
    email: string,
    password: string,
    sendVerificationEmail: boolean
  ) {
    return await setUserInDb(email, password, sendVerificationEmail);
  },

  async login(email: string, password: string) {
    return await checkAndCreateSession(email, password);
  },

  async loginWithMagicLink(token: string) {
    return await verifyMagicLink(token);
  },

  async sendMagicLink(email: string) {
    return await sendMagicLink(email);
  },

  async sendVerificationEmail(email: string) {
    return await sendVerificationEmail(email);
  },

  async verifyEmail(token: string) {
    return await verifyEmail(token);
  },
};
