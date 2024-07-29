import * as React from 'react';
import type { MergedFormData } from '../IFormData';
import { FaTrash } from 'react-icons/fa';

interface IFormViewProps {
  formDataList: MergedFormData[];
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleApproveAction: (index: number, isApproved: boolean) => void;
  handleDeleteRow: (index: number) => void; 
  editable: boolean;
}

const FormView: React.FC<IFormViewProps> = ({
  formDataList,
  handleInputChange,
  handleFileChange,
  handleApproveAction,
  handleDeleteRow,
  editable
}) => (
  <form>
    <table>
      <thead>
        <tr>
          <th /> 
          <th>Tiêu đề</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Tổng cộng</th>
          <th>Tệp đính kèm</th>
          <th>Trạng thái</th>
          <th>Thao tác Duyệt</th>
          <th>Cố vấn</th>
          <th>Ghi chú của cố vấn</th>
          <th>Người phê duyệt 1</th>
          <th>Ghi chú của người phê duyệt 1</th>
          <th>Người phê duyệt 2</th>
          <th>Ghi chú của người phê duyệt 2</th>
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
            <td>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange(index)}
              />
            </td>
            <td>
              <input
                type="text"
                name="Amount"
                value={formData.Amount}
                onChange={handleInputChange(index)}
              />
            </td>
            <td>
              <input
                type="text"
                name="Price"
                value={formData.Price}
                onChange={handleInputChange(index)}
              />
            </td>
            <td>
              <input
                type="text"
                name="Total"
                value={formData.Total}
                readOnly
              />
            </td>
            <td>
              <input
                type="file"
                name="File"
                onChange={(event) => handleFileChange(index, event)}
              />
            </td>
            <td>
              <select name="Status" value={formData.Status} onChange={handleInputChange(index)}>
                <option value="1">Đề xuất</option>
                <option value="2">Duyệt cấp 1</option>
                <option value="3">Duyệt cấp 2</option>
                <option value="4">Bị hủy</option>
              </select>
            </td>
            <td>
              <div>
                <button
                  id={`btnApprove_${index}`}
                  name={`btnApprove_${index}`}
                  onClick={() => handleApproveAction(index, true)}
                  disabled={!editable}
                >
                  Duyệt
                </button>
                <button
                  id={`btnReject_${index}`}
                  name={`btnReject_${index}`}
                  onClick={() => handleApproveAction(index, false)}
                  disabled={!editable}
                >
                  Không duyệt
                </button>
              </div>
            </td>
            <td><input type="text" name="Counselors" value={formData.Counselors} onChange={handleInputChange(index)} /></td>
            <td><input type="text" name="CounselorNote" value={formData.CounselorNote} onChange={handleInputChange(index)}/></td>
            <td><input type="text" name="Approver1" value={formData.Approver1} onChange={handleInputChange(index)} /></td>
            <td> <input type="text" name="Approver1Note" value={formData.Approver1Note} onChange={handleInputChange(index)} /> </td> 
            <td> <input type="text" name="Approver2" value={formData.Approver2} onChange={handleInputChange(index)} /> </td> 
            <td> <input type="text" name="Approver2Note" value={formData.Approver2Note} onChange={handleInputChange(index)} /> </td> 
          </tr>
        ))}
      </tbody>
    </table>
  </form>
);

export default FormView;
