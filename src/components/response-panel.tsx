import {
  CheckCircleIcon,
  GlobeHemisphereWestIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { methodStyles } from "@/lib/http-display";
import { prettyJson } from "@/lib/request-body";
import { cn } from "@/lib/utils";
import type { ApiResult, Endpoint } from "@/types";

type ResponsePanelProps = {
  activeEndpoint: Endpoint;
  result: ApiResult | null;
  error: string;
};

function statusIcon(result: ApiResult | null) {
  if (!result) return <GlobeHemisphereWestIcon className="size-5" />;
  if (result.ok) {
    return (
      <CheckCircleIcon className="size-5 text-emerald-500" weight="fill" />
    );
  }
  return (
    <WarningCircleIcon className="size-5 text-destructive" weight="fill" />
  );
}

export function ResponsePanel({
  activeEndpoint,
  result,
  error,
}: ResponsePanelProps) {
  return (
    <Card className="rounded-lg py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          {statusIcon(result)}
          <div>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              {result
                ? `${result.status} ${result.statusText || "HTTP"} in ${result.elapsedMs}ms`
                : activeEndpoint.response_type
                  ? activeEndpoint.response_type
                  : "No request sent"}
            </CardDescription>
          </div>
        </div>
        {result ? (
          <Badge
            variant="outline"
            className={cn(
              "h-6 rounded-md",
              result.ok ? methodStyles.GET : methodStyles.DELETE,
            )}
          >
            {result.ok ? "OK" : "ERROR"}
          </Badge>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-4 p-4">
        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid gap-1">
          <div className="text-xs font-medium text-muted-foreground">Body</div>
          <ScrollArea className="min-h-80 rounded-md border bg-background">
            <pre className="p-3 font-mono text-xs leading-relaxed text-foreground">
              {result?.body ||
                (result?.bodyType === "empty"
                  ? "(empty)"
                  : activeEndpoint.response_example
                    ? prettyJson(activeEndpoint.response_example)
                    : "Send a request to see the response.")}
            </pre>
          </ScrollArea>
        </div>

        <div className="grid gap-1">
          <div className="text-xs font-medium text-muted-foreground">
            Headers
          </div>
          <ScrollArea className="max-h-48 rounded-md border bg-background">
            <pre className="p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {result ? prettyJson(result.headers) : "{}"}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
