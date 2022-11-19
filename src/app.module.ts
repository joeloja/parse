import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Rates } from './models/rates.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Users } from './models/users.model';
import { Departments } from './models/departments.model';
import { Statements } from './models/statements.model';
import { Donations } from './models/donations.model';
import { ConfigModule } from '@nestjs/config';
import { ParserService } from './parser/parser.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_DBNAME,
      models: [Users, Departments, Statements, Rates, Donations],
      autoLoadModels: true,
      synchronize: true,
      logging: true,
    }),
    SequelizeModule.forFeature([
      Rates,
      Users,
      Departments,
      Statements,
      Donations,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, ParserService],
})
export class AppModule {}
