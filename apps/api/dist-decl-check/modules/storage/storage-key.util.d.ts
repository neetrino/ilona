export declare const STORAGE_KEY_PREFIXES: readonly ["avatars", "chat", "documents", "settings"];
export declare const PROXY_STORAGE_KEY_PREFIXES: readonly ["chat", "avatars", "documents"];
export declare class InvalidStorageKeyError extends Error {
    constructor(message?: string);
}
export declare function assertSafeStorageKey(key: string): string;
export declare function extractStorageKeyFromProxyUrl(decodedUrl: string): string;
