import * as React from 'react';
import { IApproveProps } from '../IApproveProps'; 
import styles from '../../../suggest/components/Views/Suggestion.module.scss';
import { FaSearch, FaCheckCircle, FaTimes, FaFilePdf, FaFileWord, FaFileAlt } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web'; 

interface IApproveState {
  suggestions: dataSuggest[];
  showPopup: boolean;
  popupReason: string;
  popupAction: 'approve' | 'reject' | undefined;
  currentIndex: number | undefined;
  error: string;
  description: string;
}

export interface dataSuggest {
  Title: string;
  Person: string;
  Status: string;
  Attachments?: { FileName: string; Url: string; }[];
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

export default class DemoApprove extends React.Component<IApproveProps, IApproveState> {
  constructor(props: IApproveProps) {
    super(props);
    this.state = {
      suggestions: [],
      showPopup: false,
      popupReason: '',
      popupAction: undefined,
      currentIndex: undefined,
      error: '',  
      description: '',
    };
    this.getApprove = this.getApprove.bind(this);
    this.postComment = this.postComment.bind(this);
  }

  handleClose = (): void => {
    this.setState({
      showPopup: false,
      popupReason: '',
      error: '',
    });
  };

  handleApprove = (index: number): void => {
    const selectedSuggestion = this.state.suggestions[index];
    this.setState({
      currentIndex: index,
      popupAction: 'approve',
      showPopup: true,
      description: selectedSuggestion.Title,
    });
  };

  handleReject = (index: number): void => {
    const selectedSuggestion = this.state.suggestions[index];
    this.setState({
      currentIndex: index,
      popupAction: 'reject',
      showPopup: true,
      description: selectedSuggestion.Title,
    });
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

  handlePopupChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    this.setState({ popupReason: event.target.value, error: '' });
  };

  private async getApprove(): Promise<void> {
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const currentUser = await sp.web.currentUser();
      const items = await sp.web.lists.getByTitle(listTitle).items
        .filter(`Status eq 'Staff'`)
        .select('Id', 'Title', 'Person/Id', 'Person/Title', 'Status')
        .expand('Person')();

      const suggestions: (dataSuggest | null)[] = await Promise.all(items.map(async (item: { Id: number, Title: string, Person?: { Title: string }, Status: string }) => {
        if (item.Person && item.Person.Title !== currentUser.Title) {
          return null;
        }

        const attachments = await sp.web.lists.getByTitle(listTitle).items
          .getById(item.Id)
          .attachmentFiles();

          const attachmentLinks = attachments.length > 0 
          ? attachments.map((attachment: IAttachment) => ({
              FileName: attachment.FileName,
              Url: attachment.ServerRelativeUrl, // Store both filename and URL
            })) 
          : [];

        return {
          Title: item.Title,
          Person: item.Person?.Title,
          Status: item.Status,
          Attachments: attachmentLinks,
        } as dataSuggest;
      }));

      const filteredSuggestions = suggestions.filter((s): s is dataSuggest => s !== null);
      this.setState({ suggestions: filteredSuggestions });
    } catch (error) {
      alert('Error retrieving data: ' + error.message);
    }
  }

  private async postComment(): Promise<void> {
    const descriptionElement = document.getElementById("description") as HTMLInputElement | null;
    const reasonPersonElement = document.getElementById("ReasonPerson") as HTMLInputElement | null;

    if (descriptionElement && reasonPersonElement) {
        const Description = descriptionElement.value;
        const ReasonPerson = reasonPersonElement.value;

        if (!this.props || !this.props.context) {
            alert('Context is not available.');
            return;
        }

        const listTitle = 'Suggest';
        const sp = spfi().using(SPFx(this.props.context));
        const { popupAction } = this.state;
        const status = popupAction === 'approve' ? 'Approve' : 'Deny';

        try {
            const items = await sp.web.lists.getByTitle(listTitle).items
                .filter(`Title eq '${Description}'`)
                .top(1)();

            if (items.length === 0) {
                throw new Error('No item found to update.');
            }
            const item = items[0];

            await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).update({
                ReasonPerson: ReasonPerson,
                Status: status,
            });

            alert(`Update successful: Status set to ${status}`);
            await this.getApprove();
        } catch (error) {
            alert('Update failed: ' + error.message);
        }
    } else {
        alert('Please fill in all fields.');
    }
}


  public render(): React.ReactElement<IApproveProps> {
    const { showPopup, popupReason, popupAction, error, description } = this.state;

    return (
      <div className={styles.formContainer}>
        <form className={styles.tableContainer}>
          <div className={styles.actionButtons}>
            <button type="button" onClick={this.getApprove} className={`${styles.btn} ${styles.btnEdit}`}>
              <FaSearch color="blue" /> Tra cứu 
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th style={{ width: '300px' }}>Nội dung deny</th>
                <th style={{ width: '200px' }}>Tài liệu</th>
                <th style={{ width: '180px' }}>Duyệt</th>
              </tr>
            </thead>
            <tbody>
              {this.state.suggestions.map((suggestion: dataSuggest, index: number) => (
                <tr key={index}>
                  <td>
                    <input type="text" value={suggestion.Title} readOnly />
                  </td>
                  <td>
                    {suggestion.Attachments?.map((file, fileIndex) => (
                      <div key={fileIndex} className={styles.fileItem}>
                        {this._renderFileIcon(file.FileName)}
                        <a href={file.Url} target="_blank" rel="noopener noreferrer">
                          {file.FileName}
                        </a>
                      </div>
                    )) || 'No attachments'}
                  </td>
                  <td>
                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className={styles.btnApprove}
                        onClick={() => this.handleApprove(index)}
                      >
                        <FaCheckCircle color="green" size={24} />
                      </button>
                      <button
                        type="button"
                        className={styles.btnReject}
                        onClick={() => this.handleReject(index)}
                      >
                        <FaTimes color="red" size={24} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>

        {showPopup && (
          <div className={styles.popupOverlay}>
            <div className={styles.popupContent}>
              <h2>{popupAction === 'approve' ? 'Lý do Duyệt' : 'Lý do Không Duyệt'}</h2>
              <div style={{ display: 'none' }}>
                <input
                  type='text'
                  id='description'
                  value={description}
                  onChange={(e) => this.setState({ description: e.target.value })}
                />
              </div>
              <textarea
                value={popupReason}
                onChange={this.handlePopupChange}
                placeholder="Nhập lý do... "
                id="ReasonPerson"
              />
              {error && <p className={styles.errorText}>{error}</p>}
              <div className={styles.buttonContainer}>
                <button type="button" className={`${styles.submitBtn} ${styles.popupButton}`} onClick={this.postComment}>
                  Xác nhận
                </button>
                <button className={`${styles.closeBtn} ${styles.popupButton}`} onClick={this.handleClose}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
