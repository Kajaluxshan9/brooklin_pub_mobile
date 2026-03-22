import { api } from "./api";

export interface NewsletterSubscribeData {
  email: string;
  name?: string;
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
}

export const newsletterService = {
  subscribe: async (data: NewsletterSubscribeData): Promise<NewsletterResponse> => {
    return api.post<NewsletterResponse>("/newsletter/subscribe", data);
  },
  unsubscribe: async (email: string): Promise<NewsletterResponse> => {
    return api.post<NewsletterResponse>("/newsletter/unsubscribe", { email });
  },
};
