import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#C9A84C', '#1E88E5', '#43A047', '#8E24AA', '#E65100', '#E53935'];

export default function BarChartWrapper({ data, xKey, yKey, height = 280, color, valueFormatter, multiColor = false }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey={xKey} stroke="#8b93a7" fontSize={12} tickLine={false} />
        <YAxis stroke="#8b93a7" fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
        <Tooltip
          contentStyle={{ background: '#1A2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          formatter={valueFormatter ? (v) => valueFormatter(v) : undefined}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} fill={color || 'var(--accent)'}>
          {multiColor && data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
