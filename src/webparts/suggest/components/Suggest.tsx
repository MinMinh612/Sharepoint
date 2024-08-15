import * as React from 'react';
import { ISuggestProps } from './ISuggestProps';
import styles from './Views/Suggestion.module.scss';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import DemoSuggest from './Views/DemoSuggest'
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';

interface ISuggestState {
  suggestions: dataSuggest[];
}

export interface dataSuggest {
  Title: string;
  Attachments?: string[];
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

export default class Suggest extends React.Component<ISuggestProps, ISuggestState> {
  constructor(props: ISuggestProps) {
    super(props);
    this.state = {
      suggestions: []
    };
    this.addSuggest = this.addSuggest.bind(this);
    this.editSuggest = this.editSuggest.bind(this);
    this.deleteSuggest = this.deleteSuggest.bind(this);
    this.getSuggest = this.getSuggest.bind(this);
  }

  private async addSuggest(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;

    if (descriptionElement && fileInputElement) {
      const Description = descriptionElement.value;
      const file = fileInputElement.files ? fileInputElement.files[0] : null;

      if (!file) {
        alert('Please select a file.');
        return;
      }

      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));

      try {
        const response = await sp.web.lists.getByTitle(listTitle).items.add({
          Title: Description,
        });
        const itemId = response.data?.Id || response.Id;
        if (itemId) {
          await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, file);
          alert('Add successful with attachment');
          await this.getSuggest();
        } else {
          alert('Item added but no ID returned.');
        }
      } catch (error) {
        alert('Add failed: ' + error.message);
      }
    } else {
      alert('Please fill in all fields.');
    }
  }

  private async editSuggest(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;

    if (descriptionElement) {
      const Description = descriptionElement.value;
      const file = fileInputElement.files ? fileInputElement.files[0] : null;

      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));

      try {
        const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${Description}'`).top(1)();
        if (items.length === 0) {
          throw new Error('No item found to update.');
        }
        const item = items[0];
        const itemUpdatePromise = sp.web.lists.getByTitle(listTitle).items.getById(item.Id).update({
          // Update other fields if necessary
        });

        if (file) {
          const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
          const deletePromises = attachments.map((attachment: IAttachment) => 
            sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.getByName(attachment.FileName).delete()
          );
          await Promise.all(deletePromises);
          await itemUpdatePromise;
          await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.add(file.name, file);
        } else {
          await itemUpdatePromise;
        }
        alert('Update successful with attachment');
        await this.getSuggest();
      } catch (error) {
        alert('Update failed: ' + error.message);
      }
    } else {
      alert('Please fill in all fields.');
    }
  }

  private async deleteSuggest(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;

    if (descriptionElement) {
      const Description = descriptionElement.value;
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));

      try {
        const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${Description}'`).top(1)();
        if (items.length === 0) {
          throw new Error('No items found with the provided Title.');
        }
        const item = items[0];
        const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
        const deletePromises = attachments.map((attachment: IAttachment) =>
          sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.getByName(attachment.FileName).delete()
        );
        await Promise.all(deletePromises);
        await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).delete();
        alert('Delete successful');
        await this.getSuggest();
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    } else {
      alert('Please enter Title.');
    }
  }

  private async getSuggest(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      // Fetch items from the SharePoint list
      const items = await sp.web.lists.getByTitle(listTitle).items.select('Title')();
      
      // Map over the items and fetch attachments
      const suggestions: dataSuggest[] = await Promise.all(items.map(async (item: { Title: string }) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${item.Title}'`).top(1)().then((items) => 
          sp.web.lists.getByTitle(listTitle).items.getById(items[0].Id).attachmentFiles()
        );
        const attachmentLinks = attachments.length > 0 
          ? attachments.map((attachment: IAttachment) => attachment.FileName) 
          : [];
        
        return {
          Title: item.Title,
          Attachments: attachmentLinks
        };
      }));
  
      // Update the component state with the fetched suggestions
      this.setState({ suggestions });
    } catch (error) {
      alert('Error retrieving data: ' + error.message);
    }
  }
    
  private checkListExists(): void {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));

    sp.web.lists.getByTitle(listTitle)()
      .then(() => {
        alert('List exists.');
      })
      .catch(error => {
        alert('List does not exist: ' + error.message);
      });
  }

  public componentDidMount(): void {
    this.checkListExists();
  }

  public render(): React.ReactElement<ISuggestProps> {
    return (
      <section>
        <div className={styles.actionButtons}>
          <button type="button" onClick={this.addSuggest} className={`${styles.btn} ${styles.btnAdd}`}>
            <FaPlus color="green" /> Thêm
          </button>
          <button type="button" onClick={this.editSuggest} className={`${styles.btn} ${styles.btnEdit}`}>
            <FaEdit color="orange" /> Sửa
          </button>
          <button type="button" onClick={this.deleteSuggest} className={`${styles.btn} ${styles.btnDelete}`}>
            <FaTrash color="red" /> Xóa
          </button>
          <button type="button" onClick={this.getSuggest} className={`${styles.btn} ${styles.btnEdit}`}>
            Tra cứu
          </button>
        </div>
        <div>
          <table>
            <tbody>
              <tr>
                <td>Nội dung check delete:</td>
                <td><input type='text' id='description' /></td>
              </tr>
              <tr>
                <td>Files:</td>
                <td><input type="file" id="newfile" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <DemoSuggest suggestions={this.state.suggestions} />
      </section>
    );
  }
}
