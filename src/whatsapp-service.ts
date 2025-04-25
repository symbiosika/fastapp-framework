import {
  registerCompanyInWhatsAppAPI,
  registerPhoneNumerInWhatsAppAPI,
  getRegistrationsForWhatsAppAPI,
} from "./lib/communication/whatsapp/register";
import { sendWhatsAppMessage } from "./lib/communication/whatsapp/send";
import { processWebhook } from "./lib/communication/whatsapp/index";

export const whatsappService = {
  registerCompanyInWhatsAppAPI,
  registerPhoneNumerInWhatsAppAPI,
  getRegistrationsForWhatsAppAPI,
  sendWhatsAppMessage,
  processWebhook,
};
