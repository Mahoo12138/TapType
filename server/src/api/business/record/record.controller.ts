import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiPaginatedResponse } from '@/decorators/swagger.decorators';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChapterRecordResDto } from './dto/chapter-record.res.dto';
import { CreateChapterRecordDto } from './dto/create-chapter-record.dto';
import { CreateChapterWithWordsDto } from './dto/create-chapter-with-words.dto';
import { CreateWordRecordDto } from './dto/create-word-record.dto';
import { ListChapterRecordReqDto } from './dto/list-chapter-record.req.dto';
import { ListWordRecordReqDto } from './dto/list-word-record.req.dto';
import { WordRecordResDto } from './dto/word-record.res.dto';
import { ChapterRecordEntity } from './entities/chapter-record.entity';
import { WordRecordEntity } from './entities/word-record.entity';
import { RecordService } from './record.service';

@ApiTags('Record')
@Controller({
  version: '1',
  path: 'record',
})
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Post('chapter')
  @ApiOperation({ summary: '创建章节记录' })
  @ApiResponse({ status: 201, type: ChapterRecordEntity })
  async createChapterRecord(
    @Body() createDto: CreateChapterRecordDto,
    @CurrentUser('id') userId: Uuid,
  ): Promise<ChapterRecordEntity> {
    return await this.recordService.createChapterRecord(createDto, userId);
  }

  @Post('chapter-with-words')
  @ApiOperation({ summary: '创建章节记录（包含单词记录）' })
  @ApiResponse({ status: 201, type: ChapterRecordEntity })
  async createChapterWithWords(
    @Body() createDto: CreateChapterWithWordsDto,
    @CurrentUser('id') userId: Uuid,
  ): Promise<ChapterRecordEntity> {
    return await this.recordService.createChapterWithWords(createDto, userId);
  }

  @Post('word')
  @ApiOperation({ summary: '创建单词记录' })
  @ApiResponse({ status: 201, type: WordRecordEntity })
  async createWordRecord(
    @Body() createDto: CreateWordRecordDto,
    @CurrentUser('id') userId: Uuid,
  ): Promise<WordRecordEntity> {
    return await this.recordService.createWordRecord(createDto, userId);
  }

  @Get('chapter')
  @ApiOperation({ summary: '查询章节记录列表（带分页）' })
  @ApiPaginatedResponse({ type: ChapterRecordResDto, paginationType: 'offset' })
  async findAllChapterRecords(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: ListChapterRecordReqDto,
  ): Promise<OffsetPaginatedDto<ChapterRecordResDto>> {
    return await this.recordService.findAllChapterRecords(userId, reqDto);
  }

  @Get('word')
  @ApiOperation({ summary: '查询单词记录列表（带分页）' })
  @ApiPaginatedResponse({ type: WordRecordResDto, paginationType: 'offset' })
  async findAllWordRecords(
    @CurrentUser('id') userId: Uuid,
    @Query() reqDto: ListWordRecordReqDto,
  ): Promise<OffsetPaginatedDto<WordRecordResDto>> {
    return await this.recordService.findAllWordRecords(userId, reqDto);
  }

  @Get('chapter/:id')
  @ApiOperation({ summary: '根据ID查询章节记录' })
  @ApiResponse({ status: 200, type: ChapterRecordEntity })
  async findChapterRecordById(
    @Param('id') id: Uuid,
    @CurrentUser('id') userId: Uuid,
  ): Promise<ChapterRecordEntity> {
    return await this.recordService.findChapterRecordById(id, userId);
  }

  @Get('word/:id')
  @ApiOperation({ summary: '根据ID查询单词记录' })
  @ApiResponse({ status: 200, type: WordRecordEntity })
  async findWordRecordById(
    @Param('id') id: Uuid,
    @CurrentUser('id') userId: Uuid,
  ): Promise<WordRecordEntity> {
    return await this.recordService.findWordRecordById(id, userId);
  }
}