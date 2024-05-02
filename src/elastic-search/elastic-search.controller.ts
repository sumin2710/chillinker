import { Controller, Get } from '@nestjs/common';
import { ElasticSearchService } from './elastic-search.service';

@Controller('elastic-search')
export class ElasticSearchController {
  constructor(private readonly elasticService: ElasticSearchService) {}

  @Get()
  async getInfo() {
    return await this.elasticService.getInfo();
  }

  @Get('/search')
  async search(
    indexName: string = 'webcontents',
    keyword: string = '로맨스',
    fieldName1: string = 'keyword',
    fieldName2: string = 'category',
    page: number,
    take: number,
  ) {
    return await this.elasticService.searchMultipleField(
      indexName,
      keyword,
      fieldName1,
      fieldName2,
      page,
      take,
    );
  }
}