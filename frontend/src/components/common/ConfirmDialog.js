import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';

const ConfirmDialog = ({ open, onClose, onConfirm, title, message, confirmText, cancelText, severity = 'warning', loading = false }) => {
  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {message}
        </DialogContentText>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" py={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Processing...
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {cancelText || 'Cancel'}
        </Button>
        <Button
          onClick={handleConfirm}
          color={severity === 'error' ? 'error' : 'primary'}
          variant="contained"
          autoFocus
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {confirmText || 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

