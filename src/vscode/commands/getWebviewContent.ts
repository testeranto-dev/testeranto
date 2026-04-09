import { htmlTemplate } from './webview/htmlTemplate';
import { cssStyles } from './webview/cssStyles';
import { jsScript } from './webview/jsScript';

function getWebviewContent(): string {
    return htmlTemplate(cssStyles(), jsScript());
}
