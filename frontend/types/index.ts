export interface User {
  id: number;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  type: "article" | "video" | "photo";
}

export interface Tag {
  id: number;
  name: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  coverImageUrl?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  tags?: Tag[];
}

export interface Video {
  id: number;
  url: string;
  publicId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  tags?: Tag[];
}

export interface Photo {
  id: number;
  url: string;
  publicId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  tags?: Tag[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AIFaq {
  question: string;
  answer: string;
}

export interface AeoJsonLd {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: { "@type": string; text: string };
  }>;
}

export interface AIMeta {
  description: string;
}

export interface AIAlt {
  alt: string;
}
