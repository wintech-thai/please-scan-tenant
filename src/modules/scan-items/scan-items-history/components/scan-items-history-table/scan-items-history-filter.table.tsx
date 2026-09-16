"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Search } from "lucide-react";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useQueryStates, parseAsString } from "nuqs";
import { useTranslation } from "react-i18next";

interface ScanItemsHistoryFilterTableProps {
  onSearch?: (
    searchField: string,
    searchValue: string,
    dateRange?: DateRange
  ) => void;
  initialDateRange?: DateRange;
}

export const ScanItemsHistoryFilterTable = ({
  onSearch,
  initialDateRange,
}: ScanItemsHistoryFilterTableProps) => {
  const { t } = useTranslation("scan-items-history");
  const [queryState] = useQueryStates({
    searchField: parseAsString.withDefault("fullTextSearch"),
    searchValue: parseAsString.withDefault(""),
  });

  const [searchField, setSearchField] = useState("fullTextSearch");
  const [searchValue, setSearchValue] = useState(queryState.searchValue);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialDateRange
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate date range
    if (dateRange && (!dateRange.from || !dateRange.to)) {
      toast.error(t("filter.dateRange"));
      return;
    }

    if (onSearch) {
      onSearch(searchField, searchValue, dateRange);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="
        w-full
        flex flex-col gap-3
        md:flex-row md:items-center md:justify-between
      "
      aria-label="Scan items history filter controls"
    >
      {/* Left side: search controls */}
      <div
        className="
          w-full
          grid grid-cols-1 gap-2
          sm:grid-cols-[minmax(0,1fr)]
          md:flex md:items-center
        "
      >
        {/* Field selector */}
        <div className="w-full md:w-auto">
          <Select value={searchField} onValueChange={setSearchField}>
            <SelectTrigger
              className="w-full md:w-48"
              aria-label="Select search field"
            >
              <SelectValue placeholder={t("filter.selectSearchField")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fullTextSearch">
                {t("filter.search")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search input */}
        <div className="w-full md:w-[400px]">
          <Input
            placeholder={t("filter.searchPlaceholder")}
            className="w-full"
            aria-label="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            maxLength={50}
          />
        </div>

        {/* Date Range Picker */}
        <div className="w-full md:w-auto">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            className="w-full md:w-[400px]"
          />
        </div>

        {/* Search button */}
        <div className="w-full md:w-auto">
          <Button
            type="submit"
            className="w-full md:w-[80px]"
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};
