import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowClockwiseIcon,
  BracketsCurlyIcon,
  CheckCircleIcon,
  CopyIcon,
  DatabaseIcon,
  GlobeHemisphereWestIcon,
  HardDrivesIcon,
  PlayIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import endpointConfig from "@/endpoints.json";
import { cn } from "@/lib/utils";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

type Endpoint = {
  id: string;
  group: string;
  name: string;
  method: HttpMethod;
  path: string;
  summary: string;
  body: unknown;
};

type ApiResult = {
  ok: boolean;
  status: number;
  statusText: string;
  elapsedMs: number;
  headers: Record<string, string>;
  body: string;
  bodyType: "json" | "text" | "empty";
};

const endpoints = endpointConfig as Endpoint[];

const methodStyles: Record<HttpMethod, string> = {
  GET: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  POST: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PUT: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  DELETE: "border-destructive/20 bg-destructive/10 text-destructive",
};

const statusIcon = (result: ApiResult | null) => {
  if (!result) return <GlobeHemisphereWestIcon className="size-5" />;
  if (result.ok)
    return (
      <CheckCircleIcon className="size-5 text-emerald-500" weight="fill" />
    );
  return (
    <WarningCircleIcon className="size-5 text-destructive" weight="fill" />
  );
};

const prettyJson = (value: unknown) => JSON.stringify(value, null, 2);

function readStoredBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    window.localStorage.getItem("infractl-api-base-url") ??
    "http://localhost:8080"
  );
}

function App() {
  const [activeEndpointId, setActiveEndpointId] = useState(endpoints[0].id);
  const activeEndpoint =
    endpoints.find((endpoint) => endpoint.id === activeEndpointId) ??
    endpoints[0];
  const [baseUrl, setBaseUrl] = useState(readStoredBaseUrl);
  const [method, setMethod] = useState<HttpMethod>(activeEndpoint.method);
  const [path, setPath] = useState(activeEndpoint.path);
  const [body, setBody] = useState(prettyJson(activeEndpoint.body));
  const [result, setResult] = useState<ApiResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const groupedEndpoints = useMemo(() => {
    return endpoints.reduce<Record<string, Endpoint[]>>((groups, endpoint) => {
      groups[endpoint.group] = [...(groups[endpoint.group] ?? []), endpoint];
      return groups;
    }, {});
  }, []);

  const requestUrl = useMemo(() => {
    try {
      return new URL(
        path,
        baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
      ).toString();
    } catch {
      return `${baseUrl}${path}`;
    }
  }, [baseUrl, path]);

  function selectEndpoint(endpoint: Endpoint) {
    setActiveEndpointId(endpoint.id);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setBody(prettyJson(endpoint.body));
    setResult(null);
    setError("");
  }

  async function sendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");
    setResult(null);
    window.localStorage.setItem("infractl-api-base-url", baseUrl);

    const startedAt = performance.now();
    try {
      const init: RequestInit = {
        method,
        headers: {
          Accept: "application/json",
        },
      };

      if (method !== "GET" && body.trim() !== "" && body.trim() !== "null") {
        JSON.parse(body);
        init.body = body;
        init.headers = {
          ...init.headers,
          "Content-Type": "application/json",
        };
      }

      const response = await fetch(requestUrl, init);
      const responseText = await response.text();
      const elapsedMs = Math.round(performance.now() - startedAt);
      const headers = Object.fromEntries(response.headers.entries());
      let bodyType: ApiResult["bodyType"] = responseText ? "text" : "empty";
      let formattedBody = responseText;

      if (responseText) {
        try {
          formattedBody = prettyJson(JSON.parse(responseText));
          bodyType = "json";
        } catch {
          bodyType = "text";
        }
      }

      setResult({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        elapsedMs,
        headers,
        body: formattedBody,
        bodyType,
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Request failed",
      );
    } finally {
      setIsSending(false);
    }
  }

  async function copyCurl() {
    const parts = [`curl -i -X ${method}`, `"${requestUrl}"`];
    if (method !== "GET" && body.trim() !== "" && body.trim() !== "null") {
      parts.splice(
        1,
        0,
        `-H "Content-Type: application/json"`,
        `--data '${body.replaceAll("'", "'\\''")}'`,
      );
    }
    await navigator.clipboard.writeText(parts.join(" "));
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <div className="border-b bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border bg-background">
              <BracketsCurlyIcon className="size-5" weight="bold" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-normal">
                infractl API workbench
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{activeEndpoint.group}</span>
                <span>/</span>
                <span>{activeEndpoint.name}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-1 sm:min-w-96">
            <Label className="text-xs text-muted-foreground">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Endpoints</h2>
          </div>
          <div className="space-y-4 p-3">
            {Object.entries(groupedEndpoints).map(([group, groupEndpoints]) => (
              <div key={group} className="space-y-2">
                <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
                  {group === "Storage" ? (
                    <HardDrivesIcon className="size-4" />
                  ) : null}
                  {group === "Proxy" ? (
                    <ShieldCheckIcon className="size-4" />
                  ) : null}
                  {group === "Core" ? (
                    <DatabaseIcon className="size-4" />
                  ) : null}
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
                      onClick={() => selectEndpoint(endpoint)}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {endpoint.name}
                        </span>
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
          <Card className="rounded-lg py-0">
            <form onSubmit={sendRequest}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                  <CardTitle>Request</CardTitle>
                  <CardDescription>{activeEndpoint.summary}</CardDescription>
                </div>
                <CardAction className="static col-auto row-auto flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => selectEndpoint(activeEndpoint)}
                  >
                    <ArrowClockwiseIcon />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCurl}
                  >
                    <CopyIcon />
                    cURL
                  </Button>
                  <Button type="submit" size="sm" disabled={isSending}>
                    <PlayIcon weight="fill" />
                    {isSending ? "Sending" : "Send"}
                  </Button>
                </CardAction>
              </CardHeader>

              <CardContent className="grid gap-4 p-4">
                <div className="grid gap-3 md:grid-cols-[132px_minmax(0,1fr)]">
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Method
                    </Label>
                    <NativeSelect
                      className="w-full"
                      value={method}
                      onChange={(event) =>
                        setMethod(event.target.value as HttpMethod)
                      }
                    >
                      <NativeSelectOption>GET</NativeSelectOption>
                      <NativeSelectOption>POST</NativeSelectOption>
                      <NativeSelectOption>PUT</NativeSelectOption>
                      <NativeSelectOption>DELETE</NativeSelectOption>
                    </NativeSelect>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Path
                    </Label>
                    <Input
                      className="font-mono"
                      value={path}
                      onChange={(event) => setPath(event.target.value)}
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div className="grid gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      className="text-xs text-muted-foreground"
                      htmlFor="body-editor"
                    >
                      JSON body
                    </Label>
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {requestUrl}
                    </span>
                  </div>
                  <Textarea
                    id="body-editor"
                    className="min-h-96 resize-y font-mono leading-relaxed"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    spellCheck={false}
                  />
                </div>
              </CardContent>
            </form>
          </Card>

          <Card className="rounded-lg py-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex items-center gap-2">
                {statusIcon(result)}
                <div>
                  <CardTitle>Response</CardTitle>
                  <CardDescription>
                    {result
                      ? `${result.status} ${result.statusText || "HTTP"} in ${result.elapsedMs}ms`
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
                <div className="text-xs font-medium text-muted-foreground">
                  Body
                </div>
                <ScrollArea className="min-h-80 rounded-md border bg-background">
                  <pre className="p-3 font-mono text-xs leading-relaxed text-foreground">
                    {result?.body ||
                      (result?.bodyType === "empty"
                        ? "(empty)"
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
        </div>
      </div>
    </main>
  );
}

export default App;
