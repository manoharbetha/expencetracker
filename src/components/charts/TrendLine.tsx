import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartDatum } from '../../types';

export const TrendLine = ({ data }: { data: ChartDatum[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid stroke="#1a2535" vertical={false} />
      <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
      <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
      <Tooltip />
      {['Food', 'Travel', 'Shopping', 'Bills'].map((key, index) => <Line key={key} type="monotone" dataKey={key} stroke={['#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e'][index]} strokeWidth={2} dot={false} />)}
    </LineChart>
  </ResponsiveContainer>
);
