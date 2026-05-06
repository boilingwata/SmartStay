import React, { memo } from 'react';
import { CalendarClock, ClipboardList, Filter, ShieldCheck, LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
}

interface Props {
  data: {
    totalPolicies: number;
    pendingApprovals: number;
    activeExceptions: number;
    todayBookings: number;
  } | undefined;
  isLoading: boolean;
}

const AmenityStats = memo(({ data, isLoading }: Props) => {
  const stats: StatItem[] = [
    { label: 'Chính sách', value: data?.totalPolicies ?? 0, icon: ClipboardList },
    { label: 'Chờ duyệt', value: data?.pendingApprovals ?? 0, icon: ShieldCheck, color: 'text-amber-500' },
    { label: 'Ngoại lệ mở', value: data?.activeExceptions ?? 0, icon: Filter, color: 'text-blue-500' },
    { label: 'Đặt chỗ hôm nay', value: data?.todayBookings ?? 0, icon: CalendarClock, color: 'text-emerald-500' },
  ];

  if (isLoading) {
    return (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-[2rem] bg-black/5 dark:bg-white/5 p-2 border border-border/50 animate-pulse">
             <div className="h-full w-full rounded-[calc(2rem-0.5rem)] bg-card" />
          </div>
        ))}
      </section>
    );
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      {stats.map((item, index) => (
        <div 
          key={item.label} 
          className="group relative rounded-[2rem] bg-black/5 dark:bg-white/5 p-2 border border-border/50 transition-all duration-500 hover:border-primary/30"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex h-full w-full flex-col justify-between rounded-[calc(2rem-0.5rem)] bg-card p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-transform duration-500 group-hover:scale-[1.01]">
            <div className="flex items-start justify-between">
              <div className={`rounded-xl bg-primary/5 p-2.5 ${item.color || 'text-primary'} border border-primary/10`}>
                <item.icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex h-2 w-2 rounded-full bg-primary/20 animate-pulse" />
            </div>
            
            <div className="mt-4">
              <p className="text-4xl font-black tracking-tighter text-foreground sm:text-5xl">{item.value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">{item.label}</p>
            </div>

            {/* Difference Anchor: Machined Detail */}
            <div className="absolute bottom-4 right-6 h-[1px] w-8 bg-border/50 transition-all duration-500 group-hover:w-12 group-hover:bg-primary/50" />
          </div>
        </div>
      ))}
    </section>
  );
});

AmenityStats.displayName = 'AmenityStats';

export default AmenityStats;
