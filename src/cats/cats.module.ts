import { Module } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CatsController } from './cats.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cat } from './entities/cat.entity';
import { BreedModule } from 'src/breed/breed.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cat]),
    BreedModule
  ],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule { }
