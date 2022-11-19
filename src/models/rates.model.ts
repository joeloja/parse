import { Table, Column, Model, NotNull } from 'sequelize-typescript';
import { DataTypes } from 'sequelize';

@Table({
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['sign', 'date'],
    },
  ],
})
export class Rates extends Model {
  @NotNull
  @Column({ type: DataTypes.STRING(3), allowNull: false })
  sign: string;

  @NotNull
  @Column({ type: DataTypes.DECIMAL(18, 8), allowNull: false })
  value: number;

  @NotNull
  @Column({ type: DataTypes.DATEONLY, allowNull: false })
  date: Date;
}
