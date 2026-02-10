"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { MASTERY_LEVELS, type MasteryLevel } from "@/lib/mastery";

interface UpcomingDay {
  reviews: number;
  newCards: number;
}

interface DeckStatsProps {
  stats: {
    total: number;
    learned: number;
    dueToday: number;
    newAvailable: number;
    byMastery: Record<MasteryLevel, number>;
    upcoming: UpcomingDay[];
    averageDifficulty: number;
    totalReviews: number;
  };
}

export function DeckStats({ stats }: DeckStatsProps) {
  const maxUpcoming = Math.max(
    ...stats.upcoming.map((d) => d.reviews + d.newCards),
    1
  );
  const dayLabels = ["Today", "Tomorrow", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"];
  const hasNewCards = stats.upcoming.some((d) => d.newCards > 0);

  // Calculate percentages for the donut chart
  const total = stats.total || 1;
  const masteryData = [
    { level: "high" as MasteryLevel, count: stats.byMastery.high, color: "#7CB374" },
    { level: "medium" as MasteryLevel, count: stats.byMastery.medium, color: "#9AB34A" },
    { level: "low" as MasteryLevel, count: stats.byMastery.low, color: "#D4A574" },
    { level: "not_seen" as MasteryLevel, count: stats.byMastery.not_seen, color: "#9ca3af" },
  ];

  // Create SVG donut chart segments
  let cumulativePercent = 0;
  const donutSegments = masteryData.map((item) => {
    const percent = (item.count / total) * 100;
    const startAngle = (cumulativePercent / 100) * 360;
    const endAngle = ((cumulativePercent + percent) / 100) * 360;
    cumulativePercent += percent;

    // Convert angles to SVG arc path
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const largeArc = percent > 50 ? 1 : 0;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    if (percent === 0) return null;

    return (
      <path
        key={item.level}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={item.color}
      />
    );
  });

  return (
    <div className="space-y-4">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{stats.dueToday}</div>
            <div className="text-sm text-muted-foreground">Due Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-success">{stats.newAvailable}</div>
            <div className="text-sm text-muted-foreground">New Cards</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{stats.learned}</div>
            <div className="text-sm text-muted-foreground">Learned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
      </div>

      {/* Mastery Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Stability Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {stats.total === 0 ? (
                  <circle cx="50" cy="50" r="40" fill="#e5e7eb" />
                ) : (
                  donutSegments
                )}
                <circle cx="50" cy="50" r="25" fill="var(--card)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xl font-bold">
                    {stats.total > 0 
                      ? Math.round((stats.byMastery.high / total) * 100)
                      : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">High</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {masteryData.map((item) => (
                <div key={item.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{MASTERY_LEVELS[item.level].label}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.upcoming.map((day, index) => {
              const total = day.reviews + day.newCards;
              const reviewWidth = (day.reviews / maxUpcoming) * 100;
              const newWidth = (day.newCards / maxUpcoming) * 100;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-muted-foreground">
                    {dayLabels[index]}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden flex">
                    {day.reviews > 0 && (
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${reviewWidth}%` }}
                        title={`${day.reviews} review${day.reviews !== 1 ? "s" : ""}`}
                      />
                    )}
                    {day.newCards > 0 && (
                      <div
                        className="h-full bg-success transition-all duration-300"
                        style={{ width: `${newWidth}%` }}
                        title={`${day.newCards} new`}
                      />
                    )}
                  </div>
                  <div className="w-8 text-sm text-right font-medium">{total}</div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-xs text-muted-foreground">Reviews</span>
            </div>
            {hasNewCards && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-success" />
                <span className="text-xs text-muted-foreground">New Cards</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Average Difficulty</div>
              <div className="text-xl font-semibold">{stats.averageDifficulty.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">
                {stats.averageDifficulty <= 3 ? "Easy" : stats.averageDifficulty <= 6 ? "Moderate" : "Challenging"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
              <div className="text-xl font-semibold">{stats.totalReviews}</div>
              <div className="text-xs text-muted-foreground">Sessions completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
