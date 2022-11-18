import {
  Table,
  Column,
  Model,
  Unique,
  NotNull,
  HasMany,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Donations } from './donations.model';

@Table({ timestamps: false })
export class Rates extends Model {
  @Unique
  @NotNull
  @Column({ type: DataTypes.STRING(3), allowNull: false })
  sign: string;

  @NotNull
  @Column({ type: DataTypes.DECIMAL(18, 8), allowNull: false })
  value: number;

  @NotNull
  @Column({ type: DataTypes.DATEONLY, allowNull: false })
  date: Date;

  @HasMany(() => Donations, { sourceKey: 'sign' })
  donations: Donations[];
}
