import api from "./api";
import type { OpeningHours, OpeningHoursStatus } from "../types/api.types";

export const openingHoursService = {
  async getAllOpeningHours(): Promise<OpeningHours[]> {
    return api.get<OpeningHours[]>("/opening-hours");
  },
  async getCurrentStatus(): Promise<OpeningHoursStatus> {
    return api.get<OpeningHoursStatus>("/opening-hours/status");
  },
  async getHoursByDay(day: string): Promise<OpeningHours> {
    return api.get<OpeningHours>(`/opening-hours/day/${day}`);
  },
  async getOpeningHoursById(id: string): Promise<OpeningHours> {
    return api.get<OpeningHours>(`/opening-hours/${id}`);
  },
};
