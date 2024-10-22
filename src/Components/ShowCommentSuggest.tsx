import * as React from 'react';
import styles from './ShowCommentSuggest.module.scss';  // Import file CSS dưới dạng module

interface ShowCommentSuggestProps {
    user: { name: string; avatarUrl: string };
    comment: string;
    isLoading: boolean;
}

const ShowCommentSuggest: React.FC<ShowCommentSuggestProps> = ({ user, comment, isLoading }) => {
    return (
        <div className={styles.container}>
            {/* Hiển thị avatar và tên */}
            <div className={styles.header}>
                <img 
                    src={isLoading ? 'path_to_default_avatar.png' : user.avatarUrl} 
                    alt="avatar" 
                    className={styles.avatar} 
                />
                <span className={styles.userName}>
                    {isLoading ? 'Đang tải dữ liệu' : user.name}
                </span>
            </div>

            {/* Hiển thị comment */}
            <div className={styles.comment}>
                {isLoading ? 'Đang cập nhật' : comment}
            </div>
        </div>
    );
};

export default ShowCommentSuggest;
