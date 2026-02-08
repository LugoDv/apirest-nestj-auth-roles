import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { UpdateCatDto } from './dto/update-cat.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cat } from './entities/cat.entity';
import { Breed } from 'src/breed/entities/breed.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CatsService {

  constructor(
    @InjectRepository(Cat)
    private readonly catRepository: Repository<Cat>,
    @InjectRepository(Breed)
    private readonly breedRepository: Repository<Breed>,
  ) {

  }

  async create(createCatDto: CreateCatDto): Promise<Cat> {

    const breed = await this.breedRepository.findOneBy({ id: createCatDto.breedId });

    if (!breed) {
      throw new NotFoundException(`Breed with id ${createCatDto.breedId} not found`);
    }

    const cat = this.catRepository.create({
      ...createCatDto,
      breed: breed,
    });

    return await this.catRepository.save(cat);

  }

  async findAll(): Promise<Cat[]> {
    return await this.catRepository.find();
  }

  async findOne(id: number): Promise<Cat> {
    const cat = await this.catRepository.findOneBy({ id });
    if (!cat) {
      throw new NotFoundException(`Cat with id ${id} not found`);
    }
    return cat;
  }

  async update(id: number, updateCatDto: UpdateCatDto) {
    const cat = await this.findOne(id);

    if (updateCatDto.breedId) {
      const breed = await this.breedRepository.findOneBy({ id: updateCatDto.breedId });
      if (!breed) {
        throw new NotFoundException(`Breed with id ${updateCatDto.breedId} not found`);
      }
      cat.breed = breed;
    }

    Object.assign(cat, updateCatDto);
    return await this.catRepository.save(cat);
  }

  async remove(id: number) {
    const cat = await this.catRepository.findOneBy({ id });
    if (!cat) {
      throw new NotFoundException(`Cat with id ${id} not found`);
    }
    return await this.catRepository.softRemove(cat);
  }
}
