import { Rates } from './models/rates.model';
import { InjectModel } from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { TNode } from './parser/parser.interface';
import { Users } from './models/users.model';
import { Departments } from './models/departments.model';
import * as _ from 'lodash';
import { Statements } from './models/statements.model';
import { Donations } from './models/donations.model';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Rates) private rateModel: typeof Rates,
    @InjectModel(Users) private userModel: typeof Users,
    @InjectModel(Departments) private departmentModel: typeof Departments,
    @InjectModel(Statements) private statementsModel: typeof Statements,
    @InjectModel(Donations) private donationModel: typeof Donations,
    private parserService: ParserService,
  ) {}

  async loadData(filename) {
    const data = this.parserService.parse(filename);

    const employeeList: TNode[] =
      data.filter((e) => e['type'] == 'E-List')?.pop()?.children || [];

    const preparedDepartments = [];
    const preparedEmployees = [];
    const preparedStatements = [];
    const preparedDonations = [];
    const preparedCurrencies = [
      {
        sign: 'USD',
        value: 1,
        date: new Date(),
      },
    ];
    const preparedRates = [];

    employeeList.map((employee) => {
      const department = employee.children
        .filter((e) => e.type == 'Department')
        .pop();

      preparedDepartments.push({
        departmentId: department.properties.id,
        name: department.properties.name,
      });

      preparedEmployees.push({
        userId: employee.properties.id,
        name: employee.properties.name,
        surname: employee.properties.surname,
        departmentId: department.properties.id || null,
      });

      const salary = employee.children.filter((e) => e.type == 'Salary').pop();

      salary.children.map((statement) => {
        preparedStatements.push({
          statementId: statement.properties.id,
          userId: employee.properties.id,
          amount: statement.properties.amount,
          date: new Date(statement.properties.date),
        });
      });

      const donations = employee.children.filter((e) => e.type == 'Donation');

      donations.map((donation) => {
        const [amount, currencySign] = donation.properties.amount.split(' ');

        preparedDonations.push({
          donationId: donation.properties.id,
          userId: employee.properties.id,
          amount,
          currencySign,
          date: new Date(donation.properties.date),
        });
      });
    });

    const rateList: TNode[] =
      data.filter((e) => e['type'] == 'Rates')?.pop()?.children || [];

    rateList.map((rate) => {
      preparedRates.push({
        sign: rate.properties.sign,
        value: rate.properties.value,
        date: new Date(rate.properties.date),
      });
    });

    await this.rateModel.bulkCreate(preparedRates, {
      ignoreDuplicates: true,
    });

    await this.rateModel.bulkCreate(preparedCurrencies, {
      ignoreDuplicates: true,
    });

    await this.departmentModel.bulkCreate(
      _.uniqBy(preparedDepartments, 'departmentId'),
      {
        ignoreDuplicates: true,
      },
    );
    await this.userModel.bulkCreate(_.uniqBy(preparedEmployees, 'userId'), {
      ignoreDuplicates: true,
    });

    await this.statementsModel.bulkCreate(preparedStatements, {
      ignoreDuplicates: true,
    });

    await this.donationModel.bulkCreate(preparedDonations, {
      ignoreDuplicates: true,
    });
  }
}
