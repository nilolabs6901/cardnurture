'use client';

import { useState, useCallback, useRef, useEffect, Suspense, ChangeEvent, DragEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, Camera, X, Loader2, CheckCircle, AlertCircle, FileImage } from 'lucide-react';
import type { ParseResult, BatchOcrItem } from '@/types';

/* ─── FileUpload Component ─── */

interface FileUploadProps {
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
}

function FileUpload({ multiple = true, onFilesSelected }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const accepted: File[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      // Accept by MIME type or by extension for HEIC (some browsers don't set MIME)
      const ext = file.name.toLowerCase().split('.').pop();
      if (allowedTypes.includes(file.type) || ext === 'heic' || ext === 'heif') {
        accepted.push(file);
      }
    }

    if (accepted.length > 0) {
      onFilesSelected(accepted);
    }
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 w-full min-h-[280px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
        isDragActive
          ? 'border-[var(--accent-orange)] bg-[var(--accent-orange-muted)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-surface-hover)]'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 ${
          isDragActive
            ? 'bg-[var(--accent-orange)] text-white'
            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
        }`}
      >
        <Upload size={28} />
      </div>

      <div className="text-center px-4">
        <p className="text-[var(--text-primary)] font-medium text-sm">
          {isDragActive ? 'Drop your card images here' : 'Tap to upload or drag & drop'}
        </p>
        <p className="text-[var(--text-tertiary)] text-xs mt-1">
          JPEG, PNG, WebP, or HEIC -- up to 5MB each
        </p>
      </div>
    </div>
  );
}

/* ─── BatchProcessingQueue Component ─── */

interface BatchProcessingQueueProps {
  items: BatchOcrItem[];
  onStartReview: () => void;
  allDone: boolean;
}

function BatchProcessingQueue({ items, onStartReview, allDone }: BatchProcessingQueueProps) {
  const completedCount = items.filter((i) => i.status === 'extracted').length;
  const failedCount = items.filter((i) => i.status === 'failed').length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? ((completedCount + failedCount) / totalCount) * 100 : 0;

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)]">
            Processing {completedCount + failedCount} of {totalCount} cards
          </span>
          <span className="text-[var(--text-tertiary)]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out progress-shimmer"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Queue list */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] px-4 py-3 animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}
            style={{ animationFillMode: 'both' }}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {item.status === 'queued' && (
                <FileImage size={18} className="text-[var(--text-tertiary)]" />
              )}
              {item.status === 'processing' && (
                <Loader2 size={18} className="text-[var(--accent-orange)] animate-spin" />
              )}
              {item.status === 'extracted' && (
                <CheckCircle size={18} className="text-[var(--status-success)]" />
              )}
              {item.status === 'failed' && (
                <AlertCircle size={18} className="text-[var(--status-error)]" />
              )}
            </div>

            {/* File name */}
            <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
              {item.fileName}
            </span>

            {/* Status text */}
            <span
              className={`text-xs flex-shrink-0 ${
                item.status === 'queued'
                  ? 'text-[var(--text-tertiary)]'
                  : item.status === 'processing'
                    ? 'text-[var(--accent-orange)]'
                    : item.status === 'extracted'
                      ? 'text-[var(--status-success)]'
                      : 'text-[var(--status-error)]'
              }`}
            >
              {item.status === 'queued' && 'Queued'}
              {item.status === 'processing' && 'Processing...'}
              {item.status === 'extracted' && 'Done'}
              {item.status === 'failed' && (item.error || 'Failed')}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
      {allDone && (
        <button
          onClick={onStartReview}
          className="w-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white font-semibold rounded-xl px-4 py-3 min-h-[44px] transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Start Review ({completedCount} card{completedCount !== 1 ? 's' : ''})
        </button>
      )}
    </div>
  );
}

/* ─── Processing Overlay ─── */

function ProcessingOverlay() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-primary)]/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in-up">
        {/* Pulsing orange ring */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--accent-orange)] pulse-ring" />
          <div className="absolute inset-2 rounded-full border-4 border-[var(--accent-orange)] pulse-ring" style={{ animationDelay: '0.5s' }} />
          <Camera size={28} className="text-[var(--accent-orange)] relative z-10" />
        </div>
        <div className="text-center">
          <p className="text-[var(--text-primary)] font-medium text-sm">Processing card...</p>
          {elapsed > 3 && (
            <p className="text-[var(--text-tertiary)] text-xs mt-2">
              {elapsed > 15
                ? 'Still working... first-time OCR setup takes longer'
                : 'Extracting text via OCR...'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Upload Page ─── */

export default function UploadPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--text-secondary)]">Loading...</div>}>
      <UploadPage />
    </Suspense>
  );
}

function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFab = searchParams.get('scanned') === '1';

  const [isProcessing, setIsProcessing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchOcrItem[]>([]);
  const [batchResults, setBatchResults] = useState<ParseResult[]>([]);
  const [error, setError] = useState('');
  const processingRef = useRef(false);

  // Warn before navigating away during batch processing
  useEffect(() => {
    const hasUnfinishedBatch =
      batchMode && batchItems.some((i) => i.status === 'processing' || i.status === 'queued');
    const hasUnreviewedResults =
      batchMode && batchItems.some((i) => i.status === 'extracted') && !batchItems.every((i) => i.status === 'extracted' || i.status === 'failed');

    if (!hasUnfinishedBatch && !hasUnreviewedResults) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [batchMode, batchItems]);

  async function processOcr(file: File): Promise<ParseResult | null> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Processing failed' }));
      throw new Error(data.error || 'Processing failed');
    }

    return res.json();
  }

  async function handleSingleFile(file: File) {
    setIsProcessing(true);
    setError('');

    try {
      const result = await processOcr(file);
      if (result) {
        sessionStorage.setItem(
          'cardnurture_ocr_result',
          JSON.stringify({
            rawText: result.rawText,
            fields: result.fields,
            confidence: result.confidence,
          })
        );
        router.push('/confirm');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image.');
      setIsProcessing(false);
    }
  }

  async function handleBatchFiles(files: File[]) {
    setBatchMode(true);
    setError('');

    // Initialize batch items
    const items: BatchOcrItem[] = files.map((file, idx) => ({
      id: `batch-${idx}-${Date.now()}`,
      fileName: file.name,
      status: 'queued' as const,
    }));
    setBatchItems(items);

    const results: ParseResult[] = [];

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      // Update current item to processing
      setBatchItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'processing' as const } : item
        )
      );

      try {
        const result = await processOcr(files[i]);
        if (result) {
          results.push(result);
          setBatchItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: 'extracted' as const, result } : item
            )
          );
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed';
        setBatchItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: 'failed' as const, error: errorMessage } : item
          )
        );
      }
    }

    setBatchResults(results);
  }

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      if (files.length === 1) {
        handleSingleFile(files[0]);
      } else if (files.length > 1) {
        handleBatchFiles(files);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function handleStartReview() {
    // Collect all successful results from batch items
    const successResults: ParseResult[] = [];
    for (const item of batchItems) {
      if (item.status === 'extracted' && item.result) {
        successResults.push(item.result);
      }
    }

    if (successResults.length === 0) {
      setError('No cards were successfully processed.');
      return;
    }

    sessionStorage.setItem('cardnurture_batch_results', JSON.stringify(successResults));
    router.push('/upload/review');
  }

  const allDone =
    batchItems.length > 0 &&
    batchItems.every((i) => i.status === 'extracted' || i.status === 'failed');

  return (
    <>
      {isProcessing && <ProcessingOverlay />}

      <div className="animate-fade-in-up max-w-lg mx-auto px-4 pt-6 pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-[var(--font-space-grotesk)] text-2xl font-bold text-[var(--text-primary)]">
            Scan a Card
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Snap a photo or upload from your gallery
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-[var(--status-error)] flex-shrink-0" />
            <p className="text-sm text-[var(--status-error)]">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto flex-shrink-0 text-[var(--status-error)] hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Upload zone OR batch queue */}
        {!batchMode ? (
          <FileUpload multiple={true} onFilesSelected={handleFilesSelected} />
        ) : (
          <BatchProcessingQueue
            items={batchItems}
            onStartReview={handleStartReview}
            allDone={allDone}
          />
        )}

        {/* Reset batch */}
        {batchMode && allDone && (
          <button
            onClick={() => {
              setBatchMode(false);
              setBatchItems([]);
              setBatchResults([]);
              setError('');
            }}
            className="mt-3 w-full text-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 min-h-[44px]"
          >
            Upload different cards
          </button>
        )}
      </div>

      {/* Quick-scan FAB after returning from saving a contact */}
      {showFab && !isProcessing && !batchMode && (
        <button
          onClick={() => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/jpeg,image/png,image/webp,image/heic,.heic,.heif';
            fileInput.capture = 'environment';
            fileInput.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files.length > 0) {
                handleSingleFile(target.files[0]);
              }
            };
            fileInput.click();
          }}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-[var(--accent-orange)] hover:bg-[var(--accent-orange-hover)] text-white flex items-center justify-center shadow-lg transition-all duration-150 active:scale-[0.98] z-40"
          style={{ boxShadow: '0 4px 20px rgba(243, 111, 33, 0.4)' }}
        >
          <Camera size={24} />
        </button>
      )}
    </>
  );
}
