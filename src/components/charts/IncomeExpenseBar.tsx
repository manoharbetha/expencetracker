import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartDatum } from '../../types';

export const IncomeExpenseBar = ({ data }: { data: ChartDatum[] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={data}>
      <CartesianGrid stroke="#1a2535" vertical={false} />
      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
      <Tooltip />
      <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} />
      <Bar dataKey="expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
