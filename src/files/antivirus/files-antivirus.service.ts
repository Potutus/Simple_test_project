import { BadRequestException } from '@nestjs/common'
import { createScanner } from 'clamdjs'

export class AntivirusService {
	private clamScanner

	constructor() {
		this.clamScanner = createScanner(
			process.env.ANTIVIRUS_HOST,
			process.env.ANTIVIRUS_PORT
		)
	}

	//доработать
	async scanBuffer(fileBuffer: Buffer): Promise<void> {
		try {
			const result = await this.clamScanner.scanBuffer(fileBuffer, 60000)

			if (result != 'stream: OK') {
				//throw new BadRequestException('Файл инфицирован или подозрительный')
			}

			console.log('Файл чистый')
		} catch (e) {
			//throw new BadRequestException('Проверка файла не удалась')
		}
	}
}
