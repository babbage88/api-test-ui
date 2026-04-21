import { useMemo, useRef, useState, type FormEvent } from "react";
import { BracketsCurlyIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { EndpointSidebar } from "@/components/endpoint-sidebar";
import { RequestPanel } from "@/components/request-panel";
import { ResponsePanel } from "@/components/response-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import endpointConfig from "@/endpoints.json";
import {
  arrayBufferToBase64,
  isRecord,
  prettyJson,
  replacePrivateKeyDefaults,
  setValueAtPath,
} from "@/lib/request-body";
import type { ApiResult, Endpoint, HttpMethod } from "@/types";

const endpoints = endpointConfig as Endpoint[];

function readStoredBaseUrl() {
  if (typeof window === "undefined") return "http://localhost:8080";
  return (
    window.localStorage.getItem("infractl-api-base-url") ??
    "http://localhost:8080"
  );
}

function App() {
  const privateKeyFileInputRef = useRef<HTMLInputElement>(null);
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
  const [defaultPrivateKeyBase64, setDefaultPrivateKeyBase64] = useState("");
  const [defaultPrivateKeyName, setDefaultPrivateKeyName] = useState("");
  const [isCurlCopied, setIsCurlCopied] = useState(false);

  const parsedBody = useMemo(() => {
    try {
      return { value: JSON.parse(body) as unknown, error: "" };
    } catch (parseError) {
      return {
        value: null,
        error:
          parseError instanceof Error
            ? parseError.message
            : "JSON body is invalid",
      };
    }
  }, [body]);

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

  const curlCommand = useMemo(() => {
    const parts = [`curl -i -X ${method}`, `"${requestUrl}"`];
    if (method !== "GET" && body.trim() !== "" && body.trim() !== "null") {
      parts.splice(
        1,
        0,
        `-H "Content-Type: application/json"`,
        `--data '${body.replaceAll("'", "'\\''")}'`,
      );
    }
    return parts.join(" ");
  }, [body, method, requestUrl]);

  function selectEndpoint(endpoint: Endpoint) {
    setActiveEndpointId(endpoint.id);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setBody(
      prettyJson(
        defaultPrivateKeyBase64
          ? replacePrivateKeyDefaults(endpoint.body, defaultPrivateKeyBase64)
          : endpoint.body,
      ),
    );
    setResult(null);
    setError("");
  }

  async function loadDefaultPrivateKey(file: File) {
    const privateKeyBase64 = arrayBufferToBase64(await file.arrayBuffer());
    setDefaultPrivateKeyBase64(privateKeyBase64);
    setDefaultPrivateKeyName(file.name);

    if (isRecord(parsedBody.value)) {
      setBody(
        prettyJson(
          replacePrivateKeyDefaults(parsedBody.value, privateKeyBase64),
        ),
      );
    }
  }

  function openPrivateKeyFilePicker() {
    toast.info("Looking for ~/.ssh?", {
      description:
        "In the macOS file picker, press Command + Shift + . to show hidden folders.",
    });
    privateKeyFileInputRef.current?.click();
  }

  function updateBodyValue(path: string[], value: unknown) {
    if (!isRecord(parsedBody.value)) return;

    const nextBody = structuredClone(parsedBody.value);
    setValueAtPath(nextBody, path, value);
    setBody(prettyJson(nextBody));
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
    await navigator.clipboard.writeText(curlCommand);
    setIsCurlCopied(true);
    window.setTimeout(() => setIsCurlCopied(false), 1800);
  }

  return (
    <main className="min-h-svh bg-background text-foreground">
      <Toaster position="bottom-right" richColors />
      <input
        ref={privateKeyFileInputRef}
        className="hidden"
        type="file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void loadDefaultPrivateKey(file);
          }
          event.target.value = "";
        }}
      />

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
        <EndpointSidebar
          activeEndpointId={activeEndpointId}
          groupedEndpoints={groupedEndpoints}
          onSelectEndpoint={selectEndpoint}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
          <RequestPanel
            activeEndpoint={activeEndpoint}
            method={method}
            path={path}
            body={body}
            parsedBody={parsedBody}
            requestUrl={requestUrl}
            curlCommand={curlCommand}
            isSending={isSending}
            isCurlCopied={isCurlCopied}
            defaultPrivateKeyBase64={defaultPrivateKeyBase64}
            defaultPrivateKeyName={defaultPrivateKeyName}
            onMethodChange={setMethod}
            onPathChange={setPath}
            onBodyChange={setBody}
            onReset={() => selectEndpoint(activeEndpoint)}
            onSubmit={sendRequest}
            onCopyCurl={copyCurl}
            onOpenPrivateKeyFilePicker={openPrivateKeyFilePicker}
            onUpdateBodyValue={updateBodyValue}
          />

          <ResponsePanel
            activeEndpoint={activeEndpoint}
            result={result}
            error={error}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
