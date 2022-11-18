import {
  Table,
  Column,
  Model,
  BelongsTo,
  ForeignKey,
  HasMany,
  Unique,
  NotNull,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Departments } from './departments.model';
import { Statements } from './statements.model';
import { Donations } from './donations.model';

@Table({ timestamps: false })
export class Users extends Model {
  @Unique
  @NotNull
  @Column({ type: DataTypes.BIGINT, allowNull: false })
  userId: number;

  @Column({ type: DataTypes.TEXT })
  name: string;

  @Column({ type: DataTypes.TEXT })
  surname: string;

  @ForeignKey(() => Departments)
  @Column({ type: DataTypes.BIGINT })
  departmentId: number;

  @BelongsTo(() => Departments, { targetKey: 'departmentId' })
  department: Departments;

  @HasMany(() => Statements, { sourceKey: 'userId' })
  statements: Statements[];

  @HasMany(() => Donations, { sourceKey: 'userId' })
  donations: Donations[];
}
