import { Cat } from "src/cats/entities/cat.entity";
import { UserRole } from "src/common/enums/rol.enum";
import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  name: string;
  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false })
  password: string;

  @Column({ default: UserRole.USER, enum: UserRole })
  role: UserRole;

  @OneToMany(() => Cat, (cat) => cat.user)
  cats: Cat[];

  @DeleteDateColumn()
  deletedAt: Date;
}
