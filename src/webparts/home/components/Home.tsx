import * as React from 'react';
import styles from './Home.module.scss';
import type { IHomeProps } from './IHomeProps';
import { escape } from '@microsoft/sp-lodash-subset';
import ApprovalHome from '../../approve/components/Views/ApprovalHome'
import { IFormData } from '../../suggest/components/ISuggestProps'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';


interface IHomeState {
  formDataList: IFormData[];
}


export default class Home extends React.Component<IHomeProps, IHomeState> {
  constructor(props: IHomeProps) {
    super(props);
    this.state = {
      formDataList: [
        {
          description: 'Đơn duyệt',
          Plan: 'E-Office',
          Date: '31/07/2024 10:00',
          Emergency: 'Hơi gấp',
          File: [
            { name: 'document1.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
            { name: 'document2.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Cần chữa lành',
          ProcessName: '',
          StatusSuggestion: '',
        },
        {
          description: 'Đơn thử nghiệm',
          Plan: 'Sharepoint',
          Date: '31/07/2024 11:21',
          Emergency: 'Gấp',
          File: [
            { name: 'document3.pdf', url: 'https://www.pdf995.com/samples/pdf.pdf' },
            { name: 'document4.docx', url: 'https://file-examples.com/wp-content/uploads/2017/02/file_example_DOC_10.docx' }
          ],
          NoteSuggest: 'Chữa rách vết thương đã lành',
          ProcessName: '',
          StatusSuggestion: '',
        },
      ],
    };
  }

  public render(): React.ReactElement<IHomeProps> {
    const {
      hasTeamsContext,
      userDisplayName
    } = this.props;

    return (
      <section className={`${styles.home} ${hasTeamsContext ? styles.teams : ''}`}>
        <div className={styles.welcome}>
          <h2>Xin chào, {escape(userDisplayName)}!</h2>
          <h2>Công việc cần thực hiện</h2>

          <div className={styles.container}>
  <div className={styles.headerContainer}>
    <h3 className={styles.documentHeader}>
      Các đề xuất cần duyệt
    </h3>
    <FontAwesomeIcon icon={faArrowRight} className={styles.processIcon} />
  </div>
  <div className={styles.approvalHomeContainer}>
    <ApprovalHome formDataList={this.state.formDataList} />
  </div>
</div>
          <div className={styles.container}>
            <div className={styles.headerContainer}>
            <h3 className={styles.documentHeader}>Các văn bản cần lưu trữ</h3>
            <p className={styles.approvalHomeContainer}>Không có dữ liệu</p>
            </div>
          </div>
        </div>
        
      </section>
    );
  }
}
