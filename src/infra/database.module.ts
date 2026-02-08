import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Importamos el módulo de configuración
      inject: [ConfigService], // Inyectamos el servicio para leer el .env
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', // Cambiamos a postgres como instalamos antes
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true, // Carga automáticamente las entidades
        synchronize: true, // Úsalo solo en desarrollo
        logging: true, // Habilita el logging para ver las consultas SQL
      }),
    }),
  ],
})
export class DatabaseModule { }