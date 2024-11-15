import * as React from 'react';
import styles from './ShowCommentSuggest.module.scss';
import "@pnp/sp/webs";
import "@pnp/sp/site-users/web";
import { spfi, SPFx } from '@pnp/sp';
import { WebPartContext } from '@microsoft/sp-webpart-base';

interface ShowCommentSuggestProps {
    user: { name: string; avatarUrl?: string; loginName?: string }; // Hỗ trợ cả `avatarUrl` và `loginName`
    comment: string | JSX.Element;
    isLoading: boolean;
    context?: WebPartContext; // Đặt `context` là tùy chọn
}

interface ShowCommentSuggestState {
    avatarUrl: string;
}

export default class ShowCommentSuggest extends React.Component<ShowCommentSuggestProps, ShowCommentSuggestState> {
    constructor(props: ShowCommentSuggestProps) {
        super(props);
        this.state = {
            avatarUrl: props.user.avatarUrl || 'path_to_default_avatar.png' // Sử dụng avatarUrl nếu có, mặc định nếu không
        };
    }

    public async componentDidMount(): Promise<void> {
        const { user, context } = this.props;

        // Nếu đã có `avatarUrl`, không cần tải lại
        if (user.avatarUrl) {
            this.setState({ avatarUrl: user.avatarUrl });
            return;
        }

        // Nếu không có `avatarUrl`, sử dụng `loginName` để lấy avatar (nếu `context` được truyền vào)
        if (user.loginName && context) {
            const avatarUrl = await this.getUserAvatarUrl(user.loginName);
            this.setState({ avatarUrl });
        }
    }

    // Hàm lấy URL avatar dựa trên loginName của người dùng
    private async getUserAvatarUrl(loginName: string): Promise<string> {
        const { context } = this.props;

        if (!context) {
            return '/_layouts/15/images/PersonPlaceholder.96x96x32.png'; // Trả về avatar mặc định nếu không có context
        }

        try {
            const sp = spfi().using(SPFx(context));
            const user = await sp.web.siteUsers.getByLoginName(loginName)();

            // Nếu có email, sử dụng URL avatar SharePoint
            if (user.Email) {
                return `${context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=S&accountname=${encodeURIComponent(user.Email)}`;
            }

            // Nếu không có email, trả về URL avatar mặc định của SharePoint
            return '/_layouts/15/images/PersonPlaceholder.96x96x32.png';
        } catch (error) {
            console.error('Error fetching user avatar:', error);
            // Trả về URL avatar mặc định nếu có lỗi
            return '/_layouts/15/images/PersonPlaceholder.96x96x32.png';
        }
    }

    public render(): React.ReactElement<ShowCommentSuggestProps> {
        const { user, comment, isLoading } = this.props;
        const { avatarUrl } = this.state;

        return (
            <div className={styles.container}>
                {/* Hiển thị avatar và tên người dùng */}
                <div className={styles.header}>
                    <img
                        src={isLoading ? 'path_to_default_avatar.png' : avatarUrl}
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
    }
}
