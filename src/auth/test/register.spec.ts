import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AuthService } from '../auth.service'
import { AppModule } from 'src/app.module'

describe('AuthController (e2e)', () => {
	let app: INestApplication
	let authService: AuthService

	const testUser = {
		username: 'testuser123',
		email: 'test123@example.com',
		password: 'TestPass123!',
		passwordRepeat: 'TestPass123!',
	}

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile()

		app = moduleFixture.createNestApplication()

		// Важно! Включаем ValidationPipe точно так же, как в main.ts
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			})
		)

		await app.init()

		authService = moduleFixture.get<AuthService>(AuthService)
	})

	afterAll(async () => {
		await app.close()
	})

	// ====================== REGISTER ======================
	describe('POST /auth/register', () => {
		it('должен успешно зарегистрировать пользователя', async () => {
			const res = await request(app.getHttpServer())
				.post('/auth/register') // ← поменяй путь, если у тебя другой
				.send(testUser)
				.expect(201) // или 200 — смотри твой контроллер

			expect(res.body).toHaveProperty('message')
			expect(res.body.message).toContain('зарегистрировались')
			expect(res.body.user.username).toBe(testUser.username)
		})

		it('должен вернуть ошибку при существующем username', async () => {
			await request(app.getHttpServer())
				.post('/auth/register')
				.send(testUser)
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toContain(
						'Пользователь с таким именем уже существует'
					)
				})
		})

		it('должен вернуть ошибку при существующем email', async () => {
			const duplicateEmail = { ...testUser, username: 'anotheruser' }
			await request(app.getHttpServer())
				.post('/auth/register')
				.send(duplicateEmail)
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toContain(
						'Пользователь с таким email уже существует'
					)
				})
		})

		it('должен провалить валидацию при слабом пароле', async () => {
			const weakPass = { ...testUser, password: '123', passwordRepeat: '123' }
			await request(app.getHttpServer())
				.post('/auth/register')
				.send(weakPass)
				.expect(400)
		})

		it('должен провалить валидацию при несовпадении паролей', async () => {
			const mismatch = { ...testUser, passwordRepeat: 'WrongPass123!' }
			await request(app.getHttpServer())
				.post('/auth/register')
				.send(mismatch)
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toContain('Пароли не совпадают')
				})
		})
	})

	// ====================== LOGIN ======================
	describe('POST /auth/login', () => {
		it('должен успешно войти с корректными данными', async () => {
			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					username: testUser.username,
					password: testUser.password,
				})
				.expect(200) // или 201

			expect(res.body.message).toBe('Вход выполнен успешно!')
			// Если используешь сессии, можно проверить cookie
			expect(res.headers['set-cookie']).toBeDefined()
		})

		it('должен вернуть ошибку при неверном пароле', async () => {
			await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					username: testUser.username,
					password: 'WrongPassword123!',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toBe('Неверное имя пользователя или пароль')
				})
		})

		it('должен вернуть ошибку при несуществующем пользователе', async () => {
			await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					username: 'nonexistentuser',
					password: 'AnyPass123!',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body.message).toBe('Неверное имя пользователя или пароль')
				})
		})

		it('должен потребовать подтверждение email, если пользователь не подтверждён', async () => {
			// Создай пользователя без подтверждения (или используй сервис напрямую)
			await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					username: testUser.username,
					password: testUser.password,
				})
				.expect(401)
				.expect((res) => {
					expect(res.body.message).toContain('Ваш email не подтвержден')
				})
		})

		it('должен запросить 2FA код, если двухфакторка включена', async () => {
			// Предполагаем, что у тестового пользователя включена 2FA
			const res = await request(app.getHttpServer())
				.post('/auth/login')
				.send({
					username: testUser.username,
					password: testUser.password,
				})
				.expect(200)

			expect(res.body.message).toContain('двухфакторной аутентификации')
		})
	})

	// ====================== LOGOUT ======================
	describe('POST /auth/logout', () => {
		it('должен успешно выйти и очистить сессию', async () => {
			// Сначала логинимся
			const loginRes = await request(app.getHttpServer())
				.post('/auth/login')
				.send({ username: testUser.username, password: testUser.password })

			const cookies = loginRes.headers['set-cookie']

			await request(app.getHttpServer())
				.post('/auth/logout')
				.set('Cookie', cookies)
				.expect(200)
				.expect((res) => {
					expect(res.body.message).toBe('Выход выполнен успешно!')
				})
		})
	})
})
