"use client"
import { Confirm } from './_components/Confirm';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import lang from './_define/lang';
import { SettingDialog } from './_components/setting/SettingDialog';

// クライアントコンポーネントとして定義する必要があるものを、
// layout.tsxの外に切り出している

const detector = new LanguageDetector(null, {
    order: ['querystring', 'cookie',  'navigator', 'localStorage', 'htmlTag'],
    htmlTag: typeof document !== 'undefined' ? document.documentElement : undefined,
});
i18n
    .use(detector)
    .use(initReactI18next)
    .init({
        resources: lang,
        // lng: 'en',
    });
console.log('lang', i18n.language);

if (typeof document !== 'undefined') {
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    })
}
export default function CcSettingProvider() {
    return (
        <>
            <Confirm.Root />
            <SettingDialog.Root />
        </>
    );
}