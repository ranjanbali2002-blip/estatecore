import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#C9A84C', '#1E88E5', '#43A047', '#8E24AA', '#E65100', '#E53935', '#00ACC1'];

export default function PieChartWrapper({ data, nameKey = 'name', valueKey = 'value', height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0B0F1A" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#1A2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#8b93a7' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
