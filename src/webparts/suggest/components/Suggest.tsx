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

  private async addSuggest(status: string = 'Draft'): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;
  
    const Title = descriptionElement ? descriptionElement.value : '';
    const files = fileInputElement ? fileInputElement.files : null;
  
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      let userId = null;
      if (this.state.selectedUser) {
        const user = await this.getUserByEmail(this.state.selectedUser);
        if (user) {
          userId = user.Id;
        }
      }
  
      // Ensure PersonId is an array (even if empty)
      const personIds = userId ? [userId] : [];
  
      // Check if a draft already exists with the same Title
      const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${Title}'`).top(1)();
      let itemId;
  
      if (items.length > 0) {
        // If item exists, update it
        itemId = items[0].Id;
        await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
          Status: status,
          PersonId: personIds,  // Assign the array here
        });
      } else {
        // If no item exists, create a new one
        const response = await sp.web.lists.getByTitle(listTitle).items.add({
          Title: Title || '',
          Status: status,
          PersonId: personIds  // Assign the array here
        });
        itemId = response.data?.Id || response.Id;
      }
  
      if (itemId && files && files.length > 0) {
        // Add attachments if any
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, file);
        }
      }
  
      if (status === 'Draft') {
        console.log('Auto-saved as Draft');
      } else {
        alert('Add successful with attachments');
        await this.getSuggest();
        this.toggleModal();
      }
    } catch (error) {
      alert('Add failed: ' + error.message);
    }
  }
      
  private async editSuggest(status: string = 'Draft'): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement;
    const fileInputElement = document.getElementById("newfile") as HTMLInputElement;
  
    const Title = descriptionElement ? descriptionElement.value : '';
    const files = fileInputElement ? fileInputElement.files : null;
  
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));
  
    try {
      let userId = null;
      if (this.state.selectedUser) {
        const user = await this.getUserByEmail(this.state.selectedUser);
        if (user) {
          userId = user.Id;
        }
      }
  
      // Check if an item exists with the same Title
      const items = await sp.web.lists.getByTitle(listTitle).items.filter(`Title eq '${Title}'`).top(1)();
      if (items.length === 0) {
        throw new Error('No item found to update.');
      }

      const personIds = userId ? [userId] : [];
      const itemId = items[0].Id;
  
      // Update the item
      await sp.web.lists.getByTitle(listTitle).items.getById(itemId).update({
        Title: Title,
        Status: 'Staff',
        PersonId: personIds
      });
  
      if (files && files.length > 0) {
        // Add new attachments
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          await sp.web.lists.getByTitle(listTitle).items.getById(itemId).attachmentFiles.add(file.name, file);
        }
      }
  
      alert('Update successful with new attachments');
      await this.getSuggest();
      this.toggleModal();
    } catch (error) {
      alert('Update failed: ' + error.message);
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
        const items = await sp.web.lists.getByTitle(listTitle).items.select('Id', 'Title')();

        const suggestions: dataSuggest[] = await Promise.all(items.map(async (item: { Id: number; Title: string }) => {
            const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();

            const attachmentLinks = attachments.length > 0 
                ? attachments.map((attachment: IAttachment) => ({
                    FileName: attachment.FileName,
                    Url: attachment.ServerRelativeUrl
                }))
                : [];

            return {
                Title: item.Title,
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
        const ensureUserResult = await sp.web.ensureUser(email); //dùng ensureUser cho chắc k
        return ensureUserResult; 
    } catch (error) {
        console.error('Error getting or ensuring user by email:', error.message);
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

  private handleInputBlur(): void {
    if (this.state.selectedSuggestion) {
      this.editSuggest('Draft').catch(console.error);
    } else {
      this.addSuggest('Draft').catch(console.error);
    }
  }
  

  
  
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
                      <input 
                        type='text' 
                        id='description' 
                        defaultValue={this.state.selectedSuggestion?.Title || ''} 
                        onBlur={this.handleInputBlur.bind(this)} // Save on blur (focus out)
                      />
                    </td>
                  </tr>
                  <tr>
                    <td>Người dùng:</td>
                    <td>
                      <select
                        value={this.state.selectedUser}
                        onChange={(e) => this.setState({ selectedUser: e.target.value })}
                        onBlur={this.handleInputBlur.bind(this)} // Save on blur (focus out)
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
                      <input type="file" id="newfile" multiple onBlur={this.handleInputBlur.bind(this)} />
                    </td>
                  </tr>
                </tbody>
              </table>
              <button onClick={() => this.state.selectedSuggestion ? this.editSuggest() : this.addSuggest('Staff')} className={`${styles.btn} ${styles.btnAdd}`}>
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