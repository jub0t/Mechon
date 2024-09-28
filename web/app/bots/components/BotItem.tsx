"use client";

import { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Separator } from "@radix-ui/react-separator";

export interface BotItemProps {
  items: {
    name: string,
    isRunning: boolean,
    id: string,
    runtime: string,
    language: string
  }[];
}

export default function BotItemsList({ items }: BotItemProps) {
  return (
    <ScrollArea className="h-screen w-full">
      <div className="grid grid-cols-3 gap-5 w-full flex flex-col gap-2 p-4 pt-0">
        {items.map((item, v) => (
          <Link
            key={v}
            href={`/bots/${item?.id}`}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
            )}
          >
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{item.name}</div>
                  <span
                    className={`flex h-2 w-2 rounded-full ${item.isRunning ? "bg-red-600" : "bg-green-600"
                      }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {item.runtime && (
                <Badge key={item.runtime + `_bot_runtime`} variant={"default"}>
                  {item.runtime}
                </Badge>
              )}

              {item.language && (
                <Badge key={item.language + `_item_language`} variant={"outline"}>
                  {item.language}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string,
): ComponentProps<typeof Badge>["variant"] {
  const lowercaseLabel = label.toLowerCase();
  if (lowercaseLabel === "work") {
    return "default";
  }

  if (lowercaseLabel === "personal") {
    return "outline";
  }

  return "secondary";
}
