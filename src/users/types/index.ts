import { ApiProperty } from '@nestjs/swagger';

export class LoginUserRequest {
  @ApiProperty({ example: 'Petro' })
  username: string;

  @ApiProperty({ example: 'Petro123' })
  password: string;
}

export class CreateUserDtoRequest {
    @ApiProperty({ example: 'Petro' })
    username: string;
  
    @ApiProperty({ example: 'Petro123' })
    password: string;
  
    @ApiProperty({ example: 'Petro@mail.ru' })
    email: string;
}

export class LoginUserResponse {
  @ApiProperty({
    example: {
      user: {
        userId: 1,
        username: 'Petro',
        password: 'Petro123',
      },
    },
  })
  user: {
    userId: number;
    username: string;
    password: string;
  };

  @ApiProperty({ example: 'Вошёл! (сказала она)' })
  msg: string;
}

export class LogoutUserResponse {
  @ApiProperty({ example: 'Сессия закончена' })
  msg: string;
}

export class LoginCheckResponse {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'Petro' })
  username: string;

  @ApiProperty({ example: 'Petro@mail.ru' })
  email: string;
}

export class SignupResponse {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Petro' })
  username: string;

  @ApiProperty({
    example: '$2b$10$90H0Hn.6Nx0SbrHQCX2xeeYjq.02nS5VpkIIwFAtDtCHEqHK',
  })
  password: string;

  @ApiProperty({ example: 'Petro@mail.ru' })
  email: string;

  @ApiProperty({ example: '2024-06-17T17:23:33.502Z' })
  updatedAt: string;

  @ApiProperty({ example: '2024-06-17T17:23:33.502Z' })
  createdAt: string;
}


export class GetAllUsers {
  @ApiProperty({
    example: {
      users: [
        {
          userId: '1',
          username: 'abc',
          email: 'abc@mail.ru'
        },
        {
          userId: '2',
          username: 'cba',
          email: 'cba@mail.ru'
        },
      ]
    },
  })
  users: [
    {
      userId: number;
      username: string;
      email: string;
    }
  ];
}
