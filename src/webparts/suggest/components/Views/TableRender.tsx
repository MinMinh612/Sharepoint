import React, { useState, forwardRef, useImperativeHandle } from 'react';
import styles from './TableRender.module.scss';

export interface RowData {
  [key: string]: string | number | JSX.Element | undefined;
}

export interface TableRenderProps<T extends RowData> {
  headers: readonly ("" | keyof T)[];
  data: T[];
  onRowSelectionChange?: (selectedRows: T[]) => void;
  showSelectColumn?: boolean;
}

// Khai báo kiểu cho ref
export interface TableRenderRef {
  clearSelection: () => void;
}

const TableRender = forwardRef<TableRenderRef, TableRenderProps<RowData>>((
  {
    headers,
    data,
    onRowSelectionChange,
    showSelectColumn = true,
  },
  ref
): JSX.Element => {
  const [searchValues, setSearchValues] = useState<string[]>(Array(headers.length).fill(''));
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const handleSearchChange = (index: number, value: string): void => {
    const updatedSearchValues = [...searchValues];
    updatedSearchValues[index] = value;
    setSearchValues(updatedSearchValues);
  };

  const filteredData = data.filter((row) =>
    headers.every((header, index) =>
      row[header]?.toString().toLowerCase().includes(searchValues[index].toLowerCase())
    )
  );

  const handleRowSelection = (index: number, isChecked: boolean): void => {
    const updatedSelectedRows = isChecked
      ? [...selectedRows, index]
      : selectedRows.filter((i) => i !== index);
    setSelectedRows(updatedSelectedRows);

    if (onRowSelectionChange) {
      onRowSelectionChange(updatedSelectedRows.map((i) => filteredData[i]));
    }
  };

  const handleSelectAll = (isChecked: boolean): void => {
    if (isChecked) {
      const allRowIndices = filteredData.map((_, index) => index);
      setSelectedRows(allRowIndices);

      if (onRowSelectionChange) {
        onRowSelectionChange(filteredData);
      }
    } else {
      setSelectedRows([]);
      if (onRowSelectionChange) {
        onRowSelectionChange([]);
      }
    }
  };

  const clearSelection = (): void => {
    setSelectedRows([]);
    if (onRowSelectionChange) {
      onRowSelectionChange([]);
    }
  };

  // Expose clearSelection via ref
  useImperativeHandle(ref, () => ({
    clearSelection,
  }));

  return (
    <div className={styles.tableContainer}>
      <table className={styles.fixedHeaderTable}>
        <thead>
          <tr>
            {showSelectColumn && (
              <th className={styles.checkboxColumn}>
              <input
                type="checkbox"
                onChange={(e) => handleSelectAll(e.target.checked)}
                checked={selectedRows.length === filteredData.length && filteredData.length > 0}
              />
            </th>
            
            )}
            {headers.map((header, index) => (
              <th key={index}>{header || ' '} </th>
            ))}
          </tr>
          <tr className={styles.searchRow}>
          {showSelectColumn && <th className={styles.checkboxColumn}> </th>}
            {headers.map((header, index) => (
              <th key={index}>
                {header ? (
                  <input
                    type="text"
                    placeholder="Tìm kiếm"
                    value={searchValues[index]}
                    onChange={(e) => handleSearchChange(index, e.target.value)}
                    className={styles.searchInput}
                  />
                ) : (
                  <div />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr
              key={index}
              className={selectedRows.includes(index) ? styles.highlighted : ''}
            >
              {showSelectColumn && (
                <td className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectedRows.includes(index)}
                  onChange={(e) => handleRowSelection(index, e.target.checked)}
                />
              </td>
              
              )}
              {headers.map((header, headerIndex) => (
                <td key={headerIndex}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TableRender;
