import type { ProjectTask } from "../types/project";

type TimelineDay = {
  key: string;
  date: Date;
  inCurrentMonth: boolean;
};

type TimelineWeek = {
  key: string;
  label: string;
  startIndex: number;
  days: TimelineDay[];
};

interface MonthlyTimelineProps {
  tasks: ProjectTask[];
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatShortDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function isSameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function getMonthWeeks(referenceDate: Date) {
  const firstDayOfMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );

  const current = new Date(firstDayOfMonth);
  const offsetToMonday = (current.getDay() + 6) % 7;
  current.setDate(current.getDate() - offsetToMonday);

  const weeks: TimelineWeek[] = [];

  while (current <= lastDayOfMonth) {
    const monday = new Date(current);
    const days = Array.from({ length: 5 }, (_, index) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + index);

      return {
        key: formatDateKey(day),
        date: day,
        inCurrentMonth: day.getMonth() === referenceDate.getMonth(),
      };
    });

    if (days[4].date >= firstDayOfMonth) {
      weeks.push({
        key: formatDateKey(monday),
        label: `${formatShortDate(days[0].date)} - ${formatShortDate(
          days[4].date,
        )}`,
        startIndex: weeks.length * 5,
        days,
      });
    }

    current.setDate(current.getDate() + 7);
  }

  return weeks;
}

function taskSpansDay(task: ProjectTask, day: Date) {
  const startDate = parseDateKey(task.dataInicioPrevisto);
  const endDate = parseDateKey(task.dataTerminoPrevisto);

  if (!startDate || !endDate) {
    return false;
  }

  const dayKey = formatDateKey(day);

  return dayKey >= formatDateKey(startDate) && dayKey <= formatDateKey(endDate);
}

function isTaskLate(task: ProjectTask, today: Date) {
  const endDate = parseDateKey(task.dataTerminoPrevisto);

  if (!endDate || task.status === "Concluído") {
    return false;
  }

  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return endDate < todayAtMidnight;
}

function getDayBackground(statuses: ProjectTask["status"][]) {
  if (statuses.includes("Concluído")) {
    return "bg-emerald-50";
  }

  if (statuses.includes("Em andamento")) {
    return "bg-amber-50";
  }

  if (statuses.length > 0) {
    return "bg-slate-50";
  }

  return "bg-white";
}

export function MonthlyTimeline({ tasks }: MonthlyTimelineProps) {
  const today = new Date();
  const weeks = getMonthWeeks(today);
  const days = weeks.flatMap((week) => week.days);

  return (
    <section className="mb-4 rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5">
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[1040px]">
          <div
            className="grid gap-0 border-b border-gray-200 pb-3  rounded-tl-2xl rounded-tr-2xl"
            style={{
              gridTemplateColumns: `repeat(${days.length}, minmax(44px, 1fr))`,
            }}
          >
            {weeks.map((week) => {
              const isCurrentWeek = week.days.some((day) =>
                isSameDay(day.date, today),
              );

              return (
                <div
                  key={week.key}
                  className={`pb-2 text-[11px] font-bold uppercase tracking-[0.30em] mx-auto mt-[1rem] relative ${
                    isCurrentWeek ? "text-emerald-700" : "text-gray-500"
                  }`}
                  style={{
                    gridColumn: `${week.startIndex + 1} / span ${week.days.length}`,
                  }}
                >
                  {week.label}
                  {isCurrentWeek && (
                    <div className="bg-emerald-600  w-100% h-[0.3rem]  mx-auto" />
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="grid gap-0 border-b border-gray-200"
            style={{
              gridTemplateColumns: `repeat(${days.length}, minmax(44px, 1fr))`,
            }}
          >
            {days.map((day) => {
              const isToday = isSameDay(day.date, today);
              const dayTasks = tasks.filter((task) =>
                taskSpansDay(task, day.date),
              );
              const hasTasks = dayTasks.length > 0;
              const hasDelayedTask = dayTasks.some((task) =>
                isTaskLate(task, today),
              );
              const dayStatuses = [
                ...new Set(dayTasks.map((task) => task.status)),
              ];

              return (
                <div
                  key={day.key}
                  title={
                    hasTasks
                      ? dayTasks
                          .map(
                            (task) =>
                              `${task.atividade} | ${task.dataInicioPrevisto} até ${task.dataTerminoPrevisto}`,
                          )
                          .join("\n")
                      : undefined
                  }
                  className={`flex min-h-4 flex-col items-center border-l border-gray-100 px-2 py-2 ${
                    hasDelayedTask
                      ? "bg-red-100"
                      : isToday
                        ? "bg-emerald-50"
                        : hasTasks
                          ? getDayBackground(dayStatuses)
                          : day.inCurrentMonth
                            ? "bg-white"
                            : "bg-gray-50"
                  } ${
                    hasDelayedTask
                      ? "text-red-700"
                      : isToday
                        ? "text-emerald-700"
                        : "text-gray-500"
                  }`}
                >
                  <span
                    className={`mb-1 h-2 w-px rounded-full ${
                      hasDelayedTask
                        ? "bg-red-600"
                        : isToday || hasTasks
                          ? "bg-emerald-600"
                          : "bg-gray-300"
                    }`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {formatShortDay(day.date)}
                  </span>
                  <span className="text-sm font-medium leading-none">
                    {day.date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
