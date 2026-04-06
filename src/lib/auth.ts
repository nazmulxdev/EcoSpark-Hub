import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { config } from "../config/env";
import { Role, UserStatus } from "../generated/prisma/enums";

export const auth = betterAuth({
  baseURL: "https://ecospark-hub.vercel.app",
  // baseURL: "http://localhost:3000",
  trustedOrigins: [
    config.FRONTEND_URL as string,
    config.BETTER_AUTH_URL as string,
    "http://localhost:3000",
    "https://ecospark-hub.vercel.app",
    "https://ecosoark-hub.vercel.app",
  ],
  secret: config.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: config.OAUTH_CLIENT_ID as string,
      clientSecret: config.OAUTH_CLIENT_SECRET,
      redirectUri: `https://ecospark-hub.vercel.app/api/auth/callback/google`,
      // redirectUri: `http://localhost:3000/api/auth/callback/google`,
      mapProfileToUser: () => {
        return {
          role: Role.USER,
          userStatus: UserStatus.ACTIVE,
          isVerified: true,
          provider: "google",
        };
      },
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.USER,
        input: false,
      },
      userStatus: {
        type: "string",
        required: true,
        defaultValue: UserStatus.ACTIVE,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  advanced: {
    useSecureCookies: true,
    trustedProxyHeaders: true,
    disableOriginCheck: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      partitioned: true,
    },
    disableCSRFCheck: true,
  },
});
