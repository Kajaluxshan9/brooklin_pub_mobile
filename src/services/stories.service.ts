import api from "./api";
import type { Story, StoryCategory } from "../types/api.types";

export const storiesService = {
  async getAllCategories(): Promise<StoryCategory[]> {
    return api.get<StoryCategory[]>("/stories/categories");
  },
  async getCategoryById(id: string): Promise<StoryCategory> {
    return api.get<StoryCategory>(`/stories/categories/${id}`);
  },
  async getAllStories(): Promise<Story[]> {
    return api.get<Story[]>("/stories");
  },
  async getStoriesByCategory(categoryId: string): Promise<Story[]> {
    return api.get<Story[]>(`/stories/category/${categoryId}`);
  },
  async getStoryById(id: string): Promise<Story> {
    return api.get<Story>(`/stories/${id}`);
  },
};
