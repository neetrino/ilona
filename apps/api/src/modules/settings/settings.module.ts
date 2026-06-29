import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SettingsCoreService } from './settings-core.service';
import { SettingsBrandingService } from './settings-branding.service';
import { SettingsFooterService } from './settings-footer.service';
import { SettingsPercentsService } from './settings-percents.service';
import { SettingsPenaltiesService } from './settings-penalties.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    SettingsCoreService,
    SettingsBrandingService,
    SettingsFooterService,
    SettingsPercentsService,
    SettingsPenaltiesService,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}


