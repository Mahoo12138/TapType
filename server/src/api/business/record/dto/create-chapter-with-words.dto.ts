import { Uuid } from '@/common/types/common.type';
import { IsArray, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LetterMistakes } from '../entities/word-record.entity';

export class CreateWordRecordInChapterDto {
  @IsUUID()
  @IsOptional()
  wordId?: Uuid;

  @IsString()
  @Length(1, 100)
  wordName: string;

  @IsArray()
  @IsNumber({}, { each: true })
  timing: number[];

  @IsInt()
  wrongCount: number;

  @IsObject()
  mistakes: LetterMistakes;
}

export class CreateChapterWithWordsDto {
  @IsUUID()
  dict: Uuid;

  @IsNumber()
  time: number;

  @IsInt()
  correctCount: number;

  @IsInt()
  wrongCount: number;

  @IsInt()
  wordCount: number;

  @IsArray()
  @IsInt({ each: true })
  correctWordIndexes: number[];

  @IsInt()
  wordNumber: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWordRecordInChapterDto)
  wordRecords: CreateWordRecordInChapterDto[];
} 