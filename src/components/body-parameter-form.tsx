import { type ReactNode } from "react";
import { KeyIcon, UploadSimpleIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatFieldLabel, isRecord, prettyJson } from "@/lib/request-body";
import type { ParsedBody } from "@/types";

type BodyParameterFormProps = {
  parsedBody: ParsedBody;
  defaultPrivateKeyBase64: string;
  defaultPrivateKeyName: string;
  onOpenPrivateKeyFilePicker: () => void;
  onUpdateBodyValue: (path: string[], value: unknown) => void;
};

function SecretFieldPreview({ value }: { value: string }) {
  if (!value) {
    return <span className="text-muted-foreground">No key selected</span>;
  }

  return (
    <span className="font-mono text-muted-foreground">
      {value.length.toLocaleString()} base64 chars
    </span>
  );
}

export function BodyParameterForm({
  parsedBody,
  defaultPrivateKeyBase64,
  defaultPrivateKeyName,
  onOpenPrivateKeyFilePicker,
  onUpdateBodyValue,
}: BodyParameterFormProps) {
  function renderBodyField(value: unknown, path: string[]): ReactNode {
    const name = path[path.length - 1];
    const label = formatFieldLabel(name);

    if (isRecord(value)) {
      return (
        <div key={path.join(".")} className="grid gap-3 rounded-md border p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium">{label}</h3>
              <p className="font-mono text-xs text-muted-foreground">
                {path.join(".")}
              </p>
            </div>
            {name === "ssh" && defaultPrivateKeyName ? (
              <Badge variant="outline">
                <KeyIcon />
                {defaultPrivateKeyName}
              </Badge>
            ) : null}
          </div>
          <Separator />
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(value).map(([childName, childValue]) =>
              renderBodyField(childValue, [...path, childName]),
            )}
          </div>
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <div
          key={path.join(".")}
          className="flex min-h-16 items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
        >
          <div className="grid gap-1">
            <Label className="text-sm text-foreground">{label}</Label>
            <span className="font-mono text-xs text-muted-foreground">
              {path.join(".")}
            </span>
          </div>
          <Switch
            checked={value}
            onCheckedChange={(checked) => onUpdateBodyValue(path, checked)}
          />
        </div>
      );
    }

    if (typeof value === "number") {
      return (
        <div key={path.join(".")} className="grid gap-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            type="number"
            value={value}
            onChange={(event) =>
              onUpdateBodyValue(path, Number(event.target.value))
            }
          />
        </div>
      );
    }

    if (typeof value === "string" && name === "private_key_base64") {
      const isUsingDefault =
        defaultPrivateKeyBase64 !== "" && value === defaultPrivateKeyBase64;

      return (
        <div key={path.join(".")} className="grid gap-2 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <SecretFieldPreview value={value} />
            </div>
            {isUsingDefault ? <Badge variant="secondary">Default</Badge> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenPrivateKeyFilePicker}
            >
              <UploadSimpleIcon />
              Pick file
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!defaultPrivateKeyBase64}
              onClick={() => onUpdateBodyValue(path, defaultPrivateKeyBase64)}
            >
              <KeyIcon />
              Use default
            </Button>
          </div>
        </div>
      );
    }

    if (typeof value === "string") {
      return (
        <div key={path.join(".")} className="grid gap-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            value={value}
            onChange={(event) => onUpdateBodyValue(path, event.target.value)}
            spellCheck={false}
          />
        </div>
      );
    }

    return (
      <div key={path.join(".")} className="grid gap-1">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Textarea
          className="min-h-20 resize-y font-mono"
          value={prettyJson(value)}
          onChange={(event) => {
            try {
              onUpdateBodyValue(path, JSON.parse(event.target.value));
            } catch {
              onUpdateBodyValue(path, event.target.value);
            }
          }}
          spellCheck={false}
        />
      </div>
    );
  }

  if (parsedBody.error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
        {parsedBody.error}
      </div>
    );
  }

  if (!isRecord(parsedBody.value)) {
    return (
      <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
        No object body configured for this request.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {Object.entries(parsedBody.value).map(([fieldName, fieldValue]) =>
        renderBodyField(fieldValue, [fieldName]),
      )}
    </div>
  );
}
