import { IFormData } from '../../suggest/components/ISuggestProps';

export interface IHomeProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  formDataList: IFormData[];

}
