import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDatum } from '../../types';

const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#10b981', '#ec4899'];

export const CategoryPie = ({ data }: { data: ChartDatum[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie data={data} innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" nameKey="name">
        {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);
