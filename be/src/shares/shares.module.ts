import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ItemsModule } from '../items/items.module.js';
import { SharesController } from './shares.controller.js';
import { SharesService } from './shares.service.js';

@Module({
  imports: [AuthModule, ItemsModule],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
