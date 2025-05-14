import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
          <Skeleton className="h-5 w-[60px]" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-4">
          <Skeleton className="h-4 w-[150px]" />
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 mt-0.5" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-[120px]" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-[60px]" />
          <Skeleton className="h-8 w-[70px]" />
        </div>
      </CardFooter>
    </Card>
  );
} 