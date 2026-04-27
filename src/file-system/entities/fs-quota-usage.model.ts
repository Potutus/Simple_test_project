import { Column, DataType, Model, Table } from 'sequelize-typescript'

export enum QuotaBaseLimitBytes {
	BASE_GB5 = 5 * 1024 * 1024 * 1024,
	EXPANDED_GB10 = 10 * 1024 * 1024 * 1024,
	ADMIN_GB20 = 20 * 1024 * 1024 * 1024,
	SUPERADMIN_GB50 = 50 * 1024 * 1024 * 1024,
}

export interface QuotaUsageCreateAttr {
	userID: string
	usedBytes: bigint
	limitBytes: bigint
}

@Table({ tableName: 'fs_quota_usage' })
export class FSQuotaUsage extends Model<FSQuotaUsage, QuotaUsageCreateAttr> {
	@Column({
		type: DataType.UUID,
		primaryKey: true,
		allowNull: false,
		unique: true,
	})
	userID: string

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		defaultValue: 0,
		comment: 'Bytes',
	})
	usedBytes: bigint

	@Column({
		type: DataType.BIGINT,
		allowNull: false,
		defaultValue: QuotaBaseLimitBytes.BASE_GB5,
		comment: 'Bytes',
	})
	limitBytes: bigint
}
