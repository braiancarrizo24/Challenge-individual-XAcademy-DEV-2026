import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, {
    message: 'El email ingresado no es válido.',
  })
  @IsNotEmpty({
    message: 'El email es obligatorio.',
  })
  @MaxLength(191)
  email: string;

  @IsString({
    message: 'La contraseña debe ser un texto.',
  })
  @IsNotEmpty({
    message: 'La contraseña es obligatoria.',
  })
  @MaxLength(72)
  password: string;
}