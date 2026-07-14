import type { PrismaClient } from '@ilona/database';
import type { PrismaService } from '../prisma/prisma.service';
export interface ParticipantUserId {
    userId: string;
}
export interface ChatWithParticipantIds {
    id: string;
    participants: ParticipantUserId[];
}
export declare function getChatDb(prisma: PrismaService): PrismaClient;
export declare const CHAT_GROUP_INCLUDE: {
    readonly group: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly level: true;
            readonly center: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
            readonly teacherId: true;
            readonly teacher: {
                readonly select: {
                    readonly userId: true;
                };
            };
        };
    };
    readonly participants: {
        readonly where: {
            readonly leftAt: null;
        };
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly avatarUrl: true;
                    readonly role: true;
                    readonly lastSeenAt: true;
                };
            };
        };
    };
};
export declare const CHAT_DETAIL_GROUP_INCLUDE: {
    readonly group: {
        readonly select: {
            readonly id: true;
            readonly name: true;
            readonly level: true;
            readonly center: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
            readonly teacherId: true;
            readonly teacher: {
                readonly select: {
                    readonly userId: true;
                };
            };
        };
    };
    readonly participants: {
        readonly where: {
            readonly leftAt: null;
        };
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly avatarUrl: true;
                    readonly role: true;
                    readonly status: true;
                    readonly lastSeenAt: true;
                };
            };
        };
    };
};
