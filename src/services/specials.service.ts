import api from "./api";
import type { Special } from "../types/api.types";

export const specialsService = {
  async getAllSpecials(): Promise<Special[]> {
    return api.get<Special[]>("/specials");
  },
  async getActiveSpecials(): Promise<Special[]> {
    return api.get<Special[]>("/specials/active");
  },
  async getSpecialById(id: string): Promise<Special> {
    return api.get<Special>(`/specials/${id}`);
  },
};
