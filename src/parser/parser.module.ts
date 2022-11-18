import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';

@Module({
  imports: [],
  providers: [ParserService],
})
export class ParserModule {}
