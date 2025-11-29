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
  Paper,
  Typography,
  Button,
  Divider,
  Tooltip,
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

  const getColumnWidth = (col) => {
    return columnWidths[col.key] || col.width || defaultColumnWidth;
  };

  return (
    <Box>
      {/* Settings Button - Left Side */}
      <Box display="flex" justifyContent="flex-start" alignItems="center" mb={2}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<SettingsIcon />}
          onClick={handleSettingsClick}
          sx={{
            borderColor: '#d1d5db',
            color: '#4b5563',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#9ca3af',
              bgcolor: '#f9fafb',
            },
          }}
        >
          Columns & Order
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={orderingOpen}
          onClose={handleSettingsClose}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              mt: 1,
            },
          }}
        >
          <Box sx={{ p: 2, minWidth: 300 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#111827' }}>
              Show / Hide & Reorder Columns
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
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
                    p: 1.5,
                    mb: 0.75,
                    border: '1px solid #e5e7eb',
                    borderRadius: 1.5,
                    bgcolor: hiddenCols.includes(col.key) ? '#f3f4f6' : '#ffffff',
                    cursor: 'move',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#f9fafb',
                      borderColor: '#d1d5db',
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                    <DragIcon sx={{ fontSize: 18, color: '#9ca3af', cursor: 'grab' }} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleColumn(col.key);
                      }}
                      sx={{
                        p: 0.5,
                        color: hiddenCols.includes(col.key) ? '#9ca3af' : '#3b82f6',
                        '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.1)',
                        },
                      }}
                    >
                      {hiddenCols.includes(col.key) ? (
                        <EyeSlashIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <EyeIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: hiddenCols.includes(col.key) ? 400 : 500,
                        color: hiddenCols.includes(col.key) ? '#9ca3af' : '#111827',
                        textDecoration: hiddenCols.includes(col.key) ? 'line-through' : 'none',
                      }}
                    >
                      {col.label}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Menu>
      </Box>

      {/* Bulk Actions */}
      {selected.length > 0 && onBulkAction && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: '#dbeafe',
            border: '1px solid #93c5fd',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
            {selected.length} selected
          </Typography>
          {onBulkAction(selected)}
        </Box>
      )}

      {/* Table Container with Sticky Header */}
      <Paper
        sx={{
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'relative',
        }}
      >
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            position: 'relative',
          }}
        >
          <Table
            sx={{
              minWidth: '100%',
              tableLayout: 'fixed',
            }}
          >
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: '#f9fafb',
                  position: 'sticky',
                  top: 0,
                  zIndex: 100,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                {visibleColumns.map((col, idx) => {
                  const width = getColumnWidth(col);
                  const isFrozen = frozenColumns.includes(col.key);
                  const frozenLeft = isFrozen
                    ? frozenColumns
                        .slice(0, frozenColumns.indexOf(col.key))
                        .reduce((acc, k) => {
                          const colIdx = visibleColumns.findIndex((c) => c.key === k);
                          if (colIdx === -1) return acc;
                          return acc + getColumnWidth(visibleColumns[colIdx]);
                        }, 0)
                    : 0;

                  return (
                    <TableCell
                      key={col.key}
                      sx={{
                        position: isFrozen ? 'sticky' : 'relative',
                        left: isFrozen ? frozenLeft : 'auto',
                        zIndex: isFrozen ? 101 : 100,
                        bgcolor: '#f9fafb',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        borderRight: '1px solid #e5e7eb',
                        borderBottom: '2px solid #d1d5db',
                        px: 2,
                        py: 1.75,
                        width: width,
                        minWidth: width,
                        maxWidth: width,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {col.key === 'select' ? (
                          <Checkbox
                            checked={selected.length === data.length && data.length > 0}
                            indeterminate={selected.length > 0 && selected.length < data.length}
                            onChange={toggleAll}
                            size="small"
                            sx={{ p: 0.5 }}
                          />
                        ) : (
                          <Tooltip title={col.label} arrow>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}
                            >
                              {col.label}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                      {col.key !== 'actions' && col.key !== 'select' && (
                        <Box
                          onMouseDown={(e) => startResize(e, col.key)}
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            height: '100%',
                            width: '6px',
                            cursor: 'col-resize',
                            bgcolor: 'transparent',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: '#3b82f6',
                            },
                            '&:active': {
                              bgcolor: '#2563eb',
                            },
                          }}
                        />
                      )}
                      {/* Separator line indicator */}
                      {idx < visibleColumns.length - 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            bgcolor: '#e5e7eb',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    sx={{
                      textAlign: 'center',
                      py: 6,
                      color: '#9ca3af',
                    }}
                  >
                    <Typography variant="body2">No data available</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, rowIdx) => (
                  <TableRow
                    key={row.id}
                    onClick={() => {
                      if (onRowClick) onRowClick(row);
                      toggleRow(row.id);
                    }}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                      '&:hover': {
                        bgcolor: selected.includes(row.id) ? '#dbeafe' : '#f9fafb',
                      },
                      '&:nth-of-type(even)': {
                        bgcolor: selected.includes(row.id)
                          ? '#eff6ff'
                          : 'rgba(249, 250, 251, 0.5)',
                      },
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    {visibleColumns.map((col, colIdx) => {
                      const width = getColumnWidth(col);
                      const isFrozen = frozenColumns.includes(col.key);
                      const frozenLeft = isFrozen
                        ? frozenColumns
                            .slice(0, frozenColumns.indexOf(col.key))
                            .reduce((acc, k) => {
                              const idx = visibleColumns.findIndex((c) => c.key === k);
                              if (idx === -1) return acc;
                              return acc + getColumnWidth(visibleColumns[idx]);
                            }, 0)
                        : 0;

                      if (col.key === 'select') {
                        return (
                          <TableCell
                            key={col.key}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              position: isFrozen ? 'sticky' : 'relative',
                              left: isFrozen ? frozenLeft : 'auto',
                              zIndex: isFrozen ? 11 : 1,
                              bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                              borderRight: '1px solid #f3f4f6',
                              px: 1.5,
                              py: 1.5,
                            }}
                          >
                            <Checkbox
                              checked={selected.includes(row.id)}
                              onChange={() => toggleRow(row.id)}
                              size="small"
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0.5 }}
                            />
                          </TableCell>
                        );
                      }

                      if (col.key === 'actions') {
                        return (
                          <TableCell
                            key={col.key}
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              whiteSpace: 'nowrap',
                              borderRight: '1px solid #f3f4f6',
                              px: 1.5,
                              py: 1.5,
                              width: width,
                              minWidth: width,
                              maxWidth: width,
                            }}
                          >
                            {col.render ? col.render(row) : null}
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell
                          key={col.key}
                          sx={{
                            position: isFrozen ? 'sticky' : 'relative',
                            left: isFrozen ? frozenLeft : 'auto',
                            zIndex: isFrozen ? 11 : 1,
                            bgcolor: selected.includes(row.id) ? '#eff6ff' : 'transparent',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderRight: '1px solid #f3f4f6',
                            px: 2,
                            py: 1.5,
                            width: width,
                            minWidth: width,
                            maxWidth: width,
                            fontSize: '0.875rem',
                            color: '#374151',
                          }}
                        >
                          <Tooltip
                            title={
                              col.render
                                ? ''
                                : col.value
                                ? String(col.value(row))
                                : String(row[col.key] || '')
                            }
                            arrow
                            placement="top"
                          >
                            <Box
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                width: '100%',
                              }}
                            >
                              {col.render
                                ? col.render(row)
                                : col.value
                                ? col.value(row)
                                : row[col.key] || '-'}
                            </Box>
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default CustomDataTable;
