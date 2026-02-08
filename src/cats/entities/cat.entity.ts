import { Breed } from "src/breed/entities/breed.entity";
import { Column, DeleteDateColumn, Entity, ManyToOne } from "typeorm";

@Entity()
export class Cat {

  @Column({ primary: true, generated: true })
  id: number;

  @Column()
  name: string;

  @Column()
  age: number;

  @ManyToOne(() => Breed, (breed) => breed.id, { eager: true })
  breed: Breed;

  @DeleteDateColumn()
  deletedAt: Date;
}
