import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * series: [{ key, name, color, dashed }]
 */
export default function LineChartWrapper({ data, xKey, series, height = 280, valueFormatter }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey={xKey} stroke="#8b93a7" fontSize={12} tickLine={false} />
        <YAxis stroke="#8b93a7" fontSize={12} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
        <Tooltip
          contentStyle={{ background: '#1A2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
          formatter={valueFormatter ? (v) => valueFormatter(v) : undefined}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color || 'var(--accent)'}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '6 4' : undefined}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
