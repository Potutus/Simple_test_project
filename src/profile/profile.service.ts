import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'
import { Profile } from './entities/profile.model'
import { FilesService } from 'src/files/files.service'
import { UploadAvatarDto } from './dto/profile.dto'
import { MediaService } from 'src/media/media.service'
import { FILES_CONFIG, FILES_CONFIG_DIR } from 'src/utils/const.config'

@Injectable()
export class ProfileService {
	constructor(
		@InjectModel(Profile)
		private readonly profileModel: typeof Profile,
		private readonly mediaService: MediaService,
		private readonly filesService: FilesService
	) {}

	async getProfileById(profileID: string): Promise<Profile> {
		const profile = await this.profileModel.findByPk(profileID, {
			include: { all: true },
		})
		if (!profile) {
			throw new NotFoundException(`Профиль не найден`)
		}
		return profile
	}

	// в процессе доработки
	async updateProfileOptions(
		profileID: string,
		options: any
	): Promise<Profile> {
		const profile = await this.getProfileById(profileID)
		profile.options = { ...profile.options, ...options }
		await profile.save()
		return profile
	}
	// ---

	private async setAvatarFromMedia(
		profile: Profile,
		mediaID: string
	): Promise<any> {
		const transaction = await this.profileModel.sequelize.transaction()

		let savedFile: string
		const oldAvatarFilePath = profile?.avatarPath

		try {
			const media = await this.mediaService.findById(mediaID)

			if (!media) {
				throw new NotFoundException('Медиа не найдена')
			}

			// const { avatarPath } = await this.filesService.copyFromMediaToAvatar(
			// 	media?.path
			// )

			// savedFile = avatarPath

			// await profile.update(
			// 	{
			// 		avatarPath: avatarPath,
			// 	},
			// 	{
			// 		transaction,
			// 	}
			// )

			await this.filesService.removeFile(oldAvatarFilePath)

			await transaction.commit()
		} catch (e) {
			await transaction.rollback()

			await this.filesService.removeFile(savedFile)

			throw new InternalServerErrorException(
				'При создании аватара произошла ошибка\n' + e?.message
			)
		}
	}

	private async setAvatarFromFile(
		profile: Profile,
		fileForPicture: Express.Multer.File
	): Promise<any> {
		const transaction = await this.profileModel.sequelize.transaction()

		let savedFile
		const oldAvatarFilePath = profile?.avatarPath

		try {
			savedFile = await this.filesService.createTempFile(
				fileForPicture,
				FILES_CONFIG.AVATAR.TYPE,
				FILES_CONFIG_DIR.AVATAR
			)

			await profile.update(
				{
					avatarPath: savedFile.fileDBPath,
				},
				{
					transaction,
				}
			)

			await this.filesService.finalizeFile(
				savedFile.fileTempPath,
				savedFile.fileDBPath
			)

			await this.filesService.removeFile(oldAvatarFilePath)

			await transaction.commit()
		} catch (e) {
			await transaction.rollback()

			await this.filesService.removeFile(savedFile?.fileTempPath)
			await this.filesService.removeFile(savedFile?.fileDBPath)

			throw new InternalServerErrorException(
				'При создании аватара произошла ошибка \n' + e?.message
			)
		}
	}

	async updateProfileAvatar(
		uploadAvatarDto: UploadAvatarDto,
		fileForPicture: Express.Multer.File,
		profileID: string
	): Promise<{
		message: string
	}> {
		try {
			const profile = await this.getProfileById(profileID)

			if (uploadAvatarDto?.mediaID) {
				await this.setAvatarFromMedia(profile, uploadAvatarDto.mediaID)
			} else {
				await this.setAvatarFromFile(profile, fileForPicture)
			}

			return {
				message: 'Обновлено!',
			}
		} catch (e) {
			throw new InternalServerErrorException(e?.message)
		}
	}
}
