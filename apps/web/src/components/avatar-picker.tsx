'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import Cropper, { type Area } from 'react-easy-crop';

type AvatarCropDialogProps = {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
};

async function getCroppedBlob(
  imageSrc: string,
  crop: Area,
  mimeType = 'image/jpeg',
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = Math.min(crop.width, crop.height, 512);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not crop image');
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    size,
    size,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create image'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () =>
      reject(new Error('Could not load image')),
    );
    image.src = src;
  });
}

export function AvatarCropDialog({
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedArea) return;
    setPending(true);
    setError('');
    try {
      const blob = await getCroppedBlob(imageSrc, croppedArea);
      await onConfirm(blob);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not crop image. Try another photo.',
      );
      setPending(false);
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, pending]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,14,0.78)] p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Crop profile photo"
        className="card w-full max-w-lg overflow-hidden p-0 shadow-xl"
      >
        <div className="border-b border-[var(--line)] px-3 py-2.5">
          <h2 className="heading-section">
            Crop photo
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Drag to reposition, then adjust zoom for a square profile picture.
          </p>
        </div>
        <div className="relative h-56 bg-[var(--paper)]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="space-y-2.5 px-3 py-2.5">
          <label className="flex items-center gap-3 text-sm text-[var(--muted)]">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </label>
          {error ? <p className="text-sm alert-error">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleConfirm()}
              disabled={pending || !croppedArea}
            >
              {pending ? 'Applying…' : 'Use photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type AvatarPickerProps = {
  avatarUrl: string | null;
  displayName: string;
  onUploaded: (avatarUrl: string | null) => void;
  upload: (file: Blob) => Promise<string | null>;
  remove: () => Promise<void>;
};

export function AvatarPicker({
  avatarUrl,
  displayName,
  onUploaded,
  upload,
  remove,
}: AvatarPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  function openPicker() {
    setError('');
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB before cropping');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
  }

  function closeCropper() {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
  }

  async function onCropConfirm(blob: Blob) {
    setError('');
    try {
      const nextUrl = await upload(blob);
      onUploaded(nextUrl);
      closeCropper();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    }
  }

  async function onRemove() {
    setPending(true);
    setError('');
    try {
      await remove();
      onUploaded(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove photo');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="relative size-28 shrink-0 overflow-hidden rounded-full border border-[var(--line)] bg-[var(--glow)]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${displayName} profile`}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center font-[family-name:var(--font-display)] text-3xl text-[var(--accent-strong)]">
            {initials || '?'}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          Square photos work best. Changes apply when you save the profile.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openPicker}
            disabled={pending}
          >
            {avatarUrl ? 'Change photo' : 'Add photo'}
          </button>
          {avatarUrl ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void onRemove()}
              disabled={pending}
            >
              Remove
            </button>
          ) : null}
        </div>
        {error ? <p className="text-sm alert-error">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
      {previewSrc ? (
        <AvatarCropDialog
          imageSrc={previewSrc}
          onCancel={closeCropper}
          onConfirm={onCropConfirm}
        />
      ) : null}
    </div>
  );
}
