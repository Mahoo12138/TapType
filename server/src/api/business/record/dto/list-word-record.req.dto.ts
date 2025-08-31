import { PageOptionsDto } from '@/common/dto/offset-pagination/page-options.dto';
import { Uuid } from '@/common/types/common.type';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ListWordRecordReqDto extends PageOptionsDto {
  @IsOptional()
  @IsUUID()
  dictId?: Uuid;

  @IsOptional()
  @IsUUID()
  chapterRecordId?: Uuid;

  @IsOptional()
  @IsString()
  wordName?: string;
}