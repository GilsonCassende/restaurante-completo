"use client";

import Image from "next/image";
import { Upload } from "lucide-react";
import type { RefObject } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SettingsUploadProps = {
  title: string;
  description: string;
  value: string;
  onClear: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  accentLabel: string;
  onChooseFile: () => void;
};

export function SettingsUpload({ title, description, value, onClear, inputRef, accentLabel, onChooseFile }: SettingsUploadProps) {
  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/90 p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {accentLabel}
        </Badge>
      </div>
      <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-border/70 bg-muted/25">
        {value ? (
          <Image src={value} alt={title} width={640} height={320} className="h-40 w-full object-cover" unoptimized />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Nenhum arquivo selecionado</div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onChooseFile}>
          <Upload className="h-4 w-4" />
          Escolher arquivo
        </Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Limpar
        </Button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" />
    </div>
  );
}
