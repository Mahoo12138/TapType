import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChapterRecordEntity } from './entities/chapter-record.entity';
import { WordRecordEntity } from './entities/word-record.entity';
import { CreateChapterRecordDto } from './dto/create-chapter-record.dto';
import { CreateWordRecordDto } from './dto/create-word-record.dto';
import { CreateChapterWithWordsDto } from './dto/create-chapter-with-words.dto';
import { ListChapterRecordReqDto } from './dto/list-chapter-record.req.dto';
import { ListWordRecordReqDto } from './dto/list-word-record.req.dto';
import { ChapterRecordResDto } from './dto/chapter-record.res.dto';
import { WordRecordResDto } from './dto/word-record.res.dto';
import { plainToInstance } from 'class-transformer';
import { paginate } from '@/utils/offset-pagination';
import { OffsetPaginatedDto } from '@/common/dto/offset-pagination/paginated.dto';
import { Uuid } from '@/common/types/common.type';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(ChapterRecordEntity)
    private chapterRecordRepository: Repository<ChapterRecordEntity>,
    @InjectRepository(WordRecordEntity)
    private wordRecordRepository: Repository<WordRecordEntity>,
  ) {}

  // 创建章节记录
  async createChapterRecord(createDto: CreateChapterRecordDto, userId: Uuid): Promise<ChapterRecordEntity> {
    const chapterRecord = new ChapterRecordEntity({
      ...createDto,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });
    
    return await this.chapterRecordRepository.save(chapterRecord);
  }

  // 创建单词记录
  async createWordRecord(createDto: CreateWordRecordDto, userId: Uuid): Promise<WordRecordEntity> {
    const wordRecord = new WordRecordEntity({
      ...createDto,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });
    
    return await this.wordRecordRepository.save(wordRecord);
  }

  // 同时创建章节记录和单词记录
  async createChapterWithWords(createDto: CreateChapterWithWordsDto, userId: Uuid): Promise<ChapterRecordEntity> {
    // 1. 创建章节记录
    const chapterRecord = new ChapterRecordEntity({
      dict: createDto.dict,
      time: createDto.time,
      correctCount: createDto.correctCount,
      wrongCount: createDto.wrongCount,
      wordCount: createDto.wordCount,
      correctWordIndexes: createDto.correctWordIndexes,
      wordNumber: createDto.wordNumber,
      userId,
      createdBy: userId,
      updatedBy: userId,
    });
    
    const savedChapterRecord = await this.chapterRecordRepository.save(chapterRecord);
    
    // 2. 创建单词记录
    const wordRecords = createDto.wordRecords.map(wordDto => {
      return new WordRecordEntity({
        chapterRecordId: savedChapterRecord.id,
        dictId: createDto.dict,
        wordId: wordDto.wordId || null,
        wordName: wordDto.wordName,
        timing: wordDto.timing,
        wrongCount: wordDto.wrongCount,
        mistakes: wordDto.mistakes,
        userId,
        createdBy: userId,
        updatedBy: userId,
      });
    });
    
    if (wordRecords.length > 0) {
      await this.wordRecordRepository.save(wordRecords);
    }
    
    // 3. 返回包含单词记录的章节记录
    return await this.findChapterRecordById(savedChapterRecord.id, userId);
  }

  // 查询章节记录列表（带分页）
  async findAllChapterRecords(userId: Uuid, reqDto: ListChapterRecordReqDto): Promise<OffsetPaginatedDto<ChapterRecordResDto>> {
    const query = this.chapterRecordRepository
      .createQueryBuilder('chapterRecord')
      .where('chapterRecord.userId = :userId', { userId })
      .orderBy('chapterRecord.createdAt', 'DESC');
    
    // 添加可选过滤条件
    if (reqDto.dict) {
      query.andWhere('chapterRecord.dict = :dict', { dict: reqDto.dict });
    }
    
    // 应用分页
    const [records, metaDto] = await paginate<ChapterRecordEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
    
    return new OffsetPaginatedDto(plainToInstance(ChapterRecordResDto, records), metaDto);
  }

  // 查询单词记录列表（带分页）
  async findAllWordRecords(userId: Uuid, reqDto: ListWordRecordReqDto): Promise<OffsetPaginatedDto<WordRecordResDto>> {
    const query = this.wordRecordRepository
      .createQueryBuilder('wordRecord')
      .where('wordRecord.userId = :userId', { userId })
      .orderBy('wordRecord.createdAt', 'DESC');
    
    // 添加可选过滤条件
    if (reqDto.dictId) {
      query.andWhere('wordRecord.dictId = :dictId', { dictId: reqDto.dictId });
    }
    
    if (reqDto.chapterRecordId) {
      query.andWhere('wordRecord.chapterRecordId = :chapterRecordId', { chapterRecordId: reqDto.chapterRecordId });
    }
    
    if (reqDto.wordName) {
      query.andWhere('wordRecord.wordName ILIKE :wordName', { wordName: `%${reqDto.wordName}%` });
    }
    
    // 应用分页
    const [records, metaDto] = await paginate<WordRecordEntity>(query, reqDto, {
      skipCount: false,
      takeAll: false,
    });
    
    return new OffsetPaginatedDto(plainToInstance(WordRecordResDto, records), metaDto);
  }

  // 根据ID查询章节记录
  async findChapterRecordById(id: Uuid, userId: Uuid): Promise<ChapterRecordEntity> {
    return await this.chapterRecordRepository.findOne({
      where: { id, userId },
      relations: ['words'], // 加载关联的单词记录
    });
  }

  // 根据ID查询单词记录
  async findWordRecordById(id: Uuid, userId: Uuid): Promise<WordRecordEntity> {
    return await this.wordRecordRepository.findOne({
      where: { id, userId },
      relations: ['word', 'chapterRecord'], // 加载关联的单词和章节记录
    });
  }
}