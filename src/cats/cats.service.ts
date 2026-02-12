import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cat } from './entities/cat.entity';
import { Breed } from 'src/breed/entities/breed.entity';
import { Repository } from 'typeorm';
import { ActiveUserInterface } from 'src/common/interfaces/active-user.interface';
import { UserRole } from 'src/common/enums/rol.enum';

@Injectable()
export class CatsService {

  constructor(
    @InjectRepository(Cat)
    private readonly catRepository: Repository<Cat>,
    @InjectRepository(Breed)
    private readonly breedRepository: Repository<Breed>,
  ) {

  }


  async create(createCatDto: CreateCatDto, user: ActiveUserInterface): Promise<Cat> {


    const breed = await this.validateBreed(Number(createCatDto.breedId));

    if (!breed) {
      throw new NotFoundException(`Breed with id ${createCatDto.breedId} not found`);
    }

    const cat = this.catRepository.create({
      ...createCatDto,
      breed: breed,
      userEmail: user.email,
    });

    return await this.catRepository.save(cat);

  }

  async findAll(user: ActiveUserInterface): Promise<Cat[]> {

    if (user.role === UserRole.ADMIN) {
      return await this.catRepository.find();
    }

    const cats = await this.catRepository.find({
      where: { userEmail: user.email },
    });

    if (cats.length === 0) {
      throw new NotFoundException(`you dont have any cats with email ${user.email}`);
    }

    return cats;
  }

  async findOne(id: number, user: ActiveUserInterface): Promise<Cat> {
    const cat = await this.catRepository.findOneBy({ id });
    if (!cat) {
      throw new NotFoundException(`Cat with id ${id} not found`);
    }

    this.validateOwner(cat, user);

    return cat;
  }

  async update(id: number, updateCatDto: UpdateCatDto, user: ActiveUserInterface): Promise<Cat> {
    const cat = await this.findOne(id, user);

    if (updateCatDto.breedId) {
      const breed = await this.validateBreed(Number(updateCatDto.breedId));
      if (!breed) {
        throw new NotFoundException(`Breed with id ${updateCatDto.breedId} not found`);
      }
      cat.breed = breed;
    }

    Object.assign(cat, updateCatDto);
    return await this.catRepository.save(cat);
  }

  async remove(id: number, user: ActiveUserInterface): Promise<Cat> {
    const cat = await this.findOne(id, user);

    this.validateOwner(cat, user);


    return await this.catRepository.softRemove(cat);
  }

  private validateOwner(cat: Cat, user: ActiveUserInterface): void {
    if (user.role !== UserRole.ADMIN && cat.userEmail !== user.email) {
      throw new UnauthorizedException(`Cat with id ${cat.id} not found for user with email ${user.email}`);
    }
  }

  private async validateBreed(breedId: number): Promise<Breed> {
    const breed = await this.breedRepository.findOneBy({ id: breedId });
    if (!breed) {
      throw new NotFoundException(`Breed with id ${breedId} not found`);
    }
    return breed;
  }
}
