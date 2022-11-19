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
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';

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

  async getTopDonators() {
    return await this.userModel.findAll({
      attributes: [
        'userId',
        'name',
        'surname',
        [
          Sequelize.literal(
            `(SELECT
                      AVG(amount)
                    FROM
                      "Statements" s
                    WHERE "userId" = "Users"."userId" AND date >= NOW() - interval '12 month'
                    GROUP BY "userId", date_part('year', date)
                 )`,
          ),
          'avgSalary',
        ],
        [
          Sequelize.literal(
            `SUM(amount * (SELECT value FROM "Rates" WHERE sign = "currencySign" ORDER BY date DESC LIMIT 1))`,
          ),
          'donationSum',
        ],
      ],
      include: [
        {
          model: Donations,
          attributes: [],
          required: true,
        },
      ],
      nest: true,
      raw: true,
      group: ['Users.userId', 'Users.name', 'Users.surname'],
      having: Sequelize.literal(`
        SUM(amount * (SELECT value FROM "Rates" WHERE sign = "currencySign" ORDER BY date DESC LIMIT 1)) >
        (SELECT SUM(amount) FROM "Statements" WHERE "userId" = "Users"."userId" AND date >= NOW() - interval '6 month') / 6 * 0.1`),
      order: [['avgSalary', 'ASC']],
    });
  }

  async getTopDepartment() {
    return await this.departmentModel.findAll({
      attributes: [
        'departmentId',
        'name',
        [
          Sequelize.literal(`(
            SELECT MAX("avg") - MIN("avg")
            FROM
              (
                SELECT AVG(amount) as "avg"
                FROM "Statements" s
                INNER JOIN "Users" u ON u."userId" = s."userId"
                WHERE u."departmentId" = "Departments"."departmentId" AND date >= NOW() - interval '12 month'
                GROUP BY s."userId"
              ) a
          )`),
          'differenceAvgSalary',
        ],
      ],
      include: [
        {
          model: Users,
          attributes: [
            [
              Sequelize.literal(`(
                SELECT amount
                FROM "Statements" s
                WHERE s."userId" = "Users"."userId"
                ORDER BY date DESC
                LIMIT 1
              )`),
              'lastSalary',
            ],
            [
              Sequelize.literal(`(
                (
                  SELECT
                    amount
                  FROM "Statements" s
                  WHERE s."userId" = "Users"."userId"
                  ORDER BY date DESC
                  LIMIT 1
                )
                  /
                (SELECT
                  AVG(amount)
                FROM
                  "Statements" s
                WHERE s."userId" = "Users"."userId" AND date >= NOW() - interval '12 month')
            )`),
              'growSalary',
            ],
          ],
          where: { [Op.and]: [Sequelize.literal(`true`)] },
          order: [['growSalary', 'DESC']],
          limit: 3,
        },
      ],
    });
  }
  async giveRewardByUserDonations() {
    const rewardPool = 10000;
    const preparedRewards = [];

    const totalDonations = await this.donationModel.sum('amount');

    const bigDonors = (await this.donationModel.findAll({
      attributes: [
        'userId',
        [
          Sequelize.literal(
            `SUM(amount * (SELECT value FROM "Rates" WHERE sign = "currencySign" ORDER BY date DESC LIMIT 1))`,
          ),
          'total',
        ],
      ],
      where: {},
      group: ['userId'],
      having: Sequelize.literal(
        `SUM(amount * (SELECT value FROM "Rates" WHERE sign = "currencySign" ORDER BY date DESC LIMIT 1)) > 100`,
      ),
      raw: true,
    })) as unknown as { userId: number; total: number }[];

    bigDonors.map((donor) => {
      const percentOfPool = donor.total / totalDonations;
      const reward = rewardPool * percentOfPool;
      preparedRewards.push({
        statementId: (Math.random() * 1e9) | 0,
        userId: donor.userId,
        amount: reward,
        date: new Date(),
      });
    });

    await this.statementsModel.bulkCreate(preparedRewards);

    return bigDonors;
  }

  async giveRewardByDepartment() {
    const department = await this.departmentModel.findOne({
      attributes: [
        'departmentId',
        [
          Sequelize.literal(
            `
            SUM("users->donations"."amount" * (SELECT value FROM "Rates" WHERE sign = "currencySign" ORDER BY date DESC LIMIT 1)) /
            COUNT("users"."id") 
           `,
          ),
          'donationSum',
        ],
      ],
      include: [
        {
          model: Users,
          attributes: [],
          include: [
            {
              model: Donations,
              attributes: [],
            },
          ],
        },
      ],
      group: ['Departments.departmentId'],
      order: [['donationSum', 'DESC']],
      raw: true,
      subQuery: false,
    });
    if (department) {
      const preparedDonors = [];

      const donors = await this.userModel.findAll({
        where: {
          departmentId: department.departmentId,
        },
      });

      donors.map((donor) => {
        preparedDonors.push({
          statementId: (Math.random() * 1e9) | 0,
          userId: donor.userId,
          amount: 100,
          date: new Date(),
        });
      });

      await this.statementsModel.bulkCreate(preparedDonors);
    }
    return department;
  }
}
