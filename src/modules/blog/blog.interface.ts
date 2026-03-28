export interface ICreateBlog {
  title: string;
  content: string;
  coverImage?: string;
  isPublished?: boolean;
}

export interface IUpdateBlog {
  title?: string;
  content?: string;
  coverImage?: string;
  isPublished?: boolean;
  publishedAt?: Date | null;
}
