import { Global, Module } from '@nestjs/common';
import { R2StorageProvider } from './r2-storage.provider';
import { STORAGE_PROVIDER } from './storage-provider.interface';

@Global()
@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: R2StorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
