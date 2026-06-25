"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, CheckCircle } from "lucide-react";

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
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
        isDragActive
          ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20"
          : file
          ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5"
          : "border-slate-300 hover:border-indigo-400 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 dark:border-slate-800"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-3">
        {file ? (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 animate-pulse" />
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
              </p>
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="w-12 h-12 text-slate-400 dark:text-slate-600" />
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isDragActive ? "Drop your CV here" : "Drag & drop your CV (PDF)"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF only (Max 5MB)
              </p>
            </div>
            <button
              type="button"
              className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
            >
              Browse File
            </button>
          </>
        )}
      </div>
    </div>
  );
}
