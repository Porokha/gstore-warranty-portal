import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Visibility as EyeIcon,
  VisibilityOff as EyeSlashIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';

const CustomDataTable = ({
  columns: initialColumns,
  data,
  onRowClick,
  onBulkAction,
  onBulkDelete,
  onBulkExport,
  tableKey = 'default',
  frozenColumns = [],
  defaultColumnWidth = 150,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  allowShowAll = true,
  maxShowAllRows = 500,
}) => {
  const [columns, setColumns] = useState(initialColumns);
  const [hiddenCols, setHiddenCols] = useState([]);
  const [orderingOpen, setOrderingOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dragColKey, setDragColKey] = useState(null);
  const [columnWidths, setColumnWidths] = useState({});
  const [selected, setSelected] = useState([]);
  const [frozenCols, setFrozenCols] = useState(frozenColumns || []);
  const [frozenRows, setFrozenRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [showAll, setShowAll] = useState(false);
  const tableContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const prevDataLengthRef = useRef(data?.length || 0);
  const totalRowCount = data?.length || 0;
  const showAllAllowed = allowShowAll && totalRowCount <= maxShowAllRows;

  // Clear selection when data changes (e.g., after deletion)
  useEffect(() => {
    const currentLength = data?.length || 0;
    if (currentLength < prevDataLengthRef.current && selected.length > 0) {
      // Data decreased and we have selections - clear them
      setSelected([]);
    }
    prevDataLengthRef.current = currentLength;
  }, [data, selected.length]);

  // Measure container width
  useEffect(() => {
    const updateWidth = () => {
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Load persisted preferences
  useEffect(() => {
    try {
      const storedWidths = localStorage.getItem(`${tableKey}_columnWidths`);
      const storedOrder = localStorage.getItem(`${tableKey}_columnOrder`);
      const storedHidden = localStorage.getItem(`${tableKey}_hiddenCols`);
      const storedFrozenCols = localStorage.getItem(`${tableKey}_frozenCols`);
      const storedPageSize = localStorage.getItem(`${tableKey}_pageSize`);

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
      if (storedFrozenCols) {
        setFrozenCols(JSON.parse(storedFrozenCols));
      }
      if (storedPageSize === 'all') {
        setShowAll(true);
      } else if (storedPageSize) {
        const parsedPageSize = parseInt(storedPageSize, 10);
        if (!Number.isNaN(parsedPageSize)) {
          setPageSize(parsedPageSize);
          setShowAll(false);
        }
      }
    } catch (e) {
      console.error('Failed to load table preferences:', e);
    }
  }, [tableKey]);

  useEffect(() => {
    if (!showAll || showAllAllowed) return;

    setShowAll(false);
    setPageSize(defaultPageSize);
    setCurrentPage(1);
    setSelected([]);
    try {
      localStorage.setItem(`${tableKey}_pageSize`, String(defaultPageSize));
    } catch (e) {
      console.error('Failed to save page size:', e);
    }
  }, [defaultPageSize, showAll, showAllAllowed, tableKey]);

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

  // Save frozen columns
  const saveFrozenCols = useCallback(
    (frozen) => {
      try {
        localStorage.setItem(`${tableKey}_frozenCols`, JSON.stringify(frozen));
      } catch (e) {
        console.error('Failed to save frozen columns:', e);
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
    if (key === 'select') return; // Prevent hiding checkbox column
    setHiddenCols((prev) => {
      const updated = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
      saveHidden(updated);
      return updated;
    });
  };

  // Toggle column freeze
  const toggleColumnFreeze = (key) => {
    if (key === 'select') return; // Checkbox column is always frozen
    setFrozenCols((prev) => {
      const updated = prev.includes(key)
        ? prev.filter((x) => x !== key)
        : [...prev, key].sort((a, b) => {
            const aIdx = visibleColumns.findIndex((c) => c.key === a);
            const bIdx = visibleColumns.findIndex((c) => c.key === b);
            return aIdx - bIdx;
          });
      saveFrozenCols(updated);
      return updated;
    });
  };

  // Toggle row freeze
  const toggleRowFreeze = (rowId) => {
    setFrozenRows((prev) => (prev.includes(rowId) ? prev.filter((x) => x !== rowId) : [...prev, rowId]));
  };

  // Toggle freeze all rows
  const toggleFreezeAllRows = () => {
    if (frozenRows.length === paginatedData.length) {
      setFrozenRows([]);
    } else {
      setFrozenRows(paginatedData.map((d) => d.id));
    }
  };

  const visibleColumns = columns.filter((c) => !hiddenCols.includes(c.key) && c.key !== 'rowFreeze');

  // Row selection
  const toggleRow = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selected.length === paginatedData.length) {
      setSelected([]);
    } else {
      setSelected(paginatedData.map((d) => d.id));
    }
  };

  // Column resize
  const startResize = (e, key) => {
    if (key === 'select') return; // Prevent resizing checkbox column
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
    if (col.key === 'select') return 50; // Fixed width for checkbox
    return columnWidths[col.key] || col.width || defaultColumnWidth;
  };

  // Calculate total table width and adjust last column if needed
  const { totalTableWidth, adjustedColumns } = useMemo(() => {
    const baseWidth = visibleColumns.reduce((sum, col) => sum + getColumnWidth(col), 0);
    const freezeColWidth = 50; // Width for row freeze column
    const totalBaseWidth = baseWidth + freezeColWidth;

    // If table is narrower than container and we have space, expand last non-frozen column
    let adjustedCols = [...visibleColumns];
    if (containerWidth > 0 && totalBaseWidth < containerWidth && visibleColumns.length > 0) {
      const lastCol = visibleColumns[visibleColumns.length - 1];
      if (lastCol.key !== 'select' && lastCol.key !== 'rowFreeze' && !frozenCols.includes(lastCol.key)) {
        const diff = containerWidth - totalBaseWidth;
        adjustedCols = adjustedCols.map((col, idx) => {
          if (idx === adjustedCols.length - 1) {
            return { ...col, _adjustedWidth: getColumnWidth(col) + diff };
          }
          return col;
        });
      }
    }

    const finalWidth = adjustedCols.reduce((sum, col) => sum + (col._adjustedWidth || getColumnWidth(col)), 0) + freezeColWidth;
    return { totalTableWidth: Math.max(finalWidth, containerWidth || totalBaseWidth), adjustedColumns: adjustedCols };
  }, [visibleColumns, columnWidths, defaultColumnWidth, containerWidth, frozenCols]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (showAll) return data;
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, currentPage, pageSize, showAll]);

  const totalPages = useMemo(() => Math.ceil(data.length / pageSize), [data.length, pageSize]);

  useEffect(() => {
    if (!showAll && currentPage > Math.max(totalPages, 1)) {
      setCurrentPage(1);
    }
  }, [currentPage, showAll, totalPages]);

  // Separate frozen and regular rows
  const { frozenRowsData, regularRowsData } = useMemo(() => {
    const frozen = paginatedData.filter((row) => frozenRows.includes(row.id));
    const regular = paginatedData.filter((row) => !frozenRows.includes(row.id));
    return { frozenRowsData: frozen, regularRowsData: regular };
  }, [paginatedData, frozenRows]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    setSelected([]); // Clear selection on page change
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setShowAll(false);
    setCurrentPage(1);
    setSelected([]);
    try {
      localStorage.setItem(`${tableKey}_pageSize`, String(newSize));
    } catch (e) {
      console.error('Failed to save page size:', e);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selected.length > 0) {
      // Let parent component handle confirmation dialog
      onBulkDelete(selected);
      // Don't clear selection here - let parent handle it after confirmation
    }
  };

  const handleBulkExport = () => {
    if (onBulkExport && selected.length > 0) {
      onBulkExport(selected);
    }
  };

  return (
    <Box>
      {/* Top Bar with Settings and Bulk Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={2}>
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

          {selected.length > 0 && (
            <>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                {selected.length} selected
              </Typography>
              {onBulkExport && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExportIcon />}
                  onClick={handleBulkExport}
                  sx={{
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#2563eb',
                      bgcolor: '#eff6ff',
                    },
                  }}
                >
                  Export
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={handleBulkDelete}
                  sx={{
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#dc2626',
                      bgcolor: '#fef2f2',
                    },
                  }}
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </Box>

        {/* Pagination Controls */}
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Show</InputLabel>
            <Select value={showAll ? 'all' : pageSize} label="Show" onChange={(e) => {
              if (e.target.value === 'all') {
                if (!showAllAllowed) return;
                setShowAll(true);
                setCurrentPage(1);
                setSelected([]);
                try {
                  localStorage.setItem(`${tableKey}_pageSize`, 'all');
                } catch (error) {
                  console.error('Failed to save page size:', error);
                }
              } else {
                handlePageSizeChange(e);
              }
            }}>
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size} per page
                </MenuItem>
              ))}
              {allowShowAll && (
                <MenuItem value="all" disabled={!showAllAllowed}>
                  {showAllAllowed ? 'All' : `All disabled (${totalRowCount} rows)`}
                </MenuItem>
              )}
            </Select>
          </FormControl>
          {!showAll && totalPages > 1 && (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="small"
              showFirstButton
              showLastButton
            />
          )}
        </Box>
      </Box>

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
            {columns.map((col) => {
              const isSelectCol = col.key === 'select';
              const isHidden = hiddenCols.includes(col.key);
              const isFrozen = frozenCols.includes(col.key) || isSelectCol;

              return (
                <Box
                  key={col.key}
                  draggable={!isSelectCol}
                  onDragStart={() => !isSelectCol && startOrderDrag(col.key)}
                  onDragOver={(e) => !isSelectCol && overOrderDrag(col.key, e)}
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
                    bgcolor: isHidden ? '#f3f4f6' : '#ffffff',
                    cursor: isSelectCol ? 'default' : 'move',
                    transition: 'all 0.2s',
                    opacity: isSelectCol ? 0.6 : 1,
                    '&:hover': {
                      bgcolor: '#f9fafb',
                      borderColor: '#d1d5db',
                      transform: isSelectCol ? 'none' : 'translateX(2px)',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} flex={1}>
                    {!isSelectCol && <DragIcon sx={{ fontSize: 18, color: '#9ca3af', cursor: 'grab' }} />}
                    {!isSelectCol && (
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleColumn(col.key);
                        }}
                        sx={{
                          p: 0.5,
                          color: isHidden ? '#9ca3af' : '#3b82f6',
                          '&:hover': {
                            bgcolor: 'rgba(59, 130, 246, 0.1)',
                          },
                        }}
                      >
                        {isHidden ? <EyeSlashIcon sx={{ fontSize: 18 }} /> : <EyeIcon sx={{ fontSize: 18 }} />}
                      </IconButton>
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: isHidden ? 400 : 500,
                        color: isHidden ? '#9ca3af' : '#111827',
                        textDecoration: isHidden ? 'line-through' : 'none',
                      }}
                    >
                      {col.label} {isSelectCol && '(Always visible)'}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Menu>

      {/* Table Container with Sticky Header */}
      <Paper
        ref={tableContainerRef}
        sx={{
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 300px)',
            position: 'relative',
            width: '100%',
            flex: 1,
            '&::-webkit-scrollbar': {
              height: '8px',
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#c1c1c1',
              borderRadius: '4px',
              '&:hover': {
                background: '#a8a8a8',
              },
            },
          }}
        >
          <Table
            sx={{
              width: totalTableWidth,
              minWidth: totalTableWidth,
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
                {/* Checkbox Column - Always Frozen */}
                {visibleColumns.some((c) => c.key === 'select') && (
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 104,
                      bgcolor: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: '#111827',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                      borderRight: '2px solid #d1d5db',
                      borderBottom: '2px solid #d1d5db',
                      px: 1.5,
                      py: 1.75,
                      width: 50,
                      minWidth: 50,
                      maxWidth: 50,
                      textAlign: 'center',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    <Checkbox
                      checked={selected.length === paginatedData.length && paginatedData.length > 0}
                      indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                      onChange={toggleAll}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                  </TableCell>
                )}

                {/* Regular Columns */}
                {adjustedColumns.map((col, idx) => {
                  if (col.key === 'select') return null;
                  const width = col._adjustedWidth || getColumnWidth(col);
                  const isFrozen = frozenCols.includes(col.key);
                  const frozenLeft = isFrozen
                    ? frozenCols
                        .slice(0, frozenCols.indexOf(col.key))
                        .reduce((acc, k) => {
                          const colIdx = adjustedColumns.findIndex((c) => c.key === k);
                          if (colIdx === -1) return acc;
                          return acc + (adjustedColumns[colIdx]._adjustedWidth || getColumnWidth(adjustedColumns[colIdx]));
                        }, visibleColumns.some((c) => c.key === 'select') ? 50 : 0)
                    : 0;

                  return (
                    <TableCell
                      key={col.key}
                      sx={{
                        position: isFrozen ? 'sticky' : 'relative',
                        left: isFrozen ? frozenLeft : 'auto',
                        zIndex: isFrozen ? 103 : 100,
                        bgcolor: isFrozen ? '#ffffff' : '#f9fafb',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        borderRight: isFrozen ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                        borderBottom: '2px solid #d1d5db',
                        px: 2,
                        py: 1.75,
                        width: width,
                        minWidth: width,
                        maxWidth: width,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        boxShadow: isFrozen ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      {(() => {
                        const currentCol = initialColumns.find((item) => item.key === col.key) || col;
                        return (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          overflow: 'hidden',
                        }}
                      >
                        {currentCol.headerRender ? (
                          currentCol.headerRender({ column: currentCol })
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
                        <IconButton
                          size="small"
                          onClick={() => toggleColumnFreeze(col.key)}
                          sx={{
                            p: 0.5,
                            color: isFrozen ? '#3b82f6' : '#9ca3af',
                            flexShrink: 0,
                            '&:hover': {
                              bgcolor: 'rgba(59, 130, 246, 0.1)',
                            },
                          }}
                        >
                          {isFrozen ? <LockIcon sx={{ fontSize: 16 }} /> : <LockOpenIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Box>
                        );
                      })()}
                      {col.key !== 'actions' && (
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
                          }}
                        />
                      )}
                    </TableCell>
                  );
                })}

                {/* Row Freeze Column Header */}
                <TableCell
                  sx={{
                    position: 'sticky',
                    right: 0,
                    zIndex: 104,
                    bgcolor: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    borderLeft: '2px solid #d1d5db',
                    borderBottom: '2px solid #d1d5db',
                    px: 1.5,
                    py: 1.75,
                    width: 50,
                    minWidth: 50,
                    maxWidth: 50,
                    textAlign: 'center',
                    boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
                  }}
                >
                  <Tooltip title={frozenRows.length === paginatedData.length ? 'Unfreeze all rows' : 'Freeze all rows'}>
                    <Checkbox
                      checked={frozenRows.length === paginatedData.length && paginatedData.length > 0}
                      indeterminate={frozenRows.length > 0 && frozenRows.length < paginatedData.length}
                      onChange={toggleFreezeAllRows}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                  </Tooltip>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={adjustedColumns.length + 2}
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
                <>
                  {/* Frozen Rows */}
                  {frozenRowsData.map((row, frozenIdx) => {
                    const rowHeight = 48; // Approximate row height
                    const topOffset = 64 + frozenIdx * rowHeight; // Header height + previous frozen rows
                    
                    return (
                      <TableRow
                        key={row.id}
                        onClick={() => {
                          if (onRowClick) onRowClick(row);
                          toggleRow(row.id);
                        }}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          bgcolor: selected.includes(row.id) ? '#eff6ff' : '#fef3c7',
                          '&:hover': {
                            bgcolor: selected.includes(row.id) ? '#dbeafe' : '#fde68a',
                          },
                          borderBottom: '2px solid #fbbf24',
                          position: 'sticky',
                          top: `${topOffset}px`,
                          zIndex: 20 + frozenIdx,
                        }}
                      >
                        {/* Checkbox */}
                        {visibleColumns.some((c) => c.key === 'select') && (
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 30 + frozenIdx,
                              bgcolor: selected.includes(row.id) ? '#eff6ff' : '#fef3c7',
                              borderRight: '2px solid #d1d5db',
                              px: 1.5,
                              py: 1.5,
                              textAlign: 'center',
                              width: 50,
                              minWidth: 50,
                              maxWidth: 50,
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
                        )}

                      {/* Regular Cells */}
                      {adjustedColumns.map((col) => {
                        if (col.key === 'select') return null;
                        const width = col._adjustedWidth || getColumnWidth(col);
                        const isFrozen = frozenCols.includes(col.key);
                        const frozenLeft = isFrozen
                          ? frozenCols
                              .slice(0, frozenCols.indexOf(col.key))
                              .reduce((acc, k) => {
                                const colIdx = adjustedColumns.findIndex((c) => c.key === k);
                                if (colIdx === -1) return acc;
                                return acc + (adjustedColumns[colIdx]._adjustedWidth || getColumnWidth(adjustedColumns[colIdx]));
                              }, visibleColumns.some((c) => c.key === 'select') ? 50 : 0)
                          : 0;

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
                                bgcolor: selected.includes(row.id) ? '#eff6ff' : '#fef3c7',
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
                              zIndex: isFrozen ? 25 + frozenIdx : 10,
                              bgcolor: isFrozen 
                                ? (selected.includes(row.id) ? '#eff6ff' : '#fef3c7')
                                : (selected.includes(row.id) ? '#eff6ff' : '#fef3c7'),
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
                              title={col.render ? '' : col.value ? String(col.value(row)) : String(row[col.key] || '')}
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
                                {col.render ? col.render(row) : col.value ? col.value(row) : row[col.key] || '-'}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                        {/* Row Freeze Cell */}
                        <TableCell
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowFreeze(row.id);
                          }}
                          sx={{
                            position: 'sticky',
                            right: 0,
                            zIndex: 30 + frozenIdx,
                            bgcolor: selected.includes(row.id) ? '#eff6ff' : '#fef3c7',
                            borderLeft: '2px solid #d1d5db',
                            px: 1.5,
                            py: 1.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: '#fde68a',
                            },
                            boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          <LockIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Regular Rows */}
                  {regularRowsData.map((row, regIdx) => {
                    const isEven = regIdx % 2 === 0;
                    const baseBg = selected.includes(row.id) 
                      ? '#eff6ff' 
                      : (isEven ? 'rgba(249, 250, 251, 0.5)' : 'transparent');
                    
                    return (
                      <TableRow
                        key={row.id}
                        onClick={() => {
                          if (onRowClick) onRowClick(row);
                          toggleRow(row.id);
                        }}
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          bgcolor: baseBg,
                          '&:hover': {
                            bgcolor: selected.includes(row.id) ? '#dbeafe' : '#f9fafb',
                          },
                          borderBottom: '1px solid #f3f4f6',
                        }}
                      >
                        {/* Checkbox */}
                        {visibleColumns.some((c) => c.key === 'select') && (
                          <TableCell
                            onClick={(e) => e.stopPropagation()}
                            sx={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 15,
                              bgcolor: '#ffffff',
                              borderRight: '2px solid #d1d5db',
                              px: 1.5,
                              py: 1.5,
                              textAlign: 'center',
                              width: 50,
                              minWidth: 50,
                              maxWidth: 50,
                              boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
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
                        )}

                      {/* Regular Cells */}
                      {adjustedColumns.map((col) => {
                        if (col.key === 'select') return null;
                        const width = col._adjustedWidth || getColumnWidth(col);
                        const isFrozen = frozenCols.includes(col.key);
                        const frozenLeft = isFrozen
                          ? frozenCols
                              .slice(0, frozenCols.indexOf(col.key))
                              .reduce((acc, k) => {
                                const colIdx = adjustedColumns.findIndex((c) => c.key === k);
                                if (colIdx === -1) return acc;
                                return acc + (adjustedColumns[colIdx]._adjustedWidth || getColumnWidth(adjustedColumns[colIdx]));
                              }, visibleColumns.some((c) => c.key === 'select') ? 50 : 0)
                          : 0;

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
                              zIndex: isFrozen ? 16 : 1,
                              bgcolor: isFrozen
                                ? (selected.includes(row.id) ? '#eff6ff' : '#ffffff')
                                : (selected.includes(row.id) ? '#eff6ff' : baseBg),
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              borderRight: isFrozen ? '2px solid #d1d5db' : '1px solid #f3f4f6',
                              px: 2,
                              py: 1.5,
                              width: width,
                              minWidth: width,
                              maxWidth: width,
                              fontSize: '0.875rem',
                              color: '#374151',
                              boxShadow: isFrozen ? '2px 0 4px rgba(0,0,0,0.05)' : 'none',
                            }}
                          >
                            <Tooltip
                              title={col.render ? '' : col.value ? String(col.value(row)) : String(row[col.key] || '')}
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
                                {col.render ? col.render(row) : col.value ? col.value(row) : row[col.key] || '-'}
                              </Box>
                            </Tooltip>
                          </TableCell>
                        );
                      })}

                        {/* Row Freeze Cell */}
                        <TableCell
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowFreeze(row.id);
                          }}
                          sx={{
                            position: 'sticky',
                            right: 0,
                            zIndex: 15,
                            bgcolor: '#ffffff',
                            borderLeft: '2px solid #d1d5db',
                            px: 1.5,
                            py: 1.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: '#f9fafb',
                            },
                            boxShadow: '-2px 0 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          <LockOpenIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
};

export default CustomDataTable;
