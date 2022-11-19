import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  NotNull,
  Unique,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Users } from './users.model';

@Table({ timestamps: false })
export class Statements extends Model {
  @Unique
  @NotNull
  @Column({ type: DataTypes.BIGINT, allowNull: false })
  statementId: number;

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
