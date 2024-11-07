import * as React from 'react';
import styles from '../../../suggest/components/Views/SuggestionAdd.module.scss';
import StatusBar from '../../../suggest/components/Views/StatusBar';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFx } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import { FaFileAlt, FaFileWord, FaFilePdf, FaDownload } from 'react-icons/fa';
import Popup from '../../../../Components/Popup';
import ShowCommentSuggest from '../../../../Components/ShowCommentSuggest';

interface IApproverViewProps {
  onClose: () => void;
  context: WebPartContext;
  suggestionToEdit?: DataSuggest;
}

interface IApproverViewState {
  activeTab: 'content' | 'related' | 'flow';
  description: string;
  plan: string;
  dateTime: string;
  emergency: string;
  note: string;
  processName: string;
  files: { FileName: string; Url: string }[];
  plans: { title: string; planName: string; planNote: string }[];
  emergencies: { title: string; EmergencyName: string; EmergencyNote: string }[];
  processes: { ProcessCode: string; ProcessName: string; NumberApporver: string; ProcessType: string }[];
  Status: 'Draft' | 'Staff';
  commentDataApprove?: IComment[];
  itemId?: number;
  showPopup: boolean;
  popupTitle: string;
  commentReason: string;
  approveStatus: string;
}

export interface DataSuggest {
  Id: number;
  Title: string;
  Plan: string;
  DateTime: string;
  Emergency: string;
  Note: string;
  ProcessName: string;
  Attachments: { FileName: string; Url: string }[];
  Status: string;
}

interface IComment{
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
  isApprove: string;
  CommentApprover: string;
}


export default class ApproverView extends React.Component<IApproverViewProps, IApproverViewState> {
  constructor(props: IApproverViewProps) {
    super(props);
    this.state = {
      activeTab: 'content',
      description: props.suggestionToEdit?.Title || '',
      plan: props.suggestionToEdit?.Plan || '',
      emergency: props.suggestionToEdit?.Emergency || '',
      dateTime: props.suggestionToEdit?.DateTime || '',
      note: props.suggestionToEdit?.Note || '',
      processName: props.suggestionToEdit?.ProcessName || '',
      files: props.suggestionToEdit?.Attachments || [],
      plans: [],
      emergencies: [],
      processes: [],
      Status: (props.suggestionToEdit?.Status as 'Draft' | 'Staff') || 'Draft',
      commentDataApprove: [],
      showPopup: false,
      popupTitle: '',
      commentReason: '',
      approveStatus: '',
    };
  }

  private handleDownload = (url: string, fileName: string): void => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  private _renderFileIcon = (fileName: string): JSX.Element => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {(() => {
          switch (extension) {
            case 'pdf':
              return <FaFilePdf color="red" />;
            case 'doc':
            case 'docx':
              return <FaFileWord color="blue" />;
            default:
              return <FaFileAlt />;
          }
        })()}
        <span style={{
          marginRight: '10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'Times New Roman, serif',
          fontSize: '10px'
        }}>
          {fileName.length > 10 ? `${fileName.slice(0, 20)}...` : fileName}
        </span>
      </div>
    );
  };

  private handleApproveClick = (): void => {
    this.setState({
      showPopup: true,
      popupTitle: 'Nhập lý do duyệt',
      approveStatus: 'Approve', 
    });
  };

  private handleRejectClick = (): void => {
    this.setState({
      showPopup: true,
      popupTitle: 'Nhập lý do không duyệt',
      approveStatus: 'Reject', 
    });
  };

  private handlePopupClose = (): void => {
    this.setState({ showPopup: false });
  };

  public async getCommentForApprove(): Promise<void> {
    const sp = spfi().using(SPFx(this.props.context));

    try {
      const commentItems = await sp.web.lists.getByTitle('Comment').items
        .select(
          'Id',
          'Title',
          'SuggestName',
          'ProcessTitle',
          'ProcessNumberOfApprover',
          'ProcessApprover/Title',
          'isApprove',
          'CommentApprover'
        )
        .expand('ProcessApprover')();

      if (commentItems.length > 0) {
        const commentDataApprove = commentItems.map(item => ({
          Id: item.Id,
          Title: item.Title,
          SuggestName: item.SuggestName,
          ProcessTitle: item.ProcessTitle,
          ProcessNumberOfApprover: item.ProcessNumberOfApprover,
          ProcessApprover: item.ProcessApprover.map((approver: { Title: string }) => ({ Title: approver.Title })), // Map to array of approver titles
          isApprove: item.isApprove,
          CommentApprover: item.CommentApprover
        }));

        // Update the state with the fetched process details
        this.setState({ commentDataApprove });
      } else {
        console.log("No comments found in the Comment list.");
      }
    } catch (error) {
      console.error("Error details:", error.message);
    }
  }


  private addCommentOfApprover = async (): Promise<void> => {
    const { commentReason, commentDataApprove, approveStatus  } = this.state;
    const { suggestionToEdit, context } = this.props;

    if (!suggestionToEdit || !commentDataApprove || commentDataApprove.length === 0) {
      alert("Error: Suggestion or Comment data is missing.");
      return;
    }

    try {
      const sp = spfi().using(SPFx(context));
      const currentUser = await sp.web.currentUser();
      const currentUserTitle = currentUser.Title;

      const matchingComment = commentDataApprove.find(
        (comment) =>
          comment.Title === suggestionToEdit.Id.toString() &&
          comment.ProcessApprover.some((approver) => approver.Title === currentUserTitle)
      );

      if (!matchingComment) {
        console.warn("No matching comment found for the current user.");
        alert("No matching comment found for the current user.");
        return;
      }

      // Use approveStatus to set isApprove in the update
      await sp.web.lists.getByTitle('Comment').items.getById(matchingComment.Id).update({
        CommentApprover: commentReason,
        isApprove: approveStatus, 
      });

      alert('Comment added successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error adding comment:', errorMessage);
      alert('Failed to add comment: ' + errorMessage);
    } finally {
      this.handlePopupClose();
    }
  };

  

  

  public async componentDidMount(): Promise<void> {
    await this.getCommentForApprove();
  }

  
  public render(): React.ReactElement<IApproverViewProps> {
    return (
      <div>
        {/* {this.state.itemId !== undefined && (
          <StatusBar context={this.props.context} itemId={this.state.itemId} />
        )} */}

        <StatusBar context={this.props.context} itemId={this.state.itemId || 0} />


        <div className={styles.body}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'content' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'content' })}
            >
              NỘI DUNG
            </button>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'related' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'related' })}
            >
              LIÊN QUAN
            </button>
            <button
              className={`${styles.tab} ${this.state.activeTab === 'flow' ? styles.activeTab : ''}`}
              onClick={() => this.setState({ activeTab: 'flow' })}
            >
              LƯU ĐỒ
            </button>
          </div>

          {this.state.activeTab === 'content' && (
            <div className={styles.content}>
              <div className={styles.formGroup}>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Nội dung:
                    <input
                      type="text"
                      name="description"
                      value={this.state.description}
                      readOnly
                    />
                  </label>
                  <label className={styles.label}>
                    Kế hoạch:
                    <input
                      type="text"
                      name="plan"
                      value={this.state.plan}
                      readOnly
                    />
                  </label>
                  <label className={styles.label}>
                    Ngày:
                    <input
                      type="datetime-local"
                      name="dateTime"
                      value={this.state.dateTime ? new Date(this.state.dateTime).toISOString().slice(0, 16) : ''}
                      readOnly
                      className={styles.date}
                    />
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Độ ưu tiên:
                    <input
                      type="text"
                      name="emergency"
                      value={this.state.emergency}
                      readOnly
                      className={styles.select}
                    />
                  </label>

                  <label className={styles.label}>
                    Tên quy trình:
                    <input
                      type="text"
                      value={this.state.processName || "Không có quy trình"}
                      readOnly
                      style={{ width: 'auto' }}
                    />
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>
                    File:
                    <div className={styles.fileContainer}>
                      {this.state.files.map((file, index) => (
                        <div key={index} className={styles.attachmentItem}>
                          <div className={styles.attachmentIcon}>
                            {this._renderFileIcon(file.FileName)}
                          </div>
                          <div className={styles.attachmentLink}>
                            <a href={file.Url} target="_blank" rel="noopener noreferrer">
                              {file.FileName.length > 10 ? `${file.FileName.slice(0, 20)}...` : file.FileName}
                            </a>
                            <FaDownload onClick={() => this.handleDownload(file.Url, file.FileName)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </label>
                </div>
                <div className={styles.row}>
                  <label className={styles.label}>
                    Trích yếu:
                    <textarea
                      name="note"
                      value={this.state.note}
                      readOnly
                      className={styles.textArea}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.commentContainer}>
                {this.state.Status === 'Staff' && (
                  <ShowCommentSuggest
                    user={{ name: 'User Name', avatarUrl: 'path_to_avatar.png' }}
                    comment="Đây là comment mẫu"
                    isLoading={false}
                  />
                )}
              </div>
            </div>
          )}

          {this.state.activeTab === 'related' && <div><h3>Tab Liên quan</h3></div>}
          {this.state.activeTab === 'flow' && <div><h3>Tab Lưu đồ</h3></div>}

          <div className={styles.footer}>
            <button onClick={this.props.onClose}>Đóng</button>
            <button onClick={this.handleApproveClick}>Duyệt</button>
            <button onClick={this.handleRejectClick}>Không Duyệt</button>
          </div>
        </div>

        {this.state.showPopup && (
          <Popup show={this.state.showPopup} onClose={this.handlePopupClose}>
            <h3>{this.state.popupTitle}</h3>
            <textarea
              placeholder="Nhập lý do..."
              className={styles.textArea}
              value={this.state.commentReason}
              onChange={(e) => this.setState({ commentReason: e.target.value })}
            />
            <button onClick={this.addCommentOfApprover}>Xác nhận</button>
            <button onClick={this.handlePopupClose}>Đóng</button>
          </Popup>
        )}
      </div>
    );
  }
}
