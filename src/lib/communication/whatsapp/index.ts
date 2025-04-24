/* -----------
A lib to handle whatsapp communication
------------ */

import { log } from "../../..";

/*
Example of a whatsapp webhook event "messages"
{
  object: "whatsapp_business_account",
  entry: [
    {
      id: "888888888888888",
      changes: [
        {
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "4988778877887",
              phone_number_id: "1234567890",
            },
            contacts: [
              {
                profile: {
                  name: "Some",
                },
                wa_id: "499999999999999",
              }
            ],
            messages: [
              {
                from: "499999999999999",
                id: "wamid.HBgNNDkxNjA5NzMyMjM1MBUCABIYIENENDJGRDk2NDc3M0U0NjY1MTY0RTA2RThGOENFMEQ2AA==",
                timestamp: "1745442749",
                text: {
                  body: "Hello world",
                },
                type: "text",
              }
            ],
          },
          field: "messages",
        }
      ],
    }
  ],
}
*/

/**
 * Extract unique whatsapp id from a whatsapp event
 */
export const getProfileFromWhatsAppEvent = (event: any) => {
  if (
    !event.entry ||
    !event.entry[0] ||
    !event.entry[0].changes ||
    !event.entry[0].changes[0] ||
    !event.entry[0].changes[0].value ||
    !event.entry[0].changes[0].value.contacts ||
    !event.entry[0].changes[0].value.contacts[0] ||
    !event.entry[0].changes[0].value.contacts[0].wa_id
  ) {
    log.error("Invalid event", { event });
    throw new Error("Invalid event");
  }
  return event.entry[0].changes[0].value.contacts[0].wa_id;
};

export const getMessagesFromWhatsAppEvent = (event: any) => {
  if (
    !event.entry ||
    !event.entry[0] ||
    !event.entry[0].changes ||
    !event.entry[0].changes[0] ||
    !event.entry[0].changes[0].value ||
    !event.entry[0].changes[0].value.messages
  ) {
    log.error("Invalid event", { event });
    throw new Error("Invalid event");
  }
  return event.entry[0].changes[0].value.messages;
};
