import * as React from 'react';
import { IApproveProps, IAttachment, ICommentForApprove, DataSuggest } from './IApproveProps';
import styles from '../../suggest/components/Views/Suggestion.module.scss';
import ApproverView from './Views/AppoverView';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/attachments';
import '@pnp/sp/site-users/web';
import { FaSearch, FaEdit } from 'react-icons/fa';
import { spfi, SPFx } from '@pnp/sp';
import TableRender from '../../../Components/TableRender';

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
      filterStatus: 'Staff', // Default status filter
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
      // Determine the filter based on the selected status
      let statusFilter = '';
      if (filterStatus === 'waiting') {
        statusFilter = "Status eq 'Staff' or Status eq 'Approve'";
      } else if (filterStatus === 'rejected') {
        statusFilter = "Status eq 'Reject'";
      } else if (filterStatus === 'approved') {
        statusFilter = "Status eq 'Issue'";
      }

      console.log('Applying filter:', statusFilter); // Log the filter to debug

      // Fetch data from SharePoint list with the appropriate filter
      const items = await sp.web.lists.getByTitle(listTitle).items
        .select('Id', 'Title', 'Plan', 'DateTime', 'Emergency', 'ProcessName', 'Note', 'Status')
        .filter(statusFilter)
        .expand('AttachmentFiles')();

      const suggestions: DataSuggest[] = await Promise.all(
        items.map(async (item) => {
          // Fetch attachments for each suggestion item
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
            Status: item.Status as 'Draft' | 'Staff' | 'Approve' | 'Reject' | 'Issue',
          };
        })
      );

      this.setState({ suggestions }); // Update state with fetched suggestions
    } catch (error) {
      console.error('Error retrieving data:', error.message);
      alert('Error retrieving data: ' + error.message);
    }
  }

  // Call getSuggestForApprove when component mounts
  public async componentDidMount(): Promise<void> {
    await this.getSuggestForApprove();
  }

  // Open the approver view for a selected suggestion
  private openApproverView(suggestion: DataSuggest): void {
    this.setState({ selectedSuggestion: suggestion, showApproverView: true });
  }

  public render(): React.ReactElement<IApproveProps> {
    const headers: readonly ["Nội dung", "Dự án", "Ngày", "Độ ưu tiên", "Xem duyệt"] = [
      "Nội dung",
      "Dự án",
      "Ngày",
      "Độ ưu tiên",
      "Xem duyệt",
    ];

    // Map state suggestions to data format for TableRender
    const data = this.state.suggestions.map((suggestion) => ({
      'Nội dung': suggestion.Title,
      'Dự án': suggestion.Plan,
      'Ngày': suggestion.DateTime
    ? new Date(suggestion.DateTime).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '',
      'Độ ưu tiên': suggestion.Emergency,
      'Xem duyệt': (
        <FaEdit
          onClick={() => this.openApproverView(suggestion)} // Open approver view on click
          style={{ cursor: 'pointer' }}
        />
      ),
    }));

    return (
      <div className={styles.formContainer}>
        {!this.state.showApproverView && (
          <form className={styles.tableContainer}>
            <div className={styles.actionButtons}>
              <select
                onChange={async (e) => {
                  const filterStatus = e.target.value;
                  this.setState({ filterStatus });
                  try {
                    await this.getSuggestForApprove();
                  } catch (error) {
                    console.error('Error fetching suggestions:', error);
                  }
                }}
                value={this.state.filterStatus} 
              >
                <option value="waiting">Chờ duyệt</option>
                <option value="rejected">Không duyệt</option>
                <option value="approved">Đã duyệt</option>
              </select>

              <button
                type="button"
                onClick={this.getSuggestForApprove} // Trigger the API call on button click
                className={`${styles.btn} ${styles.btnEdit}`}
              >
                <FaSearch color="blue" />
              </button>
            </div>

            {/* Render Table */}
            <TableRender
              headers={headers}
              showSelectColumn={false}
              data={data}
              onRowSelectionChange={(selectedRows) => {
                // Handle row selection if needed
              }}
            />
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
