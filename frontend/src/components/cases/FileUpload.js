import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { filesService } from '../../services/filesService';
import StaffDeleteDialog from '../common/StaffDeleteDialog';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const FileUpload = ({ caseId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [fileToDelete, setFileToDelete] = useState(null);
  const inputRef = useRef(null);

  const { data: files, isLoading } = useQuery(
    ['case-files', caseId],
    () => filesService.getByCase(caseId),
    { enabled: !!caseId }
  );

  const deleteMutation = useMutation(
    (fileId) => filesService.delete(fileId),
    {
      onSuccess: () => {
        setError('');
        setFileToDelete(null);
        queryClient.invalidateQueries(['case-files', caseId]);
      },
      onError: (err) => setError(err.response?.data?.message || t('case.fileDeleteFailed')),
    }
  );

  const uploadFile = async (file) => {
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError(t('case.fileTooLarge'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      await filesService.upload(caseId, file);
      queryClient.invalidateQueries(['case-files', caseId]);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || t('case.fileUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (!uploading) uploadFile(event.dataTransfer.files[0]);
  };

  const handleDownload = async (file) => {
    setDownloadingFileId(file.id);
    setError('');
    try {
      const blob = await filesService.download(file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_url?.split('/').pop() || `case-file-${file.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err.response?.data?.message || t('case.fileDownloadFailed'));
    } finally {
      setDownloadingFileId(null);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon />;
      case 'video':
        return <VideoIcon />;
      case 'pdf':
        return <PdfIcon />;
      default:
        return <FileIcon />;
    }
  };

  return (
    <Box>
      <input ref={inputRef} accept="image/*,video/*,.pdf" className="zzv-case-files__input" id="case-file-upload" type="file" onChange={(event) => uploadFile(event.target.files[0])} disabled={uploading} />
      <div
        className={`zzv-case-files__dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <span className="zzv-case-files__icon"><img src="/figma-staff/file-upload.svg" alt="" /></span>
        <div className="zzv-case-files__copy">
          <strong>{t('case.dragOrChooseFile')}</strong>
          <small>{t('case.fileTypesHint')}</small>
        </div>
        <label className="zzv-case-files__button" htmlFor="case-file-upload" aria-disabled={uploading}>
          {uploading ? t('common.saving') : t('case.chooseFile')}
        </label>
      </div>

      {error && !fileToDelete && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isLoading && <CircularProgress size={20} aria-label={t('common.loading')} sx={{ mt: 2 }} />}

      {!isLoading && files?.length > 0 && (
        <section className="zzv-case-files__list" aria-label={t('case.attachedFiles')}>
          <h2>{t('case.attachedFiles')} <span>{files.length}</span></h2>
          <ul>
            {files.map((file) => {
              const uploader = [file.uploaded_by_user?.name, file.uploaded_by_user?.last_name].filter(Boolean).join(' ');
              const uploadedAt = new Date(file.created_at);
              const date = Number.isNaN(uploadedAt.getTime()) ? '' : uploadedAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
              return <li key={file.id}>
                <span className={`zzv-case-files__file-icon zzv-case-files__file-icon--${file.file_type}`}>{getFileIcon(file.file_type)}</span>
                <div className="zzv-case-files__file-info">
                  <button type="button" onClick={() => handleDownload(file)} disabled={downloadingFileId === file.id}>
                    {file.file_url?.split('/').pop() || `#${file.id}`}
                  </button>
                  <small>{t('case.fileUploadedAt', { date })}{uploader ? ` · ${uploader}` : ''}</small>
                </div>
                <span className="zzv-case-files__file-type">{t(`case.fileTypes.${file.file_type || 'other'}`)}</span>
                {downloadingFileId === file.id && <CircularProgress size={18} aria-label={t('case.fileDownloading')} />}
                <IconButton aria-label={t('case.deleteFile', { name: file.file_url?.split('/').pop() || file.id })} onClick={() => { setError(''); setFileToDelete(file); }} disabled={deleteMutation.isLoading} size="small"><DeleteIcon fontSize="small" /></IconButton>
              </li>;
            })}
          </ul>
        </section>
      )}
      <StaffDeleteDialog
        open={Boolean(fileToDelete)}
        title={t('case.deleteFileTitle')}
        description={t('case.confirmFileDelete', { name: fileToDelete?.file_url?.split('/').pop() || '' })}
        detail={t('case.fileDeleteWarning')}
        error={error}
        loading={deleteMutation.isLoading}
        onClose={() => { setFileToDelete(null); setError(''); }}
        onConfirm={() => { if (fileToDelete) deleteMutation.mutate(fileToDelete.id); }}
      />
    </Box>
  );
};

export default FileUpload;
