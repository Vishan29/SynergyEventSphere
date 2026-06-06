import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginatorProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  pageSizes?: number[];
}

// Spring `Page` is 0-indexed. We render 1-indexed for humans.
export function Paginator({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
  pageSizes = [10, 20, 50],
}: PaginatorProps) {
  const safeTotal = Math.max(totalPages, 1);
  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-2 text-sm sm:flex-row">
      <div className="text-muted-foreground">
        {totalElements === 0
          ? 'No results'
          : `Page ${page + 1} of ${safeTotal} • ${totalElements} total`}
      </div>
      <div className="flex items-center gap-2">
        {onSizeChange ? (
          <Select
            value={String(size)}
            onValueChange={(v) => onSizeChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="Previous page"
        >
          <ChevronLeft />
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= safeTotal}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
