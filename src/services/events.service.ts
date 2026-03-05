import api from "./api";
import type { Event } from "../types/api.types";

export const eventsService = {
  async getAllEvents(): Promise<Event[]> {
    return api.get<Event[]>("/events");
  },
  async getActiveEvents(): Promise<Event[]> {
    return api.get<Event[]>("/events/active");
  },
  async getUpcomingEvents(): Promise<Event[]> {
    return api.get<Event[]>("/events/upcoming");
  },
  async getEventById(id: string): Promise<Event> {
    return api.get<Event>(`/events/${id}`);
  },
};
