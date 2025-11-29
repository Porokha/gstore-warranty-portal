import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  Visibility as EyeIcon,
  VisibilityOff as EyeSlashIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const CustomDataTable = ({
  columns: initialColumns,
  data,
  onRowClick,
  onBulkAction,
  tableKey = 'default',
  frozenColumns = [],
  defaultColumnWidth = 150,
}) => {
  const [columns, setColumns] = useState(initialColumns);
  const [hiddenCols, setHiddenCols] = useState([]);
  const [orderingOpen, setOrderingOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dragColKey, setDragColKey] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const [selected, setSelected] = useState([]);

  // Load persisted preferences
  useEffect(() => {
    try {
      const storedWidths = localStorage.getItem(`${tableKey}_columnWidths`);
      const storedOrder = localStorage.getItem(`${tableKey}_columnOrder`);
      const storedHidden = localStorage.getItem(`${tableKey}_hiddenCols`);

      if (storedWidths) {
        setColumnWidths(JSON.parse(storedWidths));
      }
      if (storedOrder) {
        const order = JSON.parse(storedOrder);
        setColumns((prev) => {
          const ordered = order.map((key) => prev.find((c) => c.key === key)).filter(Boolean);
          const remaining = prev.filter((c) => !order.includes(c.key));
          return [...ordered, ...remaining];
        });
      }
      if (storedHidden) {
        setHiddenCols(JSON.parse(storedHidden));
      }
    } catch (e) {
      console.error('Failed to load table preferences:', e);
    }
  }, [tableKey]);

  // Save column widths
  const saveWidths = useCallback(
    (updated) => {
      setColumnWidths(updated);
      try {
        localStorage.setItem(`${tableKey}_columnWidths`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save column widths:', e);
      }
    },
    [tableKey]
  );

  // Save column order
  const saveOrder = useCallback(
    (newOrder) => {
      try {
        localStorage.setItem(`${tableKey}_columnOrder`, JSON.stringify(newOrder.map((c) => c.key)));
      } catch (e) {
        console.error('Failed to save column order:', e);
      }
    },
    [tableKey]
  );

  // Save hidden columns
  const saveHidden = useCallback(
    (hidden) => {
      try {
        localStorage.setItem(`${tableKey}_hiddenCols`, JSON.stringify(hidden));
      } catch (e) {
        console.error('Failed to save hidden columns:', e);
      }
    },
    [tableKey]
  );

  // Column ordering drag handlers
  const startOrderDrag = (key) => {
    setDragColKey(key);
  };

  const overOrderDrag = (targetKey, e) => {
    e.preventDefault();
    if (!dragColKey || dragColKey === targetKey) return;

    setColumns((prev) => {
      const currentIndex = prev.findIndex((c) => c.key === dragColKey);
      const targetIndex = prev.findIndex((c) => c.key === targetKey);
      if (currentIndex === -1 || targetIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(currentIndex, 1);
      updated.splice(targetIndex, 0, moved);
      saveOrder(updated);
      return updated;
    });
  };

  const endOrderDrag = () => {
    setDragColKey(null);
  };

  // Toggle column visibility
  const toggleColumn = (key) => {
    setHiddenCols((prev) => {
      const updated = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      saveHidden(updated);
      return updated;
    });
  };

  const visibleColumns = columns.filter((c) => !hiddenCols.includes(c.key));

  // Row selection
  const toggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === data.length) {
      setSelected([]);
    } else {
      setSelected(data.map((d) => d.id));
    }
  };

  // Column resize
  const startResize = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key] || defaultColumnWidth;

    const onMove = (moveEvent) => {
      const newWidth = Math.max(80, startWidth + (moveEvent.clientX - startX));
      const updated = { ...columnWidths, [key]: newWidth };
      saveWidths(updated);
    };

    const end = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', end);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', end);
  };

  const handleSettingsClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOrderingOpen(true);
  };

  const handleSettingsClose = () => {
    setAnchorEl(null);
    setOrderingOpen(false);
  };

  const hasSelectColumn = visibleColumns.some((c) => c.key === 'select');

  return (
    <Box>
      {/* Settings Button */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={handleSettingsClick}
        >
          Columns & Order
        </Button>
        <Menu anchorEl={anchorEl} open={orderingOpen} onClose={handleSettingsClose}>
          <Box sx={{ p: 2, minWidth: 280 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Show / Hide & Reorder Columns
            </Typography>
            <Divider sx={{ mb: 1 }} />
            {columns.map((col) => (
              <Box
                key={col.key}
                draggable
                onDragStart={() => startOrderDrag(col.key)}
                onDragOver={(e) => overOrderDrag(col.key, e)}
                onDragEnd={endOrderDrag}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  p: 1,
                  mb: 0.5,
                  border: '1px solid #e5e7eb',
                  borderRadius: 1,
                  bgcolor: '#f9fafb',
                  cursor: 'move',
                  '&:hover': { bgcolor: '#f3f4f6' },
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <DragIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleColumn(col.key);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    {hiddenCols.includes(col.key) ? (
                      <EyeSlashIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                    ) : (
                      <EyeIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                    )}
                  </IconButton>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    {col.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Menu>
      </Box>

      {/* Bulk Actions */}
      {selected.length > 0 && onBulkAction && (
        <Box
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selected.length} selected
          </Typography>
          {onBulkAction(selected)}
        </Box>
      )}

      {/* Table */}
      <Paper sx={{ overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 2 }}>
        <Table sx={{ minWidth: '100%' }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              {visibleColumns.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    position: frozenColumns.includes(col.key) ? 'sticky' : 'relative',
                    left: frozenColumns.includes(col.key)
                      ? frozenColumns
                          .slice(0, frozenColumns.indexOf(col.key))
                          .reduce((acc, k) => {
                            const idx = visibleColumns.findIndex((c) => c.key === k);
                            if (idx === -1) return acc;
                            return acc + (columnWidths[visibleColumns[idx]?.key] || defaultColumnWidth);
                          }, 0)
                      : 'auto',
                    zIndex: frozenColumns.includes(col.key) ? 10 : 1,
                    bgcolor: '#f9fafb',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    borderRight: '1px solid #e5e7eb',
                    px: 1.5,
                    py: 1.5,
                    width: columnWidths[col.key] || (col.width || defaultColumnWidth),
                    minWidth: columnWidths[col.key] || (col.width || defaultColumnWidth),
                    maxWidth: columnWidths[col.key] || (col.width || defaultColumnWidth),
                  }}
                >
                  {col.key === 'select' ? (
                    <Checkbox
                      checked={selected.length === data.length && data.length > 0}
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      onChange={toggleAll}
                      size="small"
                    />
                  ) : (
                    col.label
                  )}
                  {col.key !== 'actions' && col.key !== 'select' && (
                    <Box
                      onMouseDown={(e) => startResize(e, col.key)}
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: '4px',
                        cursor: 'col-resize',
                        '&:hover': { bgcolor: '#3b82f6' },
                      }}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => {
                  if (onRowClick) onRowClick(row);
                  toggleRow(row.id);
                }}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#f9fafb' },
                  bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                }}
              >
                {visibleColumns.map((col) => {
                  if (col.key === 'select') {
                    return (
                      <TableCell
                        key={col.key}
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          position: frozenColumns.includes(col.key) ? 'sticky' : 'relative',
                          left: frozenColumns.includes(col.key) ? 0 : 'auto',
                          zIndex: frozenColumns.includes(col.key) ? 10 : 1,
                          bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                        }}
                      >
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          size="small"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    );
                  }

                  if (col.key === 'actions') {
                    return (
                      <TableCell
                        key={col.key}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {col.render ? col.render(row) : null}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      key={col.key}
                      sx={{
                        position: frozenColumns.includes(col.key) ? 'sticky' : 'relative',
                        left: frozenColumns.includes(col.key)
                          ? frozenColumns
                              .slice(0, frozenColumns.indexOf(col.key))
                              .reduce((acc, k) => {
                                const idx = visibleColumns.findIndex((c) => c.key === k);
                                if (idx === -1) return acc;
                                return acc + (columnWidths[visibleColumns[idx]?.key] || defaultColumnWidth);
                              }, 0)
                          : 'auto',
                        zIndex: frozenColumns.includes(col.key) ? 10 : 1,
                        bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                        whiteSpace: 'nowrap',
                        px: 1.5,
                        py: 1.5,
                        width: columnWidths[col.key] || (col.width || defaultColumnWidth),
                        minWidth: columnWidths[col.key] || (col.width || defaultColumnWidth),
                        maxWidth: columnWidths[col.key] || (col.width || defaultColumnWidth),
                      }}
                    >
                      {col.render ? col.render(row) : col.value ? col.value(row) : row[col.key]}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default CustomDataTable;

