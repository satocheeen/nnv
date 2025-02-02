import MarkdownViewer from '../_components/common/MarkdownViewer';

export const runtime = 'edge';

export default function PrivacyPolicyPage() {
    return (
        <MarkdownViewer mdfileName='privacy_policy.md' showBack />
    );
}