export declare function leadInclude(): {
    createdByUser: {
        select: {
            id: boolean;
            firstName: boolean;
            lastName: boolean;
            email: boolean;
        };
    };
    assignedManager: {
        select: {
            id: boolean;
            firstName: boolean;
            lastName: boolean;
            email: boolean;
        };
    };
    teacher: {
        select: {
            id: boolean;
            user: {
                select: {
                    id: boolean;
                    firstName: boolean;
                    lastName: boolean;
                    email: boolean;
                    phone: boolean;
                };
            };
        };
    };
    group: {
        select: {
            id: boolean;
            name: boolean;
            level: boolean;
            center: {
                select: {
                    id: boolean;
                    name: boolean;
                };
            };
        };
    };
    center: {
        select: {
            id: boolean;
            name: boolean;
        };
    };
    attachments: boolean;
    activities: {
        take: number;
        orderBy: {
            createdAt: "desc";
        };
    };
    student: {
        select: {
            id: boolean;
        };
    };
};
