export declare class ServerActivityService {
    private lastActivityAt;
    touch(): void;
    getLastActivityAt(): number;
    hasEverBeenActive(): boolean;
}
