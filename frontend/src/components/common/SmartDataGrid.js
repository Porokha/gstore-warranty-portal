import React, { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { Paper, Box, Button } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Toolbar = ({ onReset }) => {
  const { t } = useTranslation();

  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <GridToolbarColumnsButton />
        <GridToolbarDensitySelector />
        <GridToolbarQuickFilter size="small" />
      </Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<RestartAltIcon fontSize="small" />}
        onClick={onReset}
        sx={{ textTransform: 'none' }}
      >
        {t('table.reset')}
      </Button>
    </GridToolbarContainer>
  );
};

Toolbar.propTypes = {
  onReset: PropTypes.func.isRequired,
};

const SmartDataGrid = ({
  rows,
  columns,
  tableKey,
  loading = false,
  initialState,
  rowHeight = 56,
  ...rest
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const storageKey = useMemo(
    () => `zezva.tablePrefs.${user?.id || 'guest'}.${tableKey}`,
    [user?.id, tableKey]
  );

  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [columnOrder, setColumnOrder] = useState(columns.map((col) => col.field));
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [columnWidths, setColumnWidths] = useState({});

  const defaultVisibility = useMemo(() => {
    const visibility = {};
    columns.forEach((col) => {
      visibility[col.field] = col.hide !== true;
    });
    return visibility;
  }, [columns]);

  const persistPrefs = useCallback(
    (prefs) => {
      localStorage.setItem(storageKey, JSON.stringify(prefs));
    },
    [storageKey]
  );

  const resetPrefs = useCallback(() => {
    setColumnOrder(columns.map((col) => col.field));
    setColumnVisibilityModel(defaultVisibility);
    setColumnWidths({});
    persistPrefs({
      columnOrder: columns.map((col) => col.field),
      columnVisibilityModel: defaultVisibility,
      columnWidths: {},
    });
  }, [columns, defaultVisibility, persistPrefs]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.columnOrder)) {
          setColumnOrder(parsed.columnOrder);
        }
        if (parsed.columnVisibilityModel && typeof parsed.columnVisibilityModel === 'object') {
          setColumnVisibilityModel(parsed.columnVisibilityModel);
        } else {
          setColumnVisibilityModel(defaultVisibility);
        }
        if (parsed.columnWidths && typeof parsed.columnWidths === 'object') {
          setColumnWidths(parsed.columnWidths);
        }
      } else {
        setColumnVisibilityModel(defaultVisibility);
      }
    } catch (error) {
      console.error('Failed to load table preferences', error);
      setColumnVisibilityModel(defaultVisibility);
    } finally {
      setPrefsLoaded(true);
    }
  }, [storageKey, defaultVisibility]);

  useEffect(() => {
    if (!prefsLoaded) return;
    setColumnOrder((prev) => {
      const normalized = prev.filter((field) => columns.some((col) => col.field === field));
      const merged = Array.from(new Set([...normalized, ...columns.map((col) => col.field)]));
      return merged;
    });
    setColumnVisibilityModel((prev) => {
      const updated = { ...prev };
      columns.forEach((col) => {
        if (updated[col.field] === undefined) {
          updated[col.field] = col.hide !== true;
        }
      });
      return updated;
    });
  }, [columns, prefsLoaded]);

  useEffect(() => {
    if (!prefsLoaded) return;
    persistPrefs({
      columnOrder,
      columnVisibilityModel,
      columnWidths,
    });
  }, [columnOrder, columnVisibilityModel, columnWidths, prefsLoaded, persistPrefs]);

  const enhancedColumns = useMemo(
    () =>
      columns.map((col) => ({
        ...col,
        width: columnWidths[col.field] || col.width || 160,
        headerClassName: 'smart-grid-header',
      })),
    [columns, columnWidths]
  );

  return (
    <Paper sx={{ p: 0, overflow: 'hidden' }}>
      <Box sx={{ width: '100%' }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={enhancedColumns}
          disableRowSelectionOnClick
          rowHeight={rowHeight}
          checkboxSelection={false}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
          columnHeaderHeight={52}
          columnOrder={columnOrder}
          onColumnOrderChange={(newOrder) => setColumnOrder(newOrder)}
          onColumnWidthChange={(params) => {
            setColumnWidths((prev) => ({
              ...prev,
              [params.colDef.field]: params.width,
            }));
          }}
          loading={loading}
          slots={{
            toolbar: () => <Toolbar onReset={resetPrefs} />,
            noRowsOverlay: () => (
              <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                {t('common.noData') || 'No data'}
              </Box>
            ),
          }}
          initialState={initialState}
          sx={{
            '--DataGrid-containerBackground': '#faf7f0',
            '--DataGrid-rowBorderColor': '#e2e8f0',
            '--DataGrid-columnHeaderBackgroundColor': '#f4e7d3',
            '& .smart-grid-header': {
              backgroundColor: '#f4e7d3',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
            },
            '& .MuiDataGrid-row': {
              bgcolor: '#ffffff',
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              bgcolor: '#fdfaf5',
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
          }}
          {...rest}
        />
      </Box>
    </Paper>
  );
};

SmartDataGrid.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(PropTypes.object).isRequired,
  tableKey: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  initialState: PropTypes.object,
  rowHeight: PropTypes.number,
};

export default SmartDataGrid;

