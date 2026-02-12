import { IsEmail, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateCatDto {

  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @IsPositive()
  age: number;

  @IsNumber()
  @IsOptional()
  breedId?: number;


}
