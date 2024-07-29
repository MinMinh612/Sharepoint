import * as React from 'react';
import type { IFormData } from '../IFormData';
import { FaTrash } from 'react-icons/fa';

interface ISuggestionViewProps {
  formDataList: IFormData[];
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  editable: boolean;
  handleDeleteRow: (index: number) => void; 
}

const SuggestionView: React.FC<ISuggestionViewProps> = ({ formDataList, handleInputChange, handleFileChange, editable, handleDeleteRow }) => {
  return (
    <table>
      <thead>
        <tr>
          <th />
          <th>Nội dung</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Tổng</th>
          <th>Tệp đính kèm</th>
        </tr>
      </thead>
      <tbody>
        {formDataList.map((formData, index) => (
          <tr key={index}>
                        <td>
              <button
                type="button"
                onClick={() => handleDeleteRow(index)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                disabled={!editable}
              >
                <FaTrash color="red" />
              </button>
            </td>
            <td><input type="text" name="description" value={formData.description} onChange={handleInputChange(index)} /></td>
            <td><input type="text" name="Amount" value={formData.Amount} onChange={handleInputChange(index)} /></td>
            <td><input type="text" name="Price" value={formData.Price} onChange={handleInputChange(index)} /></td>
            <td><input type="number" name="Total" value={formData.Total} readOnly /></td>
            <td><input type="file" name="File" onChange={(event) => handleFileChange(index, event)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SuggestionView;
