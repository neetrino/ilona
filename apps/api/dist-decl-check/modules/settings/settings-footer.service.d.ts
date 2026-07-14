import { type FooterIconLinks } from '@ilona/types';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsCoreService } from './settings-core.service';
export declare class SettingsFooterService {
    private readonly prisma;
    private readonly coreService;
    private readonly logger;
    constructor(prisma: PrismaService, coreService: SettingsCoreService);
    getFooterIconLinks(): Promise<FooterIconLinks>;
    updateFooterIconLinks(input: Partial<Record<string, string | null>>): Promise<FooterIconLinks>;
}
