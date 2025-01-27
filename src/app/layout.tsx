import type { Metadata } from "next";
import './_styles/index.scss';
import CcSettingProvider from "./CcSettingProvider";
import styles from './layout.module.scss';

export const metadata: Metadata = {
    title: "Notion Network Viewer",
    description: "リレーション項目で繋がった複数のNotionデータベースの関連を可視化します。Visualizes the relations of your Notion’s pages connected with other pages by relational properties.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html>
            <body>
                <CcSettingProvider />
                {children}
                <div className={styles.Footer}>presented by Satocheeen.com</div>
            </body>
        </html>
    );
}
