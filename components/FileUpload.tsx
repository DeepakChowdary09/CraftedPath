"use client";

import React, { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { CloudUpload, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadProps {
  onTextExtracted: (text: string) => void;
  label?: string;
  disabled?: boolean;
}

type UploadState = "idle" | "loading" | "success" | "error";

export default function FileUpload({
  onTextExtracted,
  label,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setUploadState("loading");
      setErrorMsg(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/extract-text", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error ?? `Server error ${res.status}`);
        }

        onTextExtracted(data.text as string);
        setUploadState("success");
      } catch (err: any) {
        setErrorMsg(err?.message ?? "Failed to extract text.");
        setUploadState("error");
      }
    },
    [onTextExtracted]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [disabled, processFile]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset so the same file can be re-uploaded if needed
    e.target.value = "";
  };

  const handleClick = () => {
    if (!disabled && uploadState !== "loading") {
      inputRef.current?.click();
    }
  };

  const borderColor =
    isDragging
      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
      : uploadState === "success"
      ? "border-green-500 bg-green-50 dark:bg-green-950/30"
      : uploadState === "error"
      ? "border-red-400 bg-red-50 dark:bg-red-950/30"
      : "border-muted-foreground/30 hover:border-blue-400 hover:bg-muted/50";

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label="File upload area"
        className={[
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed px-6 py-8",
          "transition-all duration-200 select-none",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          borderColor,
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={handleChange}
          disabled={disabled}
        />

        {uploadState === "loading" ? (
          <>
            <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Extracting text from <span className="font-semibold">{fileName}</span>…
            </p>
          </>
        ) : uploadState === "success" ? (
          <>
            <CheckCircle className="h-9 w-9 text-green-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                {fileName}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                Text extracted — click or drag to replace
              </p>
            </div>
          </>
        ) : uploadState === "error" ? (
          <>
            <AlertCircle className="h-9 w-9 text-red-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {errorMsg ?? "Upload failed"}
              </p>
              <p className="text-xs text-red-500 mt-0.5">Click or drag to try again</p>
            </div>
          </>
        ) : (
          <>
            <CloudUpload className="h-9 w-9 text-muted-foreground transition-colors group-hover:text-blue-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drag &amp; Drop your file here or{" "}
                <span className="text-blue-500 underline underline-offset-2">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, TXT</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
