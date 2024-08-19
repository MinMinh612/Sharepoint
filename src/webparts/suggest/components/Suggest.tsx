import * as React from 'react';
import { ISuggestProps } from './ISuggestProps';
import styles from './Views/Suggestion.module.scss';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import DemoSuggest from './Views/DemoSuggest';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 



interface ISuggestState {
  suggestions: dataSuggest[];
  showModal: boolean;
  users: string[]; // Thêm state cho danh sách người dùng
  selectedUser: string;
}

export interface dataSuggest {
  Title: string;
  Person: string;
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
      suggestions: [],
      showModal: false,
      users: [], // Khởi tạo danh sách người dùng rỗng
      selectedUser: '',
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.addSuggest = this.addSuggest.bind(this);
    this.editSuggest = this.editSuggest.bind(this);
    this.deleteSuggest = this.deleteSuggest.bind(this);
    this.getSuggest = this.getSuggest.bind(this);
    this.getUsers = this.getUsers.bind(this);
  }



  private async addSuggest(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;
    const personElement = document.getElementById("userList") as HTMLInputElement;
  
    if (descriptionElement && fileInputElement && personElement) {
      const Description = descriptionElement.value;
      const Person = personElement.value;
      const files = fileInputElement.files;
  
      if (!files || files.length === 0) {
        alert('Please select at least one file.');
        return;
      }
  
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        const userExists = await this.checkUserExists(Person);
        if (!userExists) {
          alert('User not found');
          return;
        }
  
        // Ensure user by login name or email
        const user = await sp.web.ensureUser(Person);
  
        if (!user || !user.Id) {
          alert('User not found');
          return;
        }
  
        const response = await sp.web.lists.getByTitle(listTitle).items.add({
          Title: Description,
          PersonId: user.Id, 
        });
  
        const itemId = response.data?.Id || response.Id;
  
        if (itemId) {
          // Add attachments
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, file);
          }
  
          alert('Add successful with attachments');
          await this.getSuggest();
          this.toggleModal(); // Close popup after adding
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
      const files = fileInputElement.files;
  
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${Description}'`).top(1)();
        if (items.length === 0) {
          throw new Error('No item found to update.');
        }
        const item = items[0];
  
        // delete file cũ
        const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
        const deletePromises = attachments.map((attachment: IAttachment) =>
          sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.getByName(attachment.FileName).delete()
        );
        await Promise.all(deletePromises); // chờ xóa hết để tránh bất đồng bộ
  
        // updata lại
        await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).update({
          // các trường khác
        });
  
        // thêm file mới
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.add(file.name, file);
          }
        }
  
        alert('Update successful with new attachments');
        await this.getSuggest(); // tự động getdata lại
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
      const items = await sp.web.lists.getByTitle(listTitle).items.select('Title')();

      
      const suggestions: dataSuggest[] = await Promise.all(items.map(async (item: { Title: string, Person: string}) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${item.Title}'`).top(1)().then((items) => 
          sp.web.lists.getByTitle(listTitle).items.getById(items[0].Id).attachmentFiles()
        );
        const attachmentLinks = attachments.length > 0 
          ? attachments.map((attachment: IAttachment) => attachment.FileName) 
          : [];
        
        return {
          Title: item.Title,
          Person: item.Person,
          Attachments: attachmentLinks
        };
      }));
  
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
        // alert('List exists.');
      })
      .catch(error => {
        alert('List does not exist: ' + error.message);
      });
  }

  private async checkUserExists(userName: string): Promise<boolean> {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const siteUrl = sp.web.toUrl();
      
      // Construct the endpoint URL
      const url = `${siteUrl}/_api/web/siteusers?$filter=Title eq '${userName}'`;
      
      // Hàm fectch
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json'
        },
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
  
      const data = await res.json();
      return data.d.results.length > 0;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  private async getUsers(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const users = await sp.web.siteUsers();
      const userNames = users.map(user => user.Title); // Lấy danh sách tên người dùng
      this.setState({ users: userNames }); // Cập nhật state với danh sách người dùng
    } catch (error) {
      console.error('Error getting users: ', error);
    }
  }

  public componentDidMount(): void {
    this.checkListExists();
    this.getUsers().then(() => {
      // xử lý khi cần 
    }).catch(error => {
      console.error('Error getting users:', error);
    });
  }

  private toggleModal(): void {
    this.setState({ showModal: !this.state.showModal });
  }


  private handleUserChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    // console.log(event.target.value);
    this.setState({ selectedUser: event.target.value });
  };
  
  
  public render(): React.ReactElement<ISuggestProps> {
    const { users, selectedUser } = this.state;
    return (
      <section>
        <div className={styles.actionButtons}>
          <button type="button" onClick={this.toggleModal} className={`${styles.btn} ${styles.btnAdd}`}>
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
        {this.state.showModal && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
              <h2>Thêm mới đề xuất</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Nội dung:</td>
                    <td><input type='text' id='description' /></td>
                  </tr>
                  <tr>
                    <td>Files:</td>
                    <td><input type="file" id="newfile" multiple /></td>
                  </tr>
                  <tr>
                    <td>Người duyệt:</td>
                    <td>
                      <input
                        type="text"
                        list="userList"
                        value={selectedUser}
                        onChange={this.handleUserChange}
                      />
                      <datalist id="userList">
                        {users.map((user, index) => (
                          <option key={index} value={user} />
                        ))}
                      </datalist>
                    </td>
                  </tr>
                  </tbody>
              </table>
              <button onClick={this.addSuggest} className={`${styles.btn} ${styles.btnAdd}`}>Lưu</button>
              <button type="button" onClick={this.editSuggest} className={`${styles.btn} ${styles.btnEdit}`}>
                <FaEdit color="orange" /> Sửa
              </button>
              <button type="button" onClick={this.deleteSuggest} className={`${styles.btn} ${styles.btnDelete}`}>
                <FaTrash color="red" /> Xóa
              </button>
              <button onClick={this.toggleModal} className={`${styles.btn} ${styles.btnDelete}`}>Đóng</button>
            </div>
          </div>
        )}

        <DemoSuggest suggestions={this.state.suggestions} />
      </section>
    );
  }
}