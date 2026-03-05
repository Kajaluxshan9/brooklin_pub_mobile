import api from "./api";

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  reservationDate?: string;
  reservationTime?: string;
  guestCount?: number;
  position?: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export const contactService = {
  async submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    const jsonData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      subject: formData.subject,
      message: formData.message,
      reservationDate: formData.reservationDate || undefined,
      reservationTime: formData.reservationTime || undefined,
      guestCount: formData.guestCount || undefined,
      position: formData.position || undefined,
    };

    return api.post<ContactResponse>("/contact", jsonData);
  },
};
