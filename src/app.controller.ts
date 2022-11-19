import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/top/donators')
  getTopDonators() {
    return this.appService.getTopDonators();
  }

  @Get('/top/departments')
  getTopDepartment() {
    return this.appService.getTopDepartment();
  }

  @Post('/rewards/userdonations')
  giveRewardByUserDonations() {
    return this.appService.giveRewardByUserDonations();
  }

  @Post('/rewards/departmentdonations')
  giveRewardByDepartment() {
    return this.appService.giveRewardByDepartment();
  }
}
