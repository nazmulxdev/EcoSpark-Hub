import { Role } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { auth } from "../lib/auth";

import { config } from "../config/env";

export const seedAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("Super admin exist. Skipping seeding admin.");
      return;
    }

    const adminUser = await auth.api.signUpEmail({
      body: {
        email: config.ADMIN_EMAIL as string,
        password: config.ADMIN_PASSWORD as string,
        name: "EcoSpark-Hub(Admin)" as string,
      },
    });

    console.log(adminUser);

    const admin = await prisma.user.findUniqueOrThrow({
      where: {
        email: config.ADMIN_EMAIL as string,
      },
    });

    if (admin) {
      await prisma.user.update({
        where: {
          email: config.ADMIN_EMAIL as string,
        },
        data: {
          role: Role.ADMIN,
        },
      });
    }

    console.log("Admin created,", admin);
  } catch (error) {
    console.error("Error seeding super admin: ", error);

    await prisma.user.delete({
      where: {
        email: config.ADMIN_EMAIL as string,
      },
    });
  }
};
