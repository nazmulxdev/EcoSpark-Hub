import status from "http-status";
import { PRISMA_ERROR_MAP } from "./prismaErrorMap";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";

interface IPrismaErrorResponse {
  statusCode: number;
  message: string;
  code: string;
  details: Record<string, unknown> | null;
}

const extractFieldFromMeta = (
  meta: Record<string, unknown> | undefined,
): string => {
  if (!meta) return "unknown";
  if (meta.target && Array.isArray(meta.target)) return meta.target.join(", ");
  if (meta.field_name) return String(meta.field_name);
  if (meta.column) return String(meta.column);
  if (meta.table) return String(meta.table);
  if (meta.model) return String(meta.model);
  if (meta.argument) return String(meta.argument);
  return "unknown";
};

const getHumanReadableMessage = (
  error: PrismaClientKnownRequestError,
): string => {
  const field = extractFieldFromMeta(error.meta as Record<string, unknown>);

  const messages: Record<string, string> = {
    P2000: `The value provided for '${field}' is too long.`,
    P2001: `No record found matching the given filter.`,
    P2002: `A record with this '${field}' already exists.`,
    P2003: `Invalid reference: '${field}' does not match any existing record.`,
    P2004: `A database constraint was violated on '${field}'.`,
    P2005: `Invalid value stored in field '${field}'.`,
    P2006: `Invalid value provided for field '${field}'.`,
    P2007: `Data validation failed for '${field}'.`,
    P2008: `Query parsing failed. Please check your request.`,
    P2009: `Query validation failed. Please check your request.`,
    P2010: `Raw query execution failed.`,
    P2011: `'${field}' cannot be null.`,
    P2012: `'${field}' is required but missing.`,
    P2013: `Required argument '${field}' is missing.`,
    P2014: `Relation '${field}' would violate a required relation.`,
    P2015: `Related record for '${field}' not found.`,
    P2016: `Query interpretation error.`,
    P2017: `Records for relation '${field}' are not connected.`,
    P2018: `Required related records for '${field}' not found.`,
    P2019: `Input error on '${field}'.`,
    P2020: `Value for '${field}' is out of the allowed range.`,
    P2021: `Table '${field}' does not exist in the database.`,
    P2022: `Column '${field}' does not exist in the database.`,
    P2023: `Inconsistent column data for '${field}'.`,
    P2024: `Database connection pool timeout. Please try again.`,
    P2025: `The requested record was not found.`,
    P2026: `Query uses an unsupported feature.`,
    P2027: `Multiple errors occurred during transaction.`,
    P2028: `Transaction API error.`,
    P2029: `Query parameter limit exceeded.`,
    P2030: `Fulltext index not found for '${field}'.`,
    P2031: `MongoDB replica set is required.`,
    P2033: `Number does not fit in a 64-bit integer.`,
    P2034: `Transaction failed due to a write conflict or deadlock. Please retry.`,
    P2037: `Too many database connections. Please try again later.`,
  };

  return messages[error.code] ?? `Database error occurred (${error.code}).`;
};

export const handlePrismaError = (error: unknown): IPrismaErrorResponse => {
  // 1. Known request errors
  if (error instanceof PrismaClientKnownRequestError) {
    return {
      statusCode: PRISMA_ERROR_MAP[error.code] ?? status.INTERNAL_SERVER_ERROR,
      message: getHumanReadableMessage(error),
      code: error.code,
      details: (error.meta as Record<string, unknown>) ?? null,
    };
  }

  // 2. Validation errors
  if (error instanceof PrismaClientValidationError) {
    return {
      statusCode: status.BAD_REQUEST,
      message: "Invalid data provided. Please check your input.",
      code: "PRISMA_VALIDATION_ERROR",
      details: { rawMessage: error.message },
    };
  }

  // 3. Initialization errors
  if (error instanceof PrismaClientInitializationError) {
    return {
      statusCode: status.SERVICE_UNAVAILABLE,
      message: "Database connection failed. Please try again later.",
      code: error.errorCode ?? "PRISMA_INIT_ERROR",
      details: null,
    };
  }

  // 4. Unknown request errors
  if (error instanceof PrismaClientUnknownRequestError) {
    return {
      statusCode: status.INTERNAL_SERVER_ERROR,
      message: "An unexpected database error occurred.",
      code: "PRISMA_UNKNOWN_ERROR",
      details: null,
    };
  }

  // 5. Rust panic errors
  if (error instanceof PrismaClientRustPanicError) {
    return {
      statusCode: status.INTERNAL_SERVER_ERROR,
      message: "A critical database engine error occurred.",
      code: "PRISMA_RUST_PANIC",
      details: null,
    };
  }

  // 6. Not a Prisma error
  return null as unknown as IPrismaErrorResponse;
};

export const isPrismaError = (error: unknown): boolean => {
  return (
    error instanceof PrismaClientKnownRequestError ||
    error instanceof PrismaClientValidationError ||
    error instanceof PrismaClientInitializationError ||
    error instanceof PrismaClientUnknownRequestError ||
    error instanceof PrismaClientRustPanicError
  );
};
