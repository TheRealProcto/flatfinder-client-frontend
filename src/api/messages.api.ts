import { api } from "./axios";

export type MessageUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type InboxItem = {
  id: number;
  flatId: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;

  flat?: {
    id: number;
    city: string;
    streetName: string;
    streetNumber: string;
    ownerId: number;
  };

  sender?: MessageUser;
  receiver?: MessageUser;
};

export type Message = {
  id: number;
  content: string;
  flatId: number;
  senderId: number;
  receiverId: number;
  createdAt: string;

  sender?: MessageUser;
  receiver?: MessageUser;
};

export const messagesApi = {
  getInbox: () =>
    api.get<{ success: boolean; data: { threads: InboxItem[] } }>("/messages/inbox"),

  getFlatThread: (flatId: number, otherUserId?: number) =>
    api.get<{ success: boolean; data: { messages: Message[] } }>(`/flats/${flatId}/messages`, {
      params: otherUserId ? { otherUserId } : undefined,
    }),

  send: (flatId: number, content: string, receiverId?: number) =>
    api.post<{ success: boolean; data: { message: Message } }>(
      `/flats/${flatId}/messages`,
      { content },
      { params: receiverId ? { receiverId } : undefined }
    ),
};
