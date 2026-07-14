import { type StorageConfig } from './storage-client.util';
export declare class StorageDeleteService {
    private readonly config;
    private readonly logger;
    constructor(config: StorageConfig);
    delete(key: string): Promise<void>;
}
