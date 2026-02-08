import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infra/database.module';
import { BreedModule } from './breed/breed.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';


@Module({
  imports: [CatsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Asegúrate de tener un archivo .env en la raíz del proyecto
    }),
    DatabaseModule,
    BreedModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
