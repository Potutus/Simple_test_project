import { Module } from '@nestjs/common'
import { FilesService } from './files.service'
import { FileManagerService } from './files-manager.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { FileAttachment } from './entities/file-attachment.model'
import { FileStorage } from './entities/file-storage.model'

@Module({
	imports: [SequelizeModule.forFeature([FileAttachment, FileStorage])],
	providers: [FilesService, FileManagerService],
	exports: [FilesService, FileManagerService],
})
export class FilesModule {}
