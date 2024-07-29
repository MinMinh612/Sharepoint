import * as React from 'react';
import Suggestion from './Views/Suggestion';
import type { ISuggestProps, IFormData } from './ISuggestProps';

interface ISuggestState {
  formDataList: IFormData[];
}

export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      formDataList: [
        {
          description: '',
          Plan: '',
          Date: '',
          Emergency: '',
          File: undefined,
          NoteSuggest: '',
        },
      ],
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
          File: undefined,
          NoteSuggest: '',
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
      File: undefined,
      NoteSuggest: '',
    };
    this.setState((prevState: ISuggestState) => ({
      formDataList: [...prevState.formDataList, newRow],
    }));
  };
  

  editRow = (index: number): void => {
    // Implement your logic here to edit a row
  };


  render(): React.ReactElement<ISuggestProps> {
    const { formDataList } = this.state;

    return (
      <section>
        <Suggestion 
          formDataList={formDataList}
          handleDeleteRow={this.handleDeleteRow}
          editable={true}
          editRow={this.editRow}
          handleAddRow={this.handleAddRow}
        />
      </section>
    );
  }
}
