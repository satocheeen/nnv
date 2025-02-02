import MarkdownViewer from '../_components/common/MarkdownViewer';

export const runtime = 'edge';

export default function TermOfUsePage() {
    return (
        <MarkdownViewer mdfileName='terms_of_use.md' showBack />
    );
}