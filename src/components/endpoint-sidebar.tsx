import {
  DatabaseIcon,
  HardDrivesIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { methodStyles } from "@/lib/http-display";
import { cn } from "@/lib/utils";
import type { Endpoint } from "@/types";

type EndpointSidebarProps = {
  activeEndpointId: string;
  groupedEndpoints: Record<string, Endpoint[]>;
  onSelectEndpoint: (endpoint: Endpoint) => void;
};

function groupIcon(group: string) {
  if (group === "Storage") return <HardDrivesIcon className="size-4" />;
  if (group === "Proxy") return <ShieldCheckIcon className="size-4" />;
  if (group === "Core" || group === "Database") {
    return <DatabaseIcon className="size-4" />;
  }
  return null;
}

export function EndpointSidebar({
  activeEndpointId,
  groupedEndpoints,
  onSelectEndpoint,
}: EndpointSidebarProps) {
  return (
    <aside className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Endpoints</h2>
      </div>
      <div className="space-y-4 p-3">
        {Object.entries(groupedEndpoints).map(([group, groupEndpoints]) => (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
              {groupIcon(group)}
              <span>{group}</span>
            </div>
            <div className="grid gap-1">
              {groupEndpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  className={cn(
                    "grid gap-1 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-muted",
                    endpoint.id === activeEndpointId &&
                      "border-border bg-muted",
                  )}
                  type="button"
                  onClick={() => onSelectEndpoint(endpoint)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{endpoint.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-6 rounded-md",
                        methodStyles[endpoint.method],
                      )}
                    >
                      {endpoint.method}
                    </Badge>
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">
                    {endpoint.path}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
