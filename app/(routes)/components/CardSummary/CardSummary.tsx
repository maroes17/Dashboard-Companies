import { CardSummaryProps } from "./CardSummary.types";
import { CustomIcon } from "@/components/CustomIcon";
export function CardSummary(props: CardSummaryProps) {
  const { icon: Icon, title, average, total, tooltipText} = props;
  return (
    <div className="shadow-sm bg-background rounded-lg p-5 py-3 hover:shadow-lg transtition">
        <div className="flex justify-between">
            <CustomIcon icon={Icon} />
            {title}
        </div>
    </div>
  )
}
