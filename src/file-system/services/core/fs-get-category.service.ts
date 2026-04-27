import { MediaType } from 'src/media/entities/media.model'
import { FSSystemDomain } from '../../entities/file-system-node.model'

const getCategoryFromMime = (mime: string): MediaType => {
	if (mime.startsWith('image/')) return MediaType.IMAGE
	if (mime.startsWith('video/')) return MediaType.VIDEO
	if (mime.startsWith('audio/')) return MediaType.AUDIO
}

const getFavoritesSystemDomainFromCategory = (
	mediaType: MediaType
): FSSystemDomain => {
	if (mediaType === MediaType.IMAGE) return FSSystemDomain.IMAGE
	if (mediaType === MediaType.VIDEO) return FSSystemDomain.VIDEO
	if (mediaType === MediaType.AUDIO) return FSSystemDomain.AUDIO
}

export { getCategoryFromMime, getFavoritesSystemDomainFromCategory }
