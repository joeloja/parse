import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  NotNull,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Users } from './users.model';

@Table({ timestamps: false })
export class Statements extends Model {
  @ForeignKey(() => Users)
  @NotNull
  @Column({ type: DataTypes.BIGINT, allowNull: false })
  userId: number;

  @NotNull
  @Column({ type: DataTypes.DECIMAL(10, 2), allowNull: false })
  amount: number;

  @NotNull
  @Column({ type: DataTypes.DATEONLY, allowNull: false })
  date: Date;

  @BelongsTo(() => Users, { targetKey: 'userId' })
  user: Users;
}
