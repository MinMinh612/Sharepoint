import * as React from 'react';
import { FaPaperclip } from 'react-icons/fa';
import styles from './Suggestion.module.scss';
import TableRender, { RowData } from './TableRender';
import { format } from 'date-fns';

export interface IDemoSuggestProps {
  suggestions: DataSuggest[];
  onSelectForEdit: (suggestion: DataSuggest | undefined) => void;
  onSelectionChange: (selectedSuggestions: DataSuggest[]) => void;
  clearSelection?: () => void;
}

export interface DataSuggest {
  Id: number;
  Title: string;
  Attachments?: { FileName: string; Url: string }[];
  Plan?: string;
  DateTime?: string; 
  Emergency?: string;
  Note?: string;
  ProcessName: string;
}

const DemoSuggest: React.FC<IDemoSuggestProps> = ({ suggestions, onSelectForEdit, onSelectionChange }) => {
  // Định nghĩa headers và ánh xạ
  const headers = [
    { key: 'Title', label: 'Tiêu đề' },
    { key: 'DateTime', label: 'Thời gian' },
    { key: 'Attachments', label: 'Tệp đính kèm' },
  ];

  // Chuyển đổi dữ liệu thành RowData
  const transformData = (suggestions: DataSuggest[]): RowData[] => {
    return suggestions.map(suggestion => ({
      'Tiêu đề': suggestion.Title,
      'Thời gian': suggestion.DateTime ? format(new Date(suggestion.DateTime), 'dd/MM/yyyy HH:mm:ss') : '',
      'Tệp đính kèm': (
        <div className={styles.attachmentContainer}>
          {suggestion.Attachments?.slice(0, 1).map((file, fileIndex) => (
            <div key={fileIndex} className={styles.attachmentItem}>
              <div>
                <FaPaperclip />
              </div>
            </div>
          ))}
        </div>
      ),
      'Plan': suggestion.Plan,
    }));
  };

  const handleRowSelectionChange = (selectedRows: RowData[]): void => {
    const selectedSuggestions = selectedRows
      .map(row => {
        const matchedSuggestion = suggestions.find(s => {
          const formattedDateTime = s.DateTime ? format(new Date(s.DateTime), 'dd/MM/yyyy HH:mm:ss') : '';
          return s.Title === row['Tiêu đề'] && formattedDateTime === row['Thời gian'];
        });
  
        if (!matchedSuggestion) {
          console.warn('Không tìm thấy dữ liệu tương ứng:', row);
        }
  
        return matchedSuggestion;
      })
      .filter((suggestion): suggestion is DataSuggest => !!suggestion); // Loại bỏ `undefined`
  
    console.log('Dữ liệu chọn:', selectedSuggestions);
    onSelectionChange(selectedSuggestions);
  };
  
  return (
    <div className={styles.formContainer}>
      <TableRender
        headers={headers.map(h => h.label)} 
        data={transformData(suggestions)} 
        onRowSelectionChange={handleRowSelectionChange}
        showSelectColumn={true} 
      />
    </div>
  );
};

export default DemoSuggest;
