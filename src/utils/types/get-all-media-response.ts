import { GetMediaDataResponse } from './get-medias.type'

export interface MediaGetAllResponse {
	count: number
	rows: GetMediaDataResponse[]
}
