import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartDatum } from '../../types';

export const SpendingChart = ({ data }: { data: ChartDatum[] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <AreaChart data={data}>
      <defs><linearGradient id="spend" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.03} /></linearGradient></defs>
      <CartesianGrid stroke="#1a2535" vertical={false} />
      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
      <Tooltip />
      <Area type="monotone" dataKey="expenses" stroke="#3b82f6" fill="url(#spend)" strokeWidth={3} />
    </AreaChart>
  </ResponsiveContainer>
);
