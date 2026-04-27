import {
	BadRequestException,
	NotFoundException,
	ConflictException,
} from '@nestjs/common'
import { InternalBusinessException } from 'src/exception/internal-business.exception'

export const FsErrorHandler = (e: any) => {
	const constraint = e.parent?.constraint

	if (
		constraint === 'ix_fs_unique_name_children' ||
		constraint === 'ix_fs_unique_name_root'
	) {
		throw new BadRequestException('У вас уже есть папка/файл с таким названием')
	}

	if (
		e instanceof BadRequestException ||
		e instanceof InternalBusinessException ||
		e instanceof ConflictException ||
		e instanceof NotFoundException
	) {
		throw e
	}

	throw new InternalBusinessException('Что-то пошло не так')
}
