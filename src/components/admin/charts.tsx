import * as React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

type Point = { x: string | number; y: number };

export function SmoothArea({
  data,
  color = "#10b981",
  height = 260,
  yFormatter,
  showAxes = true,
}: {
  data: Point[];
  color?: string;
  height?: number;
  yFormatter?: (v: number) => string;
  showAxes?: boolean;
}) {
  const id = React.useId().replace(/[:]/g, "");
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxes && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          )}
          {showAxes && (
            <XAxis
              dataKey="x"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
          )}
          {showAxes && (
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormatter}
              width={54}
            />
          )}
          <Tooltip
            cursor={{ stroke: color, strokeOpacity: 0.2 }}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 6px 16px -8px rgba(15,23,42,0.15)",
            }}
            formatter={(v: number) => (yFormatter ? yFormatter(v) : v)}
          />
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={2}
            fill={`url(#g-${id})`}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({
  data,
  color = "#10b981",
  height = 56,
}: {
  data: { i: number; v: number }[];
  color?: string;
  height?: number;
}) {
  const id = React.useId().replace(/[:]/g, "");
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`s-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#s-${id})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
