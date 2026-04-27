import * as session from 'express-session'
import * as passport from 'passport'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from './pipes/validation.pipes'
import { NestExpressApplication } from '@nestjs/platform-express'

import Redis from 'ioredis'
import { RedisStore } from 'connect-redis'

import helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import * as csurf from 'csurf'
import { ConfigService } from '@nestjs/config'
import { StringValue, ms } from './libs/common/utils/ms.utils'
import { parseBoolean } from './libs/common/utils/parse-boolean.utils'

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule)

	const config = app.get(ConfigService)

	const redisClient = new Redis(config.getOrThrow<string>('REDIS_URI'))

	const APPLICATION_PORT = config.getOrThrow<number>('APPLICATION_PORT')

	app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

	app.useGlobalPipes(new ValidationPipe())

	// Работа с шапкой ---
	app.disable('x-powered-by')

	app.setGlobalPrefix('api')

	app.use(
		helmet({
			// по идее это нужно только в случаи если мы html передаем, просто для примера решил оставить,
			contentSecurityPolicy: {
				directives: {
					defaultSrc: ["'self'"], // Разрешаем загрузку только с нашего домена
					scriptSrc: ["'self'", "'unsafe-inline'"], // Скрипты только с нашего домена
					objectSrc: ["'none'"], // Запрещаем использование тега <object>
					imgSrc: ["'self'", 'data:'], // Разрешаем изображения только с нашего домена и через data: URI
					fontSrc: ["'self'", 'https:'], // Разрешаем шрифты только с нашего домена и через HTTPS
					connectSrc: ["'self'"], // Ограничиваем подключения только нашим сервером
					upgradeInsecureRequests: [], // Принудительное обновление незащищённых запросов
				},
			},
			crossOriginEmbedderPolicy: true, // Запрет кросс-оригин встраивания
			crossOriginOpenerPolicy: { policy: 'same-origin' }, // Защита от кросс-оригин взаимодействий
			crossOriginResourcePolicy: { policy: 'same-origin' }, // Ограничиваем доступ к ресурсам только с одного источника
			referrerPolicy: { policy: 'no-referrer' }, // Запрещаем передачу реферера
			hsts: true, // process.env.NODE_ENV === 'production' Включаем строгую транспортную безопасность ( --- )
			noSniff: true, // Защита от XSS атак
			xssFilter: true, // Включаем XSS-фильтр
			frameguard: {
				action: 'deny', // Запрещает загрузку в iframe
			},
			hidePoweredBy: true,
		})
	)
	// Конец работы с шапкой ---

	const allowed_origins =
		config.getOrThrow<string>('ALLOWED_ORIGINS').split(',') ||
		new Array<string>()

	app.enableCors({
		origin: allowed_origins,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-CSRF-Token',
			'CSRF-Token',
		],
		exposedHeaders: ['set-cookie'],
	})

	app.use(
		session({
			name: config.getOrThrow<string>('SESSION_NAME'),
			secret: config.getOrThrow<string>('SESSION_SECRET'),
			resave: false,
			saveUninitialized: false,
			cookie: {
				domain: config.getOrThrow<string>('SESSION_DOMAIN'),
				httpOnly: parseBoolean(config.getOrThrow<string>('SESSION_HTTP_ONLY')),
				secure: parseBoolean(config.getOrThrow<StringValue>('SESSION_SECURE')),
				maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
				sameSite: 'lax',
			},
			store: new RedisStore({
				client: redisClient,
				prefix: config.getOrThrow<string>('SESSION_FOLDER'),
			}),
		})
	)

	app.use(passport.initialize())
	app.use(passport.session())

	// app.use(new CsrfMiddleware().use)

	//документация
	const DocumentConfig = new DocumentBuilder()
		.setTitle('НАШ api')
		.setDescription('api документация')
		.setVersion('1.0')
		.addTag('api')
		.build()
	const document = SwaggerModule.createDocument(app, DocumentConfig)
	SwaggerModule.setup('/api/docs', app, document)
	// ---

	await app.listen(APPLICATION_PORT, () =>
		console.log(`Server started on port = ${APPLICATION_PORT}`)
	)
}
bootstrap()
