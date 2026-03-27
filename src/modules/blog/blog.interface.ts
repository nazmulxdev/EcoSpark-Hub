export interface ICreateBlog {
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  isPublished?: boolean;
}

export interface IUpdateBlog {
  title?: string;
  slug?: string;
  content?: string;
  coverImage?: string;
  isPublished?: boolean;
  publishedAt?: Date;
}
