import * as React from 'react';
import { IApproveProps } from './IApproveProps';
import styles from '../../suggest/components/Views/Suggestion.module.scss';
import ApproverView from './Views/AppoverView';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import { FaSearch, FaEdit } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';

interface IApproveState {
  suggestions: DataSuggest[];
  showPopup: boolean;
  popupReason: string;
  popupAction: 'approve' | 'reject' | undefined;
  currentIndex: number | undefined;
  error: string;
  description: string;
  filterStatus: string;
  commentDataApprove: ICommentForApprove[];
  showApproverView: boolean;
  selectedSuggestion: DataSuggest | undefined;
}

interface IAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

interface ICommentForApprove {
  Id: number;
  Title: string;
  SuggestName: string;
  ProcessTitle: string;
  ProcessNumberOfApprover: string;
  ProcessApprover: { Title: string }[];
  isApprove: string;
  CommentApprover: string;
}

export interface DataSuggest {
  Status: string;
  Plan: string;
  DateTime: string;
  Emergency: string;
  Note: string;
  Id: number;
  Title: string;
  ProcessName: string;
  Attachments: { FileName: string; Url: string }[];
}

export default class Approve extends React.Component<IApproveProps, IApproveState> {
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
      filterStatus: 'Staff',
      commentDataApprove: [],
      showApproverView: false,
      selectedSuggestion: undefined,
    };
    this.getSuggestForApprove = this.getSuggestForApprove.bind(this);
  }

  handleClose = (): void => {
    this.setState({
      showPopup: false,
      popupReason: '',
      error: '',
    });
  };

  private async getSuggestForApprove(): Promise<void> {
    const { filterStatus } = this.state;
    const listTitle = 'Suggest';
    const sp = spfi().using(SPFx(this.props.context));

    try {
      // Lọc dữ liệu dựa trên trạng thái được chọn trong select
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'Plan', 'DateTime', 'Emergency', 'ProcessName', 'Note', 'Status')
        .filter(`Status eq '${filterStatus}'`)
        .expand('AttachmentFiles')();

      const suggestions: DataSuggest[] = await Promise.all(
        items.map(async (item) => {
          const attachments = await sp.web.lists.getByTitle(listTitle).items.getById(item.Id).attachmentFiles();
          const attachmentLinks = attachments.map((attachment: IAttachment) => ({
            FileName: attachment.FileName,
            Url: attachment.ServerRelativeUrl,
          }));

          return {
            Id: item.Id,
            Title: item.Title,
            Plan: item.Plan,
            DateTime: item.DateTime,
            Emergency: item.Emergency,
            Note: item.Note,
            ProcessName: item.ProcessName || '',
            Attachments: attachmentLinks || [],
            Status: item.Status as 'Draft' | 'Staff' | 'Approve' | 'Deny',
          };
        })
      );

      this.setState({ suggestions });
    } catch (error) {
      console.error('Error retrieving data:', error.message);
      alert('Error retrieving data: ' + error.message);
    }
  }

  public async componentDidMount(): Promise<void> {
    await this.getSuggestForApprove();
  }

  private openApproverView(suggestion: DataSuggest): void {
    this.setState({ selectedSuggestion: suggestion, showApproverView: true });
  }

  public render(): React.ReactElement<IApproveProps> {
    return (
      <div className={styles.formContainer}>
        {!this.state.showApproverView && (
          <form className={styles.tableContainer}>
            <div className={styles.actionButtons}>
              <select
                onChange={(e) => this.setState({ filterStatus: e.target.value }, this.getSuggestForApprove)}
                value={this.state.filterStatus}
              >
                <option value="Staff">Chờ duyệt</option>
                <option value="Approve">Đã duyệt</option>
                <option value="Deny">Không duyệt</option>
              </select>
              <button
                type="button"
                onClick={this.getSuggestForApprove}
                className={`${styles.btn} ${styles.btnEdit}`}
              >
                <FaSearch color="blue" />
              </button>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '200px', textAlign: 'left' }}>Nội dung</th>
                  <th style={{ width: '200px', textAlign: 'left' }}>Dự án</th>
                  <th style={{ width: '200px', textAlign: 'left' }}>Ngày</th>
                  <th style={{ width: '200px', textAlign: 'left' }}>Độ ưu tiên</th>
                  <th style={{ width: '150px', textAlign: 'left' }}>Xem duyệt</th>
                </tr>
              </thead>
              <tbody>
                {this.state.suggestions.length > 0 ? (
                  this.state.suggestions.map((suggestion: DataSuggest, index: number) => (
                    <tr key={index}>
                      <td>
                        <input type="text" value={suggestion.Title} readOnly />
                      </td>
                      <td>
                        <input type="text" value={suggestion.Plan} readOnly />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={
                            suggestion.DateTime
                              ? new Date(suggestion.DateTime).toISOString().slice(0, 16)
                              : ''
                          }
                          readOnly
                        />
                      </td>
                      <td>
                        <input type="text" value={suggestion.Emergency} readOnly />
                      </td>
                      <td>
                        <FaEdit
                          onClick={() => this.openApproverView(suggestion)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </form>
        )}
        {this.state.showApproverView && this.state.selectedSuggestion && (
          <ApproverView
            suggestionToEdit={this.state.selectedSuggestion}
            onClose={() => this.setState({ showApproverView: false })}
            context={this.props.context}
          />
        )}
      </div>
    );
  }
}
