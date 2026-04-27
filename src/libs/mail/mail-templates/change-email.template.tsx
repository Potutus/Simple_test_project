import { Body, Heading, Link, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from 'react'

interface ChangeEmailTemplateProps {
	domain: string
	token: string
}

export function ChangeEmailTemplate({
	domain,
	token,
}: ChangeEmailTemplateProps) {
	const confirmLink = `${domain}/auth/new-email?token=${token}`

	return (
		<Tailwind>
			<Html>
				<Body className="text-black">
					<Heading>Подтверждение смены почты</Heading>
					<Text>
						Привет! Чтобы подтвердить свой адрес электронной почты, и продолжит
						изменение, пожалуйста, перейдите по следующей ссылке:
					</Text>
					<Link href={confirmLink}>Подтвердить почту, и продолжить</Link>
					<Text>
						Эта ссылка действительна в течение 1 часа. Если вы не запрашивали
						подтверждение текущей почты на нашем ресурсе, просто проигнорируйте
						это сообщение.
					</Text>
				</Body>
			</Html>
		</Tailwind>
	)
}
