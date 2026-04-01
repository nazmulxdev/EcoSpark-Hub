import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { config } from "../config/env";
import { Role, UserStatus } from "../generated/prisma/enums";

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  trustedOrigins: [
    config.FRONTEND_URL as string,
    config.BETTER_AUTH_URL as string,
    "http://localhost:3000",
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
      redirectUri: `${config.BETTER_AUTH_URL}/api/auth/callback/google`,
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
});
