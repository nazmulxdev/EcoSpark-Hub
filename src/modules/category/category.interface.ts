export interface ICreateCategory {
  name: string;
  slug?: string;
  isActive?: boolean;
}

export interface IUpdateCategory {
  name?: string;
  slug?: string;
  isActive?: boolean;
}
