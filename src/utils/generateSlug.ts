/* eslint-disable @typescript-eslint/no-explicit-any */
import slugify from "slugify";
import { prisma } from "../lib/prisma";

type SlugModel= "idea" | "blog" | "category";

export const generateUniqueSlug=async(title:string,model:SlugModel,existingId?:string):Promise<string>=>{

    // converting title to slug

    const baseSlug=slugify(title,{
        lower:true,
        strict:true,
        trim:true,
        
    })

    // checking if slug is already exists in the db

     let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await (prisma[model] as any).findFirst({
      where: {
        slug,
        // on update, ignore the current record itself
        ...(existingId ? { NOT: { id: existingId } } : {}),
      },
    });

    if (!existing) break; // slug is unique, use it

    // collision → append suffix: "my-idea-1", "my-idea-2" ...
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

return slug
}