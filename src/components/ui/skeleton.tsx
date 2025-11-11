import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base shimmer skeleton used across the app.
 * Lightweight, GPU-friendly, and composable.
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted/70",
        "before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:animate-[shimmer_1.2s_infinite]",
        className
      )}
      {...props}
    />
  );
}

/**
 * ImageSkeleton
 * Wrap images to show a skeleton until each individual image is loaded.
 *
 * Usage:
 * const [loaded, setLoaded] = useState(false);
 * <ImageSkeleton loaded={loaded} className="h-40 w-full rounded-xl">
 *   <img src={...} onLoad={() => setLoaded(true)} className="h-40 w-full object-cover rounded-xl" />
 * </ImageSkeleton>
 */
export const ImageSkeleton: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { loaded?: boolean }
> = ({ loaded, className, children, ...props }) => {
  const isLoaded = !!loaded;

  return (
    <div
      className={cn(
        "relative rounded-xl bg-muted/40",
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-100",
        className
      )}
      {...props}
    >
      {!isLoaded && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>
      )}
      <div
        className={cn(
          "relative h-full w-full",
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  );
};

export { Skeleton };
