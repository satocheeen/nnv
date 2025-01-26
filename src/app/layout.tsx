import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import './_styles/index.scss';
import CcSettingProvider from "./CcSettingProvider";
import styles from './layout.module.scss';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

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
            {/* <body className={`${geistSans.variable} ${geistMono.variable}`}> */}
                <CcSettingProvider>
                    {children}
                    <div className={styles.Footer}>presented by Satocheeen.com</div>
                </CcSettingProvider>
            {/* </body> */}
        </html>
    );
}
