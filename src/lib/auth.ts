// model User {
//     id            String     @id @default(uuid())
//     name          String
//     email         String
//     emailVerified Boolean    @default(false)
//     image         String?
//     createdAt     DateTime   @default(now())
//     updatedAt     DateTime   @updatedAt
//     role          Role       @default(USER)
//     userStatus    UserStatus @default(ACTIVE)
//     sessions      Session[]
//     accounts      Account[]
//     member        Member?
//     ideas         Idea[]
//     votes         Vote[]
//     comments      Comment[]

//     ideaPurchases IdeaPurchase[]

//     membershipPayment MembershipPayment?
//     ideaPayments      IdeaPayment[]
//     watchLists        Watchlist[]

//     @@unique([email])
//     @@map("users")
// }

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { config } from "../config/env";
import { Role, UserStatus } from "../generated/prisma/enums";

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
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
});
