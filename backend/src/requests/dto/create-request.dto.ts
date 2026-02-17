import { IsString, MinLength } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @MinLength(1)
  clientName!: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsString()
  @MinLength(1)
  address!: string;

  @IsString()
  @MinLength(1)
  problemText!: string;
}
