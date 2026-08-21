import {
  DropZoneArea,
  Dropzone,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  DropzoneTrigger,
  type FileStatus,
  InfiniteProgress,
  useDropzone,
} from "@redwood/shad-ui/components/dropzone";
import { Field, FieldLabel } from "@redwood/shad-ui/components/field";
import { FileText, RefreshCw, Upload, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef } from "react";

const bytesPerMegabyte = 1024 * 1024;
const maxAttachmentMegabytes = 24;
const displayPrecision = 2;
export const maxAttachmentBytes = maxAttachmentMegabytes * bytesPerMegabyte;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 MB";
  return `${(bytes / bytesPerMegabyte).toFixed(displayPrecision)} MB`;
};

export function FeedbackAttachmentsField({
  attachments,
  onInvalidChange,
  onAttachmentsChange,
}: {
  attachments: File[];
  onAttachmentsChange: (attachments: File[]) => void;
  onInvalidChange: (isInvalid: boolean) => void;
}) {
  const fileStatusesRef = useRef<FileStatus<File, string>[]>([]);
  const attachmentsRef = useRef<File[]>(attachments);

  const setAttachments = useCallback(
    (nextAttachments: File[]) => {
      attachmentsRef.current = nextAttachments;
      onAttachmentsChange(nextAttachments);
    },
    [onAttachmentsChange]
  );

  const dropzone = useDropzone<File, string>({
    onDropFile: (file) => {
      const nextTotal = attachmentsRef.current.reduce((total, attachment) => total + attachment.size, 0) + file.size;

      if (nextTotal > maxAttachmentBytes) {
        return Promise.resolve({
          status: "error",
          error: `Attachments must stay under ${formatBytes(maxAttachmentBytes)} total.`,
        });
      }

      setAttachments([...attachmentsRef.current, file]);
      return Promise.resolve({ status: "success", result: file });
    },
    onRemoveFile: (id) => {
      const removedFileStatus = fileStatusesRef.current.find((fileStatus) => fileStatus.id === id);
      if (removedFileStatus?.status !== "success") return;
      setAttachments(attachmentsRef.current.filter((attachment) => attachment !== removedFileStatus.file));
    },
    validation: {
      maxSize: maxAttachmentBytes,
    },
    shapeUploadError: (error) => error,
  });

  useEffect(() => {
    fileStatusesRef.current = dropzone.fileStatuses;
  }, [dropzone.fileStatuses]);

  useEffect(() => {
    onInvalidChange(dropzone.isInvalid);
  }, [dropzone.isInvalid, onInvalidChange]);

  const totalBytes = useMemo(() => attachments.reduce((total, attachment) => total + attachment.size, 0), [attachments]);

  return (
    <Field data-invalid={dropzone.isInvalid}>
      <div className="flex flex-col space-y-1">
        <FieldLabel className="font-semibold text-lg">Attachments:</FieldLabel>
        <Dropzone {...dropzone}>
          <DropZoneArea className="min-h-36 border border-white/30 bg-zinc-950/30 p-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <Upload className="size-7 text-zinc-300" />
              <DropzoneDescription className="text-zinc-300">Drag files here, or choose files below.</DropzoneDescription>
              <DropzoneTrigger className="bg-zinc-800 text-zinc-100 ring-1 ring-white/15 hover:bg-zinc-700">Choose Files</DropzoneTrigger>
              <p className="text-muted-foreground text-sm">
                {formatBytes(totalBytes)} / {formatBytes(maxAttachmentBytes)}
              </p>
            </div>
          </DropZoneArea>

          <DropzoneMessage />

          {dropzone.fileStatuses.length > 0 && (
            <DropzoneFileList className="mt-3 gap-2">
              {dropzone.fileStatuses.map((fileStatus) => (
                <DropzoneFileListItem key={fileStatus.id} file={fileStatus} className="gap-3 border border-white/10 bg-zinc-950/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <FileText className="mt-0.5 size-4 shrink-0 text-zinc-300" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-sm">{fileStatus.fileName}</p>
                        <p className="text-muted-foreground text-xs">{formatBytes(fileStatus.file.size)}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {fileStatus.status === "error" && (
                        <DropzoneRetryFile variant="ghost" size="icon-sm" className="text-zinc-300 hover:bg-zinc-800">
                          <RefreshCw className="size-4" />
                        </DropzoneRetryFile>
                      )}
                      <DropzoneRemoveFile variant="ghost" size="icon-sm" className="text-zinc-300 hover:bg-zinc-800">
                        <X className="size-4" />
                      </DropzoneRemoveFile>
                    </div>
                  </div>

                  {fileStatus.status === "pending" && <InfiniteProgress status={fileStatus.status} />}
                  {fileStatus.status === "error" && <DropzoneFileMessage />}
                </DropzoneFileListItem>
              ))}
            </DropzoneFileList>
          )}
        </Dropzone>
      </div>
    </Field>
  );
}
