import type { Metadata } from "next";
import './_styles/index.scss';
import CcSettingProvider from "./CcSettingProvider";
import styles from './layout.module.scss';
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export const runtime = 'edge';

export const generateMetadata = async (): Promise<Metadata> => {
    const h = await headers();
    const protocol = h.get('x-forwarded-proto');
    const host = h.get('x-forwarded-host') || h.get('host');
    const domain = `${protocol}://${host}/`;

    return {
        title: "Notion Network Viewer",
        description: "リレーション項目で繋がった複数のNotionデータベースの関連を可視化します。Visualizes the relations of your Notion’s pages connected with other pages by relational properties.",
        openGraph: {
            images: `${domain}nnv-img.png`
        }
    }
}
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
