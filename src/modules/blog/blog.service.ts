// model Blog {
//     id          String    @id @default(uuid())
//     title       String
//     slug        String    @unique
//     content     String    @db.Text
//     coverImage  String?
//     isPublished Boolean   @default(false)
//     publishedAt DateTime?
//     createdAt   DateTime  @default(now())
//     updatedAt   DateTime  @updatedAt

import { deleteFileFromCloudinary } from "../../config/cloudinary.config";
import { Blog, Prisma } from "../../generated/prisma/client";
import { IQueryParams } from "../../interfaces/query.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../shared/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { generateUniqueSlug } from "../../utils/generateSlug";
import { blogFilterableFields, blogSearchableFields } from "./blog.constant";
import { ICreateBlog, IUpdateBlog } from "./blog.interface";

//     @@index([title], name: "idx_blogs_title")
//     @@index([slug], name: "idx_blogs_slug")
//     @@map("blogs")
// }

const createBlog = async (userId: string, payload: ICreateBlog) => {
  const isAdminUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isAdminUser || isAdminUser.role !== "ADMIN") {
    throw new AppError(
      403,
      "You are not authorized to create a blog",
      "Unauthorized",
      [
        {
          field: "role",
          message: "You are not authorized to create a blog",
        },
      ],
    );
  }

  const slug = await generateUniqueSlug(payload.title, "blog");

  const blog = await prisma.blog.create({
    data: {
      ...payload,
      slug,
      publishedAt: payload.isPublished ? new Date() : null,
    },
  });

  return blog;
};

const getAllBlogs = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder<Blog, Prisma.BlogWhereInput>(
    prisma.blog,
    query,
    {
      searchableFields: blogSearchableFields,
      filterableFields: blogFilterableFields,
    },
  );

  const result = await queryBuilder
    .search()
    .filter()
    .where({ isPublished: true })
    .paginate()
    .sort()
    .execute();
  return result;
};

const getSingleBlog = async (slug: string) => {
  const blog = await prisma.blog.findUnique({
    where: {
      slug,
    },
  });

  if (!blog) {
    throw new AppError(404, "Blog not found", "Not Found", [
      {
        field: "slug",
        message: "Blog not found",
      },
    ]);
  }

  return blog;
};

const updateBlog = async (slug: string, payload: IUpdateBlog) => {
  const blog = await prisma.blog.findUnique({
    where: {
      slug,
    },
  });

  if (!blog) {
    throw new AppError(404, "Blog not found", "Not Found", [
      {
        field: "slug",
        message: "Blog not found",
      },
    ]);
  }

  if (payload.coverImage && blog.coverImage) {
    try {
      await deleteFileFromCloudinary(blog.coverImage);
    } catch (error) {
      console.log(error);
      throw new AppError(
        500,
        "Failed to delete cover image",
        "Internal Server Error",
        [
          {
            field: "coverImage",
            message: "Failed to delete cover image",
          },
        ],
      );
    }
  }

  if (payload.isPublished && !blog.isPublished) {
    payload.publishedAt = new Date();
  }

  if (payload.isPublished === false) {
    payload.publishedAt = null;
  }

  const updatedBlog = await prisma.blog.update({
    where: {
      slug,
    },
    data: payload,
  });

  return updatedBlog;
};

const deleteBlog = async (slug: string) => {
  const blog = await prisma.blog.findUnique({
    where: {
      slug,
    },
  });

  if (!blog) {
    throw new AppError(404, "Blog not found", "Not Found", [
      {
        field: "slug",
        message: "Blog not found",
      },
    ]);
  }

  if (blog.coverImage) {
    try {
      await deleteFileFromCloudinary(blog.coverImage);
    } catch (error) {
      console.log(error);
      throw new AppError(
        500,
        "Failed to delete cover image",
        "Internal Server Error",
        [
          {
            field: "coverImage",
            message: "Failed to delete cover image",
          },
        ],
      );
    }
  }

  const deletedBlog = await prisma.blog.delete({
    where: {
      slug,
    },
  });

  return deletedBlog;
};

export const blogService = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};
