import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { UserRole } from "../enums/rol.enum";


@Injectable()
export class RolesGuard implements CanActivate {

  constructor(private readonly reflector: Reflector) { }


  canActivate(context: ExecutionContext): boolean {

    console.log('👮 RolesGuard ejecutándose...');

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      console.log('✅ Ruta pública en RolesGuard');
      return true;
    }

    const requiredRole = this.reflector.getAllAndOverride<UserRole>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log('🔍 RolesGuard Debug:');

    console.log('Match:', requiredRole === user?.role);

    return requiredRole === user.role;
  }


}