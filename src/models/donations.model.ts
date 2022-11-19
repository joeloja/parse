import {
  Table,
  Column,
  Model,
  Unique,
  ForeignKey,
  NotNull,
  BelongsTo,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Users } from './users.model';
import { Rates } from './rates.model';

@Table({ timestamps: false })
export class Donations extends Model {
  @Unique
  @NotNull
  @Column({ type: DataTypes.BIGINT, allowNull: false })
  donationId: number;

  @ForeignKey(() => Users)
  @Column({ type: DataTypes.BIGINT })
  userId: number;

  @Column({ type: DataTypes.DECIMAL(18, 2) })
  amount: number;

  @ForeignKey(() => Rates)
  @Column({ type: DataTypes.STRING(3) })
  currencySign: string;

  @Column({ type: DataTypes.DATEONLY })
  date: Date;

  @BelongsTo(() => Users)
  user: Users;
}
