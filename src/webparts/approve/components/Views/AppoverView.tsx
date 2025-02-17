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
  Status: string;
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

interface IComment {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string; avatarUrl?: string }[];
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

  private async checkNumberOfApprover(): Promise<boolean> {
    const { commentDataApprove } = this.state;
    const { suggestionToEdit } = this.props;
    const sp = spfi().using(SPFx(this.props.context));
    const currentUser = await sp.web.currentUser();
    const currentUserTitle = currentUser.Title;

    if (!commentDataApprove || !suggestionToEdit) return false;

    // Lọc các comment liên quan đến suggestion hiện tại
    const currentSuggestionComments = commentDataApprove.filter(
      comment => comment.Title === suggestionToEdit.Id.toString()
    );

    // Tìm comment của user hiện tại
    const currentUserComment = currentSuggestionComments.find(
      comment => comment.ProcessApprover.some(approver => approver.Title === currentUserTitle)
    );

    if (!currentUserComment) return false;

    const currentUserLevel = currentUserComment.ProcessNumberOfApprover;

    // **Kiểm tra nếu có bất kỳ cấp nào trước đã chọn "Reject"**
    const previousLevels = currentSuggestionComments.filter(
      comment => parseInt(comment.ProcessNumberOfApprover, 10) < parseInt(currentUserLevel, 10) // Các cấp thấp hơn
    );

    const hasRejection = previousLevels.some(comment => comment.isApprove === 'Reject');

    if (hasRejection) {
      alert('Không thể duyệt vì đã có cấp trước chọn "Không duyệt".');
      return false;
    }

    // **Kiểm tra nếu là cấp tham mưu (có "tham mưu" trong tên cấp)**
    if (currentUserLevel.toLowerCase().includes('tham mưu')) {
      return true; // Tham mưu luôn được phép duyệt
    }

    // **Kiểm tra các cấp tham mưu đã duyệt hết chưa**
    const allConsultantComments = currentSuggestionComments.filter(
      comment => comment.ProcessNumberOfApprover.toLowerCase().includes('tham mưu')
    );

    const allConsultantsApproved = allConsultantComments.every(
      comment => comment.isApprove === 'Approve'
    );

    if (!allConsultantsApproved) {
      alert('Vui lòng chờ tất cả cấp tham mưu duyệt trước khi tiếp tục.');
      return false;
    }

    return true;
  }

  private handleApproveClick = async (): Promise<void> => {
    const canApprove = await this.checkNumberOfApprover();
    if (canApprove) {
      this.setState({
        showPopup: true,
        popupTitle: 'Nhập lý do duyệt',
        approveStatus: 'Approve',
      });
    }
  };

  private handleRejectClick = async (): Promise<void> => {
    const canApprove = await this.checkNumberOfApprover();
    if (canApprove) {
      this.setState({
        showPopup: true,
        popupTitle: 'Nhập lý do không duyệt',
        approveStatus: 'Reject',
      });
    }
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
        const commentDataApprove = commentItems.map(item => {
          // Kiểm tra xem ProcessApprover có phải là mảng hợp lệ không
          const processApprover = Array.isArray(item.ProcessApprover) ? item.ProcessApprover : [];

          return {
            Id: item.Id,
            Title: item.Title,
            SuggestName: item.SuggestName,
            ProcessTitle: item.ProcessTitle,
            ProcessNumberOfApprover: item.ProcessNumberOfApprover,
            // Chỉ map ProcessApprover nếu là mảng hợp lệ
            ProcessApprover: processApprover.map((approver: { Title: string }) => ({ Title: approver.Title })),
            isApprove: item.isApprove,
            CommentApprover: item.CommentApprover
          };
        });

        // Cập nhật state với dữ liệu đã lấy được
        this.setState({ commentDataApprove });
      } else {
        console.log("No comments found in the Comment list.");
      }
    } catch (error) {
      console.error("Error details:", error.message);
    }
  }

  private addCommentOfApprover = async (): Promise<void> => {
    const { commentReason, commentDataApprove, approveStatus } = this.state;
    const { suggestionToEdit, context } = this.props;

    if (!suggestionToEdit || !commentDataApprove || commentDataApprove.length === 0) {
      alert("Error: Suggestion or Comment data is missing.");
      return;
    }

    try {
      const sp = spfi().using(SPFx(context));
      const currentUser = await sp.web.currentUser();
      const currentUserTitle = currentUser.Title;

      console.log("📌 commentDataApprove:", commentDataApprove);
      console.log("📌 suggestionToEdit.Id:", suggestionToEdit.Id);

      // Tìm comment có liên quan
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

      // Cập nhật comment với thông tin của người duyệt
      await sp.web.lists.getByTitle('Comment').items.getById(matchingComment.Id).update({
        CommentApprover: commentReason,
        isApprove: approveStatus,
      });

      // Lấy toàn bộ comment cho Suggestion hiện tại
      const allCommentsForSuggestion = commentDataApprove
        .filter(comment => comment.Title === suggestionToEdit.Id.toString());

      // Kiểm tra trạng thái của tất cả các Approver
      const hasReject = allCommentsForSuggestion.some(comment => comment.isApprove?.toLowerCase() === 'reject');
      const allApproved = allCommentsForSuggestion.every(comment => comment.isApprove?.toLowerCase() === 'approve');

      if (allApproved) {//đảo ngược cái biến cho code chạy đúng, lý do thì sao chưa biết
        await this.addSuggestStatus('Reject');
      } else if (hasReject) {
        await this.addSuggestStatus('Issue');
      } else if (approveStatus === 'Approve') {
        await this.addSuggestStatus('Approve');
      }

      // Cập nhật dữ liệu sau khi thay đổi
      await this.getCommentForApprove();
      await this.loadCommentAvatars();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error adding comment:', errorMessage);
      alert('Failed to add comment: ' + errorMessage);
    } finally {
      this.handlePopupClose();
    }
  };

  private addSuggestStatus = async (status: 'Approve' | 'Reject' | 'Issue'): Promise<void> => {
    const { suggestionToEdit, context } = this.props;

    if (!suggestionToEdit) {
      alert("Error: Suggestion is missing.");
      return;
    }

    try {
      const sp = spfi().using(SPFx(context));

      // Cập nhật giá trị Status trong list Suggest
      await sp.web.lists.getByTitle('Suggest').items.getById(suggestionToEdit.Id).update({
        Status: status,
      });

      console.log(`Status of suggestion with Id ${suggestionToEdit.Id} updated to ${status}.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error updating suggestion status:', errorMessage);
      alert('Failed to update suggestion status: ' + errorMessage);
    }
  };


  // lấy dữ liệu avatar
  private async getUserAvatarUrl(userTitle: string): Promise<string> {
    try {
      const sp = spfi().using(SPFx(this.props.context));
      const user = await sp.web.siteUsers.getByLoginName(userTitle)();

      // Nếu có email, sử dụng URL avatar SharePoint
      if (user.Email) {
        return `/_layouts/15/userphoto.aspx?size=S&accountname=${encodeURIComponent(user.Email)}`;
      }

      // Nếu không có email, trả về URL avatar mặc định của SharePoint
      return '/_layouts/15/images/PersonPlaceholder.96x96x32.png';
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      // Trả về URL avatar mặc định nếu có lỗi
      return '/_layouts/15/images/PersonPlaceholder.96x96x32.png';
    }
  }

  // Hàm load avatar vào dữ liệu comment
  private async loadCommentAvatars(): Promise<void> {
    const { commentDataApprove } = this.state;

    if (!commentDataApprove) return;

    const updatedComments = await Promise.all(
      commentDataApprove.map(async (comment) => {
        const approversWithAvatars = await Promise.all(
          comment.ProcessApprover.map(async (approver) => {
            const avatarUrl = await this.getUserAvatarUrl(approver.Title);
            return {
              ...approver,
              avatarUrl,
            };
          })
        );
        return {
          ...comment,
          ProcessApprover: approversWithAvatars,
        };
      })
    );
    this.setState({ commentDataApprove: updatedComments });
  }

  componentDidUpdate(prevProps: IApproverViewProps): void {
    if (prevProps.suggestionToEdit?.Id !== this.props.suggestionToEdit?.Id) {
      this.setState({
        itemId: this.props.suggestionToEdit?.Id,
        Status: this.props.suggestionToEdit?.Status || '',
      });
    }
  }

  private stripHtmlTags(html: string): string {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  }


  public async componentDidMount(): Promise<void> {
    await this.getCommentForApprove();
    await this.loadCommentAvatars();

    if (this.props.suggestionToEdit) {
      this.setState({ itemId: this.props.suggestionToEdit.Id });
    }
  }

  // Thêm hàm xử lý hủy duyệt
  private handleCancelApprove = (): void => {
    const { commentDataApprove } = this.state;
    const { suggestionToEdit } = this.props;
    const currentUser = this.props.context.pageContext.user.displayName;

    // Tìm comment hiện tại của user
    const currentComment = commentDataApprove?.find(
      comment =>
        comment.Title === suggestionToEdit?.Id.toString() &&
        comment.ProcessApprover.some(approver => approver.Title === currentUser)
    );

    // Đổi status ngược lại
    const newStatus = currentComment?.isApprove === 'Approve' ? 'Reject' : 'Approve';

    this.setState({
      showPopup: true,
      popupTitle: 'Nhập lý do thay đổi',
      approveStatus: newStatus, // Set status mới ngược với status hiện tại
    });
  };

  public render(): React.ReactElement<IApproverViewProps> {
    console.log("📝 Comment Data Approve:", this.state.commentDataApprove);

    return (
      <div>

        {this.state.itemId !== undefined && (
          <StatusBar context={this.props.context} itemId={this.state.itemId} />
        )}

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
                      value={this.stripHtmlTags(this.state.note)}
                      readOnly
                      className={styles.textArea}
                    />
                  </label>
                </div>
              </div>
              <div className={styles.commentContainer}>
                {Array.isArray(this.state.commentDataApprove) && this.state.commentDataApprove.length > 0 ? (
                  this.state.commentDataApprove
                    .filter(comment => comment.Title === this.props.suggestionToEdit?.Id.toString())
                    .map((comment, commentIndex) => (
                      <div key={commentIndex}>
                        {Array.isArray(comment.ProcessApprover) && comment.ProcessApprover.length > 0 ? (
                          comment.ProcessApprover.map((approver, approverIndex) => {
                            const isCurrentUser = approver.Title === this.props.context.pageContext.user.displayName;

                            console.log(comment); // Kiểm tra dữ liệu comment
                            console.log(comment.ProcessApprover); // Kiểm tra ProcessApprover

                            return (
                              <ShowCommentSuggest
                                key={`${commentIndex}-${approverIndex}`}
                                user={{
                                  name: `${approver.Title} (${comment.ProcessNumberOfApprover})`,
                                  avatarUrl: approver.avatarUrl || 'path_to_default_avatar.png',
                                }}
                                comment={
                                  <>
                                    {comment.CommentApprover ? (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        <div>
                                          {comment.CommentApprover}
                                          <span>
                                            {comment.isApprove === 'Approve' ? ' ✔️' : comment.isApprove === 'Reject' ? ' ❌' : ''}
                                          </span>
                                        </div>
                                        {isCurrentUser && comment.isApprove && (
                                          <button
                                            onClick={this.handleCancelApprove}
                                            style={{
                                              padding: '5px 10px',
                                              backgroundColor: '#ff9800',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              width: 'fit-content',
                                            }}
                                          >
                                            {comment.isApprove === 'Approve' ? 'Chuyển sang không duyệt' : 'Chuyển sang duyệt'}
                                          </button>
                                        )}
                                      </div>
                                    ) : isCurrentUser ? (
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                          onClick={() => this.handleApproveClick()}
                                          style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Duyệt
                                        </button>
                                        <button
                                          onClick={() => this.handleRejectClick()}
                                          style={{
                                            padding: '5px 10px',
                                            backgroundColor: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Không duyệt
                                        </button>
                                      </div>
                                    ) : (
                                      'Đang chờ'
                                    )}
                                  </>
                                }
                                isLoading={false}
                              />
                            );
                          })
                        ) : (
                          <div>Không có người phê duyệt.</div> // Hiển thị khi không có ProcessApprover
                        )}
                      </div>
                    ))
                ) : (
                  <div>Không có bình luận nào.</div> // Hiển thị khi không có commentDataApprove
                )}
              </div>
            </div>
          )}

          {this.state.activeTab === 'related' &&
            <div>
              {this.state.commentDataApprove
                ?.filter(comment => comment.Title === this.props.suggestionToEdit?.Id.toString())
                .map((comment, commentIndex) => (
                  <div key={commentIndex}>
                    {comment.ProcessApprover.map((approver, approverIndex) => (
                      <ShowCommentSuggest
                        key={`${commentIndex}-${approverIndex}`}
                        user={{
                          name: `${approver.Title} (Level: ${comment.ProcessNumberOfApprover})`,
                          avatarUrl: approver.avatarUrl || 'path_to_default_avatar.png'
                        }}
                        comment={
                          <>
                            {comment.CommentApprover || 'Đang chờ duyệt'}
                            <span>
                              {comment.isApprove === 'Approve' ? ' ✔️' : comment.isApprove === 'Reject' ? ' ❌' : ''}
                            </span>
                          </>
                        }
                        isLoading={false}
                      />
                    ))}
                  </div>
                ))
              }
            </div>
          }

          {this.state.activeTab === 'flow' && <div><h3>Tab Lưu đồ</h3></div>}

          <div className={styles.footer}>
            <button onClick={this.props.onClose} className={`${styles.btn} ${styles.btnClose}`}>Đóng</button>
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
            <div className={styles.btnContainer}>
              <button
                onClick={this.addCommentOfApprover}
                className={`${styles.btn} ${styles.btnAdd}`}
              >
                Xác nhận
              </button>
              <button
                onClick={this.handlePopupClose}
                className={`${styles.btn} ${styles.btnClose}`}
              >
                Đóng
              </button>
            </div>
          </Popup>
        )}
      </div>
    );
  }
}
