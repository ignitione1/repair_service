import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  name!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
