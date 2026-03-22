import api from "./api";
import type {
  MenuItem,
  MenuCategory,
  PrimaryCategory,
  MenuItemMeasurement,
  MeasurementType,
} from "../types/api.types";

export const menuService = {
  // Primary Categories
  async getPrimaryCategories(): Promise<PrimaryCategory[]> {
    return api.get<PrimaryCategory[]>("/menu/primary-categories");
  },
  async getPrimaryCategoryById(id: string): Promise<PrimaryCategory> {
    return api.get<PrimaryCategory>(`/menu/primary-categories/${id}`);
  },

  // Categories
  async getCategories(): Promise<MenuCategory[]> {
    return api.get<MenuCategory[]>("/menu/categories");
  },
  async getCategoryById(id: string): Promise<MenuCategory> {
    return api.get<MenuCategory>(`/menu/categories/${id}`);
  },
  async getCategoriesByPrimaryCategory(
    primaryCategoryId: string,
  ): Promise<MenuCategory[]> {
    return api.get<MenuCategory[]>(
      `/menu/primary-categories/${primaryCategoryId}/categories`,
    );
  },

  // Menu Items
  async getAllMenuItems(): Promise<MenuItem[]> {
    return api.get<MenuItem[]>("/menu/items");
  },
  async getMenuItemById(id: string): Promise<MenuItem> {
    return api.get<MenuItem>(`/menu/items/${id}`);
  },
  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return api.get<MenuItem[]>(`/menu/categories/${categoryId}/items`);
  },
  async getMenuItemsByPrimaryCategory(
    primaryCategoryId: string,
  ): Promise<MenuItem[]> {
    return api.get<MenuItem[]>(
      `/menu/primary-categories/${primaryCategoryId}/items`,
    );
  },

  // Measurements
  async getMeasurementTypes(): Promise<MeasurementType[]> {
    return api.get<MeasurementType[]>("/measurements");
  },
  async getMenuItemMeasurements(
    menuItemId: string,
  ): Promise<MenuItemMeasurement[]> {
    return api.get<MenuItemMeasurement[]>(
      `/menu/items/${menuItemId}/measurements`,
    );
  },
};
