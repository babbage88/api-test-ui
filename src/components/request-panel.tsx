import { type FormEvent } from "react";
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  CopyIcon,
  PlayIcon,
} from "@phosphor-icons/react";

import { BodyParameterForm } from "@/components/body-parameter-form";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Endpoint, HttpMethod, ParsedBody } from "@/types";

type RequestPanelProps = {
  activeEndpoint: Endpoint;
  method: HttpMethod;
  path: string;
  body: string;
  parsedBody: ParsedBody;
  requestUrl: string;
  curlCommand: string;
  isSending: boolean;
  isCurlCopied: boolean;
  defaultPrivateKeyBase64: string;
  defaultPrivateKeyName: string;
  onMethodChange: (method: HttpMethod) => void;
  onPathChange: (path: string) => void;
  onBodyChange: (body: string) => void;
  onReset: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCopyCurl: () => void;
  onOpenPrivateKeyFilePicker: () => void;
  onUpdateBodyValue: (path: string[], value: unknown) => void;
};

export function RequestPanel({
  activeEndpoint,
  method,
  path,
  body,
  parsedBody,
  requestUrl,
  curlCommand,
  isSending,
  isCurlCopied,
  defaultPrivateKeyBase64,
  defaultPrivateKeyName,
  onMethodChange,
  onPathChange,
  onBodyChange,
  onReset,
  onSubmit,
  onCopyCurl,
  onOpenPrivateKeyFilePicker,
  onUpdateBodyValue,
}: RequestPanelProps) {
  return (
    <Card className="min-w-0 overflow-hidden rounded-lg py-0">
      <form className="min-w-0" onSubmit={onSubmit}>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <CardTitle>Request</CardTitle>
            <CardDescription>
              {activeEndpoint.summary}
              {activeEndpoint.request_type ? (
                <span className="ml-2 font-mono">
                  {activeEndpoint.request_type}
                </span>
              ) : null}
            </CardDescription>
          </div>
          <CardAction className="static col-auto row-auto flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              <ArrowClockwiseIcon />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopyCurl}
            >
              {isCurlCopied ? <CheckCircleIcon weight="fill" /> : <CopyIcon />}
              {isCurlCopied ? "Copied" : "cURL"}
            </Button>
            <Button type="submit" size="sm" disabled={isSending}>
              <PlayIcon weight="fill" />
              {isSending ? "Sending" : "Send"}
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="grid min-w-0 gap-4 p-4">
          <div className="grid gap-3 md:grid-cols-[132px_minmax(0,1fr)]">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Method</Label>
              <NativeSelect
                className="w-full"
                value={method}
                onChange={(event) =>
                  onMethodChange(event.target.value as HttpMethod)
                }
              >
                <NativeSelectOption>GET</NativeSelectOption>
                <NativeSelectOption>POST</NativeSelectOption>
                <NativeSelectOption>PUT</NativeSelectOption>
                <NativeSelectOption>DELETE</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Path</Label>
              <Input
                className="font-mono"
                value={path}
                onChange={(event) => onPathChange(event.target.value)}
                spellCheck={false}
              />
            </div>
          </div>

          <Tabs
            className="min-w-0"
            defaultValue={method === "GET" ? "curl" : "params"}
          >
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
              <TabsList className="shrink-0">
                {method !== "GET" ? (
                  <>
                    <TabsTrigger value="params">Params</TabsTrigger>
                    <TabsTrigger value="json">
                      JSON
                      {parsedBody.error ? (
                        <Badge variant="destructive">Invalid</Badge>
                      ) : null}
                    </TabsTrigger>
                  </>
                ) : null}
                <TabsTrigger value="curl">cURL</TabsTrigger>
              </TabsList>
              <span className="min-w-0 max-w-full truncate font-mono text-xs text-muted-foreground sm:max-w-[55%]">
                {requestUrl}
              </span>
            </div>

            {method !== "GET" ? (
              <TabsContent value="params" className="mt-2 min-w-0">
                <BodyParameterForm
                  parsedBody={parsedBody}
                  defaultPrivateKeyBase64={defaultPrivateKeyBase64}
                  defaultPrivateKeyName={defaultPrivateKeyName}
                  onOpenPrivateKeyFilePicker={onOpenPrivateKeyFilePicker}
                  onUpdateBodyValue={onUpdateBodyValue}
                />
              </TabsContent>
            ) : null}

            {method !== "GET" ? (
              <TabsContent value="json" className="mt-2 min-w-0">
                <div className="grid gap-1">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="body-editor"
                  >
                    JSON body
                  </Label>
                  <Textarea
                    id="body-editor"
                    className="h-80 max-w-full resize-y overflow-auto font-mono leading-relaxed [field-sizing:fixed]"
                    value={body}
                    onChange={(event) => onBodyChange(event.target.value)}
                    spellCheck={false}
                  />
                </div>
              </TabsContent>
            ) : null}

            <TabsContent value="curl" className="mt-2 min-w-0">
              <div className="grid min-w-0 gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    className="text-xs text-muted-foreground"
                    htmlFor="curl-command"
                  >
                    cURL command
                  </Label>
                  <Button
                    type="button"
                    variant={isCurlCopied ? "secondary" : "outline"}
                    size="sm"
                    onClick={onCopyCurl}
                  >
                    {isCurlCopied ? (
                      <CheckCircleIcon weight="fill" />
                    ) : (
                      <CopyIcon />
                    )}
                    {isCurlCopied ? "Copied" : "Copy"}
                  </Button>
                </div>
                <Textarea
                  id="curl-command"
                  className="h-40 max-w-full resize-y overflow-auto font-mono leading-relaxed [field-sizing:fixed]"
                  value={curlCommand}
                  readOnly
                  spellCheck={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </form>
    </Card>
  );
}
