'use client';

import { useRef, useState } from 'react';
import { FileAudio, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { AudioPlayer } from '@/components/audio-player';
import { useLocale, useT } from '@/lib/i18n/client';
import { intlLocale } from '@/lib/i18n/config';
import { AUDIO_ACCEPT, AUDIO_MAX_BYTES, mediaUrl } from '@/lib/media';
import { requestAudioUpload } from './actions';

/** PUT the file to the upload link, reporting progress (0–100). */
function uploadFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.onabort = () => resolve(false);
    xhr.send(file);
  });
}

interface AudioFieldProps {
  /** Media key of the recording, or null. */
  value: string | null;
  onChange: (key: string | null) => void;
  /** A file was uploaded in this form (the form cleans up unsaved ones). */
  onUploaded: (key: string) => void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
  labelClassName: string;
}

/**
 * Song recording: upload an audio file (straight to storage, with
 * progress), replace or remove it. The external link field sits below it in
 * the form; an uploaded file is played instead of the link.
 */
export function AudioField({
  value,
  onChange,
  onUploaded,
  onBusyChange,
  onError,
  labelClassName,
}: AudioFieldProps) {
  const t = useT();
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const mb = new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 1,
  });

  async function handleFile(file: File) {
    if (file.size > AUDIO_MAX_BYTES) {
      onError('Audio file must be at most 30 MB.');
      return;
    }
    onBusyChange(true);
    setProgress(0);
    setFileName(`${file.name} · ${mb.format(file.size / 1024 / 1024)} MB`);

    const res = await requestAudioUpload({
      fileName: file.name,
      type: file.type,
      size: file.size,
    });
    const uploaded =
      res.ok &&
      (await uploadFile(
        res.data.uploadUrl,
        file,
        res.data.contentType,
        setProgress,
      ));

    setProgress(null);
    onBusyChange(false);
    if (inputRef.current) inputRef.current.value = '';
    if (!res.ok) {
      setFileName(null);
      onError(res.error);
      return;
    }
    if (!uploaded) {
      setFileName(null);
      onError('The audio upload failed. Please try again.');
      return;
    }
    onUploaded(res.data.key);
    onChange(res.data.key);
  }

  return (
    <div>
      <div className={labelClassName}>
        {t('Recording')} · {t('optional')}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AUDIO_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {progress !== null ? (
        <div className="rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 py-3 md:bg-parchment dark:bg-parchment-deep">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="min-w-0 truncate text-ink">{fileName}</span>
            <span className="shrink-0 font-mono tabular-nums text-gold-deep">
              {progress}%
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-parchment-edge"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('Uploading…')}
          >
            <div
              className="h-full rounded-full bg-gold transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : value ? (
        <div className="rounded-xl border border-parchment-edge bg-parchment-soft px-3.5 py-3 md:bg-parchment dark:bg-parchment-deep">
          <div className="flex items-center gap-2 text-[12px] text-ink">
            <FileAudio className="h-4 w-4 shrink-0 text-gold-deep" />
            <span className="min-w-0 flex-1 truncate">
              {fileName ?? t('Uploaded recording')}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-parchment-edge px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-parchment-deep dark:text-gold"
            >
              <RefreshCw className="h-3 w-3" />
              {t('Replace')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                onChange(null);
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-parchment-edge px-2.5 py-1 text-[11px] font-semibold text-status-absent transition-colors hover:bg-parchment-deep"
            >
              <Trash2 className="h-3 w-3" />
              {t('Remove')}
            </button>
          </div>
          <AudioPlayer key={value} src={mediaUrl(value)} className="mt-2.5" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-gold/50 bg-parchment-soft px-3.5 py-3 text-left transition-colors hover:bg-parchment-deep md:bg-parchment dark:bg-parchment-deep"
        >
          <UploadCloud className="h-5 w-5 shrink-0 text-gold-deep" />
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-brand-ink">
              {t('Upload audio file')}
            </span>
            <span className="block text-[11px] text-ink-muted">
              {t('MP3, M4A, AAC, OGG or WAV · max 30 MB')}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
