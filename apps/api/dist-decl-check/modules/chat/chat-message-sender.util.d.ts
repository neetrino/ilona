export declare const chatSenderPublicSelect: {
    readonly id: true;
    readonly firstName: true;
    readonly lastName: true;
    readonly avatarUrl: true;
    readonly role: true;
    readonly status: true;
};
export type ChatSenderPublic = {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
    status: string;
};
export type MessageWithOptionalSender = {
    senderId: string | null;
    sender?: ChatSenderPublic | null;
};
export declare function mapMessageWithSender<T extends MessageWithOptionalSender>(message: T): T;
