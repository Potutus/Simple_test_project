import {
	Controller,
	Post,
	Put,
	Delete,
	Get,
	Body,
	Param,
	Query,
	UsePipes,
	ValidationPipe,
	UseInterceptors,
	UploadedFiles,
} from '@nestjs/common'
import { Authorization } from 'src/auth/decorator/auth.decorator'
import { Authorized } from 'src/auth/decorator/authorizaed.decorator'
import {
	CreateFolderDto,
	CreateFileDto,
	CreateLinkDto,
	MoveNodeDto,
	UpdateNodeDto,
	GetNodeChildren,
	CreateFsACLDto,
} from './dto/file-system.dto'
import { FilesInterceptor } from '@nestjs/platform-express'
import { FileValidationPipe } from 'src/pipes/file-validation.pipe'
import { FsAclManagerService } from './services/access/fs-acl-manager.service'
import { FileSystemService } from './file-system.service'

@Controller('fs')
export class FileSystemController {
	constructor(
		private readonly fs: FileSystemService,
		private readonly fsACL: FsAclManagerService
	) {}

	@Post('/folder')
	@Authorization()
	@UsePipes(ValidationPipe)
	createFolder(@Authorized('id') userID: string, @Body() dto: CreateFolderDto) {
		return this.fs.createFolder({
			userID,
			parentID: dto.parentID,
			name: dto.name,
			description: dto.description,
			//metadata: dto.metadata,
		})
	}

	@Post('/file')
	@Authorization()
	@UsePipes(ValidationPipe)
	@UseInterceptors(FilesInterceptor('files'))
	createFile(
		@Authorized('id') userID: string,
		@UploadedFiles(
			new FileValidationPipe({
				required: true,
				fileType: 'FS_NODE',
				fileCount: 'FEW',
				fileSize: 'MEDIUM',
			})
		)
		files: Array<Express.Multer.File>,
		@Body()
		dto: CreateFileDto
	) {
		return this.fs.createFile({
			userID,
			parentID: dto.parentID,
			name: dto.name,
			file: files[0],
			metadata: dto.metadata,
			mediaID: dto.mediaID,
			content: dto.content,
		})
	}

	@Post('/link')
	@Authorization()
	@UsePipes(ValidationPipe)
	createLink(@Authorized('id') userID: string, @Body() dto: CreateLinkDto) {
		return this.fs.createLink({
			userID: userID,
			parentID: dto?.parentID,
			name: dto?.name,
			targetType: dto.targetType,
			targetID: dto.targetID,
		})
	}

	@Get('/:nodeID')
	@Authorization()
	getOne(@Authorized('id') userID: string, @Param('nodeID') nodeID: string) {
		return this.fs.getOne(userID, nodeID)
	}

	@Get('/:parentID/children')
	@Authorization()
	getChildren(
		@Authorized('id') userID: string,
		@Param('parentID') parentID: string,
		@Body() dto: GetNodeChildren,
		@Query('limit') limit?: number,
		@Query('after') afterSortKey?: string,
		@Query('order') order?: 'ASC' | 'DESC'
	) {
		return this.fs.getChildren({
			actorID: userID,
			parentID,
			limit: limit ? Number(limit) : 50,
			afterSortKey: afterSortKey ?? null,
			order: order ?? 'ASC',
			userID: dto.nodeOwnerID,
		})
	}

	@Put('/node')
	@Authorization()
	@UsePipes(ValidationPipe)
	updateNode(@Authorized('id') userID: string, @Body() dto: UpdateNodeDto) {
		return this.fs.update({
			userID,
			nodeID: dto.nodeID,
			name: dto.name,
			description: dto.description,
			sortKey: dto.sortKey,
			content: dto.content,
			isInherit: dto.isInherit,
		})
	}

	@Put('/move')
	@Authorization()
	@UsePipes(ValidationPipe)
	moveNode(@Authorized('id') userID: string, @Body() dto: MoveNodeDto) {
		return this.fs.move({
			userID,
			nodeID: dto.nodeID,
			newParentID: dto.newParentID,
		})
	}

	// ============================================================
	// METADATA
	// ============================================================

	// @Put('/metadata/replace')
	// @Authorization()
	// @UsePipes(ValidationPipe)
	// replaceMetadata(
	// 	@Authorized('id') userID: string,
	// 	@Body() dto: MetadataReplaceDto
	// ) {
	// 	return this.fs.replaceMetadata({
	// 		userID,
	// 		nodeID: dto.nodeID,
	// 		newMeta: dto.metadata,
	// 	})
	// }

	// @Put('/metadata/merge')
	// @Authorization()
	// @UsePipes(ValidationPipe)
	// mergeMetadata(
	// 	@Authorized('id') userID: string,
	// 	@Body() dto: MetadataMergeDto
	// ) {
	// 	return this.fs.mergeMetadata({
	// 		userID,
	// 		nodeID: dto.nodeID,
	// 		patch: dto.patch,
	// 	})
	// }

	// ============================================================
	// TRASH
	// ============================================================

	@Delete('/trash')
	@Authorization()
	@UsePipes(ValidationPipe)
	softDelete(@Authorized('id') userID: string, @Body('nodeID') nodeID: string) {
		return this.fs.softDelete(userID, nodeID)
	}

	@Post('/trash/restore')
	@Authorization()
	@UsePipes(ValidationPipe)
	restore(@Authorized('id') userID: string, @Body('nodeID') nodeID: string) {
		return this.fs.restore(userID, nodeID)
	}

	@Delete('/trash/purge') // Пересмотреть жесткое удаление (когда будет path ltree)
	@Authorization()
	@UsePipes(ValidationPipe)
	purge(@Authorized('id') userID: string, @Body('nodeID') nodeID: string) {
		return this.fs.purge(userID, nodeID)
	}

	// ============================================================
	// FS ACL
	// ============================================================

	@Post('/acl')
	@Authorization()
	@UsePipes(ValidationPipe)
	setPermission(@Authorized('id') userID: string, @Body() dto: CreateFsACLDto) {
		// return this.fsACL.setEntry({
		// 	userID: userID,
		// 	nodeID: dto.nodeID,
		// 	granteeType: dto.granteeType,
		// 	granteeID: dto.granteeID,
		// 	allowMask: dto.allowMask,
		// 	denyMask: dto.denyMask,
		// })
	}

	// @Post('/trash/restore')
	// @Authorization()
	// @UsePipes(ValidationPipe)
	// removePermission(
	// 	@Authorized('id') userID: string,
	// 	@Body('nodeID') nodeID: string
	// ) {
	// 	return this.fsACL.removeEntry()
	// }

	// @Delete('/trash/purge')
	// @Authorization()
	// @UsePipes(ValidationPipe)
	// listPermissons(
	// 	@Authorized('id') userID: string,
	// 	@Body('nodeID') nodeID: string
	// ) {
	// 	return this.fsACL.list()
	// }
}
