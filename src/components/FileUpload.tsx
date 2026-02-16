'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.name.toLowerCase().endsWith('.heic')
  );
}

function validateFile(file: File): string | null {
  const isAcceptedType =
    ACCEPTED_TYPES.includes(file.type) || isHeicFile(file);
  if (!isAcceptedType) {
    return `${file.name}: Unsupported file type. Use JPEG, PNG, WebP, or HEIC.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: File too large. Maximum size is 5MB.`;
  }
  return null;
}

export default function FileUpload({
  onFilesSelected,
  multiple = false,
}: FileUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const validationErrors: string[] = [];
      const validFiles: File[] = [];

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          validationErrors.push(error);
          continue;
        }

        if (isHeicFile(file)) {
          setIsConverting(true);
          try {
            const heic2any = (await import('heic2any')).default;
            const blob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.85,
            });

            const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
            const convertedFile = new File(
              [convertedBlob],
              file.name.replace(/\.heic$/i, '.jpg'),
              { type: 'image/jpeg' }
            );
            validFiles.push(convertedFile);
          } catch {
            validationErrors.push(`${file.name}: Failed to convert HEIC file.`);
          } finally {
            setIsConverting(false);
          }
        } else {
          validFiles.push(file);
        }
      }

      setErrors(validationErrors);
      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [onFilesSelected]
  );

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    galleryInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const dismissError = (index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Mobile Buttons (visible on mobile only) */}
      <div className="flex flex-col gap-3 md:hidden">
        <button
          onClick={handleCameraClick}
          disabled={isConverting}
          className="flex items-center justify-center gap-3 w-full py-5 bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white text-lg font-semibold rounded-2xl transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
        >
          <Camera size={24} />
          Scan Card
        </button>
        <button
          onClick={handleGalleryClick}
          disabled={isConverting}
          className="flex items-center justify-center gap-3 w-full py-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-primary)] text-base font-medium rounded-2xl border border-[var(--border-subtle)] transition-all duration-150 active:scale-[0.98] min-h-[44px] disabled:opacity-50"
        >
          <Upload size={20} />
          Upload from Gallery
        </button>
      </div>

      {/* Desktop Drop Zone (visible on desktop only) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleGalleryClick}
        className={`hidden md:flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]'
            : 'border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] bg-[var(--bg-surface)]'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
            isDragging
              ? 'bg-[var(--accent-orange)] text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
          }`}
        >
          <Upload size={28} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {isDragging ? 'Drop your card images here' : 'Drag & drop business card images'}
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            or click to browse. JPEG, PNG, WebP, HEIC up to 5MB
          </p>
        </div>
      </div>

      {/* HEIC Converting Status */}
      {isConverting && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--accent-orange-muted)] text-[var(--accent-orange)] text-sm animate-fade-in-up">
          <div className="w-4 h-4 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
          Converting HEIC...
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-[var(--status-error)] text-sm animate-fade-in-up"
            >
              <span>{error}</span>
              <button
                onClick={() => dismissError(index)}
                className="shrink-0 p-1 rounded hover:bg-red-500/20 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
