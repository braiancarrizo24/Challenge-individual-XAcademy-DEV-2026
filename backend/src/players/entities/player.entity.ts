
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from 'typeorm';
import { PlayerEditionEntity } from './player-edition.entity';

@Entity('players')
@Index(['sourcePlayerId', 'gender'], { unique: true })
export class PlayerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'source_player_id', type: 'int' })
  sourcePlayerId: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 20 })
  gender: string;

  @OneToMany(
    () => PlayerEditionEntity,
    (edition) => edition.player,
  )
  editions: PlayerEditionEntity[];
}

