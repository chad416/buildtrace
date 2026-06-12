import { Module } from '@nestjs/common';

import { MachineRecordsController } from './machine-records.controller.js';

@Module({
  controllers: [MachineRecordsController],
})
export class AppModule {}
