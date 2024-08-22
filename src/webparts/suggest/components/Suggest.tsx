import * as React from 'react';
import { ISuggestProps } from './ISuggestProps';
import styles from './Views/Suggestion.module.scss';
import { FaPlus, FaEdit, FaTrash, FaFileAlt, FaFileWord, FaFilePdf } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import DemoSuggest from './Views/DemoSuggest';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 
import { ISiteUserInfo } from '@pnp/sp/site-users/types';


//delay thời gian chờ để delete không bị lỗi
const delay = (ms: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface ISuggestState {
  suggestions: dataSuggest[];
  showModal: boolean;
  users: string[]; 
  selectedUser: string;
  selectedSuggestion?: dataSuggest; 
  selectedIndex: number | undefined;
  selectedSuggestions: dataSuggest[];
  selectedIndices: number[];
  showMore: boolean;
}

export interface dataSuggest {
  Title: string;
  Attachments?: { FileName: string; Url: string }[]; // khai báo thêm Url để link trực tiếp file 
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
      users: [], 
      selectedUser: '',
      selectedSuggestion: undefined,
      selectedIndex: undefined,
      selectedSuggestions: [],
      selectedIndices: [],
      showMore: false,
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.addSuggest = this.addSuggest.bind(this);
    this.editSuggest = this.editSuggest.bind(this);
    this.deleteSuggest = this.deleteSuggest.bind(this);
    this.getSuggest = this.getSuggest.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.EditButtonClick = this.EditButtonClick.bind(this);
  }

  private async addSuggest(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;
  
    if (descriptionElement && fileInputElement) {
      const Description = descriptionElement.value;
      const files = fileInputElement.files;
  
      if (!Description || !files || files.length === 0) {
        alert('Please fill in all fields and select at least one file.');
        return;
      }
  
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        // Lấy thông tin
        const user = await this.getUserByEmail(this.state.selectedUser);
        if (!user) {
          alert('User not found');
          return;
        }
  
        // Thêm mục mới với cột "Person"
        const response = await sp.web.lists.getByTitle(listTitle).items.add({
          Title: Description,
          Status: 'Staff',
          PersonId: user.Id 
        });
  
        const itemId = response.data?.Id || response.Id;
  
        if (itemId) {
          // Thêm các tệp đính kèm
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, file);
          }
  
          alert('Add successful with attachments');
          await this.getSuggest();
          this.toggleModal(); // Đóng popup sau khi thêm
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
    const { selectedSuggestion } = this.state;
  
    if (selectedSuggestion) {
      const sp = spfi().using(SPFx(this.props.context));
      const listTitle = 'Suggest';
  
      try {
        const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${selectedSuggestion.Title}'`).top(1)();
        if (items.length === 0) {
          throw new Error('No item found to update.');
        }
        const item = items[0];
  
        const descriptionElement = document.getElementById("description") as HTMLInputElement;
        const fileInputElement = document.getElementById("newfile") as HTMLInputElement;
  
        const Description = descriptionElement.value;
        const files = fileInputElement.files;
  
        // Lấy thông tin từ mail
        const user = await this.getUserByEmail(this.state.selectedUser);
        if (!user) {
          alert('User not found');
          return;
        }
  
        // Xóa các tệp cũ
        const existingAttachments = selectedSuggestion.Attachments || [];
        const currentAttachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
        const deletePromises = currentAttachments
          .filter((attachment: IAttachment) => !existingAttachments.find(a => a.FileName === attachment.FileName))
          .map((attachment: IAttachment) =>
            sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.getByName(attachment.FileName).delete()
          );
        await Promise.all(deletePromises);
  
        // Cập nhật mục
        await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).update({
          Title: Description,
          PersonId: user.Id 
        });
  
        // Thêm tệp mới
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.add(file.name, file);
          }
        }
  
        alert('Update successful with new attachments');
        await this.getSuggest();
        this.toggleModal(); // Đóng modal sau khi cập nhật
      } catch (error) {
        alert('Update failed: ' + error.message);
      }
    } else {
      alert('No suggestion selected for editing.');
    }
  }
      
  private async deleteSuggest(): Promise<void> {
    const { selectedSuggestions } = this.state;
    const maxRetries = 3; // Số lần thử lại tối đa
  
    if (selectedSuggestions.length > 0) {
      const listTitle = 'Suggest';
      const sp = spfi().using(SPFx(this.props.context));
  
      try {
        for (const suggestion of selectedSuggestions) {
          const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${suggestion.Title}'`).top(1)();
          if (items.length > 0) {
            const item = items[0];
            const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
  
            for (const attachment of attachments) {
              let attempts = 0;
              let success = false;
              while (!success && attempts < maxRetries) {
                try {
                  await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles.getByName(attachment.FileName).delete();
                  success = true;
                } catch (err) {
                  if (err.status === 409) {
                    attempts++;
                    await delay(500); // Đợi 500ms trước khi thử lại
                  } else {
                    throw err;
                  }
                }
              }
            }
  
            await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).delete();
          }
        }
  
        alert('Delete successful');
        await this.getSuggest();
        this.setState({ selectedSuggestions: [] }); // Clear selected suggestions
      } catch (error) {
        alert('Delete failed: ' + error.message);
      }
    } else {
      alert('Please select at least one suggestion to delete.');
    }
  }
      
  private async getSuggest(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      const items = await sp.web.lists.getByTitle(listTitle).items.select('Title')(); // Only selecting 'Title'
    
      const suggestions: dataSuggest[] = await Promise.all(items.map(async (item: { Title: string }) => {
        const attachments = await sp.web.lists.getByTitle(listTitle).items
          .filter(`Title eq '${item.Title}'`)
          .top(1)()
          .then((items) =>
            sp.web.lists.getByTitle(listTitle).items.getById(items[0].Id).attachmentFiles()
          );
  
        const attachmentLinks = attachments.length > 0 
          ? attachments.map((attachment: IAttachment) => ({
              FileName: attachment.FileName,
              Url: attachment.ServerRelativeUrl // Mapping to the correct URL property
            }))
          : [];
  
        return {
          Title: item.Title,
          Attachments: attachmentLinks // No need for 'Person' here
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

  private EditButtonClick(): void {
    const { selectedIndices, suggestions } = this.state;
  
    console.log('Selected Indices:', selectedIndices);
    console.log('Suggestions:', suggestions);
  
    if (selectedIndices.length === 1) {
      const selectedSuggestion = suggestions[selectedIndices[0]];
      console.log('Selected Suggestion:', selectedSuggestion);
      this.setState({ selectedSuggestion, showModal: true });
    } else {
      console.log('Error: More than one suggestion selected or none selected.');
      alert('Please select a single suggestion to edit.');
    }
  }
        

  private async getUsers(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const users = await sp.web.siteUsers();
      // Lọc null trước khi gắn
      const userNames = users
        .map(user => user.UserPrincipalName)
        .filter((email): email is string => email !== null); 
      this.setState({ users: userNames }); 
    } catch (error) {
      console.error('Error getting users: ', error);
    }
  }
    
  private async getUserByEmail(email: string): Promise<ISiteUserInfo | null> {
    const sp = spfi().using(SPFx(this.props.context));
    try {
      const user = await sp.web.siteUsers.getByEmail(email)();
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
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
  
  private RemoveAttachment = (index: number): void => {
    const { selectedSuggestion } = this.state;
    if (selectedSuggestion) {
      const updatedAttachments = selectedSuggestion.Attachments?.filter((_, i) => i !== index);
      this.setState({
        selectedSuggestion: {
          ...selectedSuggestion,
          Attachments: updatedAttachments,
        },
      });
    }
  };

    _renderFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'pdf':
            return <FaFilePdf color="red" />;
        case 'doc':
        case 'docx':
            return <FaFileWord color="blue" />;
        default:
            return <FaFileAlt />;
    }
  };

  
  
  public render(): React.ReactElement<ISuggestProps> {
    return (
      <section>
        <div className={styles.actionButtons}>
          <button type="button" onClick={this.toggleModal} className={`${styles.btn} ${styles.btnAdd}`}>
            <FaPlus color="green" /> Thêm
          </button>
          <button type="button" onClick={this.EditButtonClick} className={`${styles.btn} ${styles.btnEdit}`}>
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
              <h2>{this.state.selectedSuggestion ? "Sửa đề xuất" : "Thêm mới đề xuất"}</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Nội dung:</td>
                    <td>
                      <input type='text' id='description' defaultValue={this.state.selectedSuggestion?.Title || ''} />
                    </td>
                  </tr>
                  <tr>
                    <td>Người dùng:</td>
                    <td>
                      <select
                        value={this.state.selectedUser}
                        onChange={(e) => this.setState({ selectedUser: e.target.value })}
                      >
                        <option value="">Chọn người dùng</option>
                        {this.state.users.map(user => (
                          <option key={user} value={user}>{user}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td>Files:</td>
                    <td>
                      {this.state.selectedSuggestion?.Attachments?.length ? (
                        <div>
                          <div className={styles.attachmentContainer}>
                            {this.state.selectedSuggestion.Attachments.slice(0, 3).map((attachment, index) => (
                              <div key={index} className={styles.attachmentItem}>
                                <button onClick={() => this.RemoveAttachment(index)} className={styles.removeButton}>
                                  &times;
                                </button>
                                <div className={styles.attachmentIcon}>
                                  {this._renderFileIcon(attachment.FileName)}
                                </div>
                                <div className={styles.attachmentLink}>
                                  <a href={attachment.Url} target="_blank" rel="noopener noreferrer" className={styles.attachmentFileName}>
                                    {attachment.FileName}
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                          {this.state.selectedSuggestion.Attachments.length > 3 && (
                            <button className={styles.showMoreButton} onClick={() => this.setState({ showMore: true })}>
                              Hiển thị thêm
                            </button>
                          )}
                          {this.state.showMore && (
                            <div className={styles.attachmentContainer}>
                              {this.state.selectedSuggestion.Attachments.slice(3).map((attachment, index) => (
                                <div key={index} className={styles.attachmentItem}>
                                  <button onClick={() => this.RemoveAttachment(index + 3)} className={styles.removeButton}>
                                    &times;
                                  </button>
                                  <div className={styles.attachmentIcon}>
                                    {this._renderFileIcon(attachment.FileName)}
                                  </div>
                                  <div className={styles.attachmentLink}>
                                    <a href={attachment.Url} target="_blank" rel="noopener noreferrer" className={styles.attachmentFileName}>
                                      {attachment.FileName}
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span>No attachments available</span>
                      )}
                      <input type="file" id="newfile" multiple />
                    </td>
                  </tr>
                </tbody>
              </table>
              <button onClick={this.state.selectedSuggestion ? this.editSuggest : this.addSuggest} className={`${styles.btn} ${styles.btnAdd}`}>
                {this.state.selectedSuggestion ? "Cập nhật" : "Lưu"}
              </button>
              <button onClick={this.toggleModal} className={`${styles.btn} ${styles.btnDelete}`}>Đóng</button>
            </div>
          </div>
        )}
        <DemoSuggest
          suggestions={this.state.suggestions}
          onSelectForEdit={this.EditButtonClick}
          onSelectionChange={(selectedSuggestions) => {
            console.log('Selected Suggestions:', selectedSuggestions);
            this.setState({
              selectedSuggestions,
              selectedIndices: selectedSuggestions.map((suggestion) => this.state.suggestions.indexOf(suggestion))
            });
          }}
        />
      </section>
    );
  }
}