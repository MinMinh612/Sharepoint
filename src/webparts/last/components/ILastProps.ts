import { WebPartContext } from '@microsoft/sp-webpart-base';
export interface ILastProps {
  description: string;
  descriptionLv1: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  userEmail: string;
  Amount: string;
  Price: string;
  Total: number;
  Status: string;
  Approve: boolean;
  approver1List: string[];
  Approver1: string[];
  Approver1Lv1: string[];
  updateDescription: (value: string) => void;
  updateAmount: (value: string) => void;
  updatePrice: (value: string) => void;
  updateTotal: (value: boolean) => void;
  updateStatus: (value: string) => void;
  updateApprove: (value: boolean) => void; 

  context: WebPartContext;
}
