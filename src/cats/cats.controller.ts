import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/rol.enum';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import type { ActiveUserInterface } from 'src/common/interfaces/active-user.interface';


@Roles(UserRole.USER)
@ApiBearerAuth()
@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) { }

  @Post()

  create(@Body() createCatDto: CreateCatDto, @ActiveUser() user: ActiveUserInterface) {
    return this.catsService.create(createCatDto, user);
  }

  @Get()
  findAll(@ActiveUser() user: ActiveUserInterface) {
    return this.catsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @ActiveUser() user: ActiveUserInterface) {
    return this.catsService.findOne(+id, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto, @ActiveUser() user: ActiveUserInterface) {
    return this.catsService.update(+id, updateCatDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @ActiveUser() user: ActiveUserInterface) {
    return this.catsService.remove(+id, user);
  }
}
