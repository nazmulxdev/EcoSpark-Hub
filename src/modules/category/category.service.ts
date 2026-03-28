import { Category, Prisma } from "../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { generateUniqueSlug } from "../../utils/generateSlug";
import {
  categoryFilterableFields,
  categorySearchableFields,
} from "./category.constant";
import { ICreateCategory, IUpdateCategory } from "./category.interface";

const createCategory = async (payload: ICreateCategory) => {
  let slug: string = "";
  const isCategoryExists = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (isCategoryExists) {
    throw new AppError(400, "Category already exists", "Bad Request", [
      { field: "name", message: "Category with this name already exists" },
    ]);
  }

  if (!payload.slug) {
    slug = await generateUniqueSlug(payload.name, "category");
  } else {
    const isSlugExists = await prisma.category.findUnique({
      where: { slug: payload.slug },
    });
    if (isSlugExists) {
      throw new AppError(400, "Category slug already exists", "Bad Request", [
        { field: "slug", message: "Category slug already exists" },
      ]);
    }
  }

  const category = await prisma.category.create({
    data: {
      ...payload,
      slug: payload.slug || slug,
    },
  });

  return category;
};

const getAllCategories = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<
    Category,
    Prisma.CategoryWhereInput,
    Prisma.CategoryInclude
  >(prisma.category, query, {
    searchableFields: categorySearchableFields,
    filterableFields: categoryFilterableFields,
  });

  const result = await queryBuilder
    .search()
    .filter()
    .paginate()
    .sort()
    .execute();
  return result;
};

const getSingleCategory = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      ideas: true,
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found", "Not Found", [
      { field: "slug", message: "Category not found" },
    ]);
  }

  return category;
};

const updateCategory = async (slug: string, payload: IUpdateCategory) => {
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new AppError(404, "Category not found", "Not Found", [
      { field: "slug", message: "Category not found" },
    ]);
  }

  if (payload.name && payload.name !== category.name) {
    const isCategoryExists = await prisma.category.findUnique({
      where: { name: payload.name },
    });

    if (isCategoryExists && isCategoryExists.id !== category.id) {
      throw new AppError(400, "Category already exists", "Bad Request", [
        { field: "name", message: "Category with this name already exists" },
      ]);
    }
  }

  if (payload.slug && payload.slug !== category.slug) {
    const isSlugExists = await prisma.category.findUnique({
      where: { slug: payload.slug },
    });
    if (isSlugExists && isSlugExists.id !== category.id) {
      throw new AppError(400, "Category slug already exists", "Bad Request", [
        { field: "slug", message: "Category slug already exists" },
      ]);
    }
  } else if (payload.name && !payload.slug) {
    payload.slug = await generateUniqueSlug(
      payload.name,
      "category",
      category.slug,
    );
  }

  const updatedCategory = await prisma.category.update({
    where: { slug },
    data: payload,
  });

  return updatedCategory;
};

const deleteCategory = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) {
    throw new AppError(404, "Category not found", "Not Found", [
      { field: "slug", message: "Category not found" },
    ]);
  }

  const deletedCategory = await prisma.category.delete({
    where: { slug },
  });

  return deletedCategory;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
