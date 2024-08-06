import * as React from 'react';
import styles from './SuggestionViewApprove.module.scss';
import type { Comment } from '../ISuggestProps';


interface ISuggestionAddViewApproveProps {
  comments: Comment[];
}

const SuggestionAddViewApprove: React.FC<ISuggestionAddViewApproveProps> = ({ comments }) => {
  return (
    <div className={styles.commentList}>
      {comments.map((comment) => (
        <div key={comment.id} className={styles.comment}>
          <img src={comment.avatarUrl} className={styles.avatar} />
          <div className={styles.commentContent}>
            <div className={styles.displayName}>{comment.displayName}</div>
            <div className={styles.content}>{comment.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionAddViewApprove;
