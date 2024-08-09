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

export interface IHomeWebPartProps {
  description: string;
}

export interface IStudentItem {
  Id: number;
  Title: string;
  StudentName: string;
  StudentDept: string;
  StudentCity: string;
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

    const btnUpdate = this.domElement.querySelector('#btnUpdate');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', () => {
        this.updateStudent();
      });
    }

    const btnDelete = this.domElement.querySelector('#btnDelete');
    if (btnDelete) {
      btnDelete.addEventListener('click', () => {
        this.deleteStudent();
      });
    }

    const btnGet = this.domElement.querySelector('#btnGet');
    if (btnGet) {
      btnGet.addEventListener('click', () => {
        this.getStudent();
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

      spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.add({
        Title: studentId,
        StudentName: studentName,
        StudentDept: studentDept,
        StudentCity: studentCity
      }).then(response => {
        alert('Add successful');
        this.getStudent();
      }).catch(error => {
        alert('Add failed: ' + error);
      });
    } else {
      alert('Please fill in all fields.');
    }
  }

  private updateStudent(): void {
    const studentIdElement = document.getElementById("studentId") as HTMLInputElement;
    const studentNameElement = document.getElementById("txtstudentname") as HTMLInputElement;
    const studentDeptElement = document.getElementById("txtstudentDept") as HTMLInputElement;
    const studentCityElement = document.getElementById("txtstudcity") as HTMLInputElement;

    if (studentIdElement && studentNameElement && studentDeptElement && studentCityElement) {
      const studentId = studentIdElement.value;

      const listTitle = 'TestAPI';
      spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.filter(`Title eq '${studentId}'`).top(1)()
        .then((items: IStudentItem[]) => {
          const item = items[0];
          return spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.getById(item.Id).update({
            StudentName: studentNameElement.value,
            StudentDept: studentDeptElement.value,
            StudentCity: studentCityElement.value
          });
        }).then(() => {
          alert('Update successful');
          this.getStudent();
        }).catch(error => {
          alert('Update failed: ' + error);
        });
    } else {
      alert('Please fill in all fields.');
    }
  }

  private deleteStudent(): void {
    const studentIdElement = document.getElementById("studentId") as HTMLInputElement;

    if (studentIdElement) {
      const studentId = studentIdElement.value;

      const listTitle = 'TestAPI';
      spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.filter(`Title eq '${studentId}'`).top(1)()
        .then((items: IStudentItem[]) => {
          const item = items[0];
          return spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.getById(item.Id).delete();
        }).then(() => {
          alert('Delete successful');
          this.getStudent();
        }).catch(error => {
          alert('Delete failed: ' + error);
        });
    } else {
      alert('Please enter a student ID.');
    }
  }

  private getStudent(): void {
    const listTitle = 'TestAPI';
    spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle).items.select('Title', 'StudentName', 'StudentDept', 'StudentCity')()
      .then((items: IStudentItem[]) => {
        let html: string = '<table border="1" width="100%"><tr><th>Student Id</th><th>Student Name</th><th>Student Dept</th><th>Student City</th></tr>';
        items.forEach((item: IStudentItem) => {
          html += `<tr>
                    <td>${item.Title}</td>
                    <td>${item.StudentName}</td>
                    <td>${item.StudentDept}</td>
                    <td>${item.StudentCity}</td>
                   </tr>`;
        });
        html += '</table>';
        const msgStatusElement = this.domElement.querySelector('#MsgStatus');
        if (msgStatusElement) {
          msgStatusElement.innerHTML = html;
        }
      }).catch((error: string) => {
        alert('Error retrieving data: ' + error);
      });
  }

  private checkListExists(): void {
    const listTitle = 'TestAPI';
    spfi().using(SPFx(this.context)).web.lists.getByTitle(listTitle)()
      .then(() => {
        console.log('List exists.');
      })
      .catch(error => {
        console.error('List does not exist:', error);
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
