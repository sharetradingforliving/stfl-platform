import { SummaryStatus } from "@/types/investment";
interface SummaryRowProps {
  label: string;
  value: string;
  status: SummaryStatus;
}
export default function SummaryRow({
  label,
  value,
  status,
}: SummaryRowProps) {
  const dotColor =
    status === "positive"
      ? "bg-green-500"
      : status === "warning"
      ? "bg-yellow-500"
      : "bg-red-500";

  const valueColor =
    status === "positive"
      ? "text-green-400"
      : status === "warning"
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`}></span>

        <span className="text-slate-400">
          {label}
        </span>
      </div>

      <span className={`font-medium ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}