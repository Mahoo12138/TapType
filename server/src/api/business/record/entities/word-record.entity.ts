import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { WordEntity } from '../../word/entities/word.entity';
import { ChapterRecordEntity } from './chapter-record.entity';

export interface LetterMistakes {
  [index: number]: string[];
}

@Entity('word_record')
export class WordRecordEntity extends AbstractEntity {
  constructor(data?: Partial<WordRecordEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_word_record_id',
  })
  id!: Uuid;

  // 添加与记录的关系
  @Column({ type: 'uuid', nullable: true, comment: '记录ID' })
  chapterRecordId: Uuid | null;

  @ManyToOne(() => ChapterRecordEntity, chapterRecord => chapterRecord.words, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'chapterRecordId' })
  chapterRecord: Relation<ChapterRecordEntity>;

  @Column({ type: 'uuid', comment: '词典ID' })
  dictId: Uuid;

  @ManyToOne(() => WordEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'wordId' })
  word: Relation<WordEntity>;

  @Column({ type: 'uuid', comment: '单词ID' })
  wordId: Uuid;

  @Column({ length: 100, comment: '练习的单词' })
  wordName: string;

  @Column({ type: 'int', array: true, comment: '每个字母的输入时间差（毫秒）' })
  timing: number[];

  @Column({ type: 'int', default: 0, comment: '出错次数' })
  wrongCount: number;

  @Column({ type: 'jsonb', comment: '每个字母的错误输入记录' })
  mistakes: LetterMistakes;

  @Column({ type: 'uuid', comment: '用户ID' })
  userId: Uuid;
}
