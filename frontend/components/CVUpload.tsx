"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, CheckCircle2, FileText, RefreshCw } from "lucide-react";

interface CVUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function CVUpload({ file, onFileChange }: CVUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        onFileChange(acceptedFiles[0]);
      }
    },
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-brass bg-brass/10"
          : file
          ? "border-teal bg-teal/5"
          : "border-brass/40 hover:border-brass bg-ink/[0.02] hover:bg-brass/5"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3">
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-teal/15 text-teal flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-teal" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold text-ink flex items-center justify-center gap-1.5">
                <FileText size={15} className="text-teal" />
                {file.name}
              </p>
              <p className="font-mono text-xs text-ink/60 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB · PDF Uploaded Successfully
              </p>
            </div>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1.5 font-body text-xs text-brass hover:text-ink font-semibold border border-brass/40 px-3 py-1 rounded-sm bg-brass/10 hover:bg-brass/20 transition-colors"
            >
              <RefreshCw size={12} /> Replace CV
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-brass/15 text-brass flex items-center justify-center">
              <UploadCloud className="w-6 h-6 text-brass" />
            </div>
            <div>
              <p className="font-body text-sm font-semibold text-ink">
                {isDragActive ? (
                  "Drop your CV PDF here..."
                ) : (
                  <>
                    Drag & drop your CV here, or <span className="text-brass font-bold underline">click to browse</span>
                  </>
                )}
              </p>
              <p className="font-mono text-xs text-ink/60 mt-1">
                Supports PDF format · Up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
