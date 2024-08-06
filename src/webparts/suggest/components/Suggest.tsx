import * as React from 'react';
import Suggestion from './Views/Suggestion';
import type { ISuggestProps, IFormData } from './ISuggestProps';
import type { IFormDataProcess } from '../../last/components/IFormData';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";


interface ISuggestState {
  formDataList: IFormData[];
  formDataListProcess: IFormDataProcess[];
}

export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      formDataList: [
        {
          description: 'Đơn duyệt',
          Plan: 'E-Office',
          Date: '31/07/2024 10:00',
          Emergency: 'Hơi gấp',
          File: [
            { name: 'document1.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'document2.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Cần chữa lành',
          ProcessName: 'Duyệt văn bản',
          StatusSuggestion: '',
        },
        {
          description: 'Đơn thử nghiệm',
          Plan: 'Sharepoint',
          Date: '31/07/2024 11:21',
          Emergency: 'Gấp',
          File: [
            { name: 'document3.pdf', url: 'https://www.pdf995.com/samples/pdf.pdf' },
            { name: 'document4.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Chữa rách vết thương đã lành',
          ProcessName: 'Duyệt văn bản',
          StatusSuggestion: '',
        },
      ],
      formDataListProcess: [], 
    };
  }


  private handleDeleteRow = (index: number): void => {
    this.setState((prevState: ISuggestState) => {
      let formDataList = [...prevState.formDataList];
      if (formDataList.length > 1) {
        formDataList = formDataList.filter((_, i) => i !== index);
      } else {
        formDataList[index] = {
          description: '',
          Plan: '',
          Date: '',
          Emergency: '',
          File: [],
          NoteSuggest: '',
          ProcessName: '',
          StatusSuggestion: '',
        };
      }
      return { formDataList };
    });
  };

  handleAddRow = (): void => {
    const newRow: IFormData = {
      description: '',
      Plan: '',
      Date: '',
      Emergency: '',
      File: [],
      NoteSuggest: '',
      ProcessName: '',
      StatusSuggestion: '',
    };
    this.setState((prevState: ISuggestState) => ({
      formDataList: [...prevState.formDataList, newRow],
    }));
  };

  editRow = (index: number): void => {
    // Implement your logic here to edit a row
  };

  render(): React.ReactElement<ISuggestProps> {
    const { formDataList, formDataListProcess } = this.state;

    return (
      <section>
        <Suggestion 
          formDataList={formDataList}
          formDataListProcess={formDataListProcess}
          handleDeleteRow={this.handleDeleteRow}
          editable={true}
          editRow={this.editRow}
          handleAddRow={this.handleAddRow}
        />
      </section>
    );
  }
}
