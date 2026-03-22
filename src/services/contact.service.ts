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
  cvFile?: { uri: string; name: string; type: string };
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

export const contactService = {
  async submitContactForm(formData: ContactFormData): Promise<ContactResponse> {
    // If there's a CV file, send as multipart/form-data
    if (formData.cvFile) {
      const multipartData = new FormData();
      multipartData.append("name", formData.name);
      multipartData.append("email", formData.email);
      if (formData.phone) multipartData.append("phone", formData.phone);
      multipartData.append("subject", formData.subject);
      multipartData.append("message", formData.message);
      if (formData.reservationDate)
        multipartData.append("reservationDate", formData.reservationDate);
      if (formData.reservationTime)
        multipartData.append("reservationTime", formData.reservationTime);
      if (formData.guestCount)
        multipartData.append("guestCount", formData.guestCount.toString());
      if (formData.position)
        multipartData.append("position", formData.position);
      multipartData.append("cvFile", {
        uri: formData.cvFile.uri,
        name: formData.cvFile.name,
        type: formData.cvFile.type,
      } as any);

      return api.postFormData<ContactResponse>("/contact", multipartData);
    }

    // Otherwise send as JSON
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
