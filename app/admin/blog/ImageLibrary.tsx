"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
type Media = {
  id: string;
  url: string;
  usedBy: { id: string; title: string }[];
  inHistory: boolean;
};
export default function ImageLibrary({
  onChoose,
  onClose,
}: {
  onChoose: (url: string) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [images, setImages] = useState<Media[]>([]),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/editor/images?page=" + page, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error);
        if (active) {
          setImages(data.images);
          setMore(data.hasMore);
        }
      })
      .catch((error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [page]);
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError("Choose an image under 3 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/editor/images", {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      onChoose(data.imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="media-dialog"
      onCancel={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="media-title"
    >
      <header>
        <div>
          <span className="editor-eyebrow">YOUR IMAGE LIBRARY</span>
          <h2 id="media-title">Choose the right image.</h2>
        </div>
        <button type="button" disabled={busy} onClick={onClose}>
          Close
        </button>
      </header>
      <p>
        Upload a JPG, PNG, or WebP up to 3 MB, or reuse an image. Images are
        resized automatically.
      </p>
      <label className="editor-primary editor-upload">
        {busy ? "Uploading…" : "Upload a new image"}
        <input
          aria-label="Upload a new image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {error && (
        <p role="alert" className="editor-error">
          {error}
        </p>
      )}
      <div className="media-grid">
        {images.map((image) => (
          <button
            type="button"
            key={image.id}
            disabled={busy}
            onClick={() => onChoose(image.url)}
            aria-label={"Use image " + image.id}
          >
            <Image
              src={image.url}
              width={300}
              height={180}
              alt="Library image preview"
              unoptimized
              loading="lazy"
            />
            <span>
              {image.usedBy.length
                ? image.usedBy.map((p) => p.title).join(", ")
                : image.inHistory
                  ? "Saved in version history"
                  : "Not attached to an edition"}
            </span>
          </button>
        ))}
      </div>
      {!images.length && <p>Your uploaded images will appear here.</p>}
      <footer className="editor-actions">
        <button disabled={busy || !page} onClick={() => setPage(page - 1)}>
          Previous images
        </button>
        <span>Page {page + 1}</span>
        <button disabled={busy || !more} onClick={() => setPage(page + 1)}>
          Next images
        </button>
      </footer>
    </dialog>
  );
}
