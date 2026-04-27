import 'express-session'

declare module 'express-session' {
	interface SessionData {
		userId: string
		username: string
		email: string
		profileId: string
		roles: { id: string; value: string; description: string }[]
	}
}
