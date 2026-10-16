
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { PlayerEditionEntity } from './player-edition.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 100, nullable: true })
  nationality: string | null;

  @Column({ length: 20, nullable: true })
  gender: string | null;

  @OneToMany(
    () => PlayerEditionEntity,
    (edition) => edition.player,
  )
  editions: PlayerEditionEntity[];
}
