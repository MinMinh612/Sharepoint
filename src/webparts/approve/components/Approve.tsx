import * as React from 'react';
import DemoApprove from './Views/DemoApprove';
import { IApproveProps } from './IApproveProps';

const Approve: React.FC<IApproveProps> = (props) => {
  return <DemoApprove {...props} />;
};

export default Approve;
