import { IsString, MinLength } from 'class-validator';

export class AssignRequestDto {
  @IsString()
  @MinLength(1)
  masterId!: string;
}
