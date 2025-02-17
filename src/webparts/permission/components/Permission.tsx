import * as React from 'react';
// import styles from './Permission.module.scss';
import type { IPermissionProps } from './IPermissionProps';
// import UsersRight from './Views/UsersRight'
import Departments from './Views/Departments'

export default class Permission extends React.Component<IPermissionProps> {
  public render(): React.ReactElement<IPermissionProps> {

    return (
      <div>
      <Departments 
      context={this.props.context}
      />
      </div>
    );
  }
}
  