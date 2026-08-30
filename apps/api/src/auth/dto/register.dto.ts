import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alex@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Alex Morgan' })
  @IsString()
  @Length(2, 100)
  displayName!: string;

  @ApiProperty({ example: 'alex_morgan' })
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/, {
    message:
      'username must contain lowercase letters, numbers, underscores, or hyphens',
  })
  username!: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}
