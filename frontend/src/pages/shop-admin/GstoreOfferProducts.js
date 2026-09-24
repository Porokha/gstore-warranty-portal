import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Switch, TextField, Typography } from '@mui/material';
import { DeleteOutlineRounded, EditRounded } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { tradeInService } from '../../services/tradeInService';

const emptyProduct = { name: '', subtitle: '', image_url: '', price_gel: '', bonus_percent: '', bonus_fixed: '', enabled: true };

export default function GstoreOfferProducts() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const productsQuery = useQuery('trade-in-admin-gstore-products', tradeInService.getAdminGstoreProducts);
  const refresh = () => {
    queryClient.invalidateQueries('trade-in-admin-gstore-products');
    queryClient.invalidateQueries('trade-in-gstore-products');
  };
  const saveMutation = useMutation(tradeInService.saveAdminGstoreProduct, {
    onSuccess: () => { setEditing(null); refresh(); },
  });
  const deleteMutation = useMutation(tradeInService.deleteAdminGstoreProduct, {
    onSuccess: () => { setDeleting(null); refresh(); },
  });

  const openEditor = (product = null) => {
    setEditing(product || { id: null });
    setForm(product ? {
      name: product.name,
      subtitle: product.subtitle || '',
      image_url: product.image_url,
      price_gel: String(product.price_gel),
      bonus_percent: product.bonus_percent == null ? '' : String(product.bonus_percent),
      bonus_fixed: product.bonus_fixed == null ? '' : String(product.bonus_fixed),
      enabled: product.enabled,
    } : emptyProduct);
    setUploadError('');
    saveMutation.reset();
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const response = await tradeInService.uploadGstoreProductImage(file);
      setForm((current) => ({ ...current, image_url: response.image_url }));
    } catch (error) {
      setUploadError(error.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    saveMutation.mutate({
      id: editing.id,
      payload: {
        name: form.name.trim(),
        subtitle: form.subtitle.trim(),
        image_url: form.image_url,
        price_gel: Number(form.price_gel),
        bonus_percent: form.bonus_percent === '' ? null : Number(form.bonus_percent),
        bonus_fixed: form.bonus_fixed === '' ? null : Number(form.bonus_fixed),
        enabled: form.enabled,
      },
    });
  };

  const valid = form.name.trim() && form.image_url && form.price_gel !== '' && Number(form.price_gel) >= 0
    && (form.bonus_percent === '' || (Number(form.bonus_percent) >= 0 && Number(form.bonus_percent) <= 100))
    && (form.bonus_fixed === '' || Number(form.bonus_fixed) >= 0);

  return <Box sx={{ p: 3, borderTop: '1px solid #e5eaf2' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
      <Box><Typography sx={{ fontSize: 18, fontWeight: 800 }}>Selectable Gstore products</Typography><Typography sx={{ color: '#667085', fontSize: 13 }}>Cards shown with the trade-in credit. Blank bonus fields use the global values above.</Typography></Box>
      <Button variant="contained" onClick={() => openEditor()}>Add product card</Button>
    </Box>
    {productsQuery.isError && <Alert severity="error">Gstore products could not be loaded.</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 2 }}>
      {(productsQuery.data || []).map((product) => <Box key={product.id} sx={{ border: '1px solid #e1e5ef', borderRadius: '12px', overflow: 'hidden', opacity: product.enabled ? 1 : .6 }}>
        <Box component="img" src={product.image_url} alt="" sx={{ width: '100%', height: 155, objectFit: 'contain', bgcolor: '#f7f6fc' }} />
        <Box sx={{ p: 1.5 }}><Typography sx={{ fontWeight: 800 }}>{product.name}</Typography><Typography sx={{ fontSize: 12, color: '#667085' }}>{product.subtitle}</Typography><Typography sx={{ mt: 1, fontWeight: 800 }}>₾{Number(product.price_gel).toLocaleString()}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}><Box sx={{ display: 'flex', alignItems: 'center' }}><Switch size="small" checked={product.enabled} disabled={saveMutation.isLoading} onChange={(event) => saveMutation.mutate({ id: product.id, payload: { name: product.name, subtitle: product.subtitle, image_url: product.image_url, price_gel: Number(product.price_gel), bonus_percent: product.bonus_percent, bonus_fixed: product.bonus_fixed, enabled: event.target.checked } })} /><Typography sx={{ fontSize: 12 }}>Visible</Typography></Box><Box><IconButton aria-label={`Edit ${product.name}`} onClick={() => openEditor(product)}><EditRounded fontSize="small" /></IconButton><IconButton aria-label={`Delete ${product.name}`} onClick={() => setDeleting(product)}><DeleteOutlineRounded fontSize="small" /></IconButton></Box></Box>
        </Box>
      </Box>)}</Box>
    {!productsQuery.isLoading && !(productsQuery.data || []).length && <Typography sx={{ py: 3, color: '#667085' }}>No product cards yet. The current generic Gstore offer remains visible until a card is published.</Typography>}
    <Dialog open={Boolean(editing)} onClose={() => !uploading && setEditing(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '12px !important' } }}>
      <DialogTitle>{editing?.id ? 'Edit Gstore product card' : 'New Gstore product card'}</DialogTitle>
      <DialogContent dividers><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField label="Product name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} inputProps={{ maxLength: 160 }} required />
        <TextField label="Short detail (optional)" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} inputProps={{ maxLength: 160 }} />
        <TextField type="number" label="Product price (GEL)" value={form.price_gel} onChange={(event) => setForm({ ...form, price_gel: event.target.value })} inputProps={{ min: 0, max: 1000000 }} required />
        <Box><Button component="label" variant="outlined" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload product image'}<input type="file" hidden accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])} /></Button>{form.image_url && <Box component="img" src={form.image_url} alt="Product preview" sx={{ display: 'block', width: 160, height: 120, mt: 1, objectFit: 'contain', bgcolor: '#f7f6fc', borderRadius: 1 }} />}</Box>
        {uploadError && <Alert severity="error">{uploadError}</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}><TextField type="number" label="Bonus % (optional)" value={form.bonus_percent} onChange={(event) => setForm({ ...form, bonus_percent: event.target.value })} inputProps={{ min: 0, max: 100 }} /><TextField type="number" label="Fixed bonus GEL (optional)" value={form.bonus_fixed} onChange={(event) => setForm({ ...form, bonus_fixed: event.target.value })} inputProps={{ min: 0, max: 100000 }} /></Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}><Switch checked={form.enabled} onChange={(event) => setForm({ ...form, enabled: event.target.checked })} /><Typography>Show in trade-in offers</Typography></Box>
        {saveMutation.isError && <Alert severity="error">{saveMutation.error?.response?.data?.message || 'Could not save product card.'}</Alert>}
      </Stack></DialogContent><DialogActions><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="contained" disabled={!valid || uploading || saveMutation.isLoading} onClick={save}>Save product</Button></DialogActions>
    </Dialog>
    <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)} PaperProps={{ sx: { borderRadius: '12px !important' } }}><DialogTitle>Delete product card?</DialogTitle><DialogContent>This removes {deleting?.name} from future offers. Existing quote snapshots remain.</DialogContent><DialogActions><Button onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={deleteMutation.isLoading} onClick={() => deleteMutation.mutate(deleting.id)}>Delete</Button></DialogActions></Dialog>
  </Box>;
}
