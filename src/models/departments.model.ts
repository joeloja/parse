import {
  Table,
  Column,
  Model,
  HasMany,
  Unique,
  NotNull,
} from 'sequelize-typescript';
import { DataTypes } from 'sequelize';
import { Users } from './users.model';

@Table({ timestamps: false })
export class Departments extends Model {
  @Unique
  @NotNull
  @Column({ type: DataTypes.BIGINT, allowNull: false })
  departmentId: number;

  @Column({ type: DataTypes.TEXT })
  name: string;

  @HasMany(() => Users, { sourceKey: 'departmentId' })
  users: Users[];
}
