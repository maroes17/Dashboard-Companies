import { CustomTooltip } from "@/components/CustomTooltip";
import { CardSummaryProps } from "./CardSummary.types";
import { CustomIcon } from "@/components/CustomIcon";
import { cn } from "@/lib/utils";
import { MoveDownRightIcon, MoveUpRightIcon, TrendingUp, TrendingDown } from "lucide-react";

export function CardSummary(props: CardSummaryProps) {
  const { icon: Icon, title, average, total, tooltipText } = props;
  return (
    <div className="shadow-sm bg-background rounded-lg p-5 py-3 hover:shadow-lg transtition">
      <div className="flex justify-between">
        <div className="flex items-center gap-2">
          <CustomIcon icon={Icon} />
          {title}
        </div>
        <CustomTooltip content={tooltipText} />
      </div>
      <div className="flex gap-4 mt-2 md:mt-4">
        <p className="text-2xl font-bold">{total}</p>
        <div className={cn('flex items-center gap-1 px-2 text-xs text-white rounded-lg h-[20px] bg-black dark:bg-secondart')}>
          {average}%
          {average < 20 && (
            <MoveDownRightIcon strokeWidth={2} className="w-4 h-4" />
          )}
          {average > 20 && average < 70 && (
            <MoveUpRightIcon strokeWidth={2} className="w-4 h-4" />
          )}
          {average >70 && average < 100 && (
            <TrendingUp strokeWidth={2} className="w-4 h-4" />
          )}
        </div>
      </div>
    </div>
  );
}
