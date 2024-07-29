import * as React from 'react';
import type { IFormData } from '../ISuggestProps';
import { FaEye, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import styles from './Suggestion.module.scss';

interface ISuggestionProps {
  formDataList: IFormData[];
  handleDeleteRow: (index: number) => void;
  editable: boolean;
  editRow: (index: number) => void;
  handleAddRow: () => void;
}

const Suggestion: React.FC<ISuggestionProps> = ({
  formDataList,
  handleDeleteRow,
  editable,
  editRow,
  handleAddRow
}) => {  
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);

  const handleCheckboxChange = (index: number): void => {
    setSelectedRows(prevSelectedRows => {
      const newSelectedRows = new Set(prevSelectedRows);
      if (newSelectedRows.has(index)) {
        newSelectedRows.delete(index);
      } else {
        newSelectedRows.add(index);
      }
      return newSelectedRows;
    });
  };

  const handleSelectAllChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const checked = event.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedRows(new Set(formDataList.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDeleteSelected = (): void => {
    selectedRows.forEach(index => handleDeleteRow(index));
    setSelectedRows(new Set());
    setSelectAll(false);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.tableContainer}>
        <div className={styles.actionButtons}>
          <button onClick={handleAddRow} disabled={!editable} className={`${styles.btn} ${styles.btnAdd}`}>
            <FaPlus color="green" /> Thêm
          </button>
          <button
            onClick={() => selectedRows.size === 1 && editRow(Array.from(selectedRows)[0])}
            disabled={!editable || selectedRows.size !== 1}
            className={`${styles.btn} ${styles.btnEdit}`}
          >
            <FaEdit color="orange" /> Sửa
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedRows.size === 0 || !editable}
            className={`${styles.btn} ${styles.btnDelete}`}
          >
            <FaTrash color="red" /> Xóa
          </button>
        </div>
        <h1>Danh mục qui trình 123456</h1>
        <form className={styles.tableContainer}>
          <table className="table">
            <thead className="thead">
              <tr className="th">
                <th>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAllChange}
                  />
                </th>
                <th style={{ width: '150px' }}>Nội dung</th>
                <th style={{ width: '150px' }}>Kế hoạch</th>
                <th style={{ width: '150px' }}>Ngày</th>
                <th style={{ width: '150px' }}>Độ ưu tiên</th>
                <th style={{ width: '150px' }}>Tài liệu</th>
                <th style={{ width: '100px' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {formDataList.map((formData, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.has(index)}
                      onChange={() => handleCheckboxChange(index)}
                    />
                  </td>
                  <td><input type="text" name="description" value={formData.description} readOnly /></td>
                  <td><input type="text" name="Plan" value={formData.Plan} readOnly /></td>
                  <td><input type="text" name="Emergency" value={formData.Emergency} readOnly /></td>
                  <td><input type="text" name="Date" value={formData.Date} readOnly /></td>
                  <td><input type="text" name="File" value={JSON.stringify(formData.File)} readOnly /></td>
                  <td>
                    <button
                      type="button"
                      onClick={() => editRow(index)}
                    >
                      <FaEye color="blue" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      </div>
    </div>
  );
};

export default Suggestion;
