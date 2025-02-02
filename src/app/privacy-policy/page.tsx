import MarkdownViewer from '../_components/common/MarkdownViewer';

export const runtime = 'edge';

export default function PrivacyPolicyPage() {
    if (typeof document === undefined) {
        return <div />
    }
    return (
        <MarkdownViewer mdfileName='privacy_policy.md' showBack />
    );
}