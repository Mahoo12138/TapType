import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Uuid } from '@/common/types/common.type';
import { AbstractEntity } from '@/database/entities/abstract.entity';
import { WordRecordEntity } from './word-record.entity';

@Entity('chapter_record')
export class ChapterRecordEntity extends AbstractEntity {
  constructor(data?: Partial<ChapterRecordEntity>) {
    super();
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_chapter_record_id',
  })
  id!: Uuid;

  @Column({ type: 'uuid', comment: '词典 Id' })
  dict: Uuid;

  @Column({ type: 'int', comment: '练习时间（秒）' })
  time: number;

  @Column({ type: 'int', comment: '正确按键次数' })
  correctCount: number;

  @Column({ type: 'int', comment: '错误按键次数' })
  wrongCount: number;

  @Column({ type: 'int', comment: '用户输入的单词总数' })
  wordCount: number;

  @Column({ type: 'int', array: true, comment: '一次打对未犯错的单词索引列表' })
  correctWordIndexes: number[];

  @Column({ type: 'int', comment: '章节总单词数' })
  wordNumber: number;

  // 添加与单词记录的一对多关系
  @OneToMany(() => WordRecordEntity, wordRecord => wordRecord.chapterRecord)
  words: WordRecordEntity[];

  @Column({ type: 'uuid', comment: '用户ID' })
  userId: Uuid;
}