import type { Prisma } from '@ilona/database';
export declare const groupTeacherUserSelect: {
    readonly id: true;
    readonly firstName: true;
    readonly lastName: true;
    readonly email: true;
    readonly avatarUrl: true;
};
export declare const groupTeacherInclude: {
    readonly include: {
        readonly user: {
            readonly select: {
                readonly id: true;
                readonly firstName: true;
                readonly lastName: true;
                readonly email: true;
                readonly avatarUrl: true;
            };
        };
    };
};
export declare const groupDetailTeacherInclude: {
    readonly include: {
        readonly user: {
            readonly select: {
                readonly phone: true;
                readonly id: true;
                readonly firstName: true;
                readonly lastName: true;
                readonly email: true;
                readonly avatarUrl: true;
            };
        };
    };
};
export declare const groupListInclude: (includeStudents?: boolean) => Prisma.GroupInclude;
export declare const groupDetailInclude: {
    readonly center: true;
    readonly teacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly phone: true;
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                    readonly avatarUrl: true;
                };
            };
        };
    };
    readonly secondTeacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly phone: true;
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                    readonly avatarUrl: true;
                };
            };
        };
    };
    readonly students: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                    readonly phone: true;
                    readonly avatarUrl: true;
                    readonly status: true;
                };
            };
        };
    };
    readonly chat: {
        readonly select: {
            readonly id: true;
        };
    };
    readonly _count: {
        readonly select: {
            readonly students: true;
            readonly lessons: true;
        };
    };
};
export declare const groupWriteInclude: {
    readonly center: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    readonly teacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                };
            };
        };
    };
    readonly secondTeacher: {
        readonly include: {
            readonly user: {
                readonly select: {
                    readonly id: true;
                    readonly firstName: true;
                    readonly lastName: true;
                    readonly email: true;
                };
            };
        };
    };
};
