import * as React from 'react';
import type { ILastProps } from './ILastProps';
import Process from './Process/Process';
import type { MergedFormData } from './IFormData';

interface ILastState {
  formDataList: MergedFormData[];
}


export default class Last extends React.Component<ILastProps, ILastState> {
  public render(): React.ReactElement<ILastProps> {

    return (
      <section>
      <Process context={this.props.context}/>
      </section>
    );
  }
}
