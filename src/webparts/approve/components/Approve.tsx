import * as React from 'react';
import Approval from './Views/Approval';
// import { dataProcess, dataSuggestion } from '../../Data'; 
import { IApproveProps } from './IApproveProps'; 
import { IFormData } from '../../suggest/components/ISuggestProps'; 
import { IFormDataProcess } from '../../last/components/IFormData';

interface IApproveState {
  formDataList: IFormData[];
  formDataListProcess: IFormDataProcess[];
}

export default class Approve extends React.Component<IApproveProps, IApproveState> {
  constructor(props: IApproveProps) {
    super(props);
    this.state = {
      formDataList: [
        {
          description: 'Đơn duyệt',
          Plan: 'E-Office',
          Date: '31/07/2024 10:00',
          Emergency: 'Hơi gấp',
          File: [
            { name: 'Tài liệu.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'Tài liệu.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Cần chữa lành',
          ProcessName: '',
          StatusSuggestion: '',
        },
        {
          description: 'Đơn thử nghiệm',
          Plan: 'Sharepoint',
          Date: '31/07/2024 11:21',
          Emergency: 'Gấp',
          File: [
            { name: 'Mẫu thử.pdf', url: 'https://www.pdf995.com/samples/pdf.pdf' },
            { name: 'Mẫu thử.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Chữa rách vết thương đã lành',
          ProcessName: '',
          StatusSuggestion: '',
        },
      ],
      formDataListProcess: [], 
    };
  }

  public render(): React.ReactElement<IApproveProps> {
    const { 
      editable, 
      handleDeleteRow, 
      handleAddRow, 
      editRow 
    } = this.props;
    
    return (
      <section>
        <Approval
          formDataList={this.state.formDataList}
          formDataListProcess={this.state.formDataListProcess}
          handleDeleteRow={handleDeleteRow}
          editable={editable}
          editRow={editRow}
          handleAddRow={handleAddRow}
        />
      </section>
    );
  }
}
