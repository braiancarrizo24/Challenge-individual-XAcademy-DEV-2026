
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
@Index(['playerId', 'edition'], { unique: true })
export class PlayerEditionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_id' })
  playerId: number;

  @ManyToOne(
    () => PlayerEntity,
    (player) => player.editions,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'player_id' })
  player: PlayerEntity;

  @Column({ type: 'int' })
  edition: number;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ length: 150, nullable: true })
  club: string | null;

  @Column({ length: 80, nullable: true })
  position: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @OneToMany(
    () => PlayerSkillEntity,
    (skill) => skill.playerEdition,
  )
  skills: PlayerSkillEntity[];
}
