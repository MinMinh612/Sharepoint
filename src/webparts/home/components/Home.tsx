import * as React from 'react';
// import styles from './Home.module.scss';
import type { IHomeProps } from './IHomeProps';
// import { escape } from '@microsoft/sp-lodash-subset';
import { IFormData } from '../../suggest/components/ISuggestProps'; 


interface IHomeState {
  formDataList: IFormData[];
}


export default class Home extends React.Component<IHomeProps, IHomeState> {

  public render(): React.ReactElement<IHomeProps> {

    return (
      <section >
        API
      </section>
    );
  }
}
