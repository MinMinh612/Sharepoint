import * as React from 'react';
import type { MergedFormData } from '../IFormData';
import { FaTrash } from 'react-icons/fa';

interface ISuggestionViewProcessLevel1Props {
  formDataList: MergedFormData[];
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  editable: boolean;
  handleDeleteRow: (index: number) => void; 
}

const SuggestionViewProcessLevel1: React.FC<ISuggestionViewProcessLevel1Props> = ({ formDataList, handleInputChange, handleFileChange, editable, handleDeleteRow }) => {
  return (
    <table>
      <thead>
        <tr>
          <th />
          <th>Mô tả</th>
          <th>File</th>
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
            <td><input type="file" name="File" onChange={(event) => handleFileChange(index, event)} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SuggestionViewProcessLevel1;
