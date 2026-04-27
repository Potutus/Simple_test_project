import { Body, Heading, Tailwind, Text } from '@react-email/components'
import { Html } from '@react-email/html'
import * as React from 'react'

interface OldEmailConfirmationTemplateProps {
	token: string
}

export function OldEmailConfirmationTemplate({
	token,
}: OldEmailConfirmationTemplateProps) {
	return (
		<Tailwind>
			<Html>
				<Body className="text-black">
					<Heading>Подтверждение изменения почты</Heading>
					<Text>
						Ваш код для подтверждения изменения почты: <strong>{token}</strong>
					</Text>
					<Text>
						Пожалуйста, введите этот код в приложении для завершения процесса
						смены почты.
					</Text>
					<Text>
						Если вы не запрашивали этот код, просто проигнорируйте это
						сообщение.
					</Text>
				</Body>
			</Html>
		</Tailwind>
	)
}
