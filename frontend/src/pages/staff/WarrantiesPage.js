import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { warrantiesService } from '../../services/warrantiesService';
import { useQueryClient } from 'react-query';
import { useAuth } from '../../contexts/AuthContext';

const WarrantiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    sku: searchParams.get('sku') || '',
    serial_number: searchParams.get('serial_number') || '',
    device_type: searchParams.get('device_type') || '',
    customer_phone: searchParams.get('customer_phone') || '',
    active_only: searchParams.get('active_only') || '',
    expired_only: searchParams.get('expired_only') || '',
  });

  const { data: warranties, isLoading, error } = useQuery(
    ['warranties', filters],
    () => warrantiesService.getAll(filters),
    {
      keepPreviousData: true,
    }
  );

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    Object.keys(newFilters).forEach((k) => {
      if (newFilters[k]) params.set(k, newFilters[k]);
    });
    setSearchParams(params);
  };

  const isWarrantyActive = (warrantyEnd) => {
    return new Date(warrantyEnd) >= new Date();
  };

  const getDaysLeft = (warrantyEnd) => {
    const end = new Date(warrantyEnd);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {t('common.errorLoading') || 'Error loading warranties'}
      </Alert>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('common.warranties')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/staff/warranties/new')}
        >
          {t('common.createWarranty')}
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            size="small"
            label={t('common.search')}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <TextField
            size="small"
            label={t('case.sku')}
            value={filters.sku}
            onChange={(e) => handleFilterChange('sku', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <TextField
            size="small"
            label={t('case.serialNumber')}
            value={filters.serial_number}
            onChange={(e) => handleFilterChange('serial_number', e.target.value)}
            sx={{ minWidth: 150 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('case.deviceType')}</InputLabel>
            <Select
              value={filters.device_type}
              label={t('case.deviceType')}
              onChange={(e) => handleFilterChange('device_type', e.target.value)}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="Laptop">Laptop</MenuItem>
              <MenuItem value="Phone">Phone</MenuItem>
              <MenuItem value="Tablet">Tablet</MenuItem>
              <MenuItem value="Desktop">Desktop</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t('common.status')}</InputLabel>
            <Select
              value={filters.active_only || filters.expired_only || ''}
              label={t('common.status')}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('active_only', value === 'active' ? 'true' : '');
                handleFilterChange('expired_only', value === 'expired' ? 'true' : '');
              }}
            >
              <MenuItem value="">{t('common.all')}</MenuItem>
              <MenuItem value="active">{t('common.active') || 'Active'}</MenuItem>
              <MenuItem value="expired">{t('common.expired') || 'Expired'}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Warranties Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('warranty.warrantyId')}</TableCell>
              <TableCell>{t('case.productTitle')}</TableCell>
              <TableCell>{t('case.sku')}</TableCell>
              <TableCell>{t('case.serialNumber')}</TableCell>
              <TableCell>{t('case.customerName')}</TableCell>
              <TableCell>{t('case.phone')}</TableCell>
              <TableCell>{t('warranty.purchaseDate')}</TableCell>
              <TableCell>{t('warranty.warrantyEndDate')}</TableCell>
              <TableCell>{t('warranty.daysLeft')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warranties && warranties.length > 0 ? (
              warranties.map((warranty) => {
                const active = isWarrantyActive(warranty.warranty_end);
                const daysLeft = getDaysLeft(warranty.warranty_end);
                
                return (
                  <TableRow key={warranty.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {warranty.warranty_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{warranty.title}</TableCell>
                    <TableCell>{warranty.sku}</TableCell>
                    <TableCell>{warranty.serial_number}</TableCell>
                    <TableCell>
                      {warranty.customer_name} {warranty.customer_last_name}
                    </TableCell>
                    <TableCell>{warranty.customer_phone}</TableCell>
                    <TableCell>
                      {new Date(warranty.purchase_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(warranty.warranty_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {active ? (
                        <Chip
                          label={`${daysLeft} ${t('warranty.daysLeft')}`}
                          color={daysLeft <= 30 ? 'warning' : 'success'}
                          size="small"
                        />
                      ) : (
                        <Chip
                          label={`${Math.abs(daysLeft)} ${t('warranty.daysAfterWarranty')}`}
                          color="default"
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={active ? (t('common.active') || 'Active') : (t('common.expired') || 'Expired')}
                        color={active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          <Tooltip title={t('common.view')}>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/staff/warranties/${warranty.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('common.createCase')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/staff/cases/new?warranty_id=${warranty.id}`)}
                            >
                              <BuildIcon />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <Tooltip title={t('warranty.deleteWarranty')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={async () => {
                                  if (window.confirm(t('warranty.deleteWarrantyConfirm'))) {
                                    try {
                                      await warrantiesService.delete(warranty.id);
                                      queryClient.invalidateQueries('warranties');
                                      alert(t('warranty.warrantyDeleted'));
                                    } catch (error) {
                                      alert(error.response?.data?.message || t('common.errorLoading'));
                                    }
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {t('common.noWarranties') || 'No warranties found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default WarrantiesPage;
