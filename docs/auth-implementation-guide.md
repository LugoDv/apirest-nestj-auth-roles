# 🔐 Guía de Implementación: Módulo de Autenticación en NestJS

## 📋 Índice

1. [Instalación de Dependencias](#1-instalación-de-dependencias)
2. [Estructura del Módulo](#2-estructura-del-módulo)
3. [Configuración Inicial](#3-configuración-inicial)
4. [Implementación Paso a Paso](#4-implementación-paso-a-paso)
5. [Guards Globales](#5-guards-globales)
6. [Decoradores Personalizados](#6-decoradores-personalizados)
7. [Uso en Controladores](#7-uso-en-controladores)

---

## 1. Instalación de Dependencias

```bash
pnpm install @nestjs/jwt @nestjs/passport bcrypt
pnpm install -D @types/bcrypt
```

---

## 2. Estructura del Módulo

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── decorators/
│   │   ├── public.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── create-auth.dto.ts
│   │   └── login.dto.ts
│   └── guard/
│       ├── auth.guard.ts
│       └── roles.guard.ts
├── common/
│   ├── decorators/
│   │   └── active-user.decorator.ts
│   ├── enums/
│   │   └── rol.enum.ts
│   └── interfaces/
│       └── active-user.interface.ts
└── users/
    ├── users.module.ts
    └── users.service.ts
```

---

## 3. Configuración Inicial

### 3.1 Variables de Entorno (.env)

```env
JWT_SECRET=tu_super_secreto_jwt_aqui_cambiar_en_produccion
```

### 3.2 Enum de Roles

**`src/common/enums/rol.enum.ts`**

```typescript
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

### 3.3 Interface de Usuario Activo

**`src/common/interfaces/active-user.interface.ts`**

```typescript
export interface ActiveUserInterface {
  email: string;
  role: string;
}
```

---

## 4. Implementación Paso a Paso

### 4.1 DTOs (Data Transfer Objects)

**`src/auth/dto/create-auth.dto.ts`**

```typescript
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../common/enums/rol.enum';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

**`src/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
```

---

### 4.2 Auth Module

**`src/auth/auth.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true, // ✅ JWT disponible globalmente
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'JWT_SECRET must be defined in environment variables',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '1d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
```

**📝 Puntos clave:**

- `global: true` → No necesitas importar JwtModule en otros módulos
- `registerAsync` → Permite usar ConfigService para variables de entorno
- `expiresIn: '1d'` → Token válido por 1 día

---

### 4.3 Auth Service

**`src/auth/auth.service.ts`**

```typescript
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../common/enums/rol.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signup({ name, email, password, role }: CreateAuthDto) {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      throw new BadRequestException('User already exists');
    }

    const newUser = {
      name,
      email,
      password: await bcrypt.hash(password, 10), // 🔒 Hash con bcrypt
      role: role || UserRole.USER,
    };

    const createdUser = await this.usersService.create(newUser);
    const { password: _, ...result } = createdUser;

    return result;
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credentials are not valid');
    }

    // 🎫 Crear payload del JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return { access_token: token };
  }

  async profile({ email }: { email: string }) {
    return await this.usersService.findOneByEmail(email);
  }
}
```

**📝 Puntos clave:**

- `bcrypt.hash(password, 10)` → 10 rounds de salt
- `bcrypt.compare()` → Verifica password hasheado
- **No uses try-catch** → NestJS lo maneja automáticamente
- JWT payload: `{ sub, email, role }`

---

### 4.4 Auth Controller

**`src/auth/auth.controller.ts`**

```typescript
import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { UserRole } from '../common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { ActiveUserInterface } from 'src/common/interfaces/active-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() // 🔓 Ruta pública
  @Post('signup')
  signup(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.signup(createAuthDto);
  }

  @Public() // 🔓 Ruta pública
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Roles(UserRole.USER) // 🔒 Requiere rol USER
  @ApiBearerAuth()
  @Get('profile')
  profile(@ActiveUser() user: ActiveUserInterface) {
    return this.authService.profile(user);
  }
}
```

---

## 5. Guards Globales

### 5.1 AuthGuard (JWT Verification)

**`src/auth/guard/auth.guard.ts`**

```typescript
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ✅ Verificar si la ruta es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      // 🔑 Verificar y decodificar JWT
      const payload = await this.jwtService.verifyAsync(token);
      // 💾 Guardar usuario en request
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**📝 Flujo de ejecución:**

1. Verifica si ruta es `@Public()`
2. Extrae token del header `Authorization: Bearer <token>`
3. Verifica token con `jwtService.verifyAsync()`
4. Guarda payload en `request.user`

---

### 5.2 RolesGuard (Authorization)

**`src/auth/guard/roles.guard.ts`**

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '../../common/enums/rol.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // ✅ Verificar si es pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // 🎭 Obtener rol requerido
    const requiredRole = this.reflector.getAllAndOverride<UserRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sin rol requerido = acceso libre
    if (!requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // 👑 Admin tiene acceso a todo
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // ✅ Verificar rol exacto
    return requiredRole === user.role;
  }
}
```

**📝 Orden de ejecución:**

1. Rutas públicas → permitir
2. Sin rol requerido → permitir
3. Usuario ADMIN → permitir siempre
4. Comparar rol requerido con rol del usuario

---

### 5.3 Registrar Guards Globalmente

**`src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RolesGuard } from './auth/guard/roles.guard';

@Module({
  imports: [
    // ... otros módulos
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // 🔒 1er guard: verifica JWT
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // 🎭 2do guard: verifica roles
    },
  ],
})
export class AppModule {}
```

**⚠️ IMPORTANTE:** El orden importa:

1. `AuthGuard` → Verifica token y carga `request.user`
2. `RolesGuard` → Usa `request.user` para verificar roles

---

## 6. Decoradores Personalizados

### 6.1 @Public() Decorator

**`src/auth/decorators/public.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Uso:**

```typescript
@Public()
@Post('login')
login() { ... }
```

---

### 6.2 @Roles() Decorator

**`src/auth/decorators/roles.decorator.ts`**

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../common/enums/rol.enum';

export const ROLES_KEY = 'roles';
export const Roles = (role: UserRole) => SetMetadata(ROLES_KEY, role);
```

**Uso:**

```typescript
@Roles(UserRole.ADMIN)
@Get('admin-only')
adminRoute() { ... }
```

---

### 6.3 @ActiveUser() Decorator

**`src/common/decorators/active-user.decorator.ts`**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Inyecta payload del JWT
  },
);
```

**Uso:**

```typescript
@Get('profile')
profile(@ActiveUser() user: ActiveUserInterface) {
  console.log(user.email, user.role);
  return user;
}
```

---

## 7. Uso en Controladores

### 7.1 Ejemplo Completo

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserRole } from 'src/common/enums/rol.enum';
import type { ActiveUserInterface } from 'src/common/interfaces/active-user.interface';

@Controller('cats')
export class CatsController {
  // 🔓 Pública - sin autenticación
  @Public()
  @Get('public')
  publicRoute() {
    return { message: 'Acceso público' };
  }

  // 🔒 Requiere autenticación (cualquier usuario)
  @ApiBearerAuth()
  @Get()
  findAll(@ActiveUser() user: ActiveUserInterface) {
    console.log('Usuario:', user.email);
    return [];
  }

  // 👤 Solo usuarios con rol USER
  @Roles(UserRole.USER)
  @ApiBearerAuth()
  @Post()
  create(@ActiveUser() user: ActiveUserInterface) {
    return { owner: user.email };
  }

  // 👑 Solo ADMIN
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Get('admin')
  adminOnly() {
    return { message: 'Solo admin' };
  }
}
```

---

## 8. Configuración de Swagger

En `main.ts`:

```typescript
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth() // 🔑 Habilita auth en Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
```

---

## 9. Testing con Swagger/Postman

### 9.1 Registro

```http
POST /auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456",
  "role": "user"
}
```

### 9.2 Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}
```

**Respuesta:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 9.3 Usar Token

```http
GET /auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 10. Checklist de Implementación

- [ ] Instalar dependencias: `@nestjs/jwt`, `bcrypt`
- [ ] Crear enum `UserRole`
- [ ] Crear interface `ActiveUserInterface`
- [ ] Crear DTOs: `CreateAuthDto`, `LoginDto`
- [ ] Configurar `JwtModule.registerAsync()` con `ConfigService`
- [ ] Implementar `AuthService` con `bcrypt.hash()` y `bcrypt.compare()`
- [ ] Crear `AuthGuard` con verificación JWT
- [ ] Crear `RolesGuard` con verificación de roles
- [ ] Registrar guards globalmente en `AppModule`
- [ ] Crear decoradores: `@Public()`, `@Roles()`, `@ActiveUser()`
- [ ] Configurar Swagger con `addBearerAuth()`
- [ ] Probar endpoints públicos y protegidos

---

## 11. Errores Comunes y Soluciones

### ❌ "JWT_SECRET must be defined"

**Solución:** Verifica que `.env` tenga `JWT_SECRET=tu_secreto`

### ❌ "Unauthorized" en todas las rutas

**Solución:** Marca rutas públicas con `@Public()`

### ❌ Guards no funcionan

**Solución:** Verifica orden en `AppModule`:

1. `AuthGuard` primero
2. `RolesGuard` segundo

### ❌ `request.user` es `undefined`

**Solución:** `AuthGuard` debe ejecutarse antes que `RolesGuard`

---

## 12. Recursos Adicionales

- [NestJS JWT Documentation](https://docs.nestjs.com/security/authentication)
- [bcrypt NPM](https://www.npmjs.com/package/bcrypt)
- [Guards NestJS](https://docs.nestjs.com/guards)

---

**🎉 ¡Implementación completa!** Guarda este documento para futuras referencias.
