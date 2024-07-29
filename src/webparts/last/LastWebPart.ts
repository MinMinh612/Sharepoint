import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle,
  IPropertyPanePageHeader // Import định nghĩa kiểu này
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'LastWebPartStrings';
import Last from './components/Last';
import { ILastProps } from './components/ILastProps';

export interface ILastPropsExtended extends ILastProps {
  approver1List: string[];
  Approver1: string[];
  Approver1Lv1: string[];
}

export interface ILastWebPartProps {
  descriptionLv1: string;
  description: string;
  Amount: string;
  Price: string;
  Total: number;
  Status: string;
  Approve: boolean;
  approver1List: string[];
  Approver1: string[];
  Approver1Lv1: string[];
}

export default class LastWebPart extends BaseClientSideWebPart<ILastWebPartProps> {
  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const total = this.properties.Total;

    const element: React.ReactElement<ILastPropsExtended> = React.createElement(
      Last,
      {
        description: this.properties.description,
        descriptionLv1: this.properties.descriptionLv1,
        Amount: this.properties.Amount,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        userEmail: this.context.pageContext.user.email,
        Price: this.properties.Price,
        Total: isNaN(total) ? 0 : total,
        Status: this.properties.Status,
        Approve: this.properties.Approve,
        approver1List: this.properties.approver1List,
        Approver1: this.properties.Approver1,
        Approver1Lv1: this.properties.Approver1Lv1,
        updateDescription: this.updateDescription.bind(this),
        updateAmount: this.updateAmount.bind(this),
        updatePrice: this.updatePrice.bind(this),
        updateTotal: this.updateTotal.bind(this),
        updateStatus: this.updateStatus.bind(this),
        updateApprove: this.updateApprove.bind(this)
      }
    );

    ReactDom.render(element, this.domElement);
  }

  private updateDescription(value: string): void {
    this.properties.description = value;
    this.render();
  }

  private updateAmount(value: string): void {
    this.properties.Amount = value;
    this.render();
  }

  private updatePrice(value: string): void {
    this.properties.Price = value;
    this.render();
  }

  private updateTotal(value: number): void {
    this.properties.Total = value;
    this.render();
  }

  private updateStatus(value: string): void {
    this.properties.Status = value;
    this.render();
  }

  private updateApprove(value: boolean): void {
    this.properties.Approve = value;
    this.render();
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }

  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          } as IPropertyPanePageHeader,
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                }),
                PropertyPaneTextField('descriptionLv1', {
                  label: strings.DescriptionLv1FieldLabel
                }),
                PropertyPaneTextField('Amount', {
                  label: strings.AmountFieldLabel
                }),
                PropertyPaneTextField('Price', {
                  label: strings.PriceFieldLabel
                }),
                PropertyPaneDropdown('Status', {
                  label: 'Trạng thái',
                  options: [
                    { key: '1', text: 'One' },
                    { key: '2', text: 'Two' },
                    { key: '3', text: 'Three' },
                    { key: '4', text: 'Four' }
                  ]
                }),
                PropertyPaneToggle('Approve', {
                  label: 'Đề xuất',
                  onText: 'On',
                  offText: 'Off'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
