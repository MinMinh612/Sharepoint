// import * as React from 'react';
// import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
// import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'HomeWebPartStrings';
import { spfi, SPFx } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { SPHttpClient } from "@microsoft/sp-http";

export interface IHomeWebPartProps {
  description: string;
}

export default class HomeWebPart extends BaseClientSideWebPart<IHomeWebPartProps> {
  public render(): void {
    this.domElement.innerHTML = `
      <div>
        <div>
          <table border='5'>
            <tr>
              <td>Student Id</td>
              <td><input type='text' id='studentId' /></td>
              <td><input type='submit' id='btnGet' value='Get Details' /></td>
            </tr>
            <tr>
              <td>Student Name</td>
              <td><input type='text' id='txtstudentname' /></td>
            </tr>
            <tr>
              <td>Student Department</td>
              <td><input type='text' id='txtstudentDept' /></td>
            </tr>
            <tr>
              <td>Student City</td>
              <td><input type='text' id='txtstudcity' /></td>
            </tr>
            <tr>
              <td>
                <input type='submit' value='Insert' id='btnInsert' /> 
                <input type='submit' value='Update' id='btnUpdate' /> 
                <input type='submit' value='Delete' id='btnDelete' />
              </td>
            </tr>
          </table>
        </div>
        <div id="MsgStatus"></div>
      </div>
    `;

    this.bindEvent();
    this.checkListExists();
  }

  private bindEvent(): void {
    const btnInsert = this.domElement.querySelector('#btnInsert');
    if (btnInsert) {
      btnInsert.addEventListener('click', () => {
        this.insertStudent();
      });
    }
  }

  private insertStudent(): void {
    const studentIdElement = document.getElementById("studentId") as HTMLInputElement;
    const studentNameElement = document.getElementById("txtstudentname") as HTMLInputElement;
    const studentDeptElement = document.getElementById("txtstudentDept") as HTMLInputElement;
    const studentCityElement = document.getElementById("txtstudcity") as HTMLInputElement;

    if (studentIdElement && studentNameElement && studentDeptElement && studentCityElement) {
      const studentId = studentIdElement.value;
      const studentName = studentNameElement.value;
      const studentDept = studentDeptElement.value;
      const studentCity = studentCityElement.value;

      const listTitle = 'TestAPI';
      // const url = `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${listTitle}')/items`;

      spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.add({
        Title: studentId,
        StudentName: studentName,
        StudentDept: studentDept,
        StudentCity: studentCity
      }).then(response => {
        alert('Add successful');
      }).catch(error => {
        alert('Add failed: ' + error);
      });
    } else {
      alert('Please fill in all fields.');
    }
  }

  private checkListExists(): void {
    const listTitle = 'TestAPI';
    this.context.spHttpClient.get(
      `${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getbytitle('${listTitle}')`,
      SPHttpClient.configurations.v1
    )
    .then(response => {
      if (response.ok) {
        console.log('List exists.');
      } else {
        console.error('List does not exist.');
      }
    })
    .catch(error => {
      console.error('Error checking list existence:', error);
    });
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}