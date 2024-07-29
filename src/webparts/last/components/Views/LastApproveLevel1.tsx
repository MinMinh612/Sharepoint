import * as React from 'react';
import type { MergedFormData } from '../IFormData';

interface IApproveLevel1ViewProps {
  formDataList: MergedFormData[];
  handleInputChange: (index: number) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleFileChange: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleApproveAction: (index: number, isApproved: boolean) => void;
  editable: boolean;
  filteredApproveLevel1Data: MergedFormData[];
}

const ApproveLevel1View: React.FC<IApproveLevel1ViewProps> = ({ formDataList, handleInputChange, handleFileChange, editable, handleApproveAction }) => (
  <form>
    <table>
      <thead>
        <tr>
          <th>Nội dung</th>
          <th>Số lượng</th>
          <th>Đơn giá</th>
          <th>Tổng cộng</th>
          <th>Tệp đính kèm</th>
          <th>Duyệt</th>
          <th>Ghi chú của người phê duyệt 1</th>
          <th>Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        {formDataList.map((formData, index) => (
          <tr key={index}>
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
            <td>
              <input
                type="text"
                name="Approver1Note"
                value={formData.Approver1Note}
                onChange={handleInputChange(index)}
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
          </tr>
        ))}
      </tbody>
    </table>
  </form>
);

export default ApproveLevel1View;
