import { Resource } from "i18next";

const resources = {
    en: {
        translation: {
            'Start': 'Start',
            'Privacy_Policy': 'Privacy Policy',
            'Terms_of_Use': 'Terms of Use',

            'Getting_Access_Token': 'Getting Access Token ...',
            'Getting_Access_Token_Error': 'Failed to get Access Token.',

            'Setting': 'Setting',
            'Next': 'Next',
            'Back': 'Back',
            'Save': 'Save',
            'Close': 'Close',
            'Filter': 'Filter',
            'Keyword': 'Keyword',
            'New': 'New',

            'Property': 'Property',
            'No_Target': 'No Target',

            'Msg_Select_Database': 'Select a database. (There are the databases which have relation property)',
            'Msg_Select_Database_Sup': 'You nedd to auth both of relative databases',
            'Msg_Auth_Database': 'Authorize the Notion',
            'Msg_Select_Relation': 'Select relations.',
            'Msg_Select_UsingProperties': 'Select using properties.  (multi-select or select properies -> filter feature, url properties -> link to the url by context menu.)',
            'Msg_Load_LatestData': 'Get the latest datas.',

            'Style_Setting': 'Style setting',

            'Msg_Select_StyleTarget': 'Select a item you want to change the style.',
            'Msg_Select_Style': 'Select the node style.',

            'Get_Data': 'Get latest data',
            'Loading': '{{name}} loading...',
            'ReLayout': 'Re layout',

            'Open_Notion': 'Open in Notion',
            'Create_Page': 'New {{name}}',
            'Create_Relation': 'Create a relation',
            'Remove_Relation': 'delete the relation',

            'Guide': 'Guide',

            'Guide_NodeClick': 'Right-click or long-tap on a node to open the node\'s menu. ',
            'Guide_CoreClick': 'Right-click or long-tap on empty area to open the creating page menu.',
            'Guide_EdgeClick': 'Right-click or long-tap on a edge to open the edge\'s menu.',

            'Guide_CreateRelation': 'Select the target node to relate.',

            'Error_GetData': 'Failed to get the datas. Please confirm your databases whether exist and authorized.',
            'Error_GetDbList': 'Failed to get your database info.  Please retry after waiting for a while.',
            'Error_CreatePage': 'Failed to create the page. Please confirm your databases whether exist and authorized.',
            'Error_CreateRelation': 'Failed to create the relation. Please confirm your databases whether exist and authorized.',
            'Error_RemoveRelation': 'Failed to remove the relation. Please confirm your databases whether exist and authorized.',

            'Warn_UrlNotExist': 'The page don\'t have the URL.',
        }
    },
    ja: {
        translation: {
            'Start': '始める',
            'Privacy_Policy': 'プライバシーポリシー',
            'Terms_of_Use': '利用規約',

            'Getting_Access_Token': 'アクセストークン取得中・・・',
            'Getting_Access_Token_Error': 'アクセストークンの取得に失敗しました。',

            'Setting': '設定',
            'Next': '次へ',
            'Back': '戻る',
            'Save': '保存',
            'Close': '閉じる',
            'Filter': '絞り込み',
            'Keyword': 'キーワード',
            'New': '新規作成',

            'Property': '項目',
            'No_Target': '選択可能項目なし',

            'Msg_Select_Database': 'データーベースを選択してください。（一覧には連携項目のあるデータベースが表示されています）',
            'Msg_Select_Database_Sup': '連携しているデータベース両方に対して権限を付与してください',
            'Msg_Auth_Database': 'Notionの認証を行う',
            'Msg_Select_Relation': 'リレーション項目を選択してください',
            'Msg_Select_UsingProperties': '使用する項目を選択してください（選択項目→フィルタ機能、URL項目→コンテキストメニューからURL先を開けます）',
            'Msg_Load_LatestData': '最新データを取得します',

            'Style_Setting': 'スタイル設定',

            'Msg_Select_StyleTarget': 'スタイルを変更する対象を選択してください',
            'Msg_Select_Style': 'スタイルを選択してください',

            'Get_Data': '最新データ取得',
            'Loading': '{{name}}取得中...',
            'ReLayout': '再レイアウト',

            'Open_Notion': 'Notionで開く',
            'Create_Page': '{{name}}作成',
            'Create_Relation': 'リレーション作成',
            'Remove_Relation': '削除',

            'Guide': '操作説明',

            'Guide_NodeClick': 'ノードを右クリックまたはロングタップすると、ノードに対するメニューが表示されます。',
            'Guide_CoreClick': 'ノード以外の場所を右クリックまたはロングタップすると、ページ作成メニューが表示されます。',
            'Guide_EdgeClick': 'リレーションを右クリックまたはロングタップすると、リレーションに対するメニューが表示されます。',

            'Guide_CreateRelation': 'リレーション先を選択してください。',

            'Error_GetData': 'データ取得に失敗しました。データベースが存在していることと権限が付与されていることを確認してください',
            'Error_GetDbList': 'データベース情報取得に失敗しました。しばらく時間を置いてから再度試してください',
            'Error_CreatePage': 'ページ作成に失敗しました。データベースに権限が付与されていることを確認してください',
            'Error_CreateRelation': 'リレーション作成に失敗しました。データベースに権限が付与されていることを確認してください',
            'Error_RemoveRelation': 'リレーション削除に失敗しました。データベースに権限が付与されていることを確認してください',

            'Warn_UrlNotExist': 'このページにはURLが設定されていません。',
        }
    }
} as Resource;
export default resources;
