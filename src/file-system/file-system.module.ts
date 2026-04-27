import { Module } from '@nestjs/common'
import { FileSystemService } from './file-system.service'
import { FileSystemController } from './file-system.controller'
import { FsPermissionService } from './services/access/fs-permission.service'
import { FsQuotaService } from './services/access/fs-quota.service'
import { FSMetadataService } from './services/core/fs-metadata.service'
import { TrashService } from './services/trash/trash.service'
import { LinkService } from './services/links/link.service'
import { FileManagerService } from 'src/files/files-manager.service'
import { SequelizeModule } from '@nestjs/sequelize'
import { FileSystemNode } from './entities/file-system-node.model'
import { FSACL } from './entities/file-system-acl.mode'
import { FSQuotaUsage } from './entities/fs-quota-usage.model'
import { FsAclManagerService } from './services/access/fs-acl-manager.service'
import { GroupHelperService } from 'src/groups/helpers/groups-helpers.service'
import { MediaService } from 'src/media/media.service'
import { SystemFolderService } from './services/system-node/system-node.service'
import { FileStorage } from 'src/files/entities/file-storage.model'
import { FileAttachment } from 'src/files/entities/file-attachment.model'
import { FilesService } from 'src/files/files.service'
import { GroupMember } from 'src/groups/entities/group-member.model'
import { GroupRole } from 'src/groups/entities/group-role.model'
import { GroupsService } from 'src/groups/groups.service'
import { Media } from 'src/media/entities/media.model'
import { MediaTAService } from 'src/media/media-action-tags.service'
import { Group } from 'src/groups/entities/group.model'
import { GroupAccessService } from 'src/groups/access/group-access.service'
import { UsersService } from 'src/users/users.service'
import { User } from 'src/users/entities/users.model'
import { RolesService } from 'src/roles/roles.service'
import { ArgonService } from 'src/auth/argon2/argon.service'
import { Role } from 'src/roles/entities/roles.model'
import { FSNodePolicyService } from './services/access/fs-node-policy-core.service'
import { SpiceDBService } from '../access-control/auth-n/spicedb.service'
import { NodeService } from './services/node/node.service'
import { AccessControlService } from 'src/access-control/access-control.service'
import { CreateLinkService } from './services/links/actions/create-link.service'
import { SoftDeleteService } from './services/trash/actions/soft-delete.service'
import { RestoreService } from './services/trash/actions/restore.service'
import { PurgeService } from './services/trash/actions/purge.service'
import { CreateFolderService } from './services/node/actions/create-folder.service'
import { CreateFileService } from './services/node/actions/create-file.service'
import { GetNodeService } from './services/node/actions/get-node.service'
import { GetChildrenNodesService } from './services/node/actions/get-children-nodes.service'
import { UpdateNodeService } from './services/node/actions/update-node.service'
import { MoveNodeService } from './services/node/actions/move-node.service'
import { AccessControlEntry } from 'src/access-control/entities/acl.model'
import { AssertTargetService } from './services/links/actions/assert-target.service'
import { ResolveParentService } from './services/system-node/resolve-parent-folder.service'
import { DeletionTaskService } from './services/deletion-tasks/deletion-action.service'
import { DeletionWorkerService } from './services/deletion-tasks/delition-worker.service'
import { FileSystemDeletionTask } from './entities/file-system-deletion-task.model'
import { ScheduleModule } from '@nestjs/schedule'
import { RequirementExecutionEngineService } from './services/access/fs-requirement-execution-engine.setvice'
import { ACEOutBoxActionService } from 'src/access-control/outbox-tasks/ace-outbox-action.service'
import { ACEOutboxTask } from 'src/access-control/entities/acl-outbox-task.model'

@Module({
	imports: [
		SequelizeModule.forFeature([
			FileSystemNode,
			FSACL,
			FSQuotaUsage,
			FileStorage,
			FileAttachment,
			GroupMember,
			GroupRole,
			Media,
			Group,
			User,
			Role,
			AccessControlEntry,
			FileSystemDeletionTask,
			ACEOutboxTask,
		]),
		ScheduleModule.forRoot(),
	],
	providers: [
		FileSystemService,
		FsPermissionService,
		FsQuotaService,
		FSMetadataService,
		LinkService,
		TrashService,
		FileManagerService,
		FsAclManagerService,
		SystemFolderService,
		GroupHelperService,
		MediaService,
		FilesService,
		GroupsService,
		MediaTAService,
		GroupAccessService,
		UsersService,
		RolesService,
		ArgonService,
		FSNodePolicyService,
		NodeService,
		AccessControlService,
		CreateLinkService,
		SoftDeleteService,
		RestoreService,
		FileSystemModule,
		PurgeService,
		CreateFolderService,
		CreateFileService,
		GetNodeService,
		GetChildrenNodesService,
		UpdateNodeService,
		MoveNodeService,
		SpiceDBService,
		AssertTargetService,
		ResolveParentService,
		DeletionTaskService,
		DeletionWorkerService,
		RequirementExecutionEngineService,
		ACEOutBoxActionService,
	],
	controllers: [FileSystemController],
})
export class FileSystemModule {}
