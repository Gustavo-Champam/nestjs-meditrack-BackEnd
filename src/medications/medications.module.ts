import { MedicationsMgmtController } from './medications.mgmt.controller';
import { MedicationsFlatController } from './medications.flat.controller';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { Medication, MedicationSchema } from './schemas/medication.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Medication.name, schema: MedicationSchema },
    ]),
  ],
  controllers: [MedicationsController, MedicationsFlatController],
  providers: [MedicationsService],
  exports: [MedicationsService],
})
export class MedicationsModule {}







