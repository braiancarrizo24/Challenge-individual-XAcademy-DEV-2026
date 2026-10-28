
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlayerEntity } from './player.entity';
import { PlayerSkillEntity } from './player-skill.entity';

@Entity('player_editions')
@Index(
  ['playerId', 'edition', 'fifaUpdate'],
  { unique: true },
)
export class PlayerEditionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_id', type: 'int' })
  playerId: number;

  @ManyToOne(
    () => PlayerEntity,
    (player) => player.editions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ name: 'fifa_version', type: 'int' })
  edition: number;

  @Column({ name: 'fifa_update', type: 'int' })
  fifaUpdate: number;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  club: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  position: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'int', nullable: true })
  potential: number | null;

  @Column({
    name: 'value_eur',
    type: 'bigint',
    nullable: true,
  })
  valueEur: string | null;

  @Column({
    name: 'wage_eur',
    type: 'bigint',
    nullable: true,
  })
  wageEur: string | null;

  @OneToMany(
    () => PlayerSkillEntity,
    (skill) => skill.playerEdition,
  )
  skills: PlayerSkillEntity[];
}

