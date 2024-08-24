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
  filterStatus: string;
}

export interface dataSuggest {
  Title: string;
  Person: string;
  Status: string;
  Attachments?: { FileName: string; Url: string; }[];
  ReasonPerson?: string;
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
      filterStatus: 'Staff',  // Default to "Chờ duyệt"
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
    const { filterStatus } = this.state;
  
    try {
      const currentUser = await sp.web.currentUser();
      const items = await sp.web.lists.getByTitle(listTitle).items
        .filter(`Status eq '${filterStatus}'`)
        .select('Id', 'Title', 'Person/Id', 'Person/Title', 'Status', 'ReasonPerson')  // Include ReasonPerson
        .expand('Person')();
  
      const suggestions: (dataSuggest | null)[] = await Promise.all(items.map(async (item: { Id: number, Title: string, Person?: { Title: string }, Status: string, ReasonPerson?: string }) => {
        if (item.Person && item.Person.Title !== currentUser.Title) {
          return null;
        }
  
        const attachments = await sp.web.lists.getByTitle(listTitle).items
          .getById(item.Id)
          .attachmentFiles();
  
        const attachmentLinks = attachments.length > 0 
          ? attachments.map((attachment: IAttachment) => ({
              FileName: attachment.FileName,
              Url: attachment.ServerRelativeUrl,
            })) 
          : [];
  
        return {
          Title: item.Title,
          Person: item.Person?.Title,
          Status: item.Status,
          Attachments: attachmentLinks,
          ReasonPerson: item.ReasonPerson  // Assign ReasonPerson
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
            this.handleClose(); //Đóng popup
        } catch (error) {
            alert('Update failed: ' + error.message);
        }
    } else {
        alert('Please fill in all fields.');
    }
}

public render(): React.ReactElement<IApproveProps> {
  const { showPopup, popupReason, popupAction, error, description, filterStatus } = this.state;

  return (
    <div className={styles.formContainer}>
      <form className={styles.tableContainer}>
        <div className={styles.actionButtons}>
          <select
            onChange={(e) => this.setState({ filterStatus: e.target.value })}
          >
            <option value="Staff">Chờ duyệt</option>
            <option value="Approve">Đã duyệt</option>
            <option value="Deny">Trả lại</option>
          </select>
          <button type="button" onClick={this.getApprove} className={`${styles.btn} ${styles.btnEdit}`}>
            <FaSearch color="blue" /> Tra cứu 
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: '200px' }}>Nội dung</th>
              <th style={{ width: '200px' }}>Tài liệu</th>
              {filterStatus === 'Staff' && (
                <th style={{ width: '180px' }}>Duyệt</th>
              )}
              {(filterStatus === 'Approve' || filterStatus === 'Deny') && (
                <>
                  <th style={{ width: '180px' }}>Người duyệt</th>
                  <th style={{ width: '200px' }}>Lý do</th>
                </>
              )}
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
                {filterStatus === 'Staff' && (
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
                )}
                {(filterStatus === 'Approve' || filterStatus === 'Deny') && (
                  <>
                    <td>{suggestion.Person}</td>
                    <td>{suggestion.ReasonPerson || 'Không có lý do'}</td>
                  </>
                )}
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
