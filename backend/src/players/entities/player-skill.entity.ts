
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlayerEditionEntity } from './player-edition.entity';

@Entity('player_skills')
@Index(['playerEditionId', 'skill'], { unique: true })
export class PlayerSkillEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'player_edition_id' })
  playerEditionId: number;

  @ManyToOne(
    () => PlayerEditionEntity,
    (edition) => edition.skills,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'player_edition_id' })
  playerEdition: PlayerEditionEntity;

  @Column({ length: 80 })
  skill: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  value: number;
}

