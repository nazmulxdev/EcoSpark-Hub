import "dotenv/config";
// BETTER_AUTH_URL
// BETTER_AUTH_SECRET
// NODE_ENV
interface EnvConfig {
  DATABASE_URL: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  NODE_ENV?: string;
  PORT?: string;
  FRONTEND_URL?: string;
  OAUTH_CLIENT_ID?: string;
  OAUTH_CLIENT_SECRET?: string;
  OAUTH_REDIRECT_URI?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_CLOUD_NAME?: string;
}

const loadEnv = (): EnvConfig => {
  const requiredVariables = [
    "DATABASE_URL",
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "NODE_ENV",
    "PORT",
    "FRONTEND_URL",
    "OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRET",
    "OAUTH_REDIRECT_URI",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_CLOUD_NAME",
  ];
  requiredVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(`Missing environment variable: ${variable}`);
    }
  });

  return {
    DATABASE_URL: process.env.DATABASE_URL as string,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL as string,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET as string,
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID as string,
    OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET as string,
    OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI as string,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
  };
};

export const config = loadEnv();
