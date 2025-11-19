import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  VideoFile as VideoIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { filesService } from '../../services/filesService';
import { useMutation, useQuery, useQueryClient } from 'react-query';

const FileUpload = ({ caseId }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: files, isLoading } = useQuery(
    ['case-files', caseId],
    () => filesService.getByCase(caseId),
    { enabled: !!caseId }
  );

  const deleteMutation = useMutation(
    (fileId) => filesService.delete(fileId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['case-files', caseId]);
      },
    }
  );

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await filesService.upload(caseId, file);
      queryClient.invalidateQueries(['case-files', caseId]);
      e.target.value = ''; // Reset file input
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
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

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'image':
        return 'primary';
      case 'video':
        return 'secondary';
      case 'pdf':
        return 'error';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Files</Typography>
        <input
          accept="image/*,video/*,.pdf"
          style={{ display: 'none' }}
          id="file-upload"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <label htmlFor="file-upload">
          <Button
            variant="contained"
            component="span"
            startIcon={<UploadIcon />}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </label>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {files && files.length > 0 ? (
        <List>
          {files.map((file) => (
            <Paper key={file.id} sx={{ mb: 1, p: 1 }}>
              <ListItem
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleDelete(file.id)}
                    disabled={deleteMutation.isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <Box sx={{ mr: 2 }}>
                  {getFileIcon(file.file_type)}
                </Box>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        <a
                          href={filesService.getFileUrl(file.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {file.file_url.split('/').pop()}
                        </a>
                      </Typography>
                      <Chip
                        label={file.file_type}
                        size="small"
                        color={getFileTypeColor(file.file_type)}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      Uploaded {new Date(file.created_at).toLocaleString()}
                      {file.uploaded_by_user &&
                        ` by ${file.uploaded_by_user.name} ${file.uploaded_by_user.last_name}`}
                    </Typography>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No files uploaded yet
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;

