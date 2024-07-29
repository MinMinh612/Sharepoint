declare interface ILastWebPartStrings {
  PropertyPaneDescription: string;
  PropertyPaneLv1Description: string;
  PropertyPaneCheckbox: string;
  PropertyPaneDropdown: string;
  PropertyPaneToggle: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  DescriptionLv1FieldLabel: string;
  PriceFieldLabel: string;
  AmountFieldLabel: string;
  TotalFieldLabel: number;
  StatusFieldLabel: string;
  ApproveFieldLabel: boolean;
  FileFieldLabel: File;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
}

declare module 'LastWebPartStrings' {
  const strings: ILastWebPartStrings;
  export = strings;
}
