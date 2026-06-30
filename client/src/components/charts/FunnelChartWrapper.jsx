import { ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip, Cell } from 'recharts';

const COLORS = ['#1E88E5', '#00ACC1', '#43A047', '#C9A84C', '#E65100'];

export default function FunnelChartWrapper({ data, height = 300 }) {
  // data: [{ stage, count }]
  const mapped = data.map((d) => ({ name: d.stage, value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <FunnelChart>
        <Tooltip
          contentStyle={{ background: '#1A2035', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
        />
        <Funnel dataKey="value" data={mapped} isAnimationActive>
          <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
          <LabelList position="left" fill="#8b93a7" stroke="none" dataKey="value" fontSize={12} />
          {mapped.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Funnel>
      </FunnelChart>
    </ResponsiveContainer>
  );
}
