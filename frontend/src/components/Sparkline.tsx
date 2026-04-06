import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: { t: number; p: number }[];
  direction: 'rising' | 'falling';
  height?: number;
}

export function Sparkline({ data, direction, height = 48 }: SparklineProps) {
  const color = direction === 'rising' ? '#22c55e' : '#ef4444';
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id={`spark-${direction}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.15} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="p"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
